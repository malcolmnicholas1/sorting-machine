import { useEffect, useState } from 'react'
import teamIcon from './assets/team-time-bros-icon.png'
import teamLogo from './assets/team-time-bros-logo.png'
import { PrototypeStage } from './components/PrototypeStage.jsx'
import { ArrivalEffectScene } from './scenes/ArrivalEffect.jsx'
import { MechanicalSorterScene } from './scenes/MechanicalSorter.jsx'
import { VisionSorterScene } from './scenes/VisionSorter.jsx'

const MECHANICAL_CAMERA_PRESETS = [
  { id: 'overview', label: 'OVERVIEW' },
  { id: 'hopper', label: 'HOPPER' },
  { id: 'st01', label: 'ST 01 · SPHERES' },
  { id: 'st02', label: 'ST 02 · CUBES' },
  { id: 'st03', label: 'ST 03 · PYRAMIDS' },
  { id: 'bypass', label: 'BYPASS MECHANISM' },
  { id: 'bins', label: 'SORTED BINS' },
]

const VISION_CAMERA_PRESETS = [
  { id: 'overview', label: 'OVERVIEW' },
  { id: 'hopper', label: 'HOPPER' },
  { id: 'scanner', label: 'VISION GANTRY' },
  { id: 'pick', label: 'PICK NEST' },
  { id: 'robot', label: 'ROBOT ARM' },
  { id: 'bins', label: 'SORTED BINS' },
]

const PROTOTYPE_CARDS = [
  {
    id: 'design-01a',
    badge: '01A · OPTION 1 MODEL',
    title: 'Stationary Deck + Sweep Paddles',
    description: 'Fixed platter floors with interior drop-through holes and rotating 4-arm sweep paddles.',
    style: 'border-cyan-300/35 bg-cyan-300/10 hover:bg-cyan-300/15',
    badgeStyle: 'text-cyan-200',
  },
  {
    id: 'design-01b',
    badge: '01B · OPTION 2 MODEL',
    title: 'Solid Turntable + Rim Funnel',
    description: 'Hole-free spinning discs with stationary wiper plows feeding external perimeter drop funnels.',
    style: 'border-cyan-300/35 bg-cyan-300/10 hover:bg-cyan-300/15',
    badgeStyle: 'text-cyan-200',
  },
  {
    id: 'design-02',
    badge: '02 · LIVE MODEL',
    title: 'Vision-Guided Pick & Place',
    description: 'A camera classifies each shape; a robotic arm moves it to the matching bin.',
    style: 'border-cyan-300/35 bg-cyan-300/10 hover:bg-cyan-300/15',
    badgeStyle: 'text-cyan-200',
  },
  {
    id: 'design-03',
    badge: '03 · LIVE MODEL',
    title: 'The Unexpected Arrival',
    description: 'A wormhole brings an influential character through, startling the carrier into spilling the shapes.',
    style: 'border-violet-300/35 bg-violet-300/10 hover:bg-violet-300/15',
    badgeStyle: 'text-violet-200',
  },
]

const CHALLENGE_PILLARS = [
  {
    title: 'Sorting system',
    description: 'Use technical methods to move items into defined groups.',
  },
  {
    title: 'Visible evidence',
    description: 'Keep item grouping clear and easy for appraisers to verify.',
  },
  {
    title: 'Random start',
    description: 'Plan for randomized item placement before each sorting attempt.',
  },
  {
    title: 'Story integration',
    description: 'Make the machine and its sorting process matter to the story.',
  },
]

function CameraPresetBar({ presets = MECHANICAL_CAMERA_PRESETS, activePreset, onSelect }) {
  return (
    <>
      <span className="mr-1 hidden font-mono text-[9px] tracking-widest text-slate-400 sm:inline">
        FOCUS:
      </span>
      {presets.map((preset) => {
        const active = activePreset === preset.id
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.id)}
            className={`rounded-md border px-2 py-1 font-mono text-[9px] tracking-wider transition ${
              active
                ? 'border-cyan-300 bg-cyan-300/20 text-cyan-100'
                : 'border-white/10 bg-slate-950/65 text-slate-300 hover:border-cyan-300/45 hover:text-cyan-200'
            }`}
          >
            {preset.label}
          </button>
        )
      })}
    </>
  )
}

