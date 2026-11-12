import { Html, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Conveyor } from '../components/Conveyor.jsx'
import { Shape } from '../components/Shape.jsx'
import { useSimulationFrame } from '../components/useSimulationFrame.js'

const CAMERA_PRESETS = {
  overview: { position: [8.6, 6.8, 10.6], target: [0.4, 0.9, 0] },
  hopper: { position: [-3.2, 3.1, 5.2], target: [-4.8, 0.7, 0] },
  scanner: { position: [-1.6, 3.4, 4.4], target: [-1.65, 0.85, 0] },
  pick: { position: [1.1, 2.8, 4.2], target: [1.15, 0.75, 0] },
  robot: { position: [4.8, 4.2, 5.6], target: [2.4, 1.1, 0] },
  bins: { position: [7.6, 4.2, 4.8], target: [4.1, 0.1, 0.2] },
}

const VISION_TYPES = {
  cube: {
    type: 'cube',
    color: '#ef4444',
    label: 'CUBE',
    confidence: '99.6%',
    binX: 4.05,
    binZ: -2.35,
    icon: '■',
  },
  sphere: {
    type: 'sphere',
    color: '#22c55e',
    label: 'SPHERE',
    confidence: '99.8%',
    binX: 4.35,
    binZ: -0.8,
    icon: '●',
  },
  pyramid: {
    type: 'pyramid',
    color: '#3b82f6',
    label: 'PYRAMID',
    confidence: '99.3%',
    binX: 4.35,
    binZ: 0.8,
    icon: '▲',
  },
  unsorted: {
    type: 'unsorted',
    color: '#f59e0b',
    label: 'ANOMALY',
    confidence: 'REJECT',
    binX: 4.05,
    binZ: 2.35,
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

const STEP_TIME = 3.2
const NUM_ITEMS = SEQUENCE.length
const TOTAL_LOOP = NUM_ITEMS * STEP_TIME

const VISION_ITEMS = SEQUENCE.map((type, index) => {
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

// Conveyor spans x = -5.05 to x = +1.15; Pick Nest at x = 0.85; Robot Pedestal at x = 2.25 (clear of belt)
const HOPPER_X = -4.75
const SCANNER_X = -1.65
const PICK_X = 0.85
const ROBOT_BASE_X = 2.25
const BELT_ITEM_Y = 0.36
const BIN_ITEM_Y = -0.14
const GRIPPER_HOLD_OFFSET_Y = 0.16

const UP_AXIS = new THREE.Vector3(0, 1, 0)
const linkDir = new THREE.Vector3()

function setLink(link, start, end) {
  linkDir.subVectors(end, start)
  const length = linkDir.length()
  link.position.addVectors(start, end).multiplyScalar(0.5)
  if (length > 0.0001) {
    linkDir.multiplyScalar(1 / length)
    link.quaternion.setFromUnitVectors(UP_AXIS, linkDir)
  }
  link.scale.y = length
}

/**
 * Computes the robot wrist position (endOut) and whether the gripper is closed for a given robotPhase ∈ [0, STEP_TIME).
 */
function computeWristPose(robotPhase, targetCfg, slot, endOut) {
  const destX = targetCfg.binX + slot[0]
  const destZ = targetCfg.binZ + slot[1]
  const pickWristY = BELT_ITEM_Y + GRIPPER_HOLD_OFFSET_Y // 0.52
  const carryWristY = 1.68
  const dropWristY = BIN_ITEM_Y + GRIPPER_HOLD_OFFSET_Y + 0.22 // 0.24
  const readyX = 1.35
  const readyY = 1.35

  if (robotPhase < 0.38) {
    // Descend from ready pose into Pick Nest
    const t = robotPhase / 0.38
    endOut.set(
      THREE.MathUtils.lerp(readyX, PICK_X, t),
      THREE.MathUtils.lerp(readyY, pickWristY, t),
      0,
    )
    return robotPhase >= 0.32
  }
  if (robotPhase < 0.82) {
    // Lift item vertically clear of Pick Nest
    const t = (robotPhase - 0.38) / 0.44
    endOut.set(
      THREE.MathUtils.lerp(PICK_X, 1.45, t),
      THREE.MathUtils.lerp(pickWristY, carryWristY, t),
      0,
    )
    return true
  }
  if (robotPhase < 1.85) {
    // Swing across to target bin slot
    const t = (robotPhase - 0.82) / 1.03
    const smooth = t * t * (3 - 2 * t)
    endOut.set(
      THREE.MathUtils.lerp(1.45, destX, smooth),
      carryWristY + Math.sin(smooth * Math.PI) * 0.18,
      THREE.MathUtils.lerp(0, destZ, smooth),
    )
    return true
  }
  if (robotPhase < 2.3) {
    // Lower into target bin slot and release
    const t = (robotPhase - 1.85) / 0.45
    endOut.set(destX, THREE.MathUtils.lerp(carryWristY, dropWristY, t), destZ)
    return t < 0.88
  }
  // Return smoothly to ready pose above Pick Nest
  const t = (robotPhase - 2.3) / (STEP_TIME - 2.3)
  const smooth = t * t * (3 - 2 * t)
  endOut.set(
    THREE.MathUtils.lerp(destX, readyX, smooth),
    THREE.MathUtils.lerp(dropWristY, readyY, smooth) + Math.sin(smooth * Math.PI) * 0.25,
    THREE.MathUtils.lerp(destZ, 0, smooth),
  )
  return false
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
      target={[0.4, 0.9, 0]}
      minDistance={4.2}
      maxDistance={20}
      maxPolarAngle={Math.PI / 2.02}
    />
  )
}

function VisionFeedHopper() {
  return (
    <group position={[-4.95, 0.2, 0]}>
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
        <mesh key={`${x}-${z}`} position={[x, -0.25, z]}>
          <cylinderGeometry args={[0.055, 0.055, 1.05, 10]} />
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
  )
}

function PickNestStopGate() {
  const beamRef = useRef()

  useSimulationFrame((elapsed) => {
    const robotPhase = elapsed % STEP_TIME
    const partPresent = robotPhase < 0.5
    if (beamRef.current) {
      beamRef.current.material.color.set(partPresent ? '#22c55e' : '#ef4444')
      beamRef.current.material.opacity = partPresent ? 0.85 : 0.45
    }
  })

  return (
    <group position={[PICK_X, 0.22, 0]}>
      {/* Mechanical end-stop gate at the end of the conveyor */}
      <mesh position={[0.28, 0.12, 0]}>
        <boxGeometry args={[0.08, 0.22, 0.92]} />
        <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.3} />
      </mesh>
      {/* Optical photo-eye posts */}
      {[-0.58, 0.58].map((zPos) => (
        <mesh key={zPos} position={[0, 0.16, zPos]}>
          <cylinderGeometry args={[0.045, 0.045, 0.32, 12]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>
      ))}
      {/* Photo-eye laser beam across the pick nest */}
      <mesh ref={beamRef} position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 1.12, 8]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.75} />
      </mesh>
    </group>
  )
}

function VisionRobot() {
  const turretRef = useRef()
  const upperArm = useRef()
  const forearm = useRef()
  const elbowJoint = useRef()
  const gripper = useRef()
  const leftFinger = useRef()
  const rightFinger = useRef()
  const upperStart = useMemo(() => new THREE.Vector3(ROBOT_BASE_X, 1.48, 0), [])
  const elbow = useRef(new THREE.Vector3())
  const end = useRef(new THREE.Vector3())

  useSimulationFrame((elapsed) => {
    const stepIndex = Math.floor(elapsed / STEP_TIME)
    const activeItemIndex = (stepIndex - 1 + NUM_ITEMS) % NUM_ITEMS
    const activeItem = VISION_ITEMS[activeItemIndex]
    const targetCfg = VISION_TYPES[activeItem.type]
    const robotPhase = elapsed % STEP_TIME

    const elbowPosition = elbow.current
    const endPosition = end.current
    const closed = computeWristPose(robotPhase, targetCfg, activeItem.slot, endPosition)

    // Rotate waist turret toward the wrist target
    if (turretRef.current) {
      const yaw = Math.atan2(-(endPosition.z - upperStart.z), endPosition.x - upperStart.x)
      turretRef.current.rotation.y = yaw
    }

    // 2-link inverse-kinematics approximation with elevated elbow
    elbowPosition.copy(upperStart).lerp(endPosition, 0.48)
    elbowPosition.y = Math.max(upperStart.y, endPosition.y) + 0.58
    setLink(upperArm.current, upperStart, elbowPosition)
    setLink(forearm.current, elbowPosition, endPosition)
    if (elbowJoint.current) {
      elbowJoint.current.position.copy(elbowPosition)
    }
    gripper.current.position.copy(endPosition)

    const fingerSpread = closed ? 0.14 : 0.25
    leftFinger.current.position.z = -fingerSpread
    rightFinger.current.position.z = fingerSpread
  })

  return (
    <group>
      {/* Heavy floor pedestal positioned at x = 2.25, completely clear of the conveyor belt */}
      <mesh position={[ROBOT_BASE_X, -0.32, 0]} receiveShadow>
        <cylinderGeometry args={[0.68, 0.78, 0.52, 32]} />
        <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.3} />
      </mesh>
      <mesh position={[ROBOT_BASE_X, 0.48, 0]} castShadow>
        <cylinderGeometry args={[0.36, 0.46, 1.1, 24]} />
        <meshStandardMaterial color="#0e7490" metalness={0.68} roughness={0.28} />
      </mesh>
      {/* Rotating waist turret + shoulder housing */}
      <group ref={turretRef} position={[ROBOT_BASE_X, 1.28, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.34, 0.36, 0.48, 24]} />
          <meshStandardMaterial color="#155e75" metalness={0.72} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.24, 20, 20]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.82} roughness={0.2} />
        </mesh>
      </group>

      {/* Articulated Upper Arm, Elbow Joint, and Forearm */}
      <mesh ref={upperArm} castShadow>
        <cylinderGeometry args={[0.13, 0.16, 1, 16]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.68} roughness={0.25} />
      </mesh>
      <mesh ref={elbowJoint} castShadow>
        <sphereGeometry args={[0.18, 18, 18]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.82} roughness={0.2} />
      </mesh>
      <mesh ref={forearm} castShadow>
        <cylinderGeometry args={[0.1, 0.13, 1, 16]} />
        <meshStandardMaterial color="#67e8f9" metalness={0.7} roughness={0.22} />
      </mesh>

      {/* Wrist Actuator & Parallel Gripper Fingers */}
      <group ref={gripper}>
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.16, 0.18, 0.12, 18]} />
          <meshStandardMaterial color="#334155" metalness={0.78} roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.02, 0]}>
          <boxGeometry args={[0.18, 0.06, 0.56]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>
        <group ref={leftFinger} position={[0, -0.16, -0.25]}>
          <mesh castShadow>
            <boxGeometry args={[0.14, 0.28, 0.06]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.75} />
          </mesh>
        </group>
        <group ref={rightFinger} position={[0, -0.16, 0.25]}>
          <mesh castShadow>
            <boxGeometry args={[0.14, 0.28, 0.06]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.75} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

function VisionGantryAndScanner() {
  const scanLight = useRef()
  const reticleRef = useRef()
  const activeStepRef = useRef(-1)
  const [scannedItem, setScannedItem] = useState(VISION_ITEMS[0])
  const boxGeo = useMemo(() => new THREE.BoxGeometry(0.62, 0.62, 0.62), [])
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(boxGeo), [boxGeo])

  useSimulationFrame((elapsed, dt) => {
    const stepIndex = Math.floor(elapsed / STEP_TIME)
    const conveyorItemIndex = stepIndex % NUM_ITEMS
    const localTime = elapsed % STEP_TIME

    if (activeStepRef.current !== conveyorItemIndex) {
      activeStepRef.current = conveyorItemIndex
      setScannedItem(VISION_ITEMS[conveyorItemIndex])
    }

    const itemX = THREE.MathUtils.lerp(HOPPER_X, PICK_X, localTime / STEP_TIME)
    const inScanZone = Math.abs(itemX - SCANNER_X) < 0.85

    if (scanLight.current) {
      scanLight.current.material.opacity = inScanZone
        ? 0.2 + (Math.sin(elapsed * 14) + 1) * 0.06
        : 0.09
    }

    if (reticleRef.current) {
      reticleRef.current.visible = inScanZone
      reticleRef.current.position.set(itemX, BELT_ITEM_Y, 0)
      reticleRef.current.rotation.y += dt * 2.2
    }
  })

  const cfg = VISION_TYPES[scannedItem.type]

  return (
    <>
      {/* Structural Gantry Arch straddling the conveyor belt */}
      <group position={[SCANNER_X, 0, 0]}>
        {[-0.82, 0.82].map((zLeg) => (
          <mesh key={zLeg} position={[0, 1.15, zLeg]} castShadow>
            <boxGeometry args={[0.14, 2.95, 0.14]} />
            <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.32} />
          </mesh>
        ))}
        {/* Gantry crossbeam */}
        <mesh position={[0, 2.65, 0]} castShadow>
          <boxGeometry args={[0.22, 0.18, 1.82]} />
          <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.3} />
        </mesh>

        {/* Camera Housing & Lens Assembly */}
        <group position={[0, 2.55, 0]}>
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
          {/* Scan cone */}
          <mesh ref={scanLight} position={[0, -1.25, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.78, 1.75, 24, 1, true]} />
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
              <span className="block text-[7px] text-slate-400">VISION SENSOR · LIVE CLASSIFY</span>
              {cfg.icon} {cfg.label} ({cfg.confidence}) → {cfg.label} BIN
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

