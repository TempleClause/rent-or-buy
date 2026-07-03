import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { ChangeEvent, CSSProperties } from 'react'
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

  const inputRef = useRef<HTMLInputElement>(null)
  /*
   * Touch handling. A native <input type=range> snaps its value to wherever a
   * finger lands on the track, so trying to scroll the page by dragging from a
   * point on a slider yanks the value there — and preventDefault can't cancel
   * that commit. We classify the gesture direction from the pointer stream and
   * let handleChange (the single writer) decide: a deliberate HORIZONTAL drag
   * flows through natively; the touchdown snap and any vertical drag are
   * rejected and the thumb is reverted, so the page scrolls untouched via
   * touch-action: pan-y. Mouse and keyboard are always native.
   */
  const drag = useRef<{ active: boolean; axis: 'x' | 'y' | null }>({ active: false, axis: null })

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    let startX = 0
    let startY = 0

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') {
        drag.current = { active: false, axis: null }
        return
      }
      startX = e.clientX
      startY = e.clientY
      drag.current = { active: true, axis: null }
    }
    const onMove = (e: PointerEvent) => {
      const d = drag.current
      if (!d.active || e.pointerType === 'mouse' || d.axis !== null) return
      const dx = Math.abs(e.clientX - startX)
      const dy = Math.abs(e.clientY - startY)
      if (dx < 5 && dy < 5) return // wait for a clear direction
      d.axis = dx > dy ? 'x' : 'y'
    }
    const onUp = () => {
      drag.current = { active: false, axis: null }
    }

    const opts = { capture: true } as const
    el.addEventListener('pointerdown', onDown, opts)
    el.addEventListener('pointermove', onMove, opts)
    el.addEventListener('pointerup', onUp, opts)
    el.addEventListener('pointercancel', onUp, opts)
    return () => {
      el.removeEventListener('pointerdown', onDown, opts)
      el.removeEventListener('pointermove', onMove, opts)
      el.removeEventListener('pointerup', onUp, opts)
      el.removeEventListener('pointercancel', onUp, opts)
    }
  }, [])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const d = drag.current
    // Reject the native value while a touch gesture is undecided or vertical:
    // revert the thumb and don't propagate. A confirmed horizontal drag (or
    // mouse / keyboard) flows through.
    if (d.active && d.axis !== 'x') {
      e.target.value = String(value)
      return
    }
    onChange(Number(e.target.value))
  }

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
        ref={inputRef}
        type="range"
        className="si-range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        style={{
          background: `linear-gradient(to right, var(--si-accent) 0%, var(--si-accent) ${pct}%, var(--lavender-soft) ${pct}%)`,
        }}
      />
    </div>
  )
}
