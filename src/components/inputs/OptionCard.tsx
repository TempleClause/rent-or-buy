import { motion } from 'framer-motion'
import type { CSSProperties, KeyboardEvent } from 'react'
import type { AccentColor, OptionCardProps } from '../../lib/types'
import { Toggle } from './Toggle'
import './OptionCard.css'

function accentStyle(accent: AccentColor): CSSProperties {
  return {
    '--oc-accent': `var(--${accent})`,
    '--oc-accent-soft': `var(--${accent}-soft)`,
  } as CSSProperties
}

const cardVariants = {
  hover: { y: -2, boxShadow: 'var(--shadow-card-hover)' },
}

const iconVariants = {
  hover: { rotate: [0, -8, 8, 0], transition: { duration: 0.4 } },
}

export function OptionCard({
  title,
  description,
  checked,
  onChange,
  accent = 'lavender',
  icon,
}: OptionCardProps) {
  const toggle = () => onChange(!checked)

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      toggle()
    }
  }

  return (
    <motion.div
      className={checked ? 'oc-root oc-checked' : 'oc-root'}
      style={accentStyle(accent)}
      role="switch"
      aria-checked={checked}
      aria-label={title}
      tabIndex={0}
      onClick={toggle}
      onKeyDown={handleKeyDown}
      variants={cardVariants}
      whileHover="hover"
      whileTap={{ scale: 0.99 }}
    >
      {icon && (
        <motion.span className="oc-icon" variants={iconVariants} aria-hidden="true">
          {icon}
        </motion.span>
      )}
      <span className="oc-text">
        <span className="oc-title">{title}</span>
        <span className="oc-desc">{description}</span>
      </span>
      {/* Purely visual — the card itself is the single switch control. */}
      <span className="oc-toggle" aria-hidden="true" inert>
        <Toggle checked={checked} onChange={toggle} accent={accent} />
      </span>
    </motion.div>
  )
}
