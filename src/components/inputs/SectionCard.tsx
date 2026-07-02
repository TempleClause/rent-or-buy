import { useId, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { CSSProperties } from 'react'
import type { AccentColor, SectionCardProps } from '../../lib/types'
import './SectionCard.css'

function accentStyle(accent: AccentColor): CSSProperties {
  return {
    '--sc-accent': `var(--${accent})`,
    '--sc-accent-soft': `var(--${accent}-soft)`,
  } as CSSProperties
}

export function SectionCard({
  title,
  icon,
  accent = 'lavender',
  defaultOpen = true,
  children,
}: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyId = useId()

  return (
    <section className="sc-root" style={accentStyle(accent)}>
      <motion.button
        type="button"
        className="sc-header"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.985 }}
      >
        {icon && (
          <span className="sc-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="sc-title">{title}</span>
        <motion.span
          className="sc-chevron"
          aria-hidden="true"
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        >
          ▾
        </motion.span>
      </motion.button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={bodyId}
            className="sc-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { type: 'spring', stiffness: 260, damping: 30 },
              opacity: { duration: 0.2 },
            }}
          >
            <div className="sc-body-inner">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
