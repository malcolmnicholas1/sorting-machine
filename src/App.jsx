import { useEffect, useState } from 'react'
import teamIcon from './assets/team-time-bros-icon.png'
import teamLogo from './assets/team-time-bros-logo.png'
import { PrototypeStage } from './components/PrototypeStage.jsx'
import { ArrivalEffectScene } from './scenes/ArrivalEffect.jsx'
import { MechanicalSorterScene } from './scenes/MechanicalSorter.jsx'
import { VisionSorterScene } from './scenes/VisionSorter.jsx'

const PROTOTYPE_CARDS = [
  {
    id: 'design-01',
    badge: '01 · LIVE MODEL',
    title: 'Mechanical Shape Sorter',
    description: 'A single incline conveyor and three passive shape-gauge stations.',
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

function App() {
  const [expandedPrototype, setExpandedPrototype] = useState(null)

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

        <div className="mb-6 grid gap-4 md:grid-cols-3">
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
          id="design-01"
          eyebrow="TEAM TIME BROS · DESIGN 01"
          title="Mechanical Shape Sorter"
          statusLabel="SIMULATION ACTIVE"
          secondaryStatus="4 HORIZONTAL PLATTERS"
          accent="cyan"
          bgClass="bg-[#070d18]"
          heightClass="h-[560px] lg:h-[680px]"
          expanded={expandedPrototype === 'mechanical'}
          anyExpanded={anyExpanded}
          onExpand={() => setExpandedPrototype('mechanical')}
          onClose={() => setExpandedPrototype(null)}
          leftHud={
            <>
              <span className="text-cyan-300">CONTROLS</span>
              <br />
              DRAG TO ORBIT · SCROLL TO ZOOM
            </>
          }
          rightHud={
            <>
              <span className="text-white">MECHANICAL GAUGES</span>
              <br />
              V-GROOVE → LEVEL FEELERS → TRI-NEST
              <br />
              UNSORTED → AMBER COLLECTOR
            </>
          }
        >
          <MechanicalSorterScene />
        </PrototypeStage>

        <PrototypeStage
          id="design-02"
          eyebrow="TEAM TIME BROS · DESIGN 02"
          title="Vision-Guided Pick & Place"
          statusLabel="CAMERA + ROBOT ARM"
          accent="cyan"
          bgClass="bg-[#070d18]"
          expanded={expandedPrototype === 'vision'}
          anyExpanded={anyExpanded}
          onExpand={() => setExpandedPrototype('vision')}
          onClose={() => setExpandedPrototype(null)}
          leftHud={
            <>
              <span className="text-cyan-300">PROCESS</span>
              <br />
              DETECT → CLASSIFY → PICK → PLACE
            </>
          }
          rightHud="DRAG TO ORBIT · SCROLL TO ZOOM"
        >
          <VisionSorterScene />
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
