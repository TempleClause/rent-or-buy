import './Background.css'

/**
 * Fixed pastel dreamscape behind the whole app: a soft gradient wash,
 * five slowly drifting blurred color blobs, and a couple of barely-there
 * floating emoji. Pure CSS animations — cheap infinite ambient motion.
 */
export function Background() {
  return (
    <div className="bgfx-root" aria-hidden="true">
      <div className="bgfx-blob bgfx-blob-lavender" />
      <div className="bgfx-blob bgfx-blob-mint" />
      <div className="bgfx-blob bgfx-blob-peach" />
      <div className="bgfx-blob bgfx-blob-sky" />
      <div className="bgfx-blob bgfx-blob-rose" />
      <span className="bgfx-sparkle bgfx-sparkle-1">✨</span>
      <span className="bgfx-sparkle bgfx-sparkle-2">🏠</span>
      <span className="bgfx-sparkle bgfx-sparkle-3">🔑</span>
    </div>
  )
}
