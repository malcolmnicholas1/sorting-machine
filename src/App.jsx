import { Html, OrbitControls, PerspectiveCamera, Sparkles } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

const TYPE_CONFIG = {
  cube: { color: '#ef4444', label: 'CUBES', binX: 6.2, binZ: -1.25, chuteEntryX: 3.4, platterY: 3.65, station: 1, icon: '■' },
  sphere: { color: '#22c55e', label: 'SPHERES', binX: 3.65, binZ: 0, chuteEntryX: 2.85, platterY: 5.4, station: 0, icon: '●' },
  pyramid: { color: '#3b82f6', label: 'PYRAMIDS', binX: 1.05, binZ: 1.25, chuteEntryX: 2.15, platterY: 1.9, station: 2, icon: '▲' },
}

const STATION_HEIGHTS = [5.4, 3.65, 1.9]
const BYPASS_X = -1.15

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
    } else {
      const routeTime = phase - 5
      const bypassDuration = 1.45
      const bypassTime = config.station * bypassDuration

      if (routeTime < bypassTime) {
        const bypassIndex = Math.floor(routeTime / bypassDuration)
        const bypassProgress = (routeTime % bypassDuration) / bypassDuration
        if (bypassProgress < 0.38) {
          const progress = bypassProgress / 0.38
          move(group.current, -0.3 + progress * (BYPASS_X + 0.3), STATION_HEIGHTS[bypassIndex], z * (1 - progress))
        } else {
          const progress = (bypassProgress - 0.38) / 0.62
          move(group.current, BYPASS_X, THREE.MathUtils.lerp(STATION_HEIGHTS[bypassIndex], STATION_HEIGHTS[bypassIndex + 1], progress), 0)
        }
        group.current.rotation.x += 0.06
      } else {
        const stationTime = routeTime - bypassTime
        const stationStartX = config.station === 0 ? -0.3 : BYPASS_X
        const approachDuration = 0.55
        const gaugeDuration = 1.25
        const chuteDuration = 2.6

        if (stationTime < approachDuration) {
          const progress = stationTime / approachDuration
          move(group.current, THREE.MathUtils.lerp(stationStartX, -0.3, progress), targetY, 0)
        } else if (stationTime < approachDuration + gaugeDuration) {
          const progress = (stationTime - approachDuration) / gaugeDuration
          move(group.current, -0.3 + progress * (config.chuteEntryX + 0.3), targetY, progress * config.binZ)
          group.current.rotation.y += 0.07
        } else if (stationTime < approachDuration + gaugeDuration + chuteDuration) {
          const progress = (stationTime - approachDuration - gaugeDuration) / chuteDuration
          move(group.current, config.chuteEntryX + progress * (config.binX - config.chuteEntryX), THREE.MathUtils.lerp(targetY, -0.25, progress), config.binZ)
          group.current.rotation.x += 0.08
        } else {
          move(group.current, config.binX, -0.25, config.binZ)
          group.current.rotation.y += 0.12
        }
      }
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
        <mesh position={[0, 0.18, -0.42]} rotation={[-0.42, 0, 0]}><boxGeometry args={[1.45, 0.1, 0.09]} /><meshStandardMaterial color="#0f172a" metalness={0.75} /></mesh>
        <mesh position={[0, 0.18, 0.42]} rotation={[0.42, 0, 0]}><boxGeometry args={[1.45, 0.1, 0.09]} /><meshStandardMaterial color="#0f172a" metalness={0.75} /></mesh>
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
  const hasBypass = type !== 'return'

  return (
    <group position={[-0.25, y, 0]}>
      <mesh receiveShadow><cylinderGeometry args={[1.38, 1.38, 0.18, 64]} /><meshStandardMaterial color="#334155" metalness={0.65} roughness={0.32} /></mesh>
      <mesh position={[0, 0.11, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.28, 0.035, 8, 48]} /><meshBasicMaterial color={color} /></mesh>
      {hasBypass && <>
        <mesh position={[-0.9, 0.105, 0]}><cylinderGeometry args={[0.24, 0.24, 0.025, 32]} /><meshBasicMaterial color="#050a12" /></mesh>
        <mesh position={[-0.9, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.27, 0.025, 8, 32]} /><meshBasicMaterial color="#f59e0b" /></mesh>
      </>}
      <MechanicalGauge type={type} />
      <Html position={labelPosition} center transform distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div className="w-32 rounded-lg border border-white/15 bg-slate-950/85 px-2 py-1 text-center font-mono text-[9px] tracking-wider text-slate-200 shadow-xl">
          <span className="block text-[8px] text-slate-400">{label}</span><span style={{ color }}>{accepts}</span>
        </div>
      </Html>
    </group>
  )
}

