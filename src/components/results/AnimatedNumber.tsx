import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import type { AnimatedNumberProps } from '../../lib/types'
import { formatMoney } from '../../lib/format'

/**
 * A number that springs smoothly between values instead of jumping.
 * The motion value is initialized to the first `value`, so the initial
 * render shows the correct figure immediately (no count-up from zero).
 */
export function AnimatedNumber({ value, format, className }: AnimatedNumberProps) {
  const mv = useMotionValue(value)
  const spring = useSpring(mv, { stiffness: 90, damping: 22 })
  const display = useTransform(spring, (v) => (format ?? formatMoney)(v))

  useEffect(() => {
    mv.set(value)
  }, [mv, value])

  return <motion.span className={className}>{display}</motion.span>
}
