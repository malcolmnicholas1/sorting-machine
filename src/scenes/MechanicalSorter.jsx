import { Html, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'
import { Conveyor } from '../components/Conveyor.jsx'
import { Shape } from '../components/Shape.jsx'
import { useSimulationFrame } from '../components/useSimulationFrame.js'

const TYPE_CONFIG = {
  cube: {
    color: '#ef4444',
    label: 'CUBES',
    binX: 6.2,
    binZ: -1.25,
    chuteEntryX: 3.4,
    platterY: 3.65,
    station: 1,
    icon: '■',
  },
  sphere: {
    color: '#22c55e',
    label: 'SPHERES',
    binX: 3.65,
    binZ: 0,
    chuteEntryX: 2.85,
    platterY: 5.4,
    station: 0,
    icon: '●',
  },
  pyramid: {
    color: '#3b82f6',
    label: 'PYRAMIDS',
    binX: 1.05,
    binZ: 1.25,
    chuteEntryX: 2.15,
    platterY: 1.9,
    station: 2,
    icon: '▲',
  },
}

const STATION_HEIGHTS = [5.4, 3.65, 1.9]
const BYPASS_X = -1.15

const OBJECTS = Array.from({ length: 15 }, (_, index) => ({
  id: index,
  type: ['cube', 'sphere', 'pyramid'][index % 3],
  offset: index * 1.22,
  lane: (index % 3) - 1,
}))

function move(object, x, y, z) {
  object.position.set(x, y, z)
}

function MovingObject({ item }) {
  const group = useRef()
  const config = TYPE_CONFIG[item.type]

  useSimulationFrame((elapsed, dt) => {
    const phase = (elapsed + item.offset) % 15.5
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
          move(
            group.current,
            -0.3 + progress * (BYPASS_X + 0.3),
            STATION_HEIGHTS[bypassIndex],
            z * (1 - progress),
          )
        } else {
          const progress = (bypassProgress - 0.38) / 0.62
          move(
            group.current,
            BYPASS_X,
            THREE.MathUtils.lerp(
              STATION_HEIGHTS[bypassIndex],
              STATION_HEIGHTS[bypassIndex + 1],
              progress,
            ),
            0,
          )
        }
        group.current.rotation.x += dt * 3.6
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
          move(
            group.current,
            -0.3 + progress * (config.chuteEntryX + 0.3),
            targetY,
            progress * config.binZ,
          )
          group.current.rotation.y += dt * 4.2
        } else if (stationTime < approachDuration + gaugeDuration + chuteDuration) {
          const progress = (stationTime - approachDuration - gaugeDuration) / chuteDuration
          move(
            group.current,
            config.chuteEntryX + progress * (config.binX - config.chuteEntryX),
            THREE.MathUtils.lerp(targetY, -0.25, progress),
            config.binZ,
          )
          group.current.rotation.x += dt * 4.8
        } else {
          move(group.current, config.binX, -0.25, config.binZ)
          group.current.rotation.y += dt * 7.2
        }
      }
    }
  })

  return (
    <group ref={group}>
      <Shape type={item.type} color={config.color} />
    </group>
  )
}

