import { Html, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Conveyor } from '../components/Conveyor.jsx'
import { Shape } from '../components/Shape.jsx'
import { useSimulationFrame } from '../components/useSimulationFrame.js'

const CAMERA_PRESETS = {
  overview: { position: [10.4, 7.2, 13.2], target: [0.3, 2.3, 0.2] },
  hopper: { position: [-3.8, 3.2, 5.6], target: [-5.6, 1.1, -0.45] },
  st01: { position: [3.2, 6.9, 4.4], target: [0.2, 5.15, 0.1] },
  st02: { position: [3.2, 5.1, 4.4], target: [0.2, 3.4, 0.2] },
  st03: { position: [3.2, 3.4, 4.4], target: [0.2, 1.65, 0.3] },
  bypass: { position: [-3.6, 5.2, 5.8], target: [-0.65, 3.2, 0.95] },
  bins: { position: [8.4, 3.8, 6.2], target: [4.2, -0.2, 0.4] },
}

const TYPE_CONFIG = {
  sphere: {
    color: '#22c55e',
    label: 'SPHERES',
    binX: 5.4,
    binZ: -1.75,
    chuteEntryX: 1.28,
    chuteZ: -1.1,
    platterY: 5.34,
    station: 0,
    icon: '●',
  },
  cube: {
    color: '#ef4444',
    label: 'CUBES',
    binX: 4.65,
    binZ: 0,
    chuteEntryX: 1.28,
    chuteZ: 0,
    platterY: 3.59,
    station: 1,
    icon: '■',
  },
  pyramid: {
    color: '#3b82f6',
    label: 'PYRAMIDS',
    binX: 3.9,
    binZ: 1.75,
    chuteEntryX: 1.28,
    chuteZ: 1.1,
    platterY: 1.84,
    station: 2,
    icon: '▲',
  },
  unsorted: {
    color: '#f59e0b',
    label: 'UNSORTED',
    binX: 2.55,
    binZ: 2.85,
    chuteEntryX: 1.15,
    chuteZ: 2.0,
    platterY: 0.09,
    station: 3,
    icon: '↻',
  },
}

const STATION_ITEM_Y = [5.34, 3.59, 1.84, 0.09]
// Angular velocity (rad/s) shared by spindles, paddles, turntables, and objects riding on platters.
// In Three.js, rotation.y -= dt * ROTOR_OMEGA rotates clockwise viewed from above (-X -> -Z -> +X -> +Z),
// which corresponds to polar angle θ = atan2(z, x) INCREASING at +ROTOR_OMEGA rad/s.
const ROTOR_OMEGA = 2.65
const ENTRY_ANGLE = -2.55 // Back-left (-0.65, -0.43)
const GAUGE_ANGLE = -0.05 // Right (+0.78, -0.04)
const BYPASS_ANGLE = 2.21 // Front-left (-0.58, +0.72)
const PLOW_CONTACT_ANGLE = 1.92 // Front-left where wiper plow intercepts object on solid turntable

// Option 1: Fixed interior drop hole cut into the stationary deck (at angle = BYPASS_ANGLE, r = 0.92)
const INTERIOR_BYPASS_PORT = {
  x: Math.cos(BYPASS_ANGLE) * 0.92,
  z: Math.sin(BYPASS_ANGLE) * 0.92,
}
// Option 2: External rim drop funnel mounted outside the solid spinning turntable (r = 1.58 > 1.38 disc)
const EXTERNAL_FUNNEL_PORT = { x: -0.82, z: 1.35 }
const ENTRY_PORT = {
  x: Math.cos(ENTRY_ANGLE) * 0.78,
  z: Math.sin(ENTRY_ANGLE) * 0.78,
}

const BIN_SLOTS = [
  [-0.24, -0.22],
  [0.24, -0.22],
  [-0.24, 0.22],
  [0.24, 0.22],
  [0, 0],
]

const SEQUENCE = [
  'sphere',
  'cube',
  'pyramid',
  'sphere',
  'cube',
  'pyramid',
  'unsorted',
  'sphere',
  'cube',
  'pyramid',
  'sphere',
  'cube',
  'pyramid',
  'unsorted',
  'sphere',
  'cube',
]

