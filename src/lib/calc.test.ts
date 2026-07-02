import { describe, it, expect } from 'vitest'
import { calculate } from './calc'
import { DEFAULT_INPUTS, DEFAULT_OPTIONS } from './types'
import type { CalculatorInputs, MethodologyOptions } from './types'

const inputs = (overrides: Partial<CalculatorInputs> = {}): CalculatorInputs => ({
  ...DEFAULT_INPUTS,
  ...overrides,
})

const options = (overrides: Partial<MethodologyOptions> = {}): MethodologyOptions => ({
  ...DEFAULT_OPTIONS,
  ...overrides,
})

/** Assert every numeric field of the result (including all yearly rows) is finite. */
function expectAllFinite(result: ReturnType<typeof calculate>): void {
  const nums: number[] = [
    result.rentTotalCost,
    result.buyTotalCost,
    result.savings,
    result.firstMonthRent,
    result.buyUpfrontCost,
    result.totalMonthlyOwnerCost,
    ...Object.values(result.monthlyPaymentBreakdown),
  ]
  for (const row of result.yearly) {
    nums.push(
      row.rentCumulativeCost,
      row.buyCumulativeCost,
      row.homeValue,
      row.loanBalance,
      row.homeEquity,
      row.renterPortfolio,
    )
  }
  for (const v of nums) expect(Number.isFinite(v)).toBe(true)
}

describe('calculate — Swiss mortgage', () => {
  it('is pure interest-only at 35% down (loan sits exactly at the 65% cap)', () => {
    const result = calculate(
      inputs({ homePrice: 1_000_000, downPaymentPct: 35, mortgageRatePct: 2, horizonYears: 30 }),
      options(),
    )
    expect(result.monthlyPaymentBreakdown.amortization).toBe(0)
    expect(result.monthlyPaymentBreakdown.interest).toBeCloseTo((650_000 * 0.02) / 12, 8)
    // The balance never moves — the first mortgage is never amortized.
    for (const row of result.yearly) {
      expect(row.loanBalance).toBe(result.yearly[0].loanBalance)
    }
    expect(result.yearly[30].loanBalance).toBeCloseTo(650_000, 6)
  })

  it('amortizes the second mortgage straight-line to the 65% cap in exactly 15y', () => {
    const result = calculate(
      inputs({ homePrice: 1_000_000, downPaymentPct: 20, amortizationYears: 15, horizonYears: 20 }),
      options(),
    )
    // loan 800k = 650k first mortgage + 150k second mortgage
    expect(result.yearly[0].loanBalance).toBe(800_000)
    expect(result.monthlyPaymentBreakdown.amortization).toBeCloseTo(150_000 / 180, 8)
    expect(result.yearly[1].loanBalance).toBeCloseTo(800_000 - 12 * (150_000 / 180), 6)
    expect(Math.abs(result.yearly[15].loanBalance - 650_000)).toBeLessThan(1)
    // ...and it parks there: year 20 is still exactly the year-15 balance.
    expect(result.yearly[20].loanBalance).toBe(result.yearly[15].loanBalance)
  })

  it('never amortizes below the 65% cap, never goes negative, never bounces back up', () => {
    const result = calculate(
      inputs({ homePrice: 900_000, downPaymentPct: 20, amortizationYears: 5, horizonYears: 30 }),
      options(),
    )
    const cap = 0.65 * 900_000
    let prev = result.yearly[0].loanBalance
    for (const row of result.yearly) {
      expect(row.loanBalance).toBeLessThanOrEqual(prev + 1e-9)
      expect(row.loanBalance).toBeGreaterThanOrEqual(cap - 1e-6)
      prev = row.loanBalance
    }
    expect(Math.abs(result.yearly[5].loanBalance - cap)).toBeLessThan(1e-6)
    // No phantom amortization once the second mortgage is gone.
    expect(result.yearly[30].loanBalance).toBe(result.yearly[5].loanBalance)
  })

  it('handles a 100% down payment: no loan, no interest, no amortization, ever', () => {
    const result = calculate(inputs({ downPaymentPct: 100 }), options())
    expect(result.monthlyPaymentBreakdown.interest).toBe(0)
    expect(result.monthlyPaymentBreakdown.amortization).toBe(0)
    for (const row of result.yearly) expect(row.loanBalance).toBe(0)
    expectAllFinite(result)
  })

  it('reports a first-month breakdown whose six parts sum to totalMonthlyOwnerCost', () => {
    const result = calculate(inputs(), options())
    const b = result.monthlyPaymentBreakdown
    // 1.2M home, 20% down → 960k loan at 1.6%
    expect(b.interest).toBeCloseTo((960_000 * (1.6 / 100)) / 12, 8)
    expect(b.amortization).toBeCloseTo((960_000 - 780_000) / (15 * 12), 8)
    expect(b.insurance).toBeCloseTo(DEFAULT_INPUTS.homeInsuranceAnnual / 12, 8)
    expect(b.hoa).toBe(DEFAULT_INPUTS.hoaMonthly)
    expect(result.totalMonthlyOwnerCost).toBeCloseTo(
      b.interest + b.amortization + b.propertyTax + b.insurance + b.maintenance + b.hoa,
      8,
    )
  })
})

