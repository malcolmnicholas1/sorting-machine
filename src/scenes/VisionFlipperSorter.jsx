import { Html, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Conveyor } from '../components/Conveyor.jsx'
import { Shape } from '../components/Shape.jsx'
import { useSimulationFrame } from '../components/useSimulationFrame.js'

const CAMERA_PRESETS = {
  overview: { position: [8.8, 6.9, 10.8], target: [0.5, 0.8, 0] },
  hopper: { position: [-3.2, 3.3, 5.2], target: [-4.8, 1.1, 0] },
  scanner: { position: [-1.7, 3.6, 4.4], target: [-1.75, 1.1, 0] },
  flipper: { position: [2.2, 3.8, 4.2], target: [1.65, 0.85, 0] },
  chutes: { position: [5.4, 4.4, 5.6], target: [3.6, 0.3, 0] },
  bins: { position: [8.2, 4.2, 5.2], target: [5.2, -0.1, 0] },
}

// Conveyor discharge & flipper pivot at x = 1.08; chute entries at x = 2.35
const HOPPER_X = -4.75
const SCANNER_X = -1.75
const FLIPPER_PIVOT_X = 1.08
const CHUTE_ENTRY_X = 2.35
const BELT_SURFACE_Y = 0.68
const BELT_ITEM_Y = 0.94
const BIN_ITEM_Y = -0.14

const FLIPPER_TYPES = {
  cube: {
    type: 'cube',
    color: '#ef4444',
    label: 'CUBE',
    laneLabel: 'LANE 01 · -28°',
    confidence: '99.7%',
    chuteZ: -1.05,
    binX: 5.15,
    binZ: -2.55,
    icon: '■',
  },
  sphere: {
    type: 'sphere',
    color: '#22c55e',
    label: 'SPHERE',
    laneLabel: 'LANE 02 · -10°',
    confidence: '99.9%',
    chuteZ: -0.35,
    binX: 5.35,
    binZ: -0.85,
    icon: '●',
  },
  pyramid: {
    type: 'pyramid',
    color: '#3b82f6',
    label: 'PYRAMID',
    laneLabel: 'LANE 03 · +10°',
    confidence: '99.4%',
    chuteZ: 0.35,
    binX: 5.35,
    binZ: 0.85,
    icon: '▲',
  },
  unsorted: {
    type: 'unsorted',
    color: '#f59e0b',
    label: 'ANOMALY',
    laneLabel: 'LANE 04 · +28°',
    confidence: 'REJECT',
    chuteZ: 1.05,
    binX: 5.15,
    binZ: 2.55,
    icon: '↻',
  },
}

const BIN_SLOTS = [
  [-0.24, -0.22],
  [0.24, -0.22],
  [-0.24, 0.22],
  [0.24, 0.22],
]

const SEQUENCE = [
  'cube',
  'sphere',
  'pyramid',
  'cube',
  'sphere',
  'unsorted',
  'pyramid',
  'cube',
  'sphere',
  'pyramid',
  'unsorted',
  'sphere',
]

const STEP_TIME = 2.6
const NUM_ITEMS = SEQUENCE.length
const TOTAL_LOOP = NUM_ITEMS * STEP_TIME

const PIPELINE_ITEMS = SEQUENCE.map((type, index) => {
  const sameTypeIndex = SEQUENCE.slice(0, index).filter((t) => t === type).length
  return {
    id: index,
    type,
    slot: BIN_SLOTS[sameTypeIndex % BIN_SLOTS.length],
  }
})

const HOPPER_PILE = [
  { type: 'cube', color: '#ef4444', pos: [-0.2, 0.2, -0.15], rot: [0.2, 0.4, 0] },
  { type: 'sphere', color: '#22c55e', pos: [0.2, 0.22, 0.16], rot: [0, 0, 0] },
  { type: 'pyramid', color: '#3b82f6', pos: [-0.05, 0.24, 0.2], rot: [0.1, 0.7, -0.1] },
  { type: 'unsorted', color: '#f59e0b', pos: [0.16, 0.18, -0.18], rot: [0.2, 0.3, 0] },
]

function getTargetYaw(chuteZ) {
  return -Math.atan2(chuteZ, CHUTE_ENTRY_X - FLIPPER_PIVOT_X)
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
      target={[0.5, 0.8, 0]}
      minDistance={4.2}
      maxDistance={21}
      maxPolarAngle={Math.PI / 2.02}
    />
  )
}

