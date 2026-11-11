import { Html, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'

const TYPE_CONFIG = {
  cube: { color: '#ef4444', label: 'CUBES', binX: 5.1, platterY: 3.65, icon: '■' },
  sphere: { color: '#22c55e', label: 'SPHERES', binX: 3.5, platterY: 5.4, icon: '●' },
  pyramid: { color: '#3b82f6', label: 'PYRAMIDS', binX: 1.9, platterY: 1.9, icon: '▲' },
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
  return (
    <group position={[-0.25, y, 0]}>
      <mesh receiveShadow rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.38, 1.38, 0.18, 64]} /><meshStandardMaterial color="#334155" metalness={0.65} roughness={0.32} /></mesh>
      <mesh position={[0, 0.11, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.28, 0.035, 8, 48]} /><meshBasicMaterial color={color} /></mesh>
      <MechanicalGauge type={type} />
      <Html position={[-1.7, 0.25, 0]} center transform distanceFactor={8} style={{ pointerEvents: 'none' }}>
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
      <Html position={[0, -0.72, 0]} center transform distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div className="w-24 rounded-md border px-2 py-1 text-center font-mono text-[9px] font-bold tracking-widest" style={{ background: `${color}22`, borderColor: color, color }}>{icon} {label}</div>
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

function App() {
  return (
    <main className="h-screen min-h-[640px] overflow-hidden bg-[#070d18] text-white">
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-950/65 px-5 py-4 backdrop-blur-md md:px-8">
        <div><p className="font-mono text-xs tracking-[0.28em] text-cyan-300">SORTWORKS</p><h1 className="mt-1 text-lg font-semibold tracking-tight">Shape Classification Line</h1></div>
        <div className="hidden gap-5 font-mono text-[10px] tracking-wider text-slate-400 sm:flex"><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />SYSTEM ONLINE</span><span>4 PLATTERS</span><span>3 OUTPUTS</span></div>
      </header>
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
    </main>
  )
}

export default App
