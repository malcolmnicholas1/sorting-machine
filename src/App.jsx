import { Html, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'

const TYPE_CONFIG = {
  cube: { color: '#ef4444', label: 'CUBES', binX: 6.2, platterY: 3.65, icon: '■' },
  sphere: { color: '#22c55e', label: 'SPHERES', binX: 3.65, platterY: 5.4, icon: '●' },
  pyramid: { color: '#3b82f6', label: 'PYRAMIDS', binX: 1.05, platterY: 1.9, icon: '▲' },
}

const OBJECTS = Array.from({ length: 15 }, (_, index) => ({
  type: ['cube', 'sphere', 'pyramid'][index % 3],
  offset: index * 1.22,
  lane: (index % 3) - 1,
}))

function move(object, x, y, z) {
  object.position.set(x, y, z)
}

function Shape({ type, color }) {
  if (type === 'sphere') {
    return <mesh castShadow><sphereGeometry args={[0.28, 24, 24]} /><meshStandardMaterial color={color} roughness={0.24} metalness={0.25} /></mesh>
  }
  if (type === 'pyramid') {
    return <mesh castShadow rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.37, 0.62, 4]} /><meshStandardMaterial color={color} roughness={0.3} metalness={0.18} /></mesh>
  }
  return <mesh castShadow><boxGeometry args={[0.5, 0.5, 0.5]} /><meshStandardMaterial color={color} roughness={0.24} metalness={0.22} /></mesh>
}

function MovingObject({ item }) {
  const group = useRef()
  const config = TYPE_CONFIG[item.type]

  useFrame(({ clock }) => {
    const phase = (clock.getElapsedTime() + item.offset) % 15.5
    const z = item.lane * 0.34
    const targetY = config.platterY

    if (phase < 5) {
      const progress = phase / 5
      move(group.current, -6.1 + progress * 5.8, 0.42 + progress * 4.98, z)
      group.current.rotation.set(0, phase * 3.5, 0)
    } else if (phase < 5 + (5.4 - targetY) / 1.65) {
      move(group.current, -0.3, 5.4 - (phase - 5) * 1.65, z)
      group.current.rotation.x += 0.06
    } else if (phase < 10.6) {
      const progress = (phase - (5 + (5.4 - targetY) / 1.65)) / (10.6 - (5 + (5.4 - targetY) / 1.65))
      move(group.current, -0.3 + progress * 3.15, targetY, z)
      group.current.rotation.y += 0.07
    } else if (phase < 13.2) {
      const progress = (phase - 10.6) / 2.6
      move(group.current, 2.85 + progress * (config.binX - 2.85), targetY - progress * (targetY + 0.25), z)
      group.current.rotation.x += 0.08
    } else {
      const progress = (phase - 13.2) / 2.3
      move(group.current, config.binX, -0.25, z * (1 - progress))
      group.current.rotation.y += 0.12
    }
  })

  return <group ref={group}><Shape type={item.type} color={config.color} /></group>
}

function Conveyor({ position, length = 5.4, rotation = [0, 0, 0] }) {
  const rollers = useMemo(() => [-length / 2 + 0.25, length / 2 - 0.25], [length])
  return (
    <group position={position} rotation={rotation}>
      <mesh receiveShadow><boxGeometry args={[length, 0.22, 1.35]} /><meshStandardMaterial color="#263447" roughness={0.7} /></mesh>
      <mesh position={[0, 0.125, 0]}><boxGeometry args={[length - 0.08, 0.035, 1.08]} /><meshStandardMaterial color="#111827" roughness={0.85} /></mesh>
      {rollers.map((x) => <mesh key={x} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.22, 0.22, 1.48, 18]} /><meshStandardMaterial color="#64748b" metalness={0.7} /></mesh>)}
      {Array.from({ length: Math.floor(length * 2) }, (_, index) => <mesh key={index} position={[-length / 2 + 0.3 + index * 0.5, 0.16, 0]}><boxGeometry args={[0.045, 0.03, 1.12]} /><meshBasicMaterial color="#38bdf8" transparent opacity={0.25} /></mesh>)}
    </group>
  )
}

