import type {
  CalculationResult,
  CalculatorInputs,
  MethodologyOptions,
  MonthlyPaymentBreakdown,
  YearlyResult,
} from './types'

/**
 * Swiss rent-vs-buy engine 🇨🇭. Pure function — never mutates its arguments
 * and never returns NaN/Infinity for non-negative inputs with horizonYears >= 1.
 *
 * Mortgage (the Swiss way): the FIRST mortgage — up to 65% of the purchase
 * price — is interest-only and never amortized. Only the SECOND mortgage
 * (the 65%→80% slice) is paid down, straight-line, over amortizationYears.
 * Once the balance reaches the 65% cap it parks there forever and interest
 * keeps accruing — the loan never hits zero unless you paid all cash.
 *
 * Taxes:
 *  - Eigenmietwert (toggle = current law; off = post-referendum abolition):
 *    each month the owner pays income tax on the imputed rent but deducts
 *    mortgage interest + maintenance, all at the marginal rate. The net
 *    effect may be NEGATIVE (deductions beat the imputed rent) — a benefit.
 *  - Grundstückgewinnsteuer: at any hypothetical sale, the nominal gain
 *    (sale value − purchase price, floored at 0) is taxed at a flat rate.
 *
 * Monthly simulation with two accounting modes:
 *  A) includeOpportunityCost: fully symmetric "invest the difference" — both
 *     sides commit identical total cash; whoever spends less on housing that
 *     month invests the difference. Net cost = cash committed − recoverable
 *     wealth (portfolio, and for the buyer also net sale proceeds).
 *  B) plain cash accounting: no investment growth anywhere; the buyer still
 *     recovers sale proceeds at each hypothetical sale date.
 */