function Chute({ y, color, binX, binZ, chuteEntryX }) {
  const entryLength = chuteEntryX + 0.3
  const dropLength = Math.hypot(binX - chuteEntryX, y + 0.25)

  return (
    <group position={[0, 0, binZ]}>
      <mesh position={[(chuteEntryX - 0.3) / 2, y, 0]}><boxGeometry args={[entryLength, 0.13, 0.78]} /><meshStandardMaterial color="#475569" metalness={0.65} roughness={0.35} /></mesh>
      <mesh position={[(chuteEntryX + binX) / 2, y / 2, 0]} rotation={[0, 0, -Math.atan2(y + 0.25, binX - chuteEntryX)]}><boxGeometry args={[dropLength, 0.13, 0.78]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} metalness={0.45} /></mesh>
      {[-0.42, 0.42].map((zOffset) => <mesh key={zOffset} position={[(chuteEntryX + binX) / 2, y / 2 + 0.13, zOffset]} rotation={[0, 0, -Math.atan2(y + 0.25, binX - chuteEntryX)]}><boxGeometry args={[dropLength, 0.08, 0.04]} /><meshStandardMaterial color="#cbd5e1" metalness={0.8} /></mesh>)}
    </group>
  )
}

function CollectionBin({ type }) {
  const { color, label, binX, binZ, icon } = TYPE_CONFIG[type]
  return (
    <group position={[binX, -0.75, binZ]}>
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
      <Platter y={5.0} label="STATION 01" accepts="V-GROOVE · SPHERES" color="#22c55e" type="sphere" />
      <Platter y={3.25} label="STATION 02" accepts="LEVEL FEELERS · CUBES" color="#ef4444" type="cube" />
      <Platter y={1.5} label="STATION 03" accepts="TRI-NEST · PYRAMIDS" color="#3b82f6" type="pyramid" />
      <Platter y={-0.25} label="STATION 04" accepts="UNSORTED CATCH TRAY" color="#f59e0b" type="return" />
      <Chute y={5.4} color="#22c55e" binX={TYPE_CONFIG.sphere.binX} binZ={TYPE_CONFIG.sphere.binZ} chuteEntryX={TYPE_CONFIG.sphere.chuteEntryX} />
      <Chute y={3.65} color="#ef4444" binX={TYPE_CONFIG.cube.binX} binZ={TYPE_CONFIG.cube.binZ} chuteEntryX={TYPE_CONFIG.cube.chuteEntryX} />
      <Chute y={1.9} color="#3b82f6" binX={TYPE_CONFIG.pyramid.binX} binZ={TYPE_CONFIG.pyramid.binZ} chuteEntryX={TYPE_CONFIG.pyramid.chuteEntryX} />
      <CollectionBin type="cube" />
      <CollectionBin type="sphere" />
      <CollectionBin type="pyramid" />
      <UnsortedCollector />
      {OBJECTS.map((item, index) => <MovingObject key={index} item={item} />)}
    </group>
  )
}

function SortingMachineCanvas({ expanded, onExpand, onClose }) {
  return (
    <>
      {expanded && <div className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md" />}
      <div className={`${expanded ? 'fixed inset-2 z-50 h-auto rounded-2xl sm:inset-5' : 'relative h-[560px] rounded-3xl lg:h-[680px]'} overflow-hidden border border-slate-700 bg-[#070d18] shadow-2xl shadow-cyan-950/30`}>
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-950/65 px-5 py-4 backdrop-blur-md">
        <div><p className="font-mono text-[10px] tracking-[0.28em] text-cyan-300">TEAM TIME BROS · DESIGN 01</p><h2 className="mt-1 text-base font-semibold tracking-tight text-white">Mechanical Shape Sorter</h2></div>
        <div className="flex items-center gap-3"><div className="hidden gap-5 font-mono text-[10px] tracking-wider text-slate-400 sm:flex"><span><i className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />SIMULATION ACTIVE</span><span>4 HORIZONTAL PLATTERS</span></div><button type="button" onClick={expanded ? onClose : onExpand} aria-label={expanded ? 'Close expanded prototype' : 'Expand prototype'} className="grid h-9 min-w-9 place-items-center rounded-lg border border-white/15 bg-white/5 px-2 text-lg text-white transition hover:border-cyan-300/60 hover:bg-cyan-300/10 hover:text-cyan-200">{expanded ? '×' : '⛶'}</button></div>
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
    </>
  )
}

const VISION_TYPES = [
  { type: 'cube', color: '#ef4444', label: 'CUBE', binZ: -2.4 },
  { type: 'sphere', color: '#22c55e', label: 'SPHERE', binZ: 0 },
  { type: 'pyramid', color: '#3b82f6', label: 'PYRAMID', binZ: 2.4 },
]

function setLink(link, start, end) {
  const direction = end.clone().sub(start)
  link.position.copy(start).add(end).multiplyScalar(0.5)
  link.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize())
  link.scale.y = direction.length()
}