function MechanicalGauge({ type }) {
  if (type === 'sphere') {
    return (
      <group>
        <mesh position={[0, 0.18, -0.42]} rotation={[0, 0, -0.42]}><boxGeometry args={[1.45, 0.1, 0.09]} /><meshStandardMaterial color="#0f172a" metalness={0.75} /></mesh>
        <mesh position={[0, 0.18, 0.42]} rotation={[0, 0, 0.42]}><boxGeometry args={[1.45, 0.1, 0.09]} /><meshStandardMaterial color="#0f172a" metalness={0.75} /></mesh>
        <mesh position={[0.4, 0.21, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.13, 0.13, 0.82, 20]} /><meshStandardMaterial color="#22c55e" metalness={0.6} /></mesh>
        <mesh position={[0.4, 0.32, 0]}><sphereGeometry args={[0.17, 16, 16]} /><meshStandardMaterial color="#86efac" emissive="#22c55e" emissiveIntensity={0.3} /></mesh>
      </group>
    )
  }
  if (type === 'cube') {
    return (
      <group>
        {[[-0.45, -0.38], [-0.45, 0.38], [0.45, -0.38], [0.45, 0.38]].map(([x, z]) => <mesh key={`${x}-${z}`} position={[x, 0.25, z]}><cylinderGeometry args={[0.08, 0.08, 0.38, 12]} /><meshStandardMaterial color="#e2e8f0" metalness={0.85} /></mesh>)}
        <mesh position={[0, 0.16, 0]}><boxGeometry args={[1.15, 0.08, 1.15]} /><meshStandardMaterial color="#475569" metalness={0.7} /></mesh>
        <mesh position={[0.84, 0.35, 0]} rotation={[0, 0, -0.5]}><boxGeometry args={[0.65, 0.07, 0.09]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.22} /></mesh>
      </group>
    )
  }
  if (type === 'pyramid') {
    return (
      <group>
        {[0, 1, 2].map((index) => {
          const angle = Math.PI / 2 + index * (Math.PI * 2 / 3)
          return <mesh key={index} position={[Math.cos(angle) * 0.55, 0.2, Math.sin(angle) * 0.55]} rotation={[0, -angle, 0]}><boxGeometry args={[0.72, 0.1, 0.09]} /><meshStandardMaterial color="#60a5fa" metalness={0.7} /></mesh>
        })}
        <mesh position={[0, 0.18, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.28, 0.1, 3]} /><meshStandardMaterial color="#1e3a8a" /></mesh>
      </group>
    )
  }
  return <mesh position={[0, 0.18, 0]}><boxGeometry args={[1.7, 0.11, 1.15]} /><meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.12} /></mesh>
}

function Platter({ y, label, accepts, color, type }) {
  const labelPosition = type === 'sphere' ? [-1.7, -0.72, 0] : [-1.7, 0.25, 0]

  return (
    <group position={[-0.25, y, 0]}>
      <mesh receiveShadow rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.38, 1.38, 0.18, 64]} /><meshStandardMaterial color="#334155" metalness={0.65} roughness={0.32} /></mesh>
      <mesh position={[0, 0.11, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.28, 0.035, 8, 48]} /><meshBasicMaterial color={color} /></mesh>
      <MechanicalGauge type={type} />
      <Html position={labelPosition} center transform distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div className="w-32 rounded-lg border border-white/15 bg-slate-950/85 px-2 py-1 text-center font-mono text-[9px] tracking-wider text-slate-200 shadow-xl">
          <span className="block text-[8px] text-slate-400">{label}</span><span style={{ color }}>{accepts}</span>
        </div>
      </Html>
    </group>
  )
}