describe('calculate — Eigenmietwert', () => {
  const opts = {
    includeOpportunityCost: false,
    includeHomeAppreciation: false,
    adjustForInflation: false,
  }
  const base = inputs({
    homePrice: 1_000_000,
    downPaymentPct: 20,
    mortgageRatePct: 1.5,
    amortizationYears: 15,
    maintenancePct: 1,
    eigenmietwertPct: 3.5,
    marginalTaxRatePct: 30,
    horizonYears: 1,
  })

  it('shifts year-1 buy cost by exactly rate × Σ(emw − interest − maintenance)', () => {
    const on = calculate(base, options({ ...opts, includeEigenmietwert: true }))
    const off = calculate(base, options({ ...opts, includeEigenmietwert: false }))
    // Independent 12-month replay of the Swiss mortgage + tax effect.
    const r = 1.5 / 100 / 12
    const cap = 650_000
    const monthlyAmort = 150_000 / (15 * 12)
    const emw = (1_000_000 * 3.5) / 100 / 12
    const maintenance = (1_000_000 * 1) / 100 / 12
    let balance = 800_000
    let expectedDelta = 0
    for (let m = 1; m <= 12; m++) {
      const interest = balance * r
      balance -= Math.min(monthlyAmort, balance - cap)
      expectedDelta += (30 / 100) * (emw - interest - maintenance)
    }
    expect(expectedDelta).toBeGreaterThan(0) // imputed rent dominates at 1.5%
    expect(on.buyTotalCost - off.buyTotalCost).toBeCloseTo(expectedDelta, 6)
    // Renting is untouched by an owner-side tax.
    expect(on.rentTotalCost).toBe(off.rentTotalCost)
  })

  it('flips sign when interest + maintenance beat the imputed rent (net deduction)', () => {
    const heavy = inputs({ ...base, mortgageRatePct: 5, eigenmietwertPct: 0.5 })
    const on = calculate(heavy, options({ ...opts, includeEigenmietwert: true }))
    const off = calculate(heavy, options({ ...opts, includeEigenmietwert: false }))
    expect(on.buyTotalCost).toBeLessThan(off.buyTotalCost)
  })
})

describe('calculate — Grundstückgewinnsteuer', () => {
  const opts = { includeOpportunityCost: false, adjustForInflation: false }
  const base = inputs({
    homePrice: 1_000_000,
    homeAppreciationPct: 2,
    propertyGainsTaxPct: 15,
    horizonYears: 10,
  })

  it('changes the horizon buy cost by exactly rate × (sale value − purchase price)', () => {
    const on = calculate(
      base,
      options({ ...opts, includeHomeAppreciation: true, includePropertyGainsTax: true }),
    )
    const off = calculate(
      base,
      options({ ...opts, includeHomeAppreciation: true, includePropertyGainsTax: false }),
    )
    const hvT = 1_000_000 * (1 + 2 / 100) ** 10
    expect(on.buyTotalCost - off.buyTotalCost).toBeCloseTo((15 / 100) * (hvT - 1_000_000), 6)
  })

  it('is a no-op with appreciation off: the gain is clamped at zero', () => {
    const on = calculate(
      base,
      options({ ...opts, includeHomeAppreciation: false, includePropertyGainsTax: true }),
    )
    const off = calculate(
      base,
      options({ ...opts, includeHomeAppreciation: false, includePropertyGainsTax: false }),
    )
    expect(on.buyTotalCost).toBeCloseTo(off.buyTotalCost, 8)
  })
})

describe('calculate — year 0 and yearly shape', () => {
  it('starts at rent cost 0 and buy cost = buy closing + selling costs, in both modes', () => {
    for (const includeOpportunityCost of [true, false]) {
      const result = calculate(inputs(), options({ includeOpportunityCost }))
      // Gains tax at year 0 is 0 (no gain yet), so only the frictions remain.
      const expectedBuy =
        DEFAULT_INPUTS.homePrice * (DEFAULT_INPUTS.buyClosingCostPct / 100) +
        DEFAULT_INPUTS.homePrice * (DEFAULT_INPUTS.sellClosingCostPct / 100)
      expect(result.yearly[0].rentCumulativeCost).toBe(0)
      expect(result.yearly[0].buyCumulativeCost).toBeCloseTo(expectedBuy, 6)
      expect(result.yearly[0].loanBalance).toBe(DEFAULT_INPUTS.homePrice * 0.8)
      expect(result.yearly[0].homeValue).toBe(DEFAULT_INPUTS.homePrice)
      expect(result.yearly[0].renterPortfolio).toBe(
        includeOpportunityCost ? result.buyUpfrontCost : 0,
      )
      expect(result.yearly).toHaveLength(DEFAULT_INPUTS.horizonYears + 1)
    }
  })
})