function VisionRobot() {
  const upperArm = useRef()
  const forearm = useRef()
  const gripper = useRef()
  const leftFinger = useRef()
  const rightFinger = useRef()
  const upperStart = useMemo(() => new THREE.Vector3(1.2, 1.55, 0), [])
  const elbow = useRef(new THREE.Vector3())
  const end = useRef(new THREE.Vector3())

  useFrame(({ clock }) => {
    const phase = clock.getElapsedTime() % 13
    const target = VISION_TYPES[Math.floor(clock.getElapsedTime() / 13) % VISION_TYPES.length]
    const elbowPosition = elbow.current
    const endPosition = end.current
    endPosition.set(1.2, 1.45, 0)

    if (phase >= 3.6 && phase < 4.2) {
      const progress = (phase - 3.6) / 0.6
      endPosition.y = THREE.MathUtils.lerp(1.45, 0.55, progress)
    } else if (phase >= 4.2 && phase < 5) {
      endPosition.y = THREE.MathUtils.lerp(0.55, 1.65, (phase - 4.2) / 0.8)
    } else if (phase >= 5 && phase < 7) {
      const progress = (phase - 5) / 2
      endPosition.set(THREE.MathUtils.lerp(1.2, 3.65, progress), 1.65, THREE.MathUtils.lerp(0, target.binZ, progress))
    } else if (phase >= 7 && phase < 7.8) {
      endPosition.set(3.65, THREE.MathUtils.lerp(1.65, 0.55, (phase - 7) / 0.8), target.binZ)
    } else if (phase >= 7.8 && phase < 10.6) {
      const progress = (phase - 7.8) / 2.8
      endPosition.set(THREE.MathUtils.lerp(3.65, 1.2, progress), THREE.MathUtils.lerp(0.55, 1.45, progress), THREE.MathUtils.lerp(target.binZ, 0, progress))
    }

    elbowPosition.copy(upperStart).lerp(endPosition, 0.52)
    elbowPosition.y += 0.45
    setLink(upperArm.current, upperStart, elbowPosition)
    setLink(forearm.current, elbowPosition, endPosition)
    gripper.current.position.copy(endPosition)
    const closed = phase > 4 && phase < 7.8
    leftFinger.current.position.z = closed ? -0.09 : -0.2
    rightFinger.current.position.z = closed ? 0.09 : 0.2
  })

  return (
    <group>
      <mesh position={[1.2, 0.2, 0]}><cylinderGeometry args={[0.55, 0.62, 0.4, 32]} /><meshStandardMaterial color="#253449" metalness={0.72} roughness={0.3} /></mesh>
      <mesh position={[1.2, 0.82, 0]}><cylinderGeometry args={[0.32, 0.42, 0.95, 24]} /><meshStandardMaterial color="#0e7490" metalness={0.66} roughness={0.28} /></mesh>
      <mesh ref={upperArm} castShadow><cylinderGeometry args={[0.13, 0.16, 1, 16]} /><meshStandardMaterial color="#38bdf8" metalness={0.68} roughness={0.25} /></mesh>
      <mesh ref={forearm} castShadow><cylinderGeometry args={[0.1, 0.13, 1, 16]} /><meshStandardMaterial color="#67e8f9" metalness={0.7} roughness={0.22} /></mesh>
      <mesh position={[1.2, 1.55, 0]}><sphereGeometry args={[0.22, 20, 20]} /><meshStandardMaterial color="#e2e8f0" metalness={0.8} /></mesh>
      <group ref={gripper}>
        <group ref={leftFinger} position={[0, -0.12, -0.2]}><mesh><boxGeometry args={[0.12, 0.36, 0.1]} /><meshStandardMaterial color="#e2e8f0" metalness={0.75} /></mesh></group>
        <group ref={rightFinger} position={[0, -0.12, 0.2]}><mesh><boxGeometry args={[0.12, 0.36, 0.1]} /><meshStandardMaterial color="#e2e8f0" metalness={0.75} /></mesh></group>
      </group>
    </group>
  )
}

