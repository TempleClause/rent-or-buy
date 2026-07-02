import { motion } from 'framer-motion'
import type { CSSProperties } from 'react'
import type { AccentColor, SliderInputProps } from '../../lib/types'
import './SliderInput.css'

function accentStyle(accent: AccentColor): CSSProperties {
  return {
    '--si-accent': `var(--${accent})`,
    '--si-accent-soft': `var(--${accent}-soft)`,
  } as CSSProperties
}

const defaultFormat = (v: number) => v.toLocaleString()

export function SliderInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = defaultFormat,
  accent = 'lavender',
  hint,
}: SliderInputProps) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0
  const display = format(value)

  return (
    <div className="si-root" style={accentStyle(accent)}>
      <div className="si-top">
        <div className="si-labels">
          <span className="si-label">{label}</span>
          {hint && <span className="si-hint">{hint}</span>}
        </div>
        <motion.span
          key={display}
          className="si-chip"
          initial={{ scale: 1.18 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
        >
          {display}
        </motion.span>
      </div>
      <input
        type="range"
        className="si-range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, var(--si-accent) 0%, var(--si-accent) ${pct}%, var(--lavender-soft) ${pct}%)`,
        }}
      />
    </div>
  )
}