export function calculate(
  inputs: CalculatorInputs,
  options: MethodologyOptions,
): CalculationResult {
  const horizonYears = Math.max(1, Math.round(inputs.horizonYears))
  const totalMonths = horizonYears * 12

  // ---- Upfront figures -------------------------------------------------
  const dp = (inputs.homePrice * inputs.downPaymentPct) / 100
  const loan0 = inputs.homePrice - dp
  const buyClosing = (inputs.homePrice * inputs.buyClosingCostPct) / 100
  const buyUpfrontCost = dp + buyClosing

  // ---- Mortgage: interest-only 1st, straight-line 2nd --------------------
  const r = inputs.mortgageRatePct / 100 / 12
  const firstMortgageCap = 0.65 * inputs.homePrice // of purchase price, constant
  const secondMortgage0 = Math.max(0, loan0 - firstMortgageCap)
  const amortYears = Math.max(1, Math.round(inputs.amortizationYears))
  const monthlyAmort = secondMortgage0 / (amortYears * 12)

  // ---- Growth factors ---------------------------------------------------
  const monthlyInvReturn = (1 + inputs.investmentReturnPct / 100) ** (1 / 12) - 1
  const inflFactor = 1 + inputs.inflationPct / 100
  const rentFactor = 1 + inputs.rentGrowthPct / 100
  const appreciationFactor = 1 + inputs.homeAppreciationPct / 100

  /** Home value after m months. */
  const homeValueAt = (m: number): number =>
    options.includeHomeAppreciation
      ? inputs.homePrice * appreciationFactor ** (m / 12)
      : inputs.homePrice

  /** Net proceeds if the home were sold after m months with the given loan balance. */
  const saleProceedsAt = (m: number, loanBalance: number): number => {
    const hv = homeValueAt(m)
    const sellCost = options.includeSellingCosts
      ? (hv * inputs.sellClosingCostPct) / 100
      : 0
    // Grundstückgewinnsteuer on the nominal gain (never negative).
    const gainsTax = options.includePropertyGainsTax
      ? (inputs.propertyGainsTaxPct / 100) * Math.max(0, hv - inputs.homePrice)
      : 0
    return hv - sellCost - gainsTax - loanBalance
  }

  // ---- Simulation state --------------------------------------------------
  let balance = loan0
  // Mode A state
  let renterPortfolio = options.includeOpportunityCost ? buyUpfrontCost : 0
  let buyerPortfolio = 0
  let totalCash = buyUpfrontCost // committed at t=0, undiscounted
  // Mode B state
  let buySpent = buyUpfrontCost
  let rentSpent = 0

  /** Snapshot the cumulative picture at the end of year t (after 12t months). */
  const snapshot = (t: number): YearlyResult => {
    const m = t * 12
    const hv = homeValueAt(m)
    const proceeds = saleProceedsAt(m, balance)
    const discY = options.adjustForInflation ? inflFactor ** t : 1
    let rentCumulativeCost: number
    let buyCumulativeCost: number
    if (options.includeOpportunityCost) {
      buyCumulativeCost = totalCash - (proceeds + buyerPortfolio) / discY
      rentCumulativeCost = totalCash - renterPortfolio / discY
    } else {
      buyCumulativeCost = buySpent - proceeds / discY
      rentCumulativeCost = rentSpent
    }
    return {
      year: t,
      rentCumulativeCost,
      buyCumulativeCost,
      homeValue: hv,
      loanBalance: balance,
      homeEquity: hv - balance,
      renterPortfolio: options.includeOpportunityCost ? renterPortfolio : 0,
    }
  }

  const yearly: YearlyResult[] = [snapshot(0)]

  let firstInterest = 0
  let firstAmort = 0
  let firstPropertyTax = 0
  let firstMaintenance = 0

  // ---- Monthly loop --------------------------------------------------------
  for (let m = 1; m <= totalMonths; m++) {
    const y = Math.floor((m - 1) / 12) // 0-indexed year, stepwise growth
    const hv = homeValueAt(m)
    const inflStep = inflFactor ** y

    const propertyTax = (hv * inputs.propertyTaxPct) / 100 / 12
    const maintenance = (hv * inputs.maintenancePct) / 100 / 12
    const homeIns = (inputs.homeInsuranceAnnual / 12) * inflStep
    const hoa = inputs.hoaMonthly * inflStep
    const rentersIns = inputs.rentersInsuranceMonthly * inflStep
    const rent = inputs.monthlyRent * rentFactor ** y

    // Mortgage: interest always accrues; only the 2nd mortgage amortizes.
    let interest = 0
    let amort = 0
    if (balance > 0) {
      interest = balance * r
      if (balance > firstMortgageCap) {
        amort = Math.min(monthlyAmort, balance - firstMortgageCap)
        balance -= amort
      }
    }
    const actualPmt = interest + amort

    // Eigenmietwert: taxed on imputed rent, deduct interest + maintenance.
    // Can be negative — that's the point of keeping a big mortgage in CH.
    const eigenmietwertTax = options.includeEigenmietwert
      ? (inputs.marginalTaxRatePct / 100) *
        ((hv * inputs.eigenmietwertPct) / 100 / 12 - interest - maintenance)
      : 0

    const buyerOutflow =
      actualPmt + propertyTax + maintenance + homeIns + hoa + eigenmietwertTax
    const renterOutflow = rent + rentersIns
    const disc = options.adjustForInflation ? inflFactor ** (m / 12) : 1

    if (m === 1) {
      firstInterest = interest
      firstAmort = amort
      firstPropertyTax = propertyTax
      firstMaintenance = maintenance
    }

    if (options.includeOpportunityCost) {
      // Portfolios grow first, then the cheaper side invests the difference.
      renterPortfolio *= 1 + monthlyInvReturn
      buyerPortfolio *= 1 + monthlyInvReturn
      const d = buyerOutflow - renterOutflow
      if (d > 0) renterPortfolio += d
      else buyerPortfolio += -d
      totalCash += Math.max(buyerOutflow, renterOutflow) / disc
    } else {
      buySpent += buyerOutflow / disc
      rentSpent += renterOutflow / disc
    }

    if (m % 12 === 0) yearly.push(snapshot(m / 12))
  }

  // ---- Results ---------------------------------------------------------
  const finalYear = yearly[horizonYears]
  const rentTotalCost = finalYear.rentCumulativeCost
  const buyTotalCost = finalYear.buyCumulativeCost
  const diff = rentTotalCost - buyTotalCost
  const winner: CalculationResult['winner'] =
    Math.abs(diff) <= 1 ? 'tie' : diff > 0 ? 'buy' : 'rent'

  let breakevenYear: number | null = null
  for (let t = 1; t <= horizonYears; t++) {
    if (yearly[t].buyCumulativeCost <= yearly[t].rentCumulativeCost) {
      breakevenYear = t
      break
    }
  }

  const monthlyPaymentBreakdown: MonthlyPaymentBreakdown = {
    interest: firstInterest, // = loan0 * r
    amortization: firstAmort,
    propertyTax: firstPropertyTax,
    insurance: inputs.homeInsuranceAnnual / 12,
    maintenance: firstMaintenance,
    hoa: inputs.hoaMonthly,
  }
  const totalMonthlyOwnerCost =
    monthlyPaymentBreakdown.interest +
    monthlyPaymentBreakdown.amortization +
    monthlyPaymentBreakdown.propertyTax +
    monthlyPaymentBreakdown.insurance +
    monthlyPaymentBreakdown.maintenance +
    monthlyPaymentBreakdown.hoa

  return {
    yearly,
    rentTotalCost,
    buyTotalCost,
    winner,
    savings: Math.abs(diff),
    breakevenYear,
    monthlyPaymentBreakdown,
    firstMonthRent: inputs.monthlyRent,
    buyUpfrontCost,
    totalMonthlyOwnerCost,
  }
}