function VisionCamera() {
  const scanLight = useRef()

  useFrame(({ clock }) => {
    scanLight.current.material.opacity = 0.08 + (Math.sin(clock.getElapsedTime() * 5) + 1) * 0.045
  })

  return (
    <group position={[-1.25, 3.1, 0]}>
      <mesh><boxGeometry args={[0.9, 0.5, 0.66]} /><meshStandardMaterial color="#172b3e" metalness={0.72} roughness={0.25} /></mesh>
      <mesh position={[0, -0.28, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.18, 0.18, 0.22, 24]} /><meshStandardMaterial color="#64748b" metalness={0.75} /></mesh>
      <mesh position={[0, -0.42, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.105, 0.105, 0.04, 24]} /><meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={2.2} /></mesh>
      <mesh ref={scanLight} position={[0, -1.28, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.75, 1.65, 24, 1, true]} /><meshBasicMaterial color="#22d3ee" transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} /></mesh>
      <Html position={[0, 0.58, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div className="whitespace-nowrap rounded border border-cyan-300/50 bg-slate-950/90 px-2 py-1 text-center font-mono text-[8px] tracking-wider text-cyan-200">VISION SENSOR · LIVE CLASSIFY</div>
      </Html>
    </group>
  )
}

function VisionBins() {
  return VISION_TYPES.map((item) => (
    <group key={item.type} position={[3.65, -0.2, item.binZ]}>
      <mesh><boxGeometry args={[1.25, 0.75, 1.2]} /><meshStandardMaterial color="#172235" roughness={0.58} /></mesh>
      <mesh position={[0, 0.4, 0]}><boxGeometry args={[1.1, 0.06, 1.05]} /><meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={0.28} /></mesh>
      <Html position={[0, -0.63, 0.72]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div className="w-20 rounded border px-1.5 py-1 text-center font-mono text-[8px] font-bold tracking-wider" style={{ color: item.color, borderColor: item.color, background: '#07111eee' }}>{item.label} BIN</div>
      </Html>
    </group>
  ))
}

function VisionObject() {
  const object = useRef()
  const activeTypeIndex = useRef(-1)
  const [typeIndex, setTypeIndex] = useState(0)

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime()
    const phase = elapsed % 13
    const nextTypeIndex = Math.floor(elapsed / 13) % VISION_TYPES.length
    const target = VISION_TYPES[nextTypeIndex]
    if (activeTypeIndex.current !== nextTypeIndex) {
      activeTypeIndex.current = nextTypeIndex
      setTypeIndex(nextTypeIndex)
    }
    const held = phase >= 4.2 && phase < 7.8

    if (phase < 3.6) {
      object.current.visible = true
      object.current.position.set(-4.3 + (phase / 3.6) * 5.5, 0.53, 0)
      object.current.rotation.set(0, phase * 1.4, 0)
    } else if (phase < 4.2) {
      object.current.visible = true
      object.current.position.set(1.2, 0.53, 0)
    } else if (held) {
      object.current.visible = true
      if (phase < 5) {
        object.current.position.set(1.2, THREE.MathUtils.lerp(0.75, 1.85, (phase - 4.2) / 0.8), 0)
      } else if (phase < 7) {
        const progress = (phase - 5) / 2
        object.current.position.set(THREE.MathUtils.lerp(1.2, 3.65, progress), 1.85, THREE.MathUtils.lerp(0, target.binZ, progress))
      } else {
        object.current.position.set(3.65, THREE.MathUtils.lerp(1.85, 0.42, (phase - 7) / 0.8), target.binZ)
      }
      object.current.rotation.set(0, 0, 0)
    } else if (phase < 12) {
      object.current.visible = true
      object.current.position.set(3.65, 0.42, target.binZ)
    } else {
      object.current.visible = false
    }
  })

  const current = VISION_TYPES[typeIndex]
  return <group ref={object}><Shape type={current.type} color={current.color} /></group>
}

