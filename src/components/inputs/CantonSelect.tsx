import { motion } from 'framer-motion'
import type { CantonSelectProps } from '../../lib/types'
import { CANTONS, CUSTOM_CANTON } from '../../lib/cantons'
import './CantonSelect.css'

export function CantonSelect({ value, onChange }: CantonSelectProps) {
  return (
    <motion.div
      className="cs-card"
      whileHover={{ y: -2, boxShadow: 'var(--shadow-card-hover)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <div className="cs-icon" aria-hidden="true">
        📍
      </div>
      <div className="cs-body">
        <label className="cs-label" htmlFor="cs-canton">
          Canton
        </label>
        <p className="cs-hint">
          sets transfer costs, property &amp; gains tax — rough estimates, communes vary
        </p>
      </div>
      <div className="cs-select-wrap">
        <select
          id="cs-canton"
          className="cs-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value={CUSTOM_CANTON}>Custom</option>
          {CANTONS.map((canton) => (
            <option key={canton.code} value={canton.code}>
              {canton.name}
            </option>
          ))}
        </select>
        <span className="cs-chevron" aria-hidden="true">
          ▾
        </span>
      </div>
    </motion.div>
  )
}