function MechanicalGauge({ type }) {
  if (type === 'sphere') {
    return (
      <group>
        <mesh position={[0, 0.18, -0.42]} rotation={[-0.42, 0, 0]}>
          <boxGeometry args={[1.45, 0.1, 0.09]} />
          <meshStandardMaterial color="#0f172a" metalness={0.75} />
        </mesh>
        <mesh position={[0, 0.18, 0.42]} rotation={[0.42, 0, 0]}>
          <boxGeometry args={[1.45, 0.1, 0.09]} />
          <meshStandardMaterial color="#0f172a" metalness={0.75} />
        </mesh>
        <mesh position={[0.4, 0.21, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.82, 20]} />
          <meshStandardMaterial color="#22c55e" metalness={0.6} />
        </mesh>
        <mesh position={[0.4, 0.32, 0]}>
          <sphereGeometry args={[0.17, 16, 16]} />
          <meshStandardMaterial color="#86efac" emissive="#22c55e" emissiveIntensity={0.3} />
        </mesh>
      </group>
    )
  }
  if (type === 'cube') {
    return (
      <group>
        {[
          [-0.45, -0.38],
          [-0.45, 0.38],
          [0.45, -0.38],
          [0.45, 0.38],
        ].map(([x, z]) => (
          <mesh key={`${x}-${z}`} position={[x, 0.25, z]}>
            <cylinderGeometry args={[0.08, 0.08, 0.38, 12]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.85} />
          </mesh>
        ))}
        <mesh position={[0, 0.16, 0]}>
          <boxGeometry args={[1.15, 0.08, 1.15]} />
          <meshStandardMaterial color="#475569" metalness={0.7} />
        </mesh>
        <mesh position={[0.84, 0.35, 0]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[0.65, 0.07, 0.09]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.22} />
        </mesh>
      </group>
    )
  }
  if (type === 'pyramid') {
    return (
      <group>
        {[0, 1, 2].map((index) => {
          const angle = Math.PI / 2 + index * ((Math.PI * 2) / 3)
          return (
            <mesh
              key={index}
              position={[Math.cos(angle) * 0.55, 0.2, Math.sin(angle) * 0.55]}
              rotation={[0, -angle, 0]}
            >
              <boxGeometry args={[0.72, 0.1, 0.09]} />
              <meshStandardMaterial color="#60a5fa" metalness={0.7} />
            </mesh>
          )
        })}
        <mesh position={[0, 0.18, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.28, 0.1, 3]} />
          <meshStandardMaterial color="#1e3a8a" />
        </mesh>
      </group>
    )
  }
  return (
    <mesh position={[0, 0.18, 0]}>
      <boxGeometry args={[1.7, 0.11, 1.15]} />
      <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.12} />
    </mesh>
  )
}

function Platter({ y, label, accepts, color, type }) {
  const labelPosition = type === 'sphere' ? [-1.7, -0.72, 0] : [-1.7, 0.25, 0]
  const hasBypass = type !== 'return'

  return (
    <group position={[-0.25, y, 0]}>
      <mesh receiveShadow>
        <cylinderGeometry args={[1.38, 1.38, 0.18, 64]} />
        <meshStandardMaterial color="#334155" metalness={0.65} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.28, 0.035, 8, 48]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {hasBypass && (
        <>
          <mesh position={[-0.9, 0.105, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.025, 32]} />
            <meshBasicMaterial color="#050a12" />
          </mesh>
          <mesh position={[-0.9, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.27, 0.025, 8, 32]} />
            <meshBasicMaterial color="#f59e0b" />
          </mesh>
        </>
      )}
      <MechanicalGauge type={type} />
      <Html position={labelPosition} center transform distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div className="w-32 rounded-lg border border-white/15 bg-slate-950/85 px-2 py-1 text-center font-mono text-[9px] tracking-wider text-slate-200 shadow-xl">
          <span className="block text-[8px] text-slate-400">{label}</span>
          <span style={{ color }}>{accepts}</span>
        </div>
      </Html>
    </group>
  )
}