function Chute({ y, color, binX }) {
  return (
    <group>
      <mesh position={[1.37, y, 0]} rotation={[0, 0, -0.1]}><boxGeometry args={[3.45, 0.13, 0.9]} /><meshStandardMaterial color="#475569" metalness={0.65} roughness={0.35} /></mesh>
      <mesh position={[(2.85 + binX) / 2, y / 2, 0]} rotation={[0, 0, -Math.atan2(y + 0.25, binX - 2.85)]}><boxGeometry args={[Math.hypot(binX - 2.85, y + 0.25), 0.13, 0.9]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} metalness={0.45} /></mesh>
    </group>
  )
}

function CollectionBin({ type }) {
  const { color, label, binX, icon } = TYPE_CONFIG[type]
  return (
    <group position={[binX, -0.75, 0]}>
      <mesh><boxGeometry args={[1.12, 0.9, 1.12]} /><meshStandardMaterial color="#182235" roughness={0.6} /></mesh>
      <mesh position={[0, 0.47, 0]}><boxGeometry args={[0.97, 0.07, 0.97]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.32} /></mesh>
      <Html position={[0, -0.72, 0.82]} center transform distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div className="w-20 rounded-md border px-1.5 py-1 text-center font-mono text-[8px] font-bold tracking-wider" style={{ background: `${color}22`, borderColor: color, color }}>{icon} {label}</div>
      </Html>
    </group>
  )
}

function UnsortedCollector() {
  return (
    <group position={[-1.35, -0.75, -1.55]}>
      <mesh><boxGeometry args={[1.35, 0.9, 1.12]} /><meshStandardMaterial color="#1f2937" roughness={0.6} /></mesh>
      <mesh position={[0, 0.47, 0]}><boxGeometry args={[1.18, 0.07, 0.95]} /><meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.35} /></mesh>
      <Html position={[0, -0.72, 0]} center transform distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div className="w-28 rounded-md border border-amber-400 bg-amber-400/10 px-2 py-1 text-center font-mono text-[9px] font-bold tracking-widest text-amber-300">↻ UNSORTED</div>
      </Html>
    </group>
  )
}

function Machine() {
  return (
    <group>
      <mesh position={[-0.25, 2.3, 0]}><cylinderGeometry args={[0.3, 0.3, 7.1, 24]} /><meshStandardMaterial color="#172033" metalness={0.75} roughness={0.3} /></mesh>
      <mesh position={[-0.25, -1.3, 0]}><cylinderGeometry args={[2.1, 2.1, 0.35, 64]} /><meshStandardMaterial color="#202d42" metalness={0.5} /></mesh>
      <Conveyor position={[-3.2, 2.88, 0]} length={7.7} rotation={[0, 0, 0.72]} />
      <Platter y={5.4} label="STATION 01" accepts="V-GROOVE · SPHERES" color="#22c55e" type="sphere" />
      <Platter y={3.65} label="STATION 02" accepts="LEVEL FEELERS · CUBES" color="#ef4444" type="cube" />
      <Platter y={1.9} label="STATION 03" accepts="TRI-NEST · PYRAMIDS" color="#3b82f6" type="pyramid" />
      <Platter y={0.15} label="STATION 04" accepts="UNSORTED DROP" color="#f59e0b" type="return" />
      <Chute y={5.4} color="#22c55e" binX={3.5} />
      <Chute y={3.65} color="#ef4444" binX={5.1} />
      <Chute y={1.9} color="#3b82f6" binX={1.9} />
      <CollectionBin type="cube" />
      <CollectionBin type="sphere" />
      <CollectionBin type="pyramid" />
      <UnsortedCollector />
      {OBJECTS.map((item, index) => <MovingObject key={index} item={item} />)}
    </group>
  )
}

