import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import type { StatsRowProps } from '../../lib/types'
import { AnimatedNumber } from './AnimatedNumber'
import './StatsRow.css'

const gridVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 28 } },
}

interface StatCardShellProps {
  emoji: string
  tint: 'butter' | 'lavender' | 'mint' | 'sky'
  label: string
  children: ReactNode
}

function StatCard({ emoji, tint, label, children }: StatCardShellProps) {
  return (
    <motion.div className="sr-card" variants={cardVariants} whileHover={{ y: -3 }}>
      <span className={`sr-emoji sr-emoji-${tint}`}>{emoji}</span>
      <span className="sr-text">
        <span className="sr-label">{label}</span>
        <span className="sr-value">{children}</span>
      </span>
    </motion.div>
  )
}

export function StatsRow({ result }: StatsRowProps) {
  const { buyUpfrontCost, breakevenYear, yearly } = result
  const last = yearly.length > 0 ? yearly[yearly.length - 1] : undefined
  const homeEquity = last?.homeEquity ?? 0
  const renterPortfolio = last?.renterPortfolio ?? 0

  return (
    <motion.div className="sr-grid" variants={gridVariants} initial="hidden" animate="show">
      <StatCard emoji="💰" tint="butter" label="Cash needed upfront">
        <AnimatedNumber value={buyUpfrontCost} />
      </StatCard>

      <StatCard emoji="🎯" tint="lavender" label="Breakeven">
        {breakevenYear !== null ? `Year ${breakevenYear}` : 'Never'}
      </StatCard>

      <StatCard emoji="🏡" tint="mint" label="Home equity at horizon">
        <AnimatedNumber value={homeEquity} />
      </StatCard>

      <StatCard emoji="📊" tint="sky" label="Renter's portfolio">
        {renterPortfolio === 0 ? '—' : <AnimatedNumber value={renterPortfolio} />}
      </StatCard>
    </motion.div>
  )
}
