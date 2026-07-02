import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import type { CalculatorInputs, MethodologyOptions } from './lib/types'
import { DEFAULT_INPUTS, DEFAULT_OPTIONS } from './lib/types'
import { calculate } from './lib/calc'
import { formatMoney, formatPercent, formatYears } from './lib/format'
import { CANTON_DRIVEN_KEYS, CUSTOM_CANTON, findCanton } from './lib/cantons'
import {
  buildShareUrl,
  clearStoredState,
  loadInitialState,
  saveStoredState,
} from './lib/share'
import { Background } from './components/Background'
import { SliderInput } from './components/inputs/SliderInput'
import { OptionCard } from './components/inputs/OptionCard'
import { SectionCard } from './components/inputs/SectionCard'
import { CantonSelect } from './components/inputs/CantonSelect'
import { VerdictCard } from './components/results/VerdictCard'
import { CostChart } from './components/results/CostChart'
import { MonthlyBreakdown } from './components/results/MonthlyBreakdown'
import { StatsRow } from './components/results/StatsRow'
import './App.css'

const columnVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 340, damping: 28 },
  },
}

function App() {
  // Boot order: share-link hash > localStorage > defaults.
  const [initial] = useState(loadInitialState)
  const [inputs, setInputs] = useState(initial.inputs)
  const [options, setOptions] = useState(initial.options)
  const [canton, setCanton] = useState(initial.canton)
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => calculate(inputs, options), [inputs, options])

  useEffect(() => {
    saveStoredState({ inputs, options, canton })
  }, [inputs, options, canton])

  const setNum = (key: keyof CalculatorInputs) => (value: number) => {
    setInputs((prev) => ({ ...prev, [key]: value }))
    // Hand-editing a canton-driven setting means you're off the preset.
    if ((CANTON_DRIVEN_KEYS as readonly (keyof CalculatorInputs)[]).includes(key)) {
      setCanton(CUSTOM_CANTON)
    }
  }

  const setOpt = (key: keyof MethodologyOptions) => (checked: boolean) =>
    setOptions((prev) => ({ ...prev, [key]: checked }))

  const selectCanton = (code: string) => {
    setCanton(code)
    const preset = findCanton(code)
    if (preset) {
      setInputs((prev) => ({
        ...prev,
        buyClosingCostPct: preset.buyClosingCostPct,
        propertyTaxPct: preset.propertyTaxPct,
        propertyGainsTaxPct: preset.propertyGainsTaxPct,
      }))
    }
  }

  const reset = () => {
    setInputs(DEFAULT_INPUTS)
    setOptions(DEFAULT_OPTIONS)
    setCanton(CUSTOM_CANTON)
    clearStoredState()
  }

  const share = async () => {
    const url = buildShareUrl({ inputs, options, canton })
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      window.prompt('Copy your link:', url)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const downPaymentCash = (inputs.homePrice * inputs.downPaymentPct) / 100

  return (
    <>
      <Background />
      <div className="app-root">
        <motion.header
          className="app-hero"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        >
          <motion.div
            className="app-hero-emoji"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            🏠
          </motion.div>
          <h1 className="app-title">
            Rent or <span className="app-gradient-text">Buy?</span>
          </h1>
          <div className="app-swiss-badge">
            <svg
              className="app-swiss-flag"
              viewBox="0 0 32 32"
              aria-hidden="true"
              focusable="false"
            >
              <rect width="32" height="32" rx="7" fill="#e33940" />
              <rect x="13" y="6" width="6" height="20" rx="1.5" fill="#fff" />
              <rect x="6" y="13" width="20" height="6" rx="1.5" fill="#fff" />
            </svg>
            Swiss edition
          </div>
          <p className="app-subtitle">
            The eternal question, Helvetified — answered with math, not vibes.
            Tune the assumptions; watch the answer dance.
          </p>
          <div className="app-actions">
            <motion.button
              type="button"
              className={`app-share ${copied ? 'app-share-copied' : ''}`}
              onClick={share}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
            >
              {copied ? '✓ Copied!' : '🔗 Share'}
            </motion.button>
            <motion.button
              type="button"
              className="app-reset"
              onClick={reset}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
            >
              ↺ Reset
            </motion.button>
          </div>
        </motion.header>

        <main className="app-grid">
          <motion.div
            className="app-col app-col-inputs"
            variants={columnVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <CantonSelect value={canton} onChange={selectCanton} />
            </motion.div>

            <motion.div variants={itemVariants}>
              <SectionCard title="The home" icon="🏡" accent="mint">
                <SliderInput
                  label="Home price"
                  value={inputs.homePrice}
                  min={200_000}
                  max={4_000_000}
                  step={50_000}
                  onChange={setNum('homePrice')}
                  format={formatMoney}
                  accent="mint"
                />
                <SliderInput
                  label="Down payment"
                  value={inputs.downPaymentPct}
                  min={20}
                  max={100}
                  step={1}
                  onChange={setNum('downPaymentPct')}
                  format={formatPercent}
                  accent="mint"
                  hint={`cash in: ${formatMoney(downPaymentCash)} — banks stop at 80% LTV`}
                />
                <SliderInput
                  label="Mortgage rate"
                  value={inputs.mortgageRatePct}
                  min={0}
                  max={5}
                  step={0.05}
                  onChange={setNum('mortgageRatePct')}
                  format={formatPercent}
                  accent="mint"
                  hint="10y Festhypothek runs ~1.5–2% these days"
                />
                <SliderInput
                  label="2nd mortgage payoff"
                  value={inputs.amortizationYears}
                  min={5}
                  max={20}
                  step={1}
                  onChange={setNum('amortizationYears')}
                  format={formatYears}
                  accent="mint"
                  hint="banks want the slice above 65% LTV gone within ~15 years"
                />
              </SectionCard>
            </motion.div>

            <motion.div variants={itemVariants}>
              <SectionCard
                title="Owning costs"
                icon="🧰"
                accent="sky"
                defaultOpen={false}
              >
                <SliderInput
                  label="Property tax"
                  value={inputs.propertyTaxPct}
                  min={0}
                  max={0.3}
                  step={0.05}
                  onChange={setNum('propertyTaxPct')}
                  format={formatPercent}
                  accent="sky"
                  hint="cantonal Liegenschaftssteuer — zero in ZH & ZG"
                />
                <SliderInput
                  label="Maintenance"
                  value={inputs.maintenancePct}
                  min={0}
                  max={2.5}
                  step={0.1}
                  onChange={setNum('maintenancePct')}
                  format={formatPercent}
                  accent="sky"
                  hint="of home value, per year"
                />
                <SliderInput
                  label="Building insurance"
                  value={inputs.homeInsuranceAnnual}
                  min={0}
                  max={6_000}
                  step={100}
                  onChange={setNum('homeInsuranceAnnual')}
                  format={formatMoney}
                  accent="sky"
                  hint="per year"
                />
                <SliderInput
                  label="Condo fees"
                  value={inputs.hoaMonthly}
                  min={0}
                  max={1_000}
                  step={25}
                  onChange={setNum('hoaMonthly')}
                  format={formatMoney}
                  accent="sky"
                  hint="Nebenkosten & renovation fund, per month"
                />
                <SliderInput
                  label="Buying costs"
                  value={inputs.buyClosingCostPct}
                  min={0}
                  max={5}
                  step={0.25}
                  onChange={setNum('buyClosingCostPct')}
                  format={formatPercent}
                  accent="sky"
                  hint="notary, land registry, transfer tax — the canton lottery"
                />
                <SliderInput
                  label="Selling costs"
                  value={inputs.sellClosingCostPct}
                  min={0}
                  max={5}
                  step={0.25}
                  onChange={setNum('sellClosingCostPct')}
                  format={formatPercent}
                  accent="sky"
                  hint="agent commission when you sell"
                />
                <SliderInput
                  label="Home appreciation"
                  value={inputs.homeAppreciationPct}
                  min={0}
                  max={6}
                  step={0.1}
                  onChange={setNum('homeAppreciationPct')}
                  format={formatPercent}
                  accent="sky"
                  hint="yearly growth in home value"
                />
                <SliderInput
                  label="Eigenmietwert"
                  value={inputs.eigenmietwertPct}
                  min={0}
                  max={4}
                  step={0.1}
                  onChange={setNum('eigenmietwertPct')}
                  format={formatPercent}
                  accent="sky"
                  hint="taxable imputed rent, % of home value per year"
                />
                <SliderInput
                  label="Gains tax rate"
                  value={inputs.propertyGainsTaxPct}
                  min={0}
                  max={40}
                  step={1}
                  onChange={setNum('propertyGainsTaxPct')}
                  format={formatPercent}
                  accent="sky"
                  hint="Grundstückgewinnsteuer — falls the longer you hold"
                />
              </SectionCard>
            </motion.div>

            <motion.div variants={itemVariants}>
              <SectionCard title="Renting" icon="🔑" accent="peach">
                <SliderInput
                  label="Monthly rent"
                  value={inputs.monthlyRent}
                  min={500}
                  max={10_000}
                  step={50}
                  onChange={setNum('monthlyRent')}
                  format={formatMoney}
                  accent="peach"
                />
                <SliderInput
                  label="Rent growth"
                  value={inputs.rentGrowthPct}
                  min={0}
                  max={5}
                  step={0.1}
                  onChange={setNum('rentGrowthPct')}
                  format={formatPercent}
                  accent="peach"
                  hint="tied to the reference interest rate — historically ~1%"
                />
                <SliderInput
                  label="Household insurance"
                  value={inputs.rentersInsuranceMonthly}
                  min={0}
                  max={100}
                  step={5}
                  onChange={setNum('rentersInsuranceMonthly')}
                  format={formatMoney}
                  accent="peach"
                  hint="Hausrat + Haftpflicht, per month"
                />
              </SectionCard>
            </motion.div>

            <motion.div variants={itemVariants}>
              <SectionCard title="Money & time" icon="⏳" accent="lavender">
                <SliderInput
                  label="Time horizon"
                  value={inputs.horizonYears}
                  min={1}
                  max={40}
                  step={1}
                  onChange={setNum('horizonYears')}
                  format={formatYears}
                  accent="lavender"
                  hint="until you'd sell or move on"
                />
                <SliderInput
                  label="Investment return"
                  value={inputs.investmentReturnPct}
                  min={0}
                  max={10}
                  step={0.1}
                  onChange={setNum('investmentReturnPct')}
                  format={formatPercent}
                  accent="lavender"
                  hint="what invested cash earns instead"
                />
                <SliderInput
                  label="Inflation"
                  value={inputs.inflationPct}
                  min={0}
                  max={4}
                  step={0.1}
                  onChange={setNum('inflationPct')}
                  format={formatPercent}
                  accent="lavender"
                />
                <SliderInput
                  label="Marginal tax rate"
                  value={inputs.marginalTaxRatePct}
                  min={0}
                  max={45}
                  step={1}
                  onChange={setNum('marginalTaxRatePct')}
                  format={formatPercent}
                  accent="lavender"
                  hint="federal + cantonal + communal, at the margin"
                />
              </SectionCard>
            </motion.div>

            <motion.div variants={itemVariants}>
              <SectionCard title="Choose your philosophy" icon="🤔" accent="rose">
                <p className="app-philosophy-intro">
                  Honest people disagree about what counts. Pick your camp.
                </p>
                <div className="app-options-stack">
                  <OptionCard
                    title="Opportunity cost"
                    icon="📈"
                    accent="lavender"
                    description="Cash not sunk into a down payment gets invested instead. Economists insist on this one; homeowners love to forget it."
                    checked={options.includeOpportunityCost}
                    onChange={setOpt('includeOpportunityCost')}
                  />
                  <OptionCard
                    title="Home appreciation"
                    icon="🏔️"
                    accent="mint"
                    description="Let the home's value grow each year. Optimists on, doomers off."
                    checked={options.includeHomeAppreciation}
                    onChange={setOpt('includeHomeAppreciation')}
                  />
                  <OptionCard
                    title="Eigenmietwert & deductions"
                    icon="🧾"
                    accent="sky"
                    description="The current system: you're taxed on imputed rent but deduct interest & maintenance. Voters killed it in 2025 — flip off for the post-2028 world."
                    checked={options.includeEigenmietwert}
                    onChange={setOpt('includeEigenmietwert')}
                  />
                  <OptionCard
                    title="Selling costs"
                    icon="🏷️"
                    accent="rose"
                    description="The agent takes a ~2% bite when you eventually sell. Realists keep this on."
                    checked={options.includeSellingCosts}
                    onChange={setOpt('includeSellingCosts')}
                  />
                  <OptionCard
                    title="Property gains tax"
                    icon="💸"
                    accent="peach"
                    description="Grundstückgewinnsteuer: the canton taxes your sale profit. Rates shrink the longer you hold."
                    checked={options.includePropertyGainsTax}
                    onChange={setOpt('includePropertyGainsTax')}
                  />
                  <OptionCard
                    title="Today's francs"
                    icon="🎈"
                    accent="lavender"
                    description="Discount future costs by inflation so every number is in today's francs."
                    checked={options.adjustForInflation}
                    onChange={setOpt('adjustForInflation')}
                  />
                </div>
              </SectionCard>
            </motion.div>
          </motion.div>

          <motion.div
            className="app-col app-col-results"
            variants={columnVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <VerdictCard result={result} horizonYears={inputs.horizonYears} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatsRow result={result} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <CostChart result={result} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <MonthlyBreakdown result={result} />
            </motion.div>
          </motion.div>
        </main>

        <footer className="app-footer">
          Made with 💜, compound interest and framer-motion — not financial
          advice, and definitely not your Steueramt.
        </footer>
      </div>
    </>
  )
}

export default App