function Chute({ y, color, binX, binZ, chuteEntryX }) {
  const entryLength = chuteEntryX + 0.3
  const dropLength = Math.hypot(binX - chuteEntryX, y + 0.25)
  const dropAngle = -Math.atan2(y + 0.25, binX - chuteEntryX)

  return (
    <group position={[0, 0, binZ]}>
      <mesh position={[(chuteEntryX - 0.3) / 2, y, 0]}>
        <boxGeometry args={[entryLength, 0.13, 0.78]} />
        <meshStandardMaterial color="#475569" metalness={0.65} roughness={0.35} />
      </mesh>
      <mesh position={[(chuteEntryX + binX) / 2, y / 2, 0]} rotation={[0, 0, dropAngle]}>
        <boxGeometry args={[dropLength, 0.13, 0.78]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} metalness={0.45} />
      </mesh>
      {[-0.42, 0.42].map((zOffset) => (
        <mesh
          key={zOffset}
          position={[(chuteEntryX + binX) / 2, y / 2 + 0.13, zOffset]}
          rotation={[0, 0, dropAngle]}
        >
          <boxGeometry args={[dropLength, 0.08, 0.04]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

function CollectionBin({ type }) {
  const { color, label, binX, binZ, icon } = TYPE_CONFIG[type]
  return (
    <group position={[binX, -0.75, binZ]}>
      <mesh>
        <boxGeometry args={[1.12, 0.9, 1.12]} />
        <meshStandardMaterial color="#182235" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.47, 0]}>
        <boxGeometry args={[0.97, 0.07, 0.97]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.32} />
      </mesh>
      <Html position={[0, -0.72, 0.82]} center transform distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div
          className="w-20 rounded-md border px-1.5 py-1 text-center font-mono text-[8px] font-bold tracking-wider"
          style={{ background: `${color}22`, borderColor: color, color }}
        >
          {icon} {label}
        </div>
      </Html>
    </group>
  )
}

function UnsortedCollector() {
  return (
    <group position={[-1.35, -0.75, -1.55]}>
      <mesh>
        <boxGeometry args={[1.35, 0.9, 1.12]} />
        <meshStandardMaterial color="#1f2937" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.47, 0]}>
        <boxGeometry args={[1.18, 0.07, 0.95]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.35} />
      </mesh>
      <Html position={[0, -0.72, 0]} center transform distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div className="w-28 rounded-md border border-amber-400 bg-amber-400/10 px-2 py-1 text-center font-mono text-[9px] font-bold tracking-widest text-amber-300">
          ↻ UNSORTED
        </div>
      </Html>
    </group>
  )
}

export function MechanicalSorterScene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[10, 7.2, 13]} fov={38} />
      <color attach="background" args={['#070d18']} />
      <fog attach="fog" args={['#070d18', 13, 28]} />
      <ambientLight intensity={0.45} />
      <directionalLight castShadow position={[4, 10, 7]} intensity={2.3} shadow-mapSize={[2048, 2048]} />
      <pointLight position={[-5, 2, 4]} color="#38bdf8" intensity={18} distance={11} />
      <pointLight position={[4, 5, 1]} color="#a855f7" intensity={13} distance={9} />
      <group>
        <mesh position={[-0.25, 2.3, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 7.1, 24]} />
          <meshStandardMaterial color="#172033" metalness={0.75} roughness={0.3} />
        </mesh>
        <mesh position={[-0.25, -1.3, 0]}>
          <cylinderGeometry args={[2.1, 2.1, 0.35, 64]} />
          <meshStandardMaterial color="#202d42" metalness={0.5} />
        </mesh>
        <Conveyor position={[-3.2, 2.88, 0]} length={7.7} rotation={[0, 0, 0.72]} />
        <Platter y={5.0} label="STATION 01" accepts="V-GROOVE · SPHERES" color="#22c55e" type="sphere" />
        <Platter y={3.25} label="STATION 02" accepts="LEVEL FEELERS · CUBES" color="#ef4444" type="cube" />
        <Platter y={1.5} label="STATION 03" accepts="TRI-NEST · PYRAMIDS" color="#3b82f6" type="pyramid" />
        <Platter y={-0.25} label="STATION 04" accepts="UNSORTED CATCH TRAY" color="#f59e0b" type="return" />
        <Chute
          y={5.4}
          color="#22c55e"
          binX={TYPE_CONFIG.sphere.binX}
          binZ={TYPE_CONFIG.sphere.binZ}
          chuteEntryX={TYPE_CONFIG.sphere.chuteEntryX}
        />
        <Chute
          y={3.65}
          color="#ef4444"
          binX={TYPE_CONFIG.cube.binX}
          binZ={TYPE_CONFIG.cube.binZ}
          chuteEntryX={TYPE_CONFIG.cube.chuteEntryX}
        />
        <Chute
          y={1.9}
          color="#3b82f6"
          binX={TYPE_CONFIG.pyramid.binX}
          binZ={TYPE_CONFIG.pyramid.binZ}
          chuteEntryX={TYPE_CONFIG.pyramid.chuteEntryX}
        />
        <CollectionBin type="cube" />
        <CollectionBin type="sphere" />
        <CollectionBin type="pyramid" />
        <UnsortedCollector />
        {OBJECTS.map((item) => (
          <MovingObject key={item.id} item={item} />
        ))}
      </group>
      <gridHelper args={[30, 30, '#1e3a5f', '#111c2e']} position={[0, -1.48, 0]} />
      <OrbitControls target={[-0.4, 2.3, 0]} minDistance={7} maxDistance={22} maxPolarAngle={Math.PI / 2.02} />
    </>
  )
}