function ElevatedHopperAndSupport() {
  return (
    <group>
      {/* Infeed Hopper at x = -4.95, y = 0.78 */}
      <group position={[-4.95, 0.78, 0]}>
        <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.85, 0.48, 0.68, 6]} />
          <meshStandardMaterial color="#1e293b" metalness={0.65} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.83, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.84, 0.038, 8, 6]} />
          <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={0.4} />
        </mesh>
        {[
          [-0.5, -0.42],
          [0.5, -0.42],
          [-0.5, 0.42],
          [0.5, 0.42],
        ].map(([x, z]) => (
          <mesh key={`${x}-${z}`} position={[x, -0.55, z]}>
            <cylinderGeometry args={[0.055, 0.055, 1.65, 10]} />
            <meshStandardMaterial color="#334155" metalness={0.7} />
          </mesh>
        ))}
        <group position={[0, 0.52, 0]}>
          {HOPPER_PILE.map((item, idx) => (
            <group key={idx} position={item.pos} rotation={item.rot}>
              <Shape type={item.type} color={item.color} />
            </group>
          ))}
        </group>
        <Html position={[0, 1.38, 0]} center transform distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div className="w-34 rounded-lg border border-cyan-400/35 bg-slate-950/90 px-2 py-1 text-center font-mono text-[8px] tracking-wider text-cyan-200 shadow-lg">
            <span className="block text-[7px] text-slate-400">RANDOM START</span>
            INFEED HOPPER
          </div>
        </Html>
      </group>

      {/* Conveyor Support Stanchions */}
      {[-3.6, -0.4, 0.9].map((xPos) => (
        <group key={xPos} position={[xPos, 0.02, 0]}>
          {[-0.52, 0.52].map((zPos) => (
            <mesh key={zPos} position={[0, 0, zPos]}>
              <cylinderGeometry args={[0.06, 0.07, 1.15, 12]} />
              <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

function VisionGantryAndScanner() {
  const scanLight = useRef()
  const reticleRef = useRef()
  const activeStepRef = useRef(-1)
  const [scannedItem, setScannedItem] = useState(PIPELINE_ITEMS[0])
  const boxGeo = useMemo(() => new THREE.BoxGeometry(0.62, 0.62, 0.62), [])
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(boxGeo), [boxGeo])

  useSimulationFrame((elapsed, dt) => {
    const stepIndex = Math.floor(elapsed / STEP_TIME)
    const conveyorItemIndex = stepIndex % NUM_ITEMS
    const localTime = elapsed % STEP_TIME

    if (activeStepRef.current !== conveyorItemIndex) {
      activeStepRef.current = conveyorItemIndex
      setScannedItem(PIPELINE_ITEMS[conveyorItemIndex])
    }

    const itemX = THREE.MathUtils.lerp(HOPPER_X, FLIPPER_PIVOT_X, localTime / STEP_TIME)
    const inScanZone = Math.abs(itemX - SCANNER_X) < 0.88

    if (scanLight.current) {
      scanLight.current.material.opacity = inScanZone
        ? 0.22 + (Math.sin(elapsed * 14) + 1) * 0.06
        : 0.09
    }

    if (reticleRef.current) {
      reticleRef.current.visible = inScanZone
      reticleRef.current.position.set(itemX, BELT_ITEM_Y, 0)
      reticleRef.current.rotation.y += dt * 2.4
    }
  })

  const cfg = FLIPPER_TYPES[scannedItem.type]

  return (
    <>
      <group position={[SCANNER_X, 0, 0]}>
        {[-0.82, 0.82].map((zLeg) => (
          <mesh key={zLeg} position={[0, 1.35, zLeg]} castShadow>
            <boxGeometry args={[0.14, 3.4, 0.14]} />
            <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.32} />
          </mesh>
        ))}
        <mesh position={[0, 3.05, 0]} castShadow>
          <boxGeometry args={[0.22, 0.18, 1.82]} />
          <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.3} />
        </mesh>

        {/* Camera Housing & Lens Assembly */}
        <group position={[0, 2.95, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.82, 0.42, 0.58]} />
            <meshStandardMaterial color="#172b3e" metalness={0.72} roughness={0.25} />
          </mesh>
          <mesh position={[0, -0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.2, 24]} />
            <meshStandardMaterial color="#64748b" metalness={0.75} />
          </mesh>
          <mesh position={[0, -0.37, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.11, 0.11, 0.04, 24]} />
            <meshStandardMaterial color={cfg.color} emissive={cfg.color} emissiveIntensity={2.2} />
          </mesh>
          <mesh ref={scanLight} position={[0, -1.15, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.75, 1.55, 24, 1, true]} />
            <meshBasicMaterial
              color={cfg.color}
              transparent
              opacity={0.14}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <Html position={[0, 0.58, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
            <div
              className="whitespace-nowrap rounded-lg border bg-slate-950/90 px-2.5 py-1 text-center font-mono text-[8px] tracking-wider shadow-xl"
              style={{ borderColor: cfg.color, color: cfg.color }}
            >
              <span className="block text-[7px] text-slate-400">VISION SENSOR · DIVERTER COMMAND</span>
              {cfg.icon} {cfg.label} ({cfg.confidence}) → {cfg.laneLabel}
            </div>
          </Html>
        </group>
      </group>

      {/* Live 3D Bounding Box Reticle around the shape being classified */}
      <group ref={reticleRef}>
        <lineSegments geometry={edgesGeo}>
          <lineBasicMaterial color={cfg.color} />
        </lineSegments>
        <mesh position={[0, -0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.38, 0.43, 24]} />
          <meshBasicMaterial color={cfg.color} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </>
  )
}

/**
 * High-Speed Servo Flipper / Diverter Channel at the end of the conveyor belt.
 * Swivels smoothly to direct each incoming shape into its matching chute mouth at x = CHUTE_ENTRY_X.
 */
function ServoFlipperDiverter() {
  const flipperGroupRef = useRef()
  const indicatorRingRef = useRef()
  const currentYawRef = useRef(0)
  const activeIdxRef = useRef(-1)
  const [activeCfg, setActiveCfg] = useState(FLIPPER_TYPES[SEQUENCE[0]])

  const channelLength = Math.hypot(CHUTE_ENTRY_X - FLIPPER_PIVOT_X, 0.7)

  useSimulationFrame((elapsed, dt) => {
    // Item k reaches the flipper at (k + 1) * STEP_TIME and passes through during [0, 0.55s] of the next step.
    // We switch the flipper target at phase = 0.65s of the step (right after the previous item enters its chute
    // and as the new item passes under the Vision Scanner).
    const shifted = Math.max(0, elapsed - 0.65)
    const targetIndex = Math.floor(shifted / STEP_TIME) % NUM_ITEMS
    const targetItem = PIPELINE_ITEMS[targetIndex]
    const cfg = FLIPPER_TYPES[targetItem.type]

    if (activeIdxRef.current !== targetIndex) {
      activeIdxRef.current = targetIndex
      setActiveCfg(cfg)
    }

    const desiredYaw = getTargetYaw(cfg.chuteZ)
    const step = Math.min(1, (dt || 0.016) * 10.5)
    currentYawRef.current = THREE.MathUtils.lerp(currentYawRef.current, desiredYaw, step)

    if (flipperGroupRef.current) {
      flipperGroupRef.current.rotation.y = currentYawRef.current
    }
    if (indicatorRingRef.current) {
      indicatorRingRef.current.material.color.set(cfg.color)
    }
  })

  return (
    <group position={[FLIPPER_PIVOT_X, BELT_SURFACE_Y, 0]}>
      {/* Stationary 4-Way Diverter Deck Table between Conveyor End and Chute Mouths */}
      <mesh position={[0.64, -0.04, 0]} receiveShadow>
        <boxGeometry args={[1.45, 0.12, 2.75]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.35} />
      </mesh>
      {/* Diverter Deck Support Legs */}
      {[
        [-0.95, 1.15],
        [0.95, 1.15],
      ].map(([zSide, xOff]) => (
        <mesh key={`${zSide}-${xOff}`} position={[xOff, -0.66, zSide]}>
          <cylinderGeometry args={[0.065, 0.075, 1.18, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.75} />
        </mesh>
      ))}

      {/* Overhead Servo Actuator Arch & Motor Hub at the Flipper Pivot */}
      {[-0.78, 0.78].map((zPost) => (
        <mesh key={zPost} position={[0, 0.42, zPost]} castShadow>
          <boxGeometry args={[0.14, 0.92, 0.14]} />
          <meshStandardMaterial color="#334155" metalness={0.75} />
        </mesh>
      ))}
      <mesh position={[0, 0.86, 0]} castShadow>
        <boxGeometry args={[0.24, 0.12, 1.7]} />
        <meshStandardMaterial color="#475569" metalness={0.78} />
      </mesh>
      {/* Servo Motor Cylinder */}
      <mesh position={[0, 0.98, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.26, 0.28, 24]} />
        <meshStandardMaterial color="#0e7490" metalness={0.72} roughness={0.25} />
      </mesh>
      <mesh ref={indicatorRingRef} position={[0, 1.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.03, 8, 32]} />
        <meshBasicMaterial color={activeCfg.color} />
      </mesh>

      {/* Swiveling Flipper Channel / Diverter Paddle */}
      <group ref={flipperGroupRef} position={[0, 0.04, 0]}>
        {/* Vertical drive shaft connecting overhead servo to flipper paddles */}
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.82, 16]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.85} />
        </mesh>
        {/* Low-friction sliding floor plate */}
        <mesh position={[channelLength / 2, 0.01, 0]} receiveShadow>
          <boxGeometry args={[channelLength, 0.03, 0.62]} />
          <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.25} />
        </mesh>
        {/* Left & Right Flipper Guide Blades */}
        {[-0.32, 0.32].map((zWall) => (
          <mesh key={zWall} position={[channelLength / 2, 0.16, zWall]} castShadow>
            <boxGeometry args={[channelLength, 0.28, 0.06]} />
            <meshStandardMaterial
              color={activeCfg.color}
              emissive={activeCfg.color}
              emissiveIntensity={0.28}
              metalness={0.6}
              roughness={0.25}
            />
          </mesh>
        ))}
        {/* Top pointer arrow bar */}
        <mesh position={[channelLength / 2, 0.31, 0]}>
          <boxGeometry args={[channelLength * 0.85, 0.035, 0.08]} />
          <meshBasicMaterial color="#e2e8f0" />
        </mesh>
      </group>

      <Html position={[0.25, 1.52, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div
          className="whitespace-nowrap rounded-lg border bg-slate-950/90 px-2.5 py-1 text-center font-mono text-[8px] tracking-wider shadow-xl"
          style={{ borderColor: activeCfg.color, color: activeCfg.color }}
        >
          <span className="block text-[7px] text-slate-400">HIGH-SPEED SERVO FLIPPER</span>
          DIRECTING → {activeCfg.icon} {activeCfg.label} CHUTE
        </div>
      </Html>
    </group>
  )
}

function DiverterChutesAndBins() {
  return Object.values(FLIPPER_TYPES).map((cfg) => {
    const startX = CHUTE_ENTRY_X
    const startY = BELT_SURFACE_Y - 0.02
    const startZ = cfg.chuteZ
    const endX = cfg.binX - 0.15
    const endY = -0.18
    const endZ = cfg.binZ

    const dx = endX - startX
    const dy = startY - endY
    const dz = endZ - startZ
    const horiz = Math.hypot(dx, dz)
    const dropLength = Math.hypot(horiz, dy)
    const yaw = -Math.atan2(dz, dx)
    const pitch = -Math.atan2(dy, horiz)

    return (
      <group key={cfg.type}>
        {/* Sloped Chute with Side Guardrails */}
        <group
          position={[(startX + endX) / 2, (startY + endY) / 2, (startZ + endZ) / 2]}
          rotation={[0, yaw, 0]}
        >
          <group rotation={[0, 0, pitch]}>
            <mesh receiveShadow>
              <boxGeometry args={[dropLength, 0.09, 0.66]} />
              <meshStandardMaterial
                color={cfg.color}
                emissive={cfg.color}
                emissiveIntensity={0.2}
                metalness={0.45}
                roughness={0.35}
              />
            </mesh>
            {[-0.34, 0.34].map((zOffset) => (
              <mesh key={zOffset} position={[0, 0.09, zOffset]}>
                <boxGeometry args={[dropLength, 0.1, 0.045]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.25} />
              </mesh>
            ))}
          </group>
        </group>

        {/* Collection Bin */}
        <group position={[cfg.binX, -0.35, cfg.binZ]}>
          <mesh receiveShadow>
            <boxGeometry args={[1.18, 0.72, 1.15]} />
            <meshStandardMaterial color="#172235" roughness={0.58} />
          </mesh>
          <mesh position={[0, 0.38, 0]}>
            <boxGeometry args={[1.05, 0.06, 1.02]} />
            <meshStandardMaterial color={cfg.color} emissive={cfg.color} emissiveIntensity={0.28} />
          </mesh>
          <Html position={[0, -0.58, 0.74]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
            <div
              className="w-24 rounded border px-1.5 py-1 text-center font-mono text-[8px] font-bold tracking-wider"
              style={{ color: cfg.color, borderColor: cfg.color, background: '#07111eee' }}
            >
              {cfg.icon} {cfg.label} BIN
            </div>
          </Html>
        </group>
      </group>
    )
  })
}

function FlipperPipelineItem({ item, index }) {
  const groupRef = useRef()
  const targetCfg = FLIPPER_TYPES[item.type]

  useSimulationFrame((elapsed, dt) => {
    const localTime = (elapsed - index * STEP_TIME + TOTAL_LOOP * 1000) % TOTAL_LOOP
    const destX = targetCfg.binX + item.slot[0]
    const destZ = targetCfg.binZ + item.slot[1]

    if (localTime < STEP_TIME) {
      // 1. Moving along the conveyor from Hopper -> Vision Scanner -> Flipper Pivot
      const progress = localTime / STEP_TIME
      groupRef.current.position.set(
        THREE.MathUtils.lerp(HOPPER_X, FLIPPER_PIVOT_X, progress),
        BELT_ITEM_Y,
        0,
      )
      groupRef.current.rotation.set(0, index * 0.7, 0)
      return
    }

    const postTime = localTime - STEP_TIME
    const flipperDuration = 0.52
    const chuteDuration = 1.35

    if (postTime < flipperDuration) {
      // 2. Deflected by the angled Servo Flipper Channel into the matching Chute Mouth
      const t = postTime / flipperDuration
      groupRef.current.position.set(
        THREE.MathUtils.lerp(FLIPPER_PIVOT_X, CHUTE_ENTRY_X, t),
        BELT_ITEM_Y - t * 0.04,
        THREE.MathUtils.lerp(0, targetCfg.chuteZ, t),
      )
      groupRef.current.rotation.y -= dt * 4.5
      return
    }

    if (postTime < flipperDuration + chuteDuration) {
      // 3. Sliding down the sloped chute into its dedicated slot inside the Collection Bin
      const t = (postTime - flipperDuration) / chuteDuration
      groupRef.current.position.set(
        THREE.MathUtils.lerp(CHUTE_ENTRY_X, destX, t),
        THREE.MathUtils.lerp(BELT_ITEM_Y - 0.04, BIN_ITEM_Y, t),
        THREE.MathUtils.lerp(targetCfg.chuteZ, destZ, t),
      )
      groupRef.current.rotation.z -= dt * 5.4
      groupRef.current.rotation.x += dt * 3.0
      return
    }

    // 4. Resting neatly inside its dedicated slot in the Collection Bin
    groupRef.current.position.set(destX, BIN_ITEM_Y, destZ)
    groupRef.current.rotation.set(0, index * 0.5, 0)
  })

  return (
    <group ref={groupRef}>
      <Shape type={item.type} color={targetCfg.color} />
    </group>
  )
}

export function VisionFlipperSorterScene({ activePreset = 'overview' }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[8.8, 6.9, 10.8]} fov={38} />
      <color attach="background" args={['#070d18']} />
      <fog attach="fog" args={['#070d18', 14, 28]} />
      <ambientLight intensity={0.5} />
      <directionalLight castShadow position={[4, 9, 6]} intensity={2.1} shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-3, 3, 2]} color="#22d3ee" intensity={12} distance={10} />
      <pointLight position={[3.5, 3, 0]} color="#a855f7" intensity={11} distance={9} />

      <ElevatedHopperAndSupport />
      <Conveyor position={[-1.95, 0.65, 0]} length={6.1} speed={1.35} />
      <VisionGantryAndScanner />
      <ServoFlipperDiverter />
      <DiverterChutesAndBins />

      {PIPELINE_ITEMS.map((item, index) => (
        <FlipperPipelineItem key={item.id} item={item} index={index} />
      ))}

      <gridHelper args={[26, 26, '#1e3a5f', '#111c2e']} position={[0, -0.6, 0]} />
      <CameraRig activePreset={activePreset} />
    </>
  )
}
