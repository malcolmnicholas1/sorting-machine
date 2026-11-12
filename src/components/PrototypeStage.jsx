import { Canvas } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { SimulationClock } from './SimulationContext.jsx'

const ACCENT_STYLES = {
  cyan: {
    eyebrow: 'text-cyan-300',
    shadow: 'shadow-cyan-950/30',
    buttonHover: 'hover:border-cyan-300/60 hover:bg-cyan-300/10 hover:text-cyan-200',
    dotActive: 'bg-emerald-400',
  },
  violet: {
    eyebrow: 'text-violet-300',
    shadow: 'shadow-violet-950/30',
    buttonHover: 'hover:border-violet-300/60 hover:bg-violet-300/10 hover:text-violet-200',
    dotActive: 'bg-violet-400',
  },
}

export function PrototypeStage({
  id,
  eyebrow,
  title,
  statusLabel,
  secondaryStatus,
  accent = 'cyan',
  bgClass = 'bg-[#070d18]',
  heightClass = 'mt-12 h-[540px] lg:h-[640px]',
  expanded,
  anyExpanded,
  onExpand,
  onClose,
  leftHud,
  rightHud,
  children,
}) {
  const containerRef = useRef(null)
  const [inView, setInView] = useState(true)
  const [paused, setPaused] = useState(false)
  const styles = ACCENT_STYLES[accent] || ACCENT_STYLES.cyan

  useEffect(() => {
    const node = containerRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
      },
      { rootMargin: '160px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const isRenderActive = expanded || (inView && !anyExpanded)

  return (
    <>
      {expanded && (
        <div
          className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        id={id}
        ref={containerRef}
        role={expanded ? 'dialog' : undefined}
        aria-modal={expanded ? 'true' : undefined}
        aria-label={title}
        className={`${
          expanded
            ? 'fixed inset-2 z-50 h-auto rounded-2xl sm:inset-5'
            : `relative ${heightClass} rounded-3xl`
        } scroll-mt-6 overflow-hidden border border-slate-700 ${bgClass} shadow-2xl ${styles.shadow}`}
      >
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-950/75 px-5 py-4 backdrop-blur-md">
          <div>
            <p className={`font-mono text-[10px] tracking-[0.28em] ${styles.eyebrow}`}>{eyebrow}</p>
            <h2 className="mt-1 text-base font-semibold tracking-tight text-white">{title}</h2>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="hidden gap-5 font-mono text-[10px] tracking-wider text-slate-400 sm:flex">
              <span>
                <i
                  className={`mr-2 inline-block h-2 w-2 rounded-full ${
                    paused ? 'bg-amber-400' : styles.dotActive
                  }`}
                />
                {paused ? 'PAUSED' : statusLabel}
              </span>
              {secondaryStatus && <span>{secondaryStatus}</span>}
            </div>
            <button
              type="button"
              onClick={() => setPaused((prev) => !prev)}
              aria-pressed={paused}
              aria-label={paused ? `Resume ${title} simulation` : `Pause ${title} simulation`}
              className={`flex h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 font-mono text-[11px] tracking-wider text-white transition ${styles.buttonHover}`}
            >
              <span aria-hidden="true">{paused ? '▶' : '⏸'}</span>
              <span className="hidden xs:inline sm:inline">{paused ? 'PLAY' : 'PAUSE'}</span>
            </button>
            <button
              type="button"
              onClick={expanded ? onClose : onExpand}
              aria-label={expanded ? `Close expanded ${title}` : `Expand ${title}`}
              className={`grid h-9 min-w-9 place-items-center rounded-lg border border-white/15 bg-white/5 px-2 text-lg text-white transition ${styles.buttonHover}`}
            >
              {expanded ? '×' : '⛶'}
            </button>
          </div>
        </div>

        <Canvas
          shadows
          dpr={[1, 2]}
          frameloop={isRenderActive ? 'always' : 'never'}
          gl={{ antialias: true }}
        >
          <SimulationClock paused={paused}>{children}</SimulationClock>
        </Canvas>

        {leftHud && (
          <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-xl border border-white/10 bg-slate-950/75 px-3.5 py-2.5 font-mono text-[10px] leading-5 tracking-wide text-slate-300 backdrop-blur-md sm:bottom-5 sm:left-5">
            {leftHud}
          </div>
        )}
        {rightHud && (
          <div className="pointer-events-none absolute bottom-4 right-4 z-10 hidden rounded-xl border border-white/10 bg-slate-950/75 px-3.5 py-2.5 font-mono text-[10px] leading-5 tracking-wide text-slate-400 backdrop-blur-md sm:bottom-5 sm:right-5 sm:block">
            {rightHud}
          </div>
        )}
      </div>
    </>
  )
}

