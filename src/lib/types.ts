import type { ReactNode } from 'react'

/* ============================================================
   Core data model — the single source of truth for the app.
   Swiss edition 🇨🇭: interest-only first mortgage, amortized
   second mortgage, Eigenmietwert, Grundstückgewinnsteuer.
   ============================================================ */

export interface CalculatorInputs {
  // Buying
  homePrice: number // CHF
  downPaymentPct: number // % of home price (Swiss law: min 20%)
  mortgageRatePct: number // annual interest %, e.g. 10y Festhypothek
  /**
   * Years to amortize the SECOND mortgage (the part of the loan above 65%
   * LTV) down to zero, straight-line. The first mortgage (≤65% LTV) is
   * interest-only and never amortized — the Swiss way.
   */
  amortizationYears: number
  propertyTaxPct: number // annual % of home value (cantonal Liegenschaftssteuer; 0 in ZH/ZG)
  maintenancePct: number // annual, % of current home value
  homeInsuranceAnnual: number // CHF/year (building insurance etc.), grows with inflation
  hoaMonthly: number // CHF/month condo fees (Nebenkosten/Erneuerungsfonds), grows with inflation
  buyClosingCostPct: number // % of price: notary, land registry, transfer tax (canton-dependent)
  sellClosingCostPct: number // % of sale price: agent commission
  homeAppreciationPct: number // annual %
  /** Taxable imputed rent (Eigenmietwert) as annual % of current home value. */
  eigenmietwertPct: number
  /** Grundstückgewinnsteuer: % of the nominal sale gain, canton-dependent. */
  propertyGainsTaxPct: number
  // Renting
  monthlyRent: number // CHF/month in year 1
  rentGrowthPct: number // annual %, applied at each year boundary
  rentersInsuranceMonthly: number // household insurance CHF/month, grows with inflation
  // Shared
  investmentReturnPct: number // annual % return on invested cash
  inflationPct: number // annual %
  marginalTaxRatePct: number // combined federal + cantonal + communal marginal rate
  horizonYears: number // how long until you'd sell / move (>= 1)
}

/** Methodology choices — the "it depends who you ask" switches. */
export interface MethodologyOptions {
  /** Invest-the-difference: cash not spent on the pricier option is invested at investmentReturnPct. */
  includeOpportunityCost: boolean
  /** Home value grows at homeAppreciationPct (off = value stays flat). */
  includeHomeAppreciation: boolean
  /**
   * Current Swiss system: owner pays income tax on the Eigenmietwert but
   * deducts mortgage interest + maintenance. Off = the post-abolition world
   * (the September 2025 referendum scrapped it; takes effect ~2028).
   */
  includeEigenmietwert: boolean
  /** Subtract sellClosingCostPct from sale proceeds at the horizon. */
  includeSellingCosts: boolean
  /** Grundstückgewinnsteuer: tax the nominal sale gain at propertyGainsTaxPct. */
  includePropertyGainsTax: boolean
  /** Report everything in today's francs (discount flows & wealth by inflation). */
  adjustForInflation: boolean
}

export interface YearlyResult {
  /** 0..horizonYears. Year 0 = the moment after upfront costs are paid. */
  year: number
  /** Net cumulative cost of renting through end of this year. */
  rentCumulativeCost: number
  /** Net cumulative cost of buying if you sold at end of this year. */
  buyCumulativeCost: number
  homeValue: number
  loanBalance: number
  /** homeValue − loanBalance (gross of selling costs & gains tax). */
  homeEquity: number
  /** Renter's invested portfolio value (0 when opportunity cost is off). */
  renterPortfolio: number
}

export interface MonthlyPaymentBreakdown {
  interest: number
  amortization: number
  propertyTax: number
  insurance: number
  maintenance: number
  hoa: number
}

export interface CalculationResult {
  yearly: YearlyResult[] // length horizonYears + 1, starting at year 0
  rentTotalCost: number // net cost of renting at the horizon
  buyTotalCost: number // net cost of buying at the horizon
  winner: 'rent' | 'buy' | 'tie'
  savings: number // |rentTotalCost − buyTotalCost|
  /** First year (1..horizon) where buying's net cost <= renting's; null if never. */
  breakevenYear: number | null
  monthlyPaymentBreakdown: MonthlyPaymentBreakdown // first-month figures
  firstMonthRent: number
  buyUpfrontCost: number // down payment + buy closing costs
  totalMonthlyOwnerCost: number // sum of breakdown fields (gross, before tax effects)
}

export const DEFAULT_INPUTS: CalculatorInputs = {
  homePrice: 1_200_000,
  downPaymentPct: 20,
  mortgageRatePct: 1.6,
  amortizationYears: 15,
  propertyTaxPct: 0.1,
  maintenancePct: 1.0,
  homeInsuranceAnnual: 1_500,
  hoaMonthly: 250,
  buyClosingCostPct: 2.5,
  sellClosingCostPct: 2,
  homeAppreciationPct: 2.5,
  eigenmietwertPct: 2.2,
  propertyGainsTaxPct: 15,
  monthlyRent: 2_900,
  rentGrowthPct: 1,
  rentersInsuranceMonthly: 25,
  investmentReturnPct: 5.5,
  inflationPct: 0.8,
  marginalTaxRatePct: 25,
  horizonYears: 10,
}

export const DEFAULT_OPTIONS: MethodologyOptions = {
  includeOpportunityCost: true,
  includeHomeAppreciation: true,
  includeEigenmietwert: true,
  includeSellingCosts: true,
  includePropertyGainsTax: true,
  adjustForInflation: false,
}

/* ============================================================
   Shared UI contracts
   ============================================================ */

export type AccentColor = 'lavender' | 'mint' | 'peach' | 'sky' | 'rose'

export interface CantonSelectProps {
  /** Selected canton code, or 'custom'. */
  value: string
  onChange: (code: string) => void
}

export interface SliderInputProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  /** How to render the value chip. Default: v.toLocaleString() */
  format?: (value: number) => string
  accent?: AccentColor // default 'lavender'
  hint?: string // small helper text under the label
}

export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  accent?: AccentColor // default 'lavender'
  ariaLabel?: string
}

export interface OptionCardProps {
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  accent?: AccentColor
  icon?: string // emoji
}

export interface SectionCardProps {
  title: string
  icon?: string // emoji
  accent?: AccentColor
  defaultOpen?: boolean
  children: ReactNode
}

export interface AnimatedNumberProps {
  value: number
  /** Default: formatMoney */
  format?: (value: number) => string
  className?: string
}

export interface VerdictCardProps {
  result: CalculationResult
  horizonYears: number
}

export interface CostChartProps {
  result: CalculationResult
}

export interface MonthlyBreakdownProps {
  result: CalculationResult
}

export interface StatsRowProps {
  result: CalculationResult
}