function VisionSorterCanvas({ expanded, onExpand, onClose }) {
  return (
    <>
      {expanded && <div className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md" />}
      <div id="design-02" className={`${expanded ? 'fixed inset-2 z-50 h-auto rounded-2xl sm:inset-5' : 'relative mt-12 h-[540px] rounded-3xl lg:h-[640px]'} overflow-hidden border border-slate-700 bg-[#070d18] shadow-2xl shadow-cyan-950/30`}>
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-950/75 px-5 py-4 backdrop-blur-md">
        <div><p className="font-mono text-[10px] tracking-[0.28em] text-cyan-300">TEAM TIME BROS · DESIGN 02</p><h2 className="mt-1 text-base font-semibold text-white">Vision-Guided Pick &amp; Place</h2></div>
        <div className="flex items-center gap-3"><div className="hidden font-mono text-[10px] tracking-wider text-slate-400 sm:block"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />CAMERA + ROBOT ARM</div><button type="button" onClick={expanded ? onClose : onExpand} aria-label={expanded ? 'Close expanded prototype' : 'Expand prototype'} className="grid h-9 min-w-9 place-items-center rounded-lg border border-white/15 bg-white/5 px-2 text-lg text-white transition hover:border-cyan-300/60 hover:bg-cyan-300/10 hover:text-cyan-200">{expanded ? '×' : '⛶'}</button></div>
      </div>
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault position={[8.5, 7.3, 10.5]} fov={38} />
        <color attach="background" args={['#070d18']} />
        <fog attach="fog" args={['#070d18', 13, 25]} />
        <ambientLight intensity={0.5} />
        <directionalLight castShadow position={[4, 9, 6]} intensity={2.1} shadow-mapSize={[1024, 1024]} />
        <pointLight position={[-3, 3, 2]} color="#22d3ee" intensity={12} distance={10} />
        <Conveyor position={[-0.8, 0.08, 0]} length={7.2} />
        <VisionCamera />
        <VisionRobot />
        <VisionBins />
        <VisionObject />
        <gridHelper args={[22, 22, '#1e3a5f', '#111c2e']} position={[0, -0.6, 0]} />
        <OrbitControls target={[0, 1, 0]} minDistance={6} maxDistance={18} maxPolarAngle={Math.PI / 2.02} />
      </Canvas>
      <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-xl border border-white/10 bg-slate-950/75 px-3 py-2 font-mono text-[9px] leading-5 tracking-wide text-slate-300 backdrop-blur-md"><span className="text-cyan-300">PROCESS</span><br />DETECT → CLASSIFY → PICK → PLACE</div>
      <div className="pointer-events-none absolute bottom-4 right-4 z-10 rounded-xl border border-white/10 bg-slate-950/75 px-3 py-2 font-mono text-[9px] leading-5 tracking-wide text-slate-400 backdrop-blur-md">DRAG TO ORBIT · SCROLL TO ZOOM</div>
      </div>
    </>
  )
}

const SPILL_ITEMS = Array.from({ length: 9 }, (_, index) => ({
  type: ['sphere', 'cube', 'pyramid'][index % 3],
  color: ['#22c55e', '#ef4444', '#3b82f6'][index % 3],
  index,
}))

function ArrivalPerson({ influential, boxRef }) {
  const figure = useRef()
  const head = useRef()
  const leftArm = useRef()
  const rightArm = useRef()
  const leftLeg = useRef()
  const rightLeg = useRef()

  useFrame(({ clock }) => {
    const phase = clock.getElapsedTime() % 13
    if (influential) {
      const progress = THREE.MathUtils.clamp((phase - 4.2) / 2.3, 0, 1)
      figure.current.visible = phase >= 4.2 && phase < 12.7
      figure.current.position.set(0.15 + progress * 0.95, 0, -0.85 + progress * 1.8)
      figure.current.scale.setScalar(0.68 + progress * 0.32)
      leftArm.current.rotation.x = -0.5
      rightArm.current.rotation.x = -0.5
      return
    }

    const walk = THREE.MathUtils.clamp(phase / 3.9, 0, 1)
    const startled = THREE.MathUtils.clamp((phase - 6.2) / 0.7, 0, 1)
    figure.current.position.set(-3.55 + walk * 1.18, 0, 0.35)
    figure.current.rotation.z = startled * 0.18
    head.current.rotation.z = startled * 0.32
    const stride = phase < 4 ? Math.sin(phase * 7) * 0.45 : 0
    leftLeg.current.rotation.x = stride
    rightLeg.current.rotation.x = -stride
    leftArm.current.rotation.x = THREE.MathUtils.lerp(1.5, -0.6, startled)
    rightArm.current.rotation.x = THREE.MathUtils.lerp(1.5, -0.6, startled)
    if (boxRef.current) {
      boxRef.current.position.x = figure.current.position.x + 0.05
    }
  })

  const shirt = influential ? '#8b5cf6' : '#f97316'
  const pants = influential ? '#312e81' : '#1e3a8a'
  return (
    <group ref={figure}>
      <mesh position={[0, 1.1, 0]} castShadow><capsuleGeometry args={[0.27, 0.58, 4, 10]} /><meshStandardMaterial color={shirt} roughness={0.52} /></mesh>
      <group ref={head} position={[0, 1.75, 0]}>
        <mesh castShadow><sphereGeometry args={[0.28, 24, 24]} /><meshStandardMaterial color="#f1c6a8" roughness={0.72} /></mesh>
        <mesh position={[0, 0.12, 0.12]}><sphereGeometry args={[0.22, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.45]} /><meshStandardMaterial color={influential ? '#4c1d95' : '#713f12'} /></mesh>
        <mesh position={[0.09, 0.02, 0.24]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color="#0f172a" /></mesh>
        <mesh position={[-0.09, 0.02, 0.24]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color="#0f172a" /></mesh>
      </group>
      <mesh position={[-0.16, 0.55, 0]} castShadow><cylinderGeometry args={[0.13, 0.16, 0.56, 12]} /><meshStandardMaterial color={pants} /></mesh>
      <mesh position={[0.16, 0.55, 0]} castShadow><cylinderGeometry args={[0.13, 0.16, 0.56, 12]} /><meshStandardMaterial color={pants} /></mesh>
      <mesh position={[-0.16, 0.16, 0.07]}><boxGeometry args={[0.3, 0.15, 0.46]} /><meshStandardMaterial color="#111827" /></mesh>
      <mesh position={[0.16, 0.16, 0.07]}><boxGeometry args={[0.3, 0.15, 0.46]} /><meshStandardMaterial color="#111827" /></mesh>
      <group ref={leftArm} position={[-0.31, 1.38, 0]}><mesh position={[0, -0.3, 0.24]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.09, 0.11, 0.62, 12]} /><meshStandardMaterial color={shirt} /></mesh><mesh position={[0, -0.3, 0.56]}><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color="#f1c6a8" /></mesh></group>
      <group ref={rightArm} position={[0.31, 1.38, 0]}><mesh position={[0, -0.3, 0.24]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.09, 0.11, 0.62, 12]} /><meshStandardMaterial color={shirt} /></mesh><mesh position={[0, -0.3, 0.56]}><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color="#f1c6a8" /></mesh></group>
      <group ref={leftLeg} position={[-0.16, 0.55, 0]}><mesh><cylinderGeometry args={[0.12, 0.14, 0.62, 12]} /><meshStandardMaterial color={pants} /></mesh></group>
      <group ref={rightLeg} position={[0.16, 0.55, 0]}><mesh><cylinderGeometry args={[0.12, 0.14, 0.62, 12]} /><meshStandardMaterial color={pants} /></mesh></group>
    </group>
  )
}

function Wormhole() {
  const portal = useRef()
  const inner = useRef()
  const outerRing = useRef()
  const middleRing = useRef()

  useFrame(({ clock }, delta) => {
    const phase = clock.getElapsedTime() % 13
    const open = THREE.MathUtils.clamp((phase - 2.1) / 1.5, 0, 1)
    portal.current.scale.setScalar(Math.max(0.001, open))
    outerRing.current.rotation.z += delta * 0.55
    middleRing.current.rotation.z -= delta * 0.85
    inner.current.material.opacity = 0.55 + Math.sin(clock.getElapsedTime() * 3.5) * 0.15
  })

  return (
    <group ref={portal} position={[0.15, 1.55, 0.72]}>
      <mesh ref={inner} position={[0, 0, -0.02]}><circleGeometry args={[0.88, 48]} /><meshBasicMaterial color="#160d36" transparent opacity={0.65} side={THREE.DoubleSide} /></mesh>
      <group ref={outerRing}><mesh><torusGeometry args={[1.03, 0.09, 16, 64]} /><meshStandardMaterial color="#8b5cf6" emissive="#7c3aed" emissiveIntensity={2.3} metalness={0.3} /></mesh></group>
      <group ref={middleRing} scale={0.78}><mesh><torusGeometry args={[1.03, 0.055, 12, 64]} /><meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={2.5} /></mesh></group>
      <mesh rotation={[0, 0, Math.PI / 4]} scale={0.54}><torusGeometry args={[1.03, 0.035, 10, 48]} /><meshBasicMaterial color="#f0abfc" /></mesh>
      <Sparkles count={40} scale={[2.8, 3.1, 0.4]} size={3} speed={0.8} color="#c4b5fd" />
    </group>
  )
}

function ArrivalBox({ boxRef }) {
  const flap = useRef()
  const itemRefs = useRef([])

  useFrame(({ clock }) => {
    const phase = clock.getElapsedTime() % 13
    const carrierX = -3.55 + THREE.MathUtils.clamp(phase / 3.9, 0, 1) * 1.18
    const spill = THREE.MathUtils.clamp((phase - 7.15) / 1.25, 0, 1)
    const drop = THREE.MathUtils.clamp((phase - 7.15) / 0.65, 0, 1)
    boxRef.current.position.set(carrierX + 0.05, THREE.MathUtils.lerp(1.3, 0.18, drop), 0.95)
    boxRef.current.rotation.x = -spill * 0.95
    boxRef.current.rotation.z = spill * 0.25
    flap.current.rotation.x = -spill * 0.65

    SPILL_ITEMS.forEach((item, index) => {
      const object = itemRefs.current[index]
      if (!object) return
      const column = (index % 3) - 1
      const row = Math.floor(index / 3) - 1
      if (phase < 7.15) {
        object.visible = true
        object.position.set(carrierX + 0.05 + column * 0.32, 2.12 + (index % 2) * 0.08, 0.95 + row * 0.28)
        object.rotation.set(0, index * 0.4, 0)
      } else if (phase < 9.1) {
        object.visible = true
        const progress = THREE.MathUtils.clamp((phase - 7.15 - (index % 3) * 0.1) / 1.6, 0, 1)
        const startX = carrierX + 0.05 + column * 0.25
        const startZ = 0.95 + row * 0.2
        const endX = -2.35 + column * 0.68
        const endZ = 1.0 + row * 0.72
        object.position.set(THREE.MathUtils.lerp(startX, endX, progress), 0.32 + Math.sin(progress * Math.PI) * (0.45 + (index % 3) * 0.12), THREE.MathUtils.lerp(startZ, endZ, progress))
        object.rotation.set(progress * 4, index * 0.6 + progress * 5, progress * 3)
      } else if (phase < 12.4) {
        object.visible = true
        object.position.set(-2.35 + column * 0.68, 0.3, 1.0 + row * 0.72)
      } else {
        object.visible = false
      }
    })
  })

  return (
    <>
      <group ref={boxRef}>
        <mesh position={[0, 0.06, 0]} castShadow><boxGeometry args={[1.2, 0.12, 1]} /><meshStandardMaterial color="#a16207" roughness={0.78} /></mesh>
        <mesh position={[0, 0.39, -0.45]} castShadow><boxGeometry args={[1.2, 0.62, 0.1]} /><meshStandardMaterial color="#c0843c" roughness={0.78} /></mesh>
        <mesh position={[-0.55, 0.39, 0]} castShadow><boxGeometry args={[0.1, 0.62, 0.9]} /><meshStandardMaterial color="#d09a54" roughness={0.78} /></mesh>
        <mesh position={[0.55, 0.39, 0]} castShadow><boxGeometry args={[0.1, 0.62, 0.9]} /><meshStandardMaterial color="#d09a54" roughness={0.78} /></mesh>
        <mesh ref={flap} position={[0, 0.39, 0.45]} castShadow><boxGeometry args={[1.2, 0.62, 0.1]} /><meshStandardMaterial color="#b77932" roughness={0.78} /></mesh>
        <mesh position={[0, 0.08, 0.055]}><boxGeometry args={[0.55, 0.04, 0.06]} /><meshBasicMaterial color="#fef3c7" /></mesh>
      </group>
      {SPILL_ITEMS.map((item, index) => <group key={item.index} ref={(node) => { itemRefs.current[index] = node }}><Shape type={item.type} color={item.color} /></group>)}
    </>
  )
}

function ArrivalScene() {
  const box = useRef()

  return (
    <>
      <PerspectiveCamera makeDefault position={[6.5, 5.6, 11.5]} fov={38} />
      <color attach="background" args={['#090b19']} />
      <fog attach="fog" args={['#090b19', 12, 24]} />
      <ambientLight intensity={0.52} />
      <directionalLight castShadow position={[3, 8, 6]} intensity={2.1} shadow-mapSize={[1024, 1024]} />
      <pointLight position={[0.3, 1.8, 1.2]} color="#8b5cf6" intensity={20} distance={7} />
      <pointLight position={[-3, 2.2, 2]} color="#fb923c" intensity={8} distance={6} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow><planeGeometry args={[22, 16]} /><meshStandardMaterial color="#111827" roughness={0.9} /></mesh>
      <gridHelper args={[20, 20, '#34245f', '#1b1c31']} position={[0, -0.065, 0]} />
      <Wormhole />
      <ArrivalPerson boxRef={box} />
      <ArrivalPerson influential />
      <ArrivalBox boxRef={box} />
      <Html position={[-1.15, 2.72, 1.5]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div className="whitespace-nowrap rounded-lg border border-violet-300/40 bg-slate-950/85 px-3 py-2 text-center font-mono text-[9px] tracking-wider text-violet-200">ARRIVAL EVENT<br /><span className="text-slate-400">UNEXPECTED VISITOR</span></div>
      </Html>
      <OrbitControls target={[-0.7, 1.1, 0.2]} minDistance={6} maxDistance={17} maxPolarAngle={Math.PI / 2.02} />
    </>
  )
}

function ArrivalEffectCanvas({ expanded, onExpand, onClose }) {
  return (
    <>
      {expanded && <div className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md" />}
      <div id="design-03" className={`${expanded ? 'fixed inset-2 z-50 h-auto rounded-2xl sm:inset-5' : 'relative mt-12 h-[540px] rounded-3xl lg:h-[640px]'} overflow-hidden border border-slate-700 bg-[#090b19] shadow-2xl shadow-violet-950/30`}>
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-950/75 px-5 py-4 backdrop-blur-md">
          <div><p className="font-mono text-[10px] tracking-[0.28em] text-violet-300">TEAM TIME BROS · DESIGN 03</p><h2 className="mt-1 text-base font-semibold text-white">The Unexpected Arrival</h2></div>
          <div className="flex items-center gap-3"><div className="hidden font-mono text-[10px] tracking-wider text-slate-400 sm:block"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-violet-400" />STORY EFFECT</div><button type="button" onClick={expanded ? onClose : onExpand} aria-label={expanded ? 'Close expanded prototype' : 'Expand prototype'} className="grid h-9 min-w-9 place-items-center rounded-lg border border-white/15 bg-white/5 px-2 text-lg text-white transition hover:border-violet-300/60 hover:bg-violet-300/10 hover:text-violet-200">{expanded ? '×' : '⛶'}</button></div>
        </div>
        <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
          <ArrivalScene />
        </Canvas>
        <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-xl border border-white/10 bg-slate-950/75 px-3 py-2 font-mono text-[9px] leading-5 tracking-wide text-slate-300 backdrop-blur-md"><span className="text-violet-300">STORY BEAT</span><br />PORTAL OPENS → VISITOR ARRIVES → BOX SPILLS</div>
        <div className="pointer-events-none absolute bottom-4 right-4 z-10 rounded-xl border border-white/10 bg-slate-950/75 px-3 py-2 font-mono text-[9px] leading-5 tracking-wide text-slate-400 backdrop-blur-md">DRAG TO ORBIT · SCROLL TO ZOOM</div>
      </div>
    </>
  )
}

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
          <a href="#design-02" className="rounded-2xl border border-cyan-300/35 bg-cyan-300/10 p-5 transition hover:bg-cyan-300/15"><p className="font-mono text-[10px] tracking-[0.2em] text-cyan-200">02 · LIVE MODEL</p><h3 className="mt-3 text-xl font-semibold">Vision-Guided Pick &amp; Place</h3><p className="mt-2 text-sm leading-6 text-slate-300">A camera classifies each shape; a robotic arm moves it to the matching bin.</p></a>
          <a href="#design-03" className="rounded-2xl border border-violet-300/35 bg-violet-300/10 p-5 transition hover:bg-violet-300/15"><p className="font-mono text-[10px] tracking-[0.2em] text-violet-200">03 · LIVE MODEL</p><h3 className="mt-3 text-xl font-semibold">The Unexpected Arrival</h3><p className="mt-2 text-sm leading-6 text-slate-300">A wormhole brings an influential character through, startling the carrier into spilling the shapes.</p></a>
        </div>
        <SortingMachineCanvas expanded={expandedPrototype === 'mechanical'} onExpand={() => setExpandedPrototype('mechanical')} onClose={() => setExpandedPrototype(null)} />
        <VisionSorterCanvas expanded={expandedPrototype === 'vision'} onExpand={() => setExpandedPrototype('vision')} onClose={() => setExpandedPrototype(null)} />
        <ArrivalEffectCanvas expanded={expandedPrototype === 'arrival'} onExpand={() => setExpandedPrototype('arrival')} onClose={() => setExpandedPrototype(null)} />
      </section>

      <section id="challenge" className="border-t border-white/10 bg-slate-900/45">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10"><p className="font-mono text-xs tracking-[0.22em] text-cyan-300">CHALLENGE PLANNING</p><h2 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight">Design decisions we’re tracking</h2><div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><div className="rounded-2xl border border-white/10 bg-slate-950/45 p-5"><strong className="block text-cyan-200">Sorting system</strong><p className="mt-2 text-sm leading-6 text-slate-400">Use technical methods to move items into defined groups.</p></div><div className="rounded-2xl border border-white/10 bg-slate-950/45 p-5"><strong className="block text-cyan-200">Visible evidence</strong><p className="mt-2 text-sm leading-6 text-slate-400">Keep item grouping clear and easy for appraisers to verify.</p></div><div className="rounded-2xl border border-white/10 bg-slate-950/45 p-5"><strong className="block text-cyan-200">Random start</strong><p className="mt-2 text-sm leading-6 text-slate-400">Plan for randomized item placement before each sorting attempt.</p></div><div className="rounded-2xl border border-white/10 bg-slate-950/45 p-5"><strong className="block text-cyan-200">Story integration</strong><p className="mt-2 text-sm leading-6 text-slate-400">Make the machine and its sorting process matter to the story.</p></div></div><p className="mt-8 max-w-3xl text-sm leading-6 text-slate-500">This workspace is for planning and prototyping. The team should continue to verify all build and tournament decisions against the official Challenge materials, Rules of the Road, and published clarifications.</p></div>
      </section>
      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500 lg:px-10"><span>TEAM TIME BROS</span><span>Design. Test. Iterate.</span></footer>
    </main>
  )
}

export default App