const OBJECTS = SEQUENCE.map((type, index) => {
  const sameTypeIndex = SEQUENCE.slice(0, index).filter((t) => t === type).length
  return {
    id: index,
    type,
    offset: index * 1.35,
    lane: (index % 3) - 1,
    slot: BIN_SLOTS[sameTypeIndex % BIN_SLOTS.length],
  }
})

const HOPPER_PILE = [
  { type: 'sphere', color: '#22c55e', pos: [-0.24, 0.22, -0.16], rot: [0, 0, 0] },
  { type: 'cube', color: '#ef4444', pos: [0.22, 0.2, 0.18], rot: [0.3, 0.5, 0.1] },
  { type: 'pyramid', color: '#3b82f6', pos: [-0.08, 0.24, 0.22], rot: [0.1, 0.8, -0.2] },
  { type: 'unsorted', color: '#f59e0b', pos: [0.18, 0.18, -0.2], rot: [0.2, 0.4, 0] },
]

function move(object, x, y, z) {
  object.position.set(x, y, z)
}

function CameraRig({ activePreset }) {
  const controlsRef = useRef()
  const desiredPos = useMemo(() => new THREE.Vector3(), [])
  const desiredTarget = useMemo(() => new THREE.Vector3(), [])
  const lastPresetRef = useRef(activePreset)
  const transitionLeftRef = useRef(0)

  useSimulationFrame((_, dt, state) => {
    if (lastPresetRef.current !== activePreset) {
      lastPresetRef.current = activePreset
      transitionLeftRef.current = 1.1
    }
    if (transitionLeftRef.current <= 0 || !controlsRef.current) return
    const preset = CAMERA_PRESETS[activePreset] || CAMERA_PRESETS.overview
    desiredPos.set(...preset.position)
    desiredTarget.set(...preset.target)

    const step = Math.min(1, (dt || 0.016) * 5.5)
    state.camera.position.lerp(desiredPos, step)
    controlsRef.current.target.lerp(desiredTarget, step)
    controlsRef.current.update()
    transitionLeftRef.current -= dt || 0.016
  })

  return (
    <OrbitControls
      ref={controlsRef}
      target={[0.3, 2.3, 0.2]}
      minDistance={4.2}
      maxDistance={23}
      maxPolarAngle={Math.PI / 2.02}
    />
  )
}

