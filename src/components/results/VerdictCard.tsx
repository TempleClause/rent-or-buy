import { motion, AnimatePresence } from 'framer-motion'
import type { VerdictCardProps } from '../../lib/types'
import { formatYears } from '../../lib/format'
import { AnimatedNumber } from './AnimatedNumber'
import './VerdictCard.css'

const HEADLINES = {
  buy: 'Buying wins 🏠',
  rent: 'Renting wins 🔑',
  tie: "It's a tie 🤝",
} as const

const springUp = { type: 'spring', stiffness: 400, damping: 30 } as const

export function VerdictCard({ result, horizonYears }: VerdictCardProps) {
  const { winner, savings, rentTotalCost, buyTotalCost, breakevenYear } = result

  // Tug-of-war shares. Negative totals (a side that MAKES money) are
  // clamped to 0 for the bar only; the legend chips show the real numbers.
  const rentShare = Math.max(0, rentTotalCost)
  const buyShare = Math.max(0, buyTotalCost)
  const shareTotal = rentShare + buyShare
  const rentPct = shareTotal > 0 ? (rentShare / shareTotal) * 100 : 50
  const buyPct = 100 - rentPct

  return (
    <div className="vc-card">
      {/* Crossfading tinted washes — one per possible winner */}
      <motion.div
        className="vc-wash vc-wash-buy"
        initial={false}
        animate={{ opacity: winner === 'buy' ? 1 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />
      <motion.div
        className="vc-wash vc-wash-rent"
        initial={false}
        animate={{ opacity: winner === 'rent' ? 1 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />
      <motion.div
        className="vc-wash vc-wash-tie"
        initial={false}
        animate={{ opacity: winner === 'tie' ? 1 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />

      <div className="vc-content">
        <span className="vc-eyebrow">The Verdict ✨</span>

        <AnimatePresence mode="wait" initial={false}>
          <motion.h2
            key={winner}
            className={`vc-headline vc-headline-${winner}`}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={springUp}
          >
            {HEADLINES[winner]}
          </motion.h2>
        </AnimatePresence>

        <p className="vc-subline">
          {winner === 'tie' ? 'separated by ' : 'saving you '}
          <AnimatedNumber value={savings} className={`vc-big vc-big-${winner}`} /> over{' '}
          {formatYears(horizonYears)}
        </p>

        <div className="vc-tug">
          <div className="vc-bar-track">
            <motion.div
              className="vc-bar-seg vc-bar-rent"
              initial={false}
              animate={{ width: `${rentPct}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            />
            <motion.div
              className="vc-bar-seg vc-bar-buy"
              initial={false}
              animate={{ width: `${buyPct}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            />
          </div>
          <div className="vc-legend">
            <motion.span className="vc-chip vc-chip-rent" whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
              <span className="vc-chip-dot" />
              Renting costs <AnimatedNumber value={rentTotalCost} />
            </motion.span>
            <motion.span className="vc-chip vc-chip-buy" whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
              <span className="vc-chip-dot" />
              Buying costs <AnimatedNumber value={buyTotalCost} />
            </motion.span>
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={breakevenYear === null ? 'never' : breakevenYear}
            className="vc-breakeven"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            {breakevenYear !== null
              ? `🎯 Buying breaks even in year ${breakevenYear}`
              : 'Buying never breaks even within your horizon'}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