function SortingMachineCanvas() {
  return (
    <div className="relative h-[560px] overflow-hidden rounded-3xl border border-slate-700 bg-[#070d18] shadow-2xl shadow-cyan-950/30 lg:h-[680px]">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-950/65 px-5 py-4 backdrop-blur-md">
        <div><p className="font-mono text-[10px] tracking-[0.28em] text-cyan-300">TEAM TIME BROS · DESIGN 01</p><h2 className="mt-1 text-base font-semibold tracking-tight text-white">Mechanical Shape Sorter</h2></div>
        <div className="hidden gap-5 font-mono text-[10px] tracking-wider text-slate-400 sm:flex"><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />SIMULATION ACTIVE</span><span>4 STATIONS</span></div>
      </div>
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault position={[10, 7.2, 13]} fov={38} />
        <color attach="background" args={['#070d18']} />
        <fog attach="fog" args={['#070d18', 13, 28]} />
        <ambientLight intensity={0.45} />
        <directionalLight castShadow position={[4, 10, 7]} intensity={2.3} shadow-mapSize={[2048, 2048]} />
        <pointLight position={[-5, 2, 4]} color="#38bdf8" intensity={18} distance={11} />
        <pointLight position={[4, 5, 1]} color="#a855f7" intensity={13} distance={9} />
        <Machine />
        <gridHelper args={[30, 30, '#1e3a5f', '#111c2e']} position={[0, -1.48, 0]} />
        <OrbitControls target={[-0.4, 2.3, 0]} minDistance={7} maxDistance={22} maxPolarAngle={Math.PI / 2.02} />
      </Canvas>
      <div className="pointer-events-none absolute bottom-5 left-5 z-10 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 font-mono text-[10px] leading-5 tracking-wide text-slate-300 backdrop-blur-md"><span className="text-cyan-300">CONTROLS</span><br />DRAG TO ORBIT · SCROLL TO ZOOM</div>
      <div className="pointer-events-none absolute bottom-5 right-5 z-10 hidden rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 font-mono text-[10px] leading-5 tracking-wide text-slate-400 backdrop-blur-md sm:block"><span className="text-white">MECHANICAL GAUGES</span><br />V-GROOVE → LEVEL FEELERS → TRI-NEST<br />UNSORTED → AMBER COLLECTOR</div>
    </div>
  )
}