function VisionBins() {
  return Object.values(VISION_TYPES).map((item) => (
    <group key={item.type} position={[item.binX, -0.35, item.binZ]}>
      <mesh receiveShadow>
        <boxGeometry args={[1.18, 0.72, 1.15]} />
        <meshStandardMaterial color="#172235" roughness={0.58} />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[1.05, 0.06, 1.02]} />
        <meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={0.28} />
      </mesh>
      <Html position={[0, -0.58, 0.74]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div
          className="w-24 rounded border px-1.5 py-1 text-center font-mono text-[8px] font-bold tracking-wider"
          style={{ color: item.color, borderColor: item.color, background: '#07111eee' }}
        >
          {item.icon} {item.label} BIN
        </div>
      </Html>
    </group>
  ))
}

function VisionPipelineItem({ item, index }) {
  const groupRef = useRef()
  const wristPos = useMemo(() => new THREE.Vector3(), [])
  const targetCfg = VISION_TYPES[item.type]

  useSimulationFrame((elapsed) => {
    const localTime = (elapsed - index * STEP_TIME + TOTAL_LOOP * 1000) % TOTAL_LOOP

    if (localTime < STEP_TIME) {
      // 1. Moving along the conveyor from Hopper -> Scanner -> Pick Nest
      const progress = localTime / STEP_TIME
      groupRef.current.position.set(
        THREE.MathUtils.lerp(HOPPER_X, PICK_X, progress),
        BELT_ITEM_Y,
        0,
      )
      groupRef.current.rotation.set(0, index * 0.7, 0)
      return
    }

    if (localTime < STEP_TIME * 2) {
      // 2. In the Pick & Place window: picked up by robot wrist and placed into target bin slot
      const robotPhase = localTime - STEP_TIME
      if (robotPhase < 0.34) {
        // Waiting in the Pick Nest for gripper fingers to close
        groupRef.current.position.set(PICK_X, BELT_ITEM_Y, 0)
        groupRef.current.rotation.set(0, index * 0.7, 0)
      } else if (robotPhase < 2.26) {
        // Held tightly between the robot's left and right gripper fingers
        computeWristPose(robotPhase, targetCfg, item.slot, wristPos)
        groupRef.current.position.set(
          wristPos.x,
          wristPos.y - GRIPPER_HOLD_OFFSET_Y,
          wristPos.z,
        )
        groupRef.current.rotation.set(0, 0, 0)
      } else {
        // Released into its dedicated bin slot
        groupRef.current.position.set(
          targetCfg.binX + item.slot[0],
          BIN_ITEM_Y,
          targetCfg.binZ + item.slot[1],
        )
        groupRef.current.rotation.set(0, index * 0.5, 0)
      }
      return
    }

    // 3. Resting in its sorted bin slot
    groupRef.current.position.set(
      targetCfg.binX + item.slot[0],
      BIN_ITEM_Y,
      targetCfg.binZ + item.slot[1],
    )
    groupRef.current.rotation.set(0, index * 0.5, 0)
  })

  return (
    <group ref={groupRef}>
      <Shape type={item.type} color={targetCfg.color} />
    </group>
  )
}

export function VisionSorterScene({ activePreset = 'overview' }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[8.6, 6.8, 10.6]} fov={38} />
      <color attach="background" args={['#070d18']} />
      <fog attach="fog" args={['#070d18', 13, 26]} />
      <ambientLight intensity={0.5} />
      <directionalLight castShadow position={[4, 9, 6]} intensity={2.1} shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-3, 3, 2]} color="#22d3ee" intensity={12} distance={10} />
      <pointLight position={[3.5, 3, 0]} color="#a855f7" intensity={10} distance={9} />

      <VisionFeedHopper />
      <Conveyor position={[-1.95, 0.08, 0]} length={6.2} speed={1.2} />
      <PickNestStopGate />
      <VisionGantryAndScanner />
      <VisionRobot />
      <VisionBins />

      {VISION_ITEMS.map((item, index) => (
        <VisionPipelineItem key={item.id} item={item} index={index} />
      ))}

      <gridHelper args={[24, 24, '#1e3a5f', '#111c2e']} position={[0, -0.6, 0]} />
      <CameraRig activePreset={activePreset} />
    </>
  )
}