function MovingObject({ item, variant }) {
  const group = useRef()
  const config = TYPE_CONFIG[item.type]
  const isTurntable = variant === 'turntable'

  useSimulationFrame((elapsed, dt) => {
    const cycleDuration = 21.6
    const phase = (elapsed + item.offset) % cycleDuration
    const beltZ = -0.45 + item.lane * 0.22
    const targetY = config.platterY

    // 1. Incline conveyor climb from feed hopper to Station 01 entry
    if (phase < 4.4) {
      const progress = phase / 4.4
      move(
        group.current,
        THREE.MathUtils.lerp(-5.85, ENTRY_PORT.x, progress),
        THREE.MathUtils.lerp(0.88, STATION_ITEM_Y[0], progress),
        THREE.MathUtils.lerp(beltZ, ENTRY_PORT.z, progress * 0.6),
      )
      group.current.rotation.set(0, -phase * 1.8, 0.72 * (1 - progress * 0.25))
      return
    }

    const routeTime = phase - 4.4
    // Time to sweep clockwise from ENTRY_ANGLE (-2.55) -> back (-π/2) -> gauge (0) -> BYPASS_ANGLE (+2.21) at ROTOR_OMEGA
    const sweepArc = BYPASS_ANGLE - ENTRY_ANGLE // 4.76 rad
    const sweepTime = sweepArc / ROTOR_OMEGA // ~1.80s
    const dropTime = 0.65
    const stationBypassDuration = sweepTime + dropTime // ~2.45s
    const totalBypassTime = config.station * stationBypassDuration

    // 2. Cascade through earlier stations (clockwise: Entry -> Back -> Gauge on Right -> Front -> Bypass on Front-Left)
    if (routeTime < totalBypassTime) {
      const stationIndex = Math.floor(routeTime / stationBypassDuration)
      const localTime = routeTime % stationBypassDuration
      const currentY = STATION_ITEM_Y[stationIndex]
      const nextY = STATION_ITEM_Y[stationIndex + 1]

      if (!isTurntable) {
        // OPTION 1 (Paddle): Swept clockwise by rotating paddle at ROTOR_OMEGA -> drops through fixed interior hole
        if (localTime < sweepTime) {
          const t = localTime / sweepTime
          const angle = ENTRY_ANGLE + localTime * ROTOR_OMEGA
          const radius = THREE.MathUtils.lerp(0.78, 0.92, t)
          move(group.current, Math.cos(angle) * radius, currentY, Math.sin(angle) * radius)
          group.current.rotation.set(0, -angle - Math.PI / 2, 0)
        } else if (localTime < sweepTime + dropTime * 0.78) {
          const t = (localTime - sweepTime) / (dropTime * 0.78)
          move(
            group.current,
            INTERIOR_BYPASS_PORT.x,
            THREE.MathUtils.lerp(currentY, nextY, t),
            INTERIOR_BYPASS_PORT.z,
          )
          group.current.rotation.x += dt * 4.2
        } else {
          const t = (localTime - sweepTime - dropTime * 0.78) / (dropTime * 0.22)
          move(
            group.current,
            THREE.MathUtils.lerp(INTERIOR_BYPASS_PORT.x, ENTRY_PORT.x, t),
            nextY,
            THREE.MathUtils.lerp(INTERIOR_BYPASS_PORT.z, ENTRY_PORT.z, t),
          )
        }
      } else {
        // OPTION 2 (Turntable): Rides clockwise on solid spinning disc at ROTOR_OMEGA -> hits wiper plow -> pushed into external funnel
        const plowSweepTime = (PLOW_CONTACT_ANGLE - ENTRY_ANGLE) / ROTOR_OMEGA
        const plowSlideTime = sweepTime - plowSweepTime

        if (localTime < plowSweepTime) {
          const angle = ENTRY_ANGLE + localTime * ROTOR_OMEGA
          const radius = 0.84
          move(group.current, Math.cos(angle) * radius, currentY, Math.sin(angle) * radius)
          group.current.rotation.set(0, -angle - Math.PI / 2, 0)
        } else if (localTime < sweepTime) {
          // Deflected outward along stationary wiper plow bar off the disc edge into external funnel
          const t = (localTime - plowSweepTime) / plowSlideTime
          const startX = Math.cos(PLOW_CONTACT_ANGLE) * 0.84
          const startZ = Math.sin(PLOW_CONTACT_ANGLE) * 0.84
          move(
            group.current,
            THREE.MathUtils.lerp(startX, EXTERNAL_FUNNEL_PORT.x, t),
            currentY - t * 0.08,
            THREE.MathUtils.lerp(startZ, EXTERNAL_FUNNEL_PORT.z, t),
          )
          group.current.rotation.y -= dt * 4.5
        } else if (localTime < sweepTime + dropTime * 0.72) {
          // Drops straight down external funnel tube outside the platter circumference
          const t = (localTime - sweepTime) / (dropTime * 0.72)
          move(
            group.current,
            EXTERNAL_FUNNEL_PORT.x,
            THREE.MathUtils.lerp(currentY - 0.08, nextY + 0.18, t),
            EXTERNAL_FUNNEL_PORT.z,
          )
          group.current.rotation.x += dt * 4.8
        } else {
          // Slides down the angled return chute from external tube back onto next solid turntable
          const t = (localTime - sweepTime - dropTime * 0.72) / (dropTime * 0.28)
          move(
            group.current,
            THREE.MathUtils.lerp(EXTERNAL_FUNNEL_PORT.x, ENTRY_PORT.x, t),
            THREE.MathUtils.lerp(nextY + 0.18, nextY, t),
            THREE.MathUtils.lerp(EXTERNAL_FUNNEL_PORT.z, ENTRY_PORT.z, t),
          )
        }
      }
      return
    }

    // 3. Target station: sweep clockwise from ENTRY_ANGLE (-2.55) through back (-π/2) to GAUGE_ANGLE (-0.05) at ROTOR_OMEGA
    const stationTime = routeTime - totalBypassTime
    const gaugeSweepDuration = (GAUGE_ANGLE - ENTRY_ANGLE) / ROTOR_OMEGA // ~0.94s
    const apronDuration = 0.5
    const chuteSlideDuration = 2.0

    if (stationTime < gaugeSweepDuration) {
      const t = stationTime / gaugeSweepDuration
      const angle = ENTRY_ANGLE + stationTime * ROTOR_OMEGA
      const radius = THREE.MathUtils.lerp(0.78, 0.68, t)
      move(group.current, Math.cos(angle) * radius, targetY, Math.sin(angle) * radius)
      group.current.rotation.set(0, -angle - Math.PI / 2, 0)
    } else if (stationTime < gaugeSweepDuration + apronDuration) {
      const t = (stationTime - gaugeSweepDuration) / apronDuration
      const gaugeExitX = Math.cos(GAUGE_ANGLE) * 0.68
      const gaugeExitZ = Math.sin(GAUGE_ANGLE) * 0.68
      move(
        group.current,
        THREE.MathUtils.lerp(gaugeExitX, config.chuteEntryX, t),
        targetY,
        THREE.MathUtils.lerp(gaugeExitZ, config.chuteZ, t),
      )
      group.current.rotation.y -= dt * 4.0
    } else if (stationTime < gaugeSweepDuration + apronDuration + chuteSlideDuration) {
      const t = (stationTime - gaugeSweepDuration - apronDuration) / chuteSlideDuration
      const slotX = config.binX + item.slot[0]
      const slotZ = config.binZ + item.slot[1]
      move(
        group.current,
        THREE.MathUtils.lerp(config.chuteEntryX, slotX, t),
        THREE.MathUtils.lerp(targetY, -0.32, t),
        THREE.MathUtils.lerp(config.chuteZ, slotZ, t),
      )
      group.current.rotation.z -= dt * 5.2
      group.current.rotation.x += dt * 3.2
    } else {
      const slotX = config.binX + item.slot[0]
      const slotZ = config.binZ + item.slot[1]
      move(group.current, slotX, -0.32, slotZ)
      group.current.rotation.set(0, item.id * 0.5, 0)
    }
  })

  return (
    <group ref={group}>
      <Shape type={item.type} color={config.color} />
    </group>
  )
}