function App() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#07111e] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_25%_0%,rgba(14,165,233,0.12),transparent_26%),radial-gradient(circle_at_80%_35%,rgba(168,85,247,0.11),transparent_23%)]" />
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <a href="#home" className="flex items-center gap-3 font-semibold tracking-tight"><span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-violet-500 text-lg text-slate-950">⌁</span><span>TEAM TIME BROS</span></a>
        <div className="hidden items-center gap-7 text-sm text-slate-300 md:flex"><a className="transition hover:text-cyan-200" href="#about">About</a><a className="transition hover:text-cyan-200" href="#designs">Designs</a><a className="transition hover:text-cyan-200" href="#challenge">Challenge</a></div>
        <a href="#designs" className="rounded-full border border-cyan-300/35 bg-cyan-300/10 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-300 hover:text-slate-950">View prototypes</a>
      </nav>

      <section id="home" className="mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:pb-36 lg:pt-28">
        <div>
          <p className="mb-6 font-mono text-xs font-medium tracking-[0.25em] text-cyan-300">DESTINATION IMAGINATION · 2026–27</p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[0.95] tracking-[-0.055em] sm:text-7xl">Making time for <span className="bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-300 bg-clip-text text-transparent">big ideas.</span></h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-slate-300">We’re Team Time Bros: makers, storytellers, and problem-solvers building inventive ways to get things sorted.</p>
          <div className="mt-10 flex flex-wrap gap-3"><a href="#designs" className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-100">Explore our designs</a><a href="#challenge" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5">Challenge focus</a></div>
        </div>
        <div className="grid gap-4 self-end sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-3xl border border-white/10 bg-slate-900/65 p-6 shadow-xl shadow-slate-950/20"><p className="font-mono text-xs tracking-[0.18em] text-cyan-300">OUR MISSION</p><p className="mt-4 text-2xl font-medium leading-tight">Turn curious questions into working prototypes.</p></div>
          <div className="rounded-3xl border border-violet-300/15 bg-violet-400/10 p-6"><p className="font-mono text-xs tracking-[0.18em] text-violet-200">SEASON PROJECT</p><p className="mt-4 text-xl leading-snug text-slate-200">A visible, mechanical sorting system with a story worth sharing.</p></div>
        </div>
      </section>

      <section id="about" className="border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
          <div><p className="font-mono text-xs tracking-[0.22em] text-cyan-300">ABOUT THE TEAM</p><h2 className="mt-4 text-4xl font-semibold tracking-tight">The Time Bros workshop</h2></div>
          <p className="max-w-3xl text-lg leading-8 text-slate-300">This is our shared build journal for testing mechanisms, comparing ideas, and documenting the designs that become part of our presentation. Every prototype starts as a question, becomes a model, and earns its place through iteration.</p>
        </div>
      </section>

      <section id="designs" className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5"><div><p className="font-mono text-xs tracking-[0.22em] text-cyan-300">DESIGNS</p><h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Prototype gallery</h2></div><p className="max-w-sm text-sm leading-6 text-slate-400">Interactive models and in-progress concepts from the Team Time Bros workshop.</p></div>
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-cyan-300/35 bg-cyan-300/10 p-5"><p className="font-mono text-[10px] tracking-[0.2em] text-cyan-200">01 · LIVE MODEL</p><h3 className="mt-3 text-xl font-semibold">Mechanical Shape Sorter</h3><p className="mt-2 text-sm leading-6 text-slate-300">A single incline conveyor and three passive shape-gauge stations.</p></article>
          <article className="rounded-2xl border border-white/10 bg-slate-900/55 p-5"><p className="font-mono text-[10px] tracking-[0.2em] text-slate-400">02 · NEXT PROTOTYPE</p><h3 className="mt-3 text-xl font-semibold">Arrival Effect</h3><p className="mt-2 text-sm leading-6 text-slate-400">A future interactive model for the story’s technical entrance.</p></article>
          <article className="rounded-2xl border border-white/10 bg-slate-900/55 p-5"><p className="font-mono text-[10px] tracking-[0.2em] text-slate-400">03 · NEXT PROTOTYPE</p><h3 className="mt-3 text-xl font-semibold">Sort Item Studies</h3><p className="mt-2 text-sm leading-6 text-slate-400">A future comparison model for visible, risk-taking sort items.</p></article>
        </div>
        <SortingMachineCanvas />
      </section>

      <section id="challenge" className="border-t border-white/10 bg-slate-900/45">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10"><p className="font-mono text-xs tracking-[0.22em] text-cyan-300">CHALLENGE PLANNING</p><h2 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight">Design decisions we’re tracking</h2><div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><div className="rounded-2xl border border-white/10 bg-slate-950/45 p-5"><strong className="block text-cyan-200">Sorting system</strong><p className="mt-2 text-sm leading-6 text-slate-400">Use technical methods to move items into defined groups.</p></div><div className="rounded-2xl border border-white/10 bg-slate-950/45 p-5"><strong className="block text-cyan-200">Visible evidence</strong><p className="mt-2 text-sm leading-6 text-slate-400">Keep item grouping clear and easy for appraisers to verify.</p></div><div className="rounded-2xl border border-white/10 bg-slate-950/45 p-5"><strong className="block text-cyan-200">Random start</strong><p className="mt-2 text-sm leading-6 text-slate-400">Plan for randomized item placement before each sorting attempt.</p></div><div className="rounded-2xl border border-white/10 bg-slate-950/45 p-5"><strong className="block text-cyan-200">Story integration</strong><p className="mt-2 text-sm leading-6 text-slate-400">Make the machine and its sorting process matter to the story.</p></div></div><p className="mt-8 max-w-3xl text-sm leading-6 text-slate-500">This workspace is for planning and prototyping. The team should continue to verify all build and tournament decisions against the official Challenge materials, Rules of the Road, and published clarifications.</p></div>
      </section>
      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500 lg:px-10"><span>TEAM TIME BROS</span><span>Design. Test. Iterate.</span></footer>
    </main>
  )
}

export default App