function App() {
  const [expandedPrototype, setExpandedPrototype] = useState(null)
  const [paddleCamera, setPaddleCamera] = useState('overview')
  const [turntableCamera, setTurntableCamera] = useState('overview')
  const [visionCamera, setVisionCamera] = useState('overview')

  useEffect(() => {
    if (!expandedPrototype) return undefined

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setExpandedPrototype(null)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [expandedPrototype])

  const anyExpanded = Boolean(expandedPrototype)

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#07111e] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_25%_0%,rgba(14,165,233,0.12),transparent_26%),radial-gradient(circle_at_80%_35%,rgba(168,85,247,0.11),transparent_23%)]" />
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 lg:px-10">
        <a href="#home" className="flex items-center" aria-label="Team Time Bros home">
          <img
            src={teamLogo}
            alt="Team Time Bros"
            className="h-20 w-auto max-w-[360px] rounded-xl object-contain sm:h-24 sm:max-w-[430px]"
          />
        </a>
        <div className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
          <a className="transition hover:text-cyan-200" href="#about">
            About
          </a>
          <a className="transition hover:text-cyan-200" href="#designs">
            Designs
          </a>
          <a className="transition hover:text-cyan-200" href="#challenge">
            Challenge
          </a>
        </div>
        <a
          href="#designs"
          className="rounded-full border border-cyan-300/35 bg-cyan-300/10 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-300 hover:text-slate-950"
        >
          View prototypes
        </a>
      </nav>

      <section
        id="home"
        className="mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:pb-36 lg:pt-12"
      >
        <div>
          <p className="mb-6 font-mono text-xs font-medium tracking-[0.25em] text-cyan-300">
            DESTINATION IMAGINATION · 2026–27
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[0.95] tracking-[-0.055em] sm:text-7xl">
            Making time for{' '}
            <span className="bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-300 bg-clip-text text-transparent">
              big ideas.
            </span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-slate-300">
            We’re Team Time Bros: makers, storytellers, and problem-solvers building inventive ways to get things
            sorted.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#designs"
              className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-100"
            >
              Explore our designs
            </a>
            <a
              href="#challenge"
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
            >
              Challenge focus
            </a>
          </div>
        </div>
        <div className="grid gap-4 self-end sm:grid-cols-2 lg:grid-cols-1">
          <div className="flex items-center gap-5 rounded-3xl border border-white/10 bg-slate-900/65 p-6 shadow-xl shadow-slate-950/20">
            <img
              src={teamIcon}
              alt="Team Time Bros clock and growth icon"
              className="h-20 w-20 rounded-2xl object-cover shadow-lg shadow-cyan-950/40"
            />
            <div>
              <p className="font-mono text-xs tracking-[0.18em] text-cyan-300">OUR MISSION</p>
              <p className="mt-3 text-2xl font-medium leading-tight">
                Turn curious questions into working prototypes.
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-violet-300/15 bg-violet-400/10 p-6">
            <p className="font-mono text-xs tracking-[0.18em] text-violet-200">SEASON PROJECT</p>
            <p className="mt-4 text-xl leading-snug text-slate-200">
              A visible, mechanical sorting system with a story worth sharing.
            </p>
          </div>
        </div>
      </section>

      <section id="about" className="border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
          <div>
            <p className="font-mono text-xs tracking-[0.22em] text-cyan-300">ABOUT THE TEAM</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight">The Time Bros workshop</h2>
          </div>
          <p className="max-w-3xl text-lg leading-8 text-slate-300">
            This is our shared build journal for testing mechanisms, comparing ideas, and documenting the designs
            that become part of our presentation. Every prototype starts as a question, becomes a model, and earns
            its place through iteration.
          </p>
        </div>
      </section>

      <section id="designs" className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="font-mono text-xs tracking-[0.22em] text-cyan-300">DESIGNS</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Prototype gallery</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-slate-400">
            Interactive models and in-progress concepts from the Team Time Bros workshop.
          </p>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PROTOTYPE_CARDS.map((card) => (
            <a
              key={card.id}
              href={`#${card.id}`}
              className={`rounded-2xl border p-5 transition ${card.style}`}
            >
              <p className={`font-mono text-[10px] tracking-[0.2em] ${card.badgeStyle}`}>{card.badge}</p>
              <h3 className="mt-3 text-xl font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{card.description}</p>
            </a>
          ))}
        </div>

        <PrototypeStage
          id="design-01a"
          eyebrow="TEAM TIME BROS · DESIGN 01A (OPTION 1)"
          title="Mechanical Sorter · Stationary Deck + Rotating Sweep Paddles"
          statusLabel="SIMULATION ACTIVE"
          secondaryStatus="FIXED DECK · INTERIOR DROP HOLE"
          accent="cyan"
          bgClass="bg-[#070d18]"
          heightClass="h-[580px] lg:h-[700px]"
          expanded={expandedPrototype === 'mechanical-paddle'}
          anyExpanded={anyExpanded}
          onExpand={() => setExpandedPrototype('mechanical-paddle')}
          onClose={() => setExpandedPrototype(null)}
          subHeader={<CameraPresetBar activePreset={paddleCamera} onSelect={setPaddleCamera} />}
          leftHud={
            <>
              <span className="text-cyan-300">OPTION 1 MECHANISM</span>
              <br />
              STATIONARY FLOOR DECK + ROTATING 4-ARM PADDLE SPIDER
            </>
          }
          rightHud={
            <>
              <span className="text-white">BYPASS PATH</span>
              <br />
              FIXED INTERIOR HOLE IN STATIONARY DECK
              <br />
              UNMATCHED ITEMS SWEPT OVER DROP TUBE
            </>
          }
        >
          <MechanicalSorterScene activePreset={paddleCamera} variant="paddle" />
        </PrototypeStage>

        <PrototypeStage
          id="design-01b"
          eyebrow="TEAM TIME BROS · DESIGN 01B (OPTION 2)"
          title="Mechanical Sorter · Solid Turntable + External Rim Funnel"
          statusLabel="SIMULATION ACTIVE"
          secondaryStatus="SOLID DISC · WIPER PLOW + RIM FUNNEL"
          accent="cyan"
          bgClass="bg-[#070d18]"
          heightClass="mt-12 h-[580px] lg:h-[700px]"
          expanded={expandedPrototype === 'mechanical-turntable'}
          anyExpanded={anyExpanded}
          onExpand={() => setExpandedPrototype('mechanical-turntable')}
          onClose={() => setExpandedPrototype(null)}
          subHeader={<CameraPresetBar activePreset={turntableCamera} onSelect={setTurntableCamera} />}
          leftHud={
            <>
              <span className="text-cyan-300">OPTION 2 MECHANISM</span>
              <br />
              SOLID SPINNING TURNTABLE (NO HOLES) + ANGLED WIPER PLOW
            </>
          }
          rightHud={
            <>
              <span className="text-white">BYPASS PATH</span>
              <br />
              PLOW PUSHES ITEMS OFF OUTER EDGE
              <br />
              EXTERNAL DROP FUNNEL FEEDS NEXT LEVEL
            </>
          }
        >
          <MechanicalSorterScene activePreset={turntableCamera} variant="turntable" />
        </PrototypeStage>

        <PrototypeStage
          id="design-02"
          eyebrow="TEAM TIME BROS · DESIGN 02"
          title="Vision-Guided Pick & Place"
          statusLabel="LIVE CV + 6-AXIS ARM"
          secondaryStatus="4 TARGET BINS"
          accent="cyan"
          bgClass="bg-[#070d18]"
          heightClass="mt-12 h-[580px] lg:h-[680px]"
          expanded={expandedPrototype === 'vision'}
          anyExpanded={anyExpanded}
          onExpand={() => setExpandedPrototype('vision')}
          onClose={() => setExpandedPrototype(null)}
          subHeader={
            <CameraPresetBar
              presets={VISION_CAMERA_PRESETS}
              activePreset={visionCamera}
              onSelect={setVisionCamera}
            />
          }
          leftHud={
            <>
              <span className="text-cyan-300">PIPELINE</span>
              <br />
              HOPPER → CV RETICLE SCAN → PHOTO-EYE STOP → ROBOT PLACE
            </>
          }
          rightHud={
            <>
              <span className="text-white">VISION &amp; ROBOTICS</span>
              <br />
              3D BOUNDING BOX + CONFIDENCE READOUT
              <br />
              SWIVEL TURRET ARM → 4 SORTED BINS
            </>
          }
        >
          <VisionSorterScene activePreset={visionCamera} />
        </PrototypeStage>

        <PrototypeStage
          id="design-03"
          eyebrow="TEAM TIME BROS · DESIGN 03"
          title="The Unexpected Arrival"
          statusLabel="STORY EFFECT"
          accent="violet"
          bgClass="bg-[#090b19]"
          expanded={expandedPrototype === 'arrival'}
          anyExpanded={anyExpanded}
          onExpand={() => setExpandedPrototype('arrival')}
          onClose={() => setExpandedPrototype(null)}
          leftHud={
            <>
              <span className="text-violet-300">STORY BEAT</span>
              <br />
              PORTAL OPENS → VISITOR ARRIVES → BOX SPILLS
            </>
          }
          rightHud="DRAG TO ORBIT · SCROLL TO ZOOM"
        >
          <ArrivalEffectScene />
        </PrototypeStage>
      </section>

      <section id="challenge" className="border-t border-white/10 bg-slate-900/45">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
          <p className="font-mono text-xs tracking-[0.22em] text-cyan-300">CHALLENGE PLANNING</p>
          <h2 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight">Design decisions we’re tracking</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {CHALLENGE_PILLARS.map((pillar) => (
              <div key={pillar.title} className="rounded-2xl border border-white/10 bg-slate-950/45 p-5">
                <strong className="block text-cyan-200">{pillar.title}</strong>
                <p className="mt-2 text-sm leading-6 text-slate-400">{pillar.description}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-3xl text-sm leading-6 text-slate-500">
            This workspace is for planning and prototyping. The team should continue to verify all build and
            tournament decisions against the official Challenge materials, Rules of the Road, and published
            clarifications.
          </p>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500 lg:px-10">
        <span>TEAM TIME BROS</span>
        <span>Design. Test. Iterate.</span>
      </footer>
    </main>
  )
}

export default App