function FeedHopper() {
  return (
    <group position={[-6.05, 0.55, -0.45]}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.92, 0.52, 0.72, 6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.65} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.79, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.9, 0.04, 8, 6]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.4} />
      </mesh>
      {[
        [-0.55, -0.45],
        [0.55, -0.45],
        [-0.55, 0.45],
        [0.55, 0.45],
      ].map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, -0.62, z]}>
          <cylinderGeometry args={[0.06, 0.06, 1.45, 10]} />
          <meshStandardMaterial color="#334155" metalness={0.7} />
        </mesh>
      ))}
      <group position={[0, 0.48, 0]}>
        {HOPPER_PILE.map((item, idx) => (
          <group key={idx} position={item.pos} rotation={item.rot}>
            <Shape type={item.type} color={item.color} />
          </group>
        ))}
      </group>
      <Html position={[0, 1.45, 0]} center transform distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div className="w-36 rounded-lg border border-cyan-400/35 bg-slate-950/90 px-2 py-1 text-center font-mono text-[8px] tracking-wider text-cyan-200 shadow-lg">
          <span className="block text-[7px] text-slate-400">RANDOM START</span>
          MIXED INFEED HOPPER
        </div>
      </Html>
    </group>
  )
}

function MechanicalGauge({ type }) {
  if (type === 'sphere') {
    return (
      <group position={[0.45, 0, -0.25]}>
        <mesh position={[0.15, 0.18, -0.28]} rotation={[0, -0.42, 0]}>
          <boxGeometry args={[1.05, 0.11, 0.07]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.22} metalness={0.6} />
        </mesh>
        <mesh position={[0.15, 0.18, 0.16]} rotation={[0, -0.42, 0]}>
          <boxGeometry args={[1.05, 0.11, 0.07]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.22} metalness={0.6} />
        </mesh>
        <mesh position={[0.1, 0.34, -0.06]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.62, 16]} />
          <meshStandardMaterial color="#86efac" metalness={0.75} />
        </mesh>
      </group>
    )
  }
  if (type === 'cube') {
    return (
      <group position={[0.42, 0, 0]}>
        {[
          [-0.25, -0.36],
          [0.35, -0.36],
          [-0.25, 0.36],
          [0.35, 0.36],
        ].map(([x, z]) => (
          <mesh key={`${x}-${z}`} position={[x, 0.28, z]}>
            <cylinderGeometry args={[0.055, 0.055, 0.42, 12]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.85} />
          </mesh>
        ))}
        <mesh position={[0.08, 0.42, 0]} rotation={[0, -0.38, 0]}>
          <boxGeometry args={[0.92, 0.08, 0.12]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.28} metalness={0.6} />
        </mesh>
      </group>
    )
  }
  if (type === 'pyramid') {
    return (
      <group position={[0.42, 0, 0.25]}>
        <mesh position={[0.05, 0.2, -0.22]} rotation={[0, 0.38, 0]}>
          <boxGeometry args={[0.95, 0.12, 0.08]} />
          <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={0.22} metalness={0.7} />
        </mesh>
        <mesh position={[0.05, 0.2, 0.22]} rotation={[0, 0.52, 0]}>
          <boxGeometry args={[0.95, 0.12, 0.08]} />
          <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={0.22} metalness={0.7} />
        </mesh>
        <mesh position={[-0.12, 0.17, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.22, 0.09, 4]} />
          <meshStandardMaterial color="#1d4ed8" />
        </mesh>
      </group>
    )
  }
  return (
    <group position={[0.32, 0, 0.42]}>
      <mesh position={[0, 0.2, 0]} rotation={[0, 0.65, 0]}>
        <boxGeometry args={[1.25, 0.14, 0.09]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.25} metalness={0.6} />
      </mesh>
    </group>
  )
}

