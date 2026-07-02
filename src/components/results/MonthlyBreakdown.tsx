import { PieChart, Pie, Cell } from 'recharts'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import type { MonthlyBreakdownProps } from '../../lib/types'
import { formatMoney } from '../../lib/format'
import { AnimatedNumber } from './AnimatedNumber'
import './MonthlyBreakdown.css'

/* Literal pastels intentionally matching the design tokens — recharts
   paints SVG fills, which can't reliably resolve CSS custom properties. */
const SLICE_META = [
  { key: 'interest', name: 'Interest', color: '#b39df2' },
  { key: 'amortization', name: 'Amortization', color: '#8ec7ff' },
  { key: 'propertyTax', name: 'Property tax', color: '#ffab8a' },
  { key: 'insurance', name: 'Insurance', color: '#ff9ec8' },
  { key: 'maintenance', name: 'Maintenance', color: '#ffd97a' },
  { key: 'hoa', name: 'Condo fees', color: '#6fd6ae' },
] as const

const legendVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const rowVariants: Variants = {
  hidden: { opacity: 0, x: 12 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
}

export function MonthlyBreakdown({ result }: MonthlyBreakdownProps) {
  const { monthlyPaymentBreakdown, totalMonthlyOwnerCost, firstMonthRent } = result

  const slices = SLICE_META.map((meta) => ({
    ...meta,
    value: monthlyPaymentBreakdown[meta.key],
  })).filter((slice) => slice.value > 0)

  const rentDelta = firstMonthRent - totalMonthlyOwnerCost
  const deltaLine =
    Math.round(Math.abs(rentDelta)) > 0
      ? `${formatMoney(Math.abs(rentDelta))} ${rentDelta > 0 ? 'more' : 'less'} than owning`
      : 'about the same as owning'

  return (
    <motion.div
      className="mb-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <h3 className="mb-title">Your monthly bill 🧾</h3>
      <p className="mb-caption">first month — amortization builds equity, but it still leaves your wallet</p>

      <div className="mb-body">
        <div className="mb-donut">
          <PieChart width={210} height={210}>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="85%"
              paddingAngle={3}
              cornerRadius={8}
              stroke="none"
            >
              {slices.map((slice) => (
                <Cell key={slice.key} fill={slice.color} />
              ))}
            </Pie>
          </PieChart>
          <div className="mb-center">
            <AnimatedNumber value={totalMonthlyOwnerCost} className="mb-center-value" />
            <span className="mb-center-caption">/month</span>
          </div>
        </div>

        <motion.ul className="mb-legend" variants={legendVariants} initial="hidden" animate="show">
          {slices.map((slice) => (
            <motion.li key={slice.key} className="mb-legend-row" variants={rowVariants}>
              <span className="mb-legend-dot" style={{ background: slice.color }} />
              <span className="mb-legend-name">{slice.name}</span>
              <AnimatedNumber value={slice.value} className="mb-legend-value" />
            </motion.li>
          ))}
        </motion.ul>
      </div>

      <div className="mb-footer">
        <motion.span className="mb-rent-chip" whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
          🔑 Renting instead: <AnimatedNumber value={firstMonthRent} /> /month
        </motion.span>
        <span className="mb-delta">{deltaLine}</span>
      </div>
    </motion.div>
  )
}