describe('calculate — accounting-mode consistency', () => {
  it('mode A degenerates to plain accounting when returns and growth are all 0', () => {
    const flat = inputs({
      investmentReturnPct: 0,
      rentGrowthPct: 0,
      inflationPct: 0,
      homeAppreciationPct: 0,
    })
    const a = calculate(flat, options({ includeOpportunityCost: true }))
    const b = calculate(flat, options({ includeOpportunityCost: false }))
    expect(a.rentTotalCost).toBeCloseTo(b.rentTotalCost, 4)
    expect(a.buyTotalCost).toBeCloseTo(b.buyTotalCost, 4)
  })
})

describe('calculate — verdicts', () => {
  it('picks buy under extreme rents and rent under extreme prices', () => {
    expect(calculate(inputs({ monthlyRent: 50_000 }), options()).winner).toBe('buy')
    expect(
      calculate(inputs({ homePrice: 5_000_000, monthlyRent: 1_500 }), options()).winner,
    ).toBe('rent')
  })

  it('shifts toward renting when the investment return is higher (mode A)', () => {
    const low = calculate(inputs({ investmentReturnPct: 3 }), options({ includeOpportunityCost: true }))
    const high = calculate(inputs({ investmentReturnPct: 10 }), options({ includeOpportunityCost: true }))
    // gap = rent − buy; a smaller gap means renting looks relatively better
    expect(high.rentTotalCost - high.buyTotalCost).toBeLessThan(low.rentTotalCost - low.buyTotalCost)
  })
})

describe('calculate — inflation adjustment', () => {
  it('discounting with inflation > 0 strictly lowers the rent total (plain accounting)', () => {
    const base = inputs({ inflationPct: 2 })
    const nominal = calculate(base, options({ includeOpportunityCost: false, adjustForInflation: false }))
    const real = calculate(base, options({ includeOpportunityCost: false, adjustForInflation: true }))
    expect(real.rentTotalCost).toBeLessThan(nominal.rentTotalCost)
  })
})

describe('calculate — robustness', () => {
  it('never produces NaN/Infinity across the Swiss edge grid', () => {
    const optionSamples: MethodologyOptions[] = [
      options(), // everything on except inflation adjust
      options({
        includeOpportunityCost: false,
        includeHomeAppreciation: false,
        includeEigenmietwert: false,
        includeSellingCosts: false,
        includePropertyGainsTax: false,
        adjustForInflation: false,
      }), // everything off
      options({ adjustForInflation: true }),
      options({ includeOpportunityCost: false, adjustForInflation: true }),
      options({ includeEigenmietwert: false, includePropertyGainsTax: false }),
    ]
    for (const downPaymentPct of [10, 20, 35, 100]) {
      for (const amortizationYears of [1, 5, 15, 20]) {
        for (const horizonYears of [1, 40]) {
          for (const opts of optionSamples) {
            expectAllFinite(
              calculate(inputs({ downPaymentPct, amortizationYears, horizonYears }), opts),
            )
          }
        }
      }
    }
    // All rates & recurring costs zeroed out.
    const zeroed = inputs({
      mortgageRatePct: 0,
      propertyTaxPct: 0,
      maintenancePct: 0,
      homeInsuranceAnnual: 0,
      hoaMonthly: 0,
      rentersInsuranceMonthly: 0,
      rentGrowthPct: 0,
      inflationPct: 0,
      homeAppreciationPct: 0,
      investmentReturnPct: 0,
      eigenmietwertPct: 0,
      propertyGainsTaxPct: 0,
      marginalTaxRatePct: 0,
      horizonYears: 1,
    })
    for (const opts of optionSamples) {
      const result = calculate(zeroed, opts)
      expectAllFinite(result)
      expect(result.yearly).toHaveLength(2)
    }
  })

  it('produces sane results from the Swiss defaults', () => {
    const result = calculate(DEFAULT_INPUTS, DEFAULT_OPTIONS)
    expectAllFinite(result)
    expect(result.yearly).toHaveLength(DEFAULT_INPUTS.horizonYears + 1)
    expect(result.savings).toBeCloseTo(Math.abs(result.rentTotalCost - result.buyTotalCost), 8)
    expect(result.firstMonthRent).toBe(DEFAULT_INPUTS.monthlyRent)
    expect(result.buyUpfrontCost).toBeCloseTo(
      DEFAULT_INPUTS.homePrice * ((DEFAULT_INPUTS.downPaymentPct + DEFAULT_INPUTS.buyClosingCostPct) / 100),
      6,
    )
  })
})