/**
 * OPTION 1 PLATTER:
 * Stationary floor deck with a fixed interior drop-through hole + rotating 4-blade sweep paddle spider on the central shaft.
 */
function StationaryPaddlePlatter({ y, label, accepts, color, type }) {
  const paddleRef = useRef()
  const hasBypass = type !== 'return'
  const labelPosition = [-1.85, 0.22, 0.35]

  useSimulationFrame((_, dt) => {
    if (paddleRef.current) {
      paddleRef.current.rotation.y -= dt * ROTOR_OMEGA
    }
  })

  return (
    <group position={[0, y, 0]}>
      {/* 100% Stationary Platter Floor Deck bolted to outer support columns */}
      <mesh receiveShadow>
        <cylinderGeometry args={[1.42, 1.42, 0.16, 64]} />
        <meshStandardMaterial color="#1e293b" metalness={0.68} roughness={0.36} />
      </mesh>
      {/* Stationary circular track surface */}
      <mesh position={[0, 0.085, 0]} receiveShadow>
        <cylinderGeometry args={[1.22, 1.22, 0.02, 48]} />
        <meshStandardMaterial color="#273549" metalness={0.5} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.095, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.36, 0.032, 8, 48]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Rotating 4-Arm Sweep Paddle Spider mounted to the spinning central shaft */}
      <group ref={paddleRef} position={[0, 0.22, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.36, 0.38, 0.22, 24]} />
          <meshStandardMaterial color="#0284c7" metalness={0.75} roughness={0.25} />
        </mesh>
        {[0, 1, 2, 3].map((armIndex) => {
          const angle = (armIndex * Math.PI) / 2
          return (
            <group key={armIndex} rotation={[0, angle, 0]}>
              {/* Radial paddle arm hovering above the fixed deck */}
              <mesh position={[0.68, 0.01, 0]} castShadow>
                <boxGeometry args={[0.72, 0.07, 0.06]} />
                <meshStandardMaterial color="#38bdf8" metalness={0.7} roughness={0.25} />
              </mesh>
              {/* Leading wiper blade facing the clockwise direction of motion */}
              <mesh position={[0.72, -0.05, 0.03]}>
                <boxGeometry args={[0.64, 0.07, 0.03]} />
                <meshStandardMaterial color="#7dd3fc" emissive="#0284c7" emissiveIntensity={0.2} />
              </mesh>
            </group>
          )
        })}
      </group>

      {/* Fixed circular drop hole cut into the stationary deck + vertical drop tube */}
      {hasBypass && (
        <group position={[INTERIOR_BYPASS_PORT.x, 0, INTERIOR_BYPASS_PORT.z]}>
          <mesh position={[0, 0.098, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.03, 32]} />
            <meshBasicMaterial color="#050a12" />
          </mesh>
          <mesh position={[0, 0.108, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.27, 0.025, 8, 32]} />
            <meshBasicMaterial color="#f59e0b" />
          </mesh>
          <mesh position={[0, -0.88, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 1.62, 24, 1, true]} />
            <meshStandardMaterial
              color="#f59e0b"
              transparent
              opacity={0.2}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}

      <MechanicalGauge type={type} />

      <Html position={labelPosition} center transform distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div className="w-36 rounded-lg border border-white/15 bg-slate-950/90 px-2 py-1 text-center font-mono text-[9px] tracking-wider text-slate-200 shadow-xl">
          <span className="block text-[8px] text-slate-400">{label} · FIXED DECK</span>
          <span style={{ color }}>{accepts}</span>
        </div>
      </Html>
    </group>
  )
}

