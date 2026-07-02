import { motion } from 'framer-motion'
import type { CSSProperties } from 'react'
import type { AccentColor, ToggleProps } from '../../lib/types'
import './Toggle.css'

function accentStyle(accent: AccentColor): CSSProperties {
  return {
    '--tg-accent': `var(--${accent})`,
    '--tg-accent-soft': `var(--${accent}-soft)`,
  } as CSSProperties
}

export function Toggle({ checked, onChange, accent = 'lavender', ariaLabel }: ToggleProps) {
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={checked ? 'tg-root tg-on' : 'tg-root'}
      style={accentStyle(accent)}
      onClick={() => onChange(!checked)}
      whileTap={{ scale: 0.9 }}
    >
      <motion.div
        className="tg-knob"
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  )
}