/**
 * OPTION 2 PLATTER:
 * Solid rotating turntable disc (zero holes) + stationary angled wiper plow that sweeps rejected shapes
 * off the outer rim into an external drop funnel mounted outside the platter circumference.
 */
function SolidTurntablePlatter({ y, label, accepts, color, type }) {
  const rotorRef = useRef()
  const hasBypass = type !== 'return'
  const labelPosition = [-1.95, 0.25, 0.2]

  useSimulationFrame((_, dt) => {
    if (rotorRef.current) {
      rotorRef.current.rotation.y -= dt * ROTOR_OMEGA
    }
  })

  return (
    <group position={[0, y, 0]}>
      {/* Stationary outer mounting ring & brackets supporting the overhead gauge and plow */}
      <mesh position={[0, -0.04, 0]}>
        <cylinderGeometry args={[1.45, 1.45, 0.1, 64, 1, true]} />
        <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.095, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.42, 0.028, 8, 48]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* 100% Solid Rotating Turntable Disc (NO holes inside the spinning disc) */}
      <group ref={rotorRef} position={[0, 0.02, 0]}>
        <mesh receiveShadow>
          <cylinderGeometry args={[1.38, 1.38, 0.15, 64]} />
          <meshStandardMaterial color="#334155" metalness={0.62} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.09, 0]}>
          <cylinderGeometry args={[0.38, 0.42, 0.06, 24]} />
          <meshStandardMaterial color="#475569" metalness={0.75} />
        </mesh>
        {Array.from({ length: 12 }, (_, index) => {
          const angle = (index * Math.PI) / 6
          return (
            <mesh key={index} position={[0, 0.082, 0]} rotation={[0, angle, 0]}>
              <boxGeometry args={[2.68, 0.018, 0.03]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} />
            </mesh>
          )
        })}
      </group>

      {/* Stationary Wiper Plow + External Rim Drop Funnel mounted outside the spinning disc */}
      {hasBypass && (
        <group>
          {/* Stationary angled wiper plow rail aligned to intercept clockwise-moving items and guide them outward */}
          <mesh position={[-0.56, 0.21, 1.02]} rotation={[0, 0.56, 0]} castShadow>
            <boxGeometry args={[1.05, 0.14, 0.07]} />
            <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={0.3} metalness={0.65} />
          </mesh>
          {/* Lip bridge from platter edge into external funnel */}
          <mesh position={[-0.68, 0.04, 1.18]} rotation={[0.18, 0.52, 0]}>
            <boxGeometry args={[0.42, 0.05, 0.48]} />
            <meshStandardMaterial color="#475569" metalness={0.7} />
          </mesh>

          {/* External Drop Funnel & Vertical Tube (at r = 1.58, completely outside the 1.38 disc) */}
          <group position={[EXTERNAL_FUNNEL_PORT.x, 0, EXTERNAL_FUNNEL_PORT.z]}>
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.32, 0.24, 0.22, 24, 1, true]} />
              <meshStandardMaterial color="#d97706" metalness={0.65} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.32, 0.025, 8, 32]} />
              <meshBasicMaterial color="#fbbf24" />
            </mesh>
            {/* External vertical drop tube to next station */}
            <mesh position={[0, -0.78, 0]}>
              <cylinderGeometry args={[0.23, 0.23, 1.44, 24, 1, true]} />
              <meshStandardMaterial
                color="#f59e0b"
                transparent
                opacity={0.24}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
            {/* Angled return feed ramp at bottom of external tube onto the next platter below */}
            <mesh position={[0.08, -1.52, -0.72]} rotation={[-0.22, 0.12, 0]}>
              <boxGeometry args={[0.44, 0.06, 1.35]} />
              <meshStandardMaterial color="#475569" metalness={0.65} />
            </mesh>
          </group>
        </group>
      )}

      <MechanicalGauge type={type} />

      <Html position={labelPosition} center transform distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div className="w-38 rounded-lg border border-white/15 bg-slate-950/90 px-2 py-1 text-center font-mono text-[9px] tracking-wider text-slate-200 shadow-xl">
          <span className="block text-[8px] text-slate-400">{label} · SOLID DISC</span>
          <span style={{ color }}>{accepts}</span>
        </div>
      </Html>
    </group>
  )
}

function Chute({ platterY, color, binX, binZ, chuteEntryX, chuteZ }) {
  const bedY = platterY - 0.22
  const binRimY = -0.32
  const apronDx = chuteEntryX - 0.68
  const apronDz = chuteZ
  const apronLength = Math.hypot(apronDx, apronDz)
  const apronYaw = -Math.atan2(apronDz, apronDx)

  const dx = binX - chuteEntryX
  const dy = bedY - binRimY
  const dz = binZ - chuteZ
  const horizontalDist = Math.hypot(dx, dz)
  const dropLength = Math.hypot(horizontalDist, dy)
  const yaw = -Math.atan2(dz, dx)
  const pitch = -Math.atan2(dy, horizontalDist)

  return (
    <group>
      <group position={[(0.68 + chuteEntryX) / 2, bedY, chuteZ / 2]} rotation={[0, apronYaw, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[apronLength + 0.18, 0.1, 0.72]} />
          <meshStandardMaterial color="#475569" metalness={0.65} roughness={0.35} />
        </mesh>
      </group>

      <group
        position={[(chuteEntryX + binX) / 2, (bedY + binRimY) / 2, (chuteZ + binZ) / 2]}
        rotation={[0, yaw, 0]}
      >
        <group rotation={[0, 0, pitch]}>
          <mesh receiveShadow>
            <boxGeometry args={[dropLength, 0.11, 0.74]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.2}
              metalness={0.45}
              roughness={0.35}
            />
          </mesh>
          {[-0.39, 0.39].map((zOffset) => (
            <mesh key={zOffset} position={[0, 0.1, zOffset]}>
              <boxGeometry args={[dropLength, 0.11, 0.045]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.25} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  )
}

function CollectionBin({ type }) {
  const { color, label, binX, binZ, icon } = TYPE_CONFIG[type]
  return (
    <group position={[binX, -0.75, binZ]}>
      <mesh receiveShadow>
        <boxGeometry args={[1.18, 0.86, 1.18]} />
        <meshStandardMaterial color="#182235" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.04, 0.07, 1.04]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.32} />
      </mesh>
      <Html position={[0, -0.7, 0.84]} center transform distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div
          className="w-24 rounded-md border px-1.5 py-1 text-center font-mono text-[8px] font-bold tracking-wider"
          style={{ background: `${color}22`, borderColor: color, color }}
        >
          {icon} {label}
        </div>
      </Html>
    </group>
  )
}

export function MechanicalSorterScene({ activePreset = 'overview', variant = 'paddle' }) {
  const spindleRef = useRef()
  const PlatterComponent = variant === 'turntable' ? SolidTurntablePlatter : StationaryPaddlePlatter

  useSimulationFrame((_, dt) => {
    if (spindleRef.current) {
      spindleRef.current.rotation.y -= dt * ROTOR_OMEGA
    }
  })

  return (
    <>
      <PerspectiveCamera makeDefault position={[10.4, 7.2, 13.2]} fov={38} />
      <color attach="background" args={['#070d18']} />
      <fog attach="fog" args={['#070d18', 14, 30]} />
      <ambientLight intensity={0.48} />
      <directionalLight castShadow position={[4, 10, 7]} intensity={2.3} shadow-mapSize={[2048, 2048]} />
      <pointLight position={[-5, 2, 4]} color="#38bdf8" intensity={18} distance={11} />
      <pointLight position={[4, 5, 1]} color="#a855f7" intensity={13} distance={9} />
      <group>
        {/* Central rotating drive shaft */}
        <mesh ref={spindleRef} position={[0, 2.35, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 7.2, 16]} />
          <meshStandardMaterial color="#0ea5e9" metalness={0.8} roughness={0.25} />
        </mesh>

        {/* Stationary outer frame support columns anchoring stationary decks/gauges */}
        {[
          [-1.32, -0.82],
          [0.05, -1.48],
          [-1.45, 0.45],
        ].map(([x, z]) => (
          <mesh key={`${x}-${z}`} position={[x, 2.1, z]}>
            <cylinderGeometry args={[0.065, 0.065, 6.8, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.3} />
          </mesh>
        ))}

        {/* Heavy machine base */}
        <mesh position={[0, -1.3, 0]} receiveShadow>
          <cylinderGeometry args={[2.1, 2.25, 0.35, 64]} />
          <meshStandardMaterial color="#202d42" metalness={0.5} />
        </mesh>

        {/* Random-start feed hopper & inclined conveyor */}
        <FeedHopper />
        <Conveyor position={[-3.55, 2.85, -0.45]} length={6.6} rotation={[0, 0, 0.72]} />

        {/* 4 Cascade Stations (either Option 1 Stationary Deck + Sweep Paddles OR Option 2 Solid Turntable + External Funnel) */}
        <PlatterComponent y={5.0} label="STATION 01" accepts="V-GROOVE · SPHERES" color="#22c55e" type="sphere" />
        <PlatterComponent y={3.25} label="STATION 02" accepts="FEELER GATE · CUBES" color="#ef4444" type="cube" />
        <PlatterComponent y={1.5} label="STATION 03" accepts="TRI-NEST · PYRAMIDS" color="#3b82f6" type="pyramid" />
        <PlatterComponent y={-0.25} label="STATION 04" accepts="UNSORTED CATCH TRAY" color="#f59e0b" type="return" />

        {/* 4 Forward-Sloping Exit Chutes */}
        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
          <Chute
            key={key}
            platterY={cfg.platterY}
            color={cfg.color}
            binX={cfg.binX}
            binZ={cfg.binZ}
            chuteEntryX={cfg.chuteEntryX}
            chuteZ={cfg.chuteZ}
          />
        ))}

        {/* 4 Collection Bins */}
        <CollectionBin type="sphere" />
        <CollectionBin type="cube" />
        <CollectionBin type="pyramid" />
        <CollectionBin type="unsorted" />

        {OBJECTS.map((item) => (
          <MovingObject key={item.id} item={item} variant={variant} />
        ))}
      </group>
      <gridHelper args={[32, 32, '#1e3a5f', '#111c2e']} position={[0, -1.48, 0]} />
      <CameraRig activePreset={activePreset} />
    </>
  )
}
