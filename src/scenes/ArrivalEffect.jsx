import { Html, OrbitControls, PerspectiveCamera, Sparkles } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Conveyor } from '../components/Conveyor.jsx'
import { Shape } from '../components/Shape.jsx'
import { useSimulationFrame } from '../components/useSimulationFrame.js'

const CAMERA_PRESETS = {
  overview: { position: [0.8, 6.6, 13.8], target: [0.6, 1.2, 0.0] },
  portal: { position: [-1.8, 3.8, 5.2], target: [-0.35, 1.3, -1.4] },
  spill: { position: [-1.4, 3.6, 6.0], target: [-1.2, 0.8, 0.35] },
  hopper: { position: [0.8, 3.6, 5.6], target: [1.65, 1.2, 0.15] },
  sorter: { position: [5.6, 4.8, 7.6], target: [4.6, 1.1, 0.15] },
}

const CYCLE_DURATION = 32.0

const STORY_BEATS = [
  {
    until: 3.2,
    code: 'BEAT 01 · 4 BROS CARRY THE BOX',
    title: 'Four Team Time Bros walk together carrying the crate of shapes',
    color: '#38bdf8',
  },
  {
    until: 4.1,
    code: 'BEAT 02 · WORMHOLE BREACH',
    title: '5th Time Bro (Influential Character) arrives through the wormhole!',
    color: '#a855f7',
  },
  {
    until: 6.3,
    code: 'BEAT 03 · STARTLED SPILL!',
    title: 'The 4 carriers jump back and drop the box — shapes scatter!',
    color: '#ef4444',
  },
  {
    until: 11.4,
    code: 'BEAT 04 · GATHER & CARRY TO SORTER',
    title: 'All 4 teammates pick up the spilled shapes and carry the box to the machine',
    color: '#f59e0b',
  },
  {
    until: 12.8,
    code: 'BEAT 05 · LOADING THE SORTER',
    title: 'The 4 teammates dump the mixed shapes into the infeed hopper',
    color: '#22d3ee',
  },
  {
    until: 19.2,
    code: 'BEAT 06 · SORTING INTO 4 BINS',
    title: 'Machine sorts the shapes while the 4 teammates move to the collection bins',
    color: '#3b82f6',
  },
  {
    until: 26.2,
    code: 'BEAT 07 · COLLECT & PLACE AROUND PORTAL',
    title: 'The 4 teammates carry sorted shapes from the bins to the portal to seal the wormhole!',
    color: '#c084fc',
  },
  {
    until: CYCLE_DURATION,
    code: 'BEAT 08 · WORMHOLE CLOSED — DANCE PARTY!',
    title: 'All 5 Team Time Bros dance and celebrate together!',
    color: '#22c55e',
  },
]

const PORTAL_POS = { x: -0.35, y: 1.55, z: -1.75 }

// 4 Workshop Teammates (each matched to one of the 4 sorted shape bins & portal pedestals)
const TEAMMATES = [
  {
    id: 0,
    name: 'BRO 01',
    type: 'sphere',
    shirt: '#22c55e',
    pants: '#14532d',
    hair: '#451a03',
    // Offset relative to crate center when the 4 teammates carry the crate together
    carryOffset: [-0.46, -0.44],
    binStand: [6.48, -1.65],
    portalStand: [-1.72, -1.45],
    pedestalPos: [-1.42, 0.36, -1.55],
    dancePos: [-2.1, 0.55],
  },
  {
    id: 1,
    name: 'BRO 02',
    type: 'cube',
    shirt: '#ef4444',
    pants: '#7f1d1d',
    hair: '#1c1917',
    carryOffset: [0.46, -0.44],
    binStand: [6.48, -0.55],
    portalStand: [-0.92, -0.52],
    pedestalPos: [-0.82, 0.36, -0.82],
    dancePos: [-1.05, 0.85],
  },
  {
    id: 2,
    name: 'BRO 03',
    type: 'pyramid',
    shirt: '#3b82f6',
    pants: '#1e3a8a',
    hair: '#713f12',
    carryOffset: [-0.46, 0.44],
    binStand: [6.48, 0.55],
    portalStand: [0.22, -0.52],
    pedestalPos: [0.12, 0.36, -0.82],
    dancePos: [1.05, 0.85],
  },
  {
    id: 3,
    name: 'BRO 04',
    type: 'unsorted',
    shirt: '#f97316',
    pants: '#1e293b',
    hair: '#78350f',
    carryOffset: [0.46, 0.44],
    binStand: [6.48, 1.65],
    portalStand: [1.02, -1.45],
    pedestalPos: [0.72, 0.36, -1.55],
    dancePos: [2.1, 0.55],
  },
]

const BIN_CONFIG = {
  sphere: {
    color: '#22c55e',
    label: 'SPHERES',
    icon: '●',
    binX: 5.75,
    binZ: -1.65,
    platterY: 2.85,
    teammateIndex: 0,
  },
  cube: {
    color: '#ef4444',
    label: 'CUBES',
    icon: '■',
    binX: 5.75,
    binZ: -0.55,
    platterY: 2.15,
    teammateIndex: 1,
  },
  pyramid: {
    color: '#3b82f6',
    label: 'PYRAMIDS',
    icon: '▲',
    binX: 5.75,
    binZ: 0.55,
    platterY: 1.45,
    teammateIndex: 2,
  },
  unsorted: {
    color: '#f59e0b',
    label: 'UNSORTED',
    icon: '↻',
    binX: 5.75,
    binZ: 1.65,
    platterY: 0.75,
    teammateIndex: 3,
  },
}

const SPILL_ITEMS = [
  { id: 0, type: 'sphere', scatterX: -1.45, scatterZ: -0.2, slotOffset: [-0.16, 0] },
  { id: 1, type: 'cube', scatterX: -0.68, scatterZ: -0.15, slotOffset: [-0.16, 0] },
  { id: 2, type: 'pyramid', scatterX: -1.35, scatterZ: 0.85, slotOffset: [-0.16, 0] },
  { id: 3, type: 'unsorted', scatterX: -0.55, scatterZ: 0.78, slotOffset: [-0.16, 0] },
  { id: 4, type: 'sphere', scatterX: -0.98, scatterZ: -0.35, slotOffset: [0.16, 0] },
  { id: 5, type: 'cube', scatterX: -1.52, scatterZ: 0.42, slotOffset: [0.16, 0] },
  { id: 6, type: 'pyramid', scatterX: -0.42, scatterZ: 0.22, slotOffset: [0.16, 0] },
  { id: 7, type: 'unsorted', scatterX: -0.88, scatterZ: 1.05, slotOffset: [0.16, 0] },
]

/**
 * Computes one of the 4 Workshop Teammates' world position, yaw, torso bend, and arm pitch at phase ∈ [0, CYCLE_DURATION).
 * Also used by CrateAndShapes so held shapes lock directly to each teammate's hands during Beat 7!
 */
function getTeammatePose(member, phase) {
  const [ox, oz] = member.carryOffset
  const [binStandX, binStandZ] = member.binStand
  const [portalStandX, portalStandZ] = member.portalStand
  const [pedX, , pedZ] = member.pedestalPos
  const [danceX, danceZ] = member.dancePos

  // Shared crate center while the 4 teammates carry it together
  let crateX = -4.2
  let crateZ = 0.35
  if (phase < 3.2) {
    crateX = THREE.MathUtils.lerp(-4.2, -1.55, phase / 3.2)
  } else if (phase < 9.5) {
    crateX = -1.55
  } else if (phase < 11.4) {
    const t = (phase - 9.5) / 1.9
    crateX = THREE.MathUtils.lerp(-1.55, 1.35, t)
    crateZ = THREE.MathUtils.lerp(0.35, 0.15, t)
  } else {
    crateX = 1.35
    crateZ = 0.15
  }

  let x = crateX + ox
  let y = 0
  let z = crateZ + oz
  // Face inward toward the crate / forward along +X
  let yaw = Math.PI / 2 + (oz > 0 ? -0.25 : 0.25)
  let bodyPitch = 0
  let bodyRoll = 0
  let leftArmPitch = 0.12
  let rightArmPitch = 0.12
  let isWalking = false
  let walkSpeed = 7.5

  if (phase < 3.2) {
    // Beat 1: All 4 walk in carrying the shared crate together
    isWalking = true
  } else if (phase < 4.0) {
    // Beat 2: Stop and look toward the opening wormhole
    const t = (phase - 3.2) / 0.8
    const lookYaw = Math.atan2(PORTAL_POS.x - x, PORTAL_POS.z - z)
    yaw = THREE.MathUtils.lerp(yaw, lookYaw, t)
  } else if (phase < 6.2) {
    // Beat 3: Startled jump back & drop the box!
    const jumpT = THREE.MathUtils.clamp((phase - 4.0) / 0.6, 0, 1)
    const hop = phase < 4.65 ? Math.sin(((phase - 4.0) / 0.65) * Math.PI) * 0.3 : 0
    x = crateX + ox * (1 + jumpT * 0.7) - jumpT * 0.25
    z = crateZ + oz * (1 + jumpT * 0.65)
    y = hop
    yaw = Math.atan2(PORTAL_POS.x - x, PORTAL_POS.z - z)
    const recover = THREE.MathUtils.clamp((phase - 5.2) / 0.9, 0, 1)
    bodyPitch = THREE.MathUtils.lerp(-0.28, 0, recover)
    const fling = THREE.MathUtils.lerp(-1.42, 0.2, recover)
    leftArmPitch = fling
    rightArmPitch = fling
  } else if (phase < 9.5) {
    // Beat 4A: Step around the spilled shapes and bend down to pick them up into the crate
    const stepIn = THREE.MathUtils.clamp((phase - 6.2) / 0.65, 0, 1)
    const startX = crateX + ox * 1.7 - 0.25
    const startZ = crateZ + oz * 1.65
    const gatherX = -1.25 + ox * 1.25
    const gatherZ = 0.35 + oz * 1.25
    x = THREE.MathUtils.lerp(startX, gatherX, stepIn)
    z = THREE.MathUtils.lerp(startZ, gatherZ, stepIn)
    yaw = Math.atan2(-1.05 - x, 0.35 - z)
    isWalking = phase < 6.85
    if (phase >= 6.85) {
      const wave = Math.sin(((phase - 6.85) / 2.6) * Math.PI * 2 + member.id * 0.6)
      const bend = Math.max(0, wave)
      bodyPitch = bend * 0.56
      leftArmPitch = 0.22 + bend * 0.48
      rightArmPitch = 0.22 + bend * 0.48
    }
  } else if (phase < 11.4) {
    // Beat 4B: All 4 carry the refilled box over to the Sorting Machine Hopper
    x = crateX + ox
    z = crateZ + oz
    yaw = Math.PI / 2 + (oz > 0 ? -0.22 : 0.22)
    isWalking = true
    walkSpeed = 8.8
  } else if (phase < 12.8) {
    // Beat 5: All 4 lift and tip the box into the Sorting Machine Infeed Hopper
    const t = (phase - 11.4) / 1.4
    const arc = Math.sin(t * Math.PI)
    x = crateX + ox
    z = crateZ + oz
    yaw = Math.atan2(2.05 - x, 0.15 - z)
    bodyPitch = -arc * 0.14
    leftArmPitch = 0.1 - arc * 0.62
    rightArmPitch = 0.1 - arc * 0.62
  } else if (phase < 19.2) {
    // Beat 6: Walk around the Sorting Machine to stand beside their assigned Collection Bin!
    const walkT = THREE.MathUtils.clamp((phase - 13.0) / 3.4, 0, 1)
    const smooth = walkT * walkT * (3 - 2 * walkT)
    // Detour slightly in Z so they walk cleanly around the sorter tower
    const midZ = oz < 0 ? -2.25 : 2.25
    const arcZ = Math.sin(smooth * Math.PI) * (midZ - (crateZ + oz)) * 0.55
    x = THREE.MathUtils.lerp(crateX + ox, binStandX, smooth)
    z = THREE.MathUtils.lerp(crateZ + oz, binStandZ, smooth) + arcZ
    yaw = walkT < 0.85 ? Math.PI / 2 : -Math.PI / 2 // Turn to face their bin (-X)
    leftArmPitch = 0.35
    rightArmPitch = 0.35
    isWalking = phase >= 13.0 && phase < 16.4
  } else if (phase < 20.6) {
    // Beat 7A: Bend over their assigned Collection Bin to collect the sorted shapes!
    const t = (phase - 19.2) / 1.4
    const bend = Math.sin(t * Math.PI)
    x = binStandX
    z = binStandZ
    yaw = -Math.PI / 2 // Facing bin at x = 5.75
    bodyPitch = bend * 0.48
    leftArmPitch = 0.15 + bend * 0.45
    rightArmPitch = 0.15 + bend * 0.45
  } else if (phase < 23.8) {
    // Beat 7B: Carry the collected sorted shapes from the bin over to the Wormhole Portal!
    const t = (phase - 20.6) / 3.2
    const smooth = t * t * (3 - 2 * t)
    const laneZ = member.id < 2 ? -2.35 : 2.25
    const detourZ = Math.sin(smooth * Math.PI) * (laneZ - binStandZ) * 0.45
    x = THREE.MathUtils.lerp(binStandX, portalStandX, smooth)
    z = THREE.MathUtils.lerp(binStandZ, portalStandZ, smooth) + detourZ
    yaw = Math.atan2(pedX - x, pedZ - z)
    leftArmPitch = 0.08 // Carrying sorted shapes in hands
    rightArmPitch = 0.08
    isWalking = true
    walkSpeed = 8.6
  } else if (phase < 26.2) {
    // Beat 7C: Place the sorted shapes onto the 4 Portal Pedestals & channel to close the Wormhole!
    const placeT = THREE.MathUtils.clamp((phase - 23.8) / 1.0, 0, 1)
    const bend = Math.sin(placeT * Math.PI)
    x = portalStandX
    z = portalStandZ
    yaw = Math.atan2(PORTAL_POS.x - x, PORTAL_POS.z - z)
    bodyPitch = bend * 0.42
    if (phase < 24.8) {
      leftArmPitch = 0.1 + bend * 0.45
      rightArmPitch = 0.1 + bend * 0.45
    } else {
      // Raise arms to channel sealing energy into the closing wormhole
      leftArmPitch = -0.75 + Math.sin(phase * 6) * 0.15
      rightArmPitch = -0.75 - Math.sin(phase * 6) * 0.15
    }
  } else {
    // Beat 8: Wormhole is closed! Gather in front and dance & celebrate with all 5 Team Time Bros!
    const gatherT = THREE.MathUtils.clamp((phase - 26.2) / 1.1, 0, 1)
    x = THREE.MathUtils.lerp(portalStandX, danceX, gatherT)
    z = THREE.MathUtils.lerp(portalStandZ, danceZ, gatherT)
    const danceTime = phase - 26.2
    const beatHop = Math.abs(Math.sin(danceTime * 6.2 + member.id * 0.9))
    y = beatHop * 0.3
    // Dance spin and sway facing the front/center
    yaw = Math.sin(danceTime * 3.1 + member.id) * 0.55
    bodyRoll = Math.sin(danceTime * 6.2 + member.id) * 0.14
    leftArmPitch = -1.45 + Math.sin(danceTime * 9.5 + member.id) * 0.32
    rightArmPitch = -1.45 - Math.sin(danceTime * 9.5 + member.id) * 0.32
    isWalking = gatherT < 1
  }

  // Hand world position in front of the teammate (used when carrying sorted shapes in Beat 7)
  const handDist = 0.48
  const handX = x + Math.sin(yaw) * handDist
  const handY = y + 1.06 - Math.sin( bodyPitch ) * 0.28
  const handZ = z + Math.cos(yaw) * handDist

  return {
    x,
    y,
    z,
    yaw,
    bodyPitch,
    bodyRoll,
    leftArmPitch,
    rightArmPitch,
    isWalking,
    walkSpeed,
    handX,
    handY,
    handZ,
  }
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
      target={[0.6, 1.2, 0.0]}
      minDistance={4.5}
      maxDistance={23}
      maxPolarAngle={Math.PI / 2.02}
    />
  )
}

function CharacterMesh({
  figureRef,
  bodyRef,
  headRef,
  leftArmRef,
  rightArmRef,
  leftLegRef,
  rightLegRef,
  shirt,
  pants,
  hairColor,
  isTimeTraveler = false,
}) {
  return (
    <group ref={figureRef}>
      <group ref={bodyRef} position={[0, 0.78, 0]}>
        <mesh position={[0, 0.34, 0]} castShadow>
          <capsuleGeometry args={[0.25, 0.52, 4, 10]} />
          <meshStandardMaterial color={shirt} roughness={0.48} />
        </mesh>

        {isTimeTraveler && (
          <>
            <mesh position={[0, 0.42, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.09, 0.09, 0.04, 16]} />
              <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={2.0} />
            </mesh>
            <mesh position={[0, 0.64, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.24, 0.045, 8, 24]} />
              <meshStandardMaterial color="#c084fc" emissive="#7c3aed" emissiveIntensity={0.8} />
            </mesh>
          </>
        )}

        <group ref={headRef} position={[0, 0.96, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.26, 24, 24]} />
            <meshStandardMaterial color="#f1c6a8" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.1, -0.02]}>
            <sphereGeometry args={[0.24, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
            <meshStandardMaterial color={hairColor} />
          </mesh>
          {isTimeTraveler ? (
            <mesh position={[0, 0.03, 0.22]}>
              <boxGeometry args={[0.32, 0.09, 0.08]} />
              <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={2.2} />
            </mesh>
          ) : (
            <>
              <mesh position={[0.085, 0.02, 0.23]}>
                <sphereGeometry args={[0.032, 8, 8]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
              <mesh position={[-0.085, 0.02, 0.23]}>
                <sphereGeometry args={[0.032, 8, 8]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
            </>
          )}
        </group>

        <group ref={leftArmRef} position={[-0.31, 0.58, 0]}>
          <mesh position={[0, -0.08, 0.24]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.095, 0.56, 12]} />
            <meshStandardMaterial color={shirt} />
          </mesh>
          <mesh position={[0, -0.08, 0.52]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial color="#f1c6a8" />
          </mesh>
        </group>

        <group ref={rightArmRef} position={[0.31, 0.58, 0]}>
          <mesh position={[0, -0.08, 0.24]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.095, 0.56, 12]} />
            <meshStandardMaterial color={shirt} />
          </mesh>
          <mesh position={[0, -0.08, 0.52]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial color="#f1c6a8" />
          </mesh>
        </group>
      </group>

      <group ref={leftLegRef} position={[-0.15, 0.78, 0]}>
        <mesh position={[0, -0.32, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.13, 0.62, 12]} />
          <meshStandardMaterial color={pants} />
        </mesh>
        <mesh position={[0, -0.66, 0.06]} castShadow>
          <boxGeometry args={[0.24, 0.14, 0.4]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
      </group>

      <group ref={rightLegRef} position={[0.15, 0.78, 0]}>
        <mesh position={[0, -0.32, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.13, 0.62, 12]} />
          <meshStandardMaterial color={pants} />
        </mesh>
        <mesh position={[0, -0.66, 0.06]} castShadow>
          <boxGeometry args={[0.24, 0.14, 0.4]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
      </group>
    </group>
  )
}

function WorkshopTeammate({ member }) {
  const figure = useRef()
  const body = useRef()
  const head = useRef()
  const leftArm = useRef()
  const rightArm = useRef()
  const leftLeg = useRef()
  const rightLeg = useRef()

  useSimulationFrame((elapsed) => {
    const phase = elapsed % CYCLE_DURATION
    const pose = getTeammatePose(member, phase)

    figure.current.position.set(pose.x, pose.y, pose.z)
    figure.current.rotation.set(0, pose.yaw, 0)
    body.current.rotation.set(pose.bodyPitch, 0, pose.bodyRoll)
    head.current.rotation.z = phase >= 4.0 && phase < 5.5 ? 0.22 : 0
    leftArm.current.rotation.x = pose.leftArmPitch
    rightArm.current.rotation.x = pose.rightArmPitch

    const stride = pose.isWalking ? Math.sin(phase * pose.walkSpeed + member.id * 1.1) * 0.48 : 0
    leftLeg.current.rotation.x = stride
    rightLeg.current.rotation.x = -stride
  })

  return (
    <CharacterMesh
      figureRef={figure}
      bodyRef={body}
      headRef={head}
      leftArmRef={leftArm}
      rightArmRef={rightArm}
      leftLegRef={leftLeg}
      rightLegRef={rightLeg}
      shirt={member.shirt}
      pants={member.pants}
      hairColor={member.hair}
    />
  )
}

function InfluentialTimeBroVisitor() {
  const figure = useRef()
  const body = useRef()
  const head = useRef()
  const leftArm = useRef()
  const rightArm = useRef()
  const leftLeg = useRef()
  const rightLeg = useRef()

  useSimulationFrame((elapsed) => {
    const phase = elapsed % CYCLE_DURATION
    const visible = phase >= 3.1
    figure.current.visible = visible
    if (!visible) return

    const emerge = THREE.MathUtils.clamp((phase - 3.1) / 1.3, 0, 1)
    const walkToSorter = THREE.MathUtils.clamp((phase - 9.8) / 2.0, 0, 1)
    const walkToPortal = THREE.MathUtils.clamp((phase - 20.6) / 2.4, 0, 1)
    const walkToDance = THREE.MathUtils.clamp((phase - 26.2) / 1.0, 0, 1)

    let x = THREE.MathUtils.lerp(-0.35, 0.35, walkToSorter)
    x = THREE.MathUtils.lerp(x, -0.35, walkToPortal)
    x = THREE.MathUtils.lerp(x, 0.0, walkToDance)

    let z = THREE.MathUtils.lerp(-1.55, -0.55, emerge)
    z = THREE.MathUtils.lerp(z, -0.95, walkToPortal)
    z = THREE.MathUtils.lerp(z, 0.95, walkToDance)

    let y = 0
    let yaw = THREE.MathUtils.lerp(-0.35, Math.PI * 0.38, walkToSorter)
    let bodyRoll = 0
    let leftArmPitch = 0.35
    let rightArmPitch = -0.35

    if (phase >= 5.8 && phase < 19.2) {
      rightArmPitch = -0.45 + Math.sin(elapsed * 3.2) * 0.15
    } else if (phase >= 19.2 && phase < 26.2) {
      // Guiding the 4 teammates to place the sorted shapes around the portal
      yaw = phase < 23.5 ? Math.PI * 0.25 : Math.PI
      leftArmPitch = -0.75 + Math.sin(elapsed * 5) * 0.15
      rightArmPitch = -0.75 - Math.sin(elapsed * 5) * 0.15
    } else if (phase >= 26.2) {
      // 5th Team Time Bro dancing center-stage with the other 4!
      const danceTime = phase - 26.2
      const beatHop = Math.abs(Math.sin(danceTime * 6.2))
      y = beatHop * 0.34
      yaw = Math.sin(danceTime * 3.4) * 0.65
      bodyRoll = Math.sin(danceTime * 6.2) * 0.16
      leftArmPitch = -1.5 + Math.sin(danceTime * 10) * 0.35
      rightArmPitch = -1.5 - Math.sin(danceTime * 10) * 0.35
    }

    figure.current.position.set(x, y, z)
    figure.current.rotation.set(0, yaw, 0)
    figure.current.scale.setScalar(0.65 + emerge * 0.35)
    body.current.rotation.set(0, 0, bodyRoll)

    const isWalking =
      (phase >= 3.1 && phase < 4.4) ||
      (phase >= 9.8 && phase < 11.8) ||
      (phase >= 20.6 && phase < 23.0) ||
      (phase >= 26.2 && phase < 27.2)
    const stride = isWalking ? Math.sin(phase * 7.5) * 0.42 : 0
    leftLeg.current.rotation.x = stride
    rightLeg.current.rotation.x = -stride
    leftArm.current.rotation.x = leftArmPitch
    rightArm.current.rotation.x = rightArmPitch
    head.current.rotation.y = Math.sin(elapsed * 2) * 0.12
  })

  return (
    <CharacterMesh
      figureRef={figure}
      bodyRef={body}
      headRef={head}
      leftArmRef={leftArm}
      rightArmRef={rightArm}
      leftLegRef={leftLeg}
      rightLegRef={rightLeg}
      shirt="#8b5cf6"
      pants="#312e81"
      hairColor="#4c1d95"
      isTimeTraveler
    />
  )
}

function WormholeAndPortalPedestals() {
  const portal = useRef()
  const inner = useRef()
  const outerRing = useRef()
  const middleRing = useRef()
  const shockwaveRef = useRef()
  const sealFlashRef = useRef()
  const padRingRef = useRef()

  useSimulationFrame((elapsed, dt) => {
    const phase = elapsed % CYCLE_DURATION
    // Opens at 2.0..3.2s; shrinks and seals shut between 24.4s and 26.1s once all 4 teammates place the sorted shapes!
    const open =
      phase < 24.4
        ? THREE.MathUtils.clamp((phase - 2.0) / 1.2, 0, 1)
        : THREE.MathUtils.clamp((26.1 - phase) / 1.7, 0, 1)

    const spinBoost = phase >= 23.6 && phase < 26.2 ? 4.5 : 1.0
    portal.current.scale.setScalar(Math.max(0.001, open))
    portal.current.visible = open > 0.005
    outerRing.current.rotation.z += dt * 0.75 * spinBoost
    middleRing.current.rotation.z -= dt * 1.15 * spinBoost
    inner.current.material.opacity = 0.55 + Math.sin(elapsed * 4.0) * 0.15

    if (padRingRef.current) {
      padRingRef.current.material.color.set(phase >= 26.0 ? '#22c55e' : '#a855f7')
    }

    if (shockwaveRef.current) {
      const waveActive = phase >= 3.4 && phase <= 5.3
      shockwaveRef.current.visible = waveActive
      if (waveActive) {
        const waveT = (phase - 3.4) / 1.9
        const scale = 0.4 + waveT * 3.6
        shockwaveRef.current.scale.set(scale, scale, 1)
        shockwaveRef.current.material.opacity = (1 - waveT) * 0.65
      }
    }

    if (sealFlashRef.current) {
      const sealActive = phase >= 25.0 && phase <= 27.2
      sealFlashRef.current.visible = sealActive
      if (sealActive) {
        const sealT = (phase - 25.0) / 2.2
        const scale = 0.25 + sealT * 3.4
        sealFlashRef.current.scale.set(scale, scale, 1)
        sealFlashRef.current.material.opacity = (1 - sealT) * 0.85
      }
    }
  })

  return (
    <group>
      <group position={[PORTAL_POS.x, 0, PORTAL_POS.z]}>
        {/* Chrono-Portal Floor Pad */}
        <mesh position={[0, -0.03, 0]} receiveShadow>
          <cylinderGeometry args={[1.45, 1.58, 0.1, 32]} />
          <meshStandardMaterial color="#1e1b4b" metalness={0.75} roughness={0.3} />
        </mesh>
        <mesh ref={padRingRef} position={[0, 0.025, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.42, 0.035, 8, 48]} />
          <meshBasicMaterial color="#a855f7" />
        </mesh>

        {/* Expanding Temporal Shockwave Ring */}
        <mesh ref={shockwaveRef} position={[0, 0.04, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.75, 0.92, 48]} />
          <meshBasicMaterial color="#c084fc" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>

        {/* Emerald Sealing Ring Flash when Wormhole Closes */}
        <mesh ref={sealFlashRef} position={[0, PORTAL_POS.y, 0.05]}>
          <ringGeometry args={[0.55, 0.82, 48]} />
          <meshBasicMaterial color="#34d399" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>

        {/* Wormhole Vortex */}
        <group ref={portal} position={[0, PORTAL_POS.y, 0]}>
          <mesh ref={inner} position={[0, 0, -0.02]}>
            <circleGeometry args={[0.92, 48]} />
            <meshBasicMaterial color="#160d36" transparent opacity={0.65} side={THREE.DoubleSide} />
          </mesh>
          <group ref={outerRing}>
            <mesh>
              <torusGeometry args={[1.06, 0.09, 16, 64]} />
              <meshStandardMaterial
                color="#8b5cf6"
                emissive="#7c3aed"
                emissiveIntensity={2.3}
                metalness={0.3}
              />
            </mesh>
          </group>
          <group ref={middleRing} scale={0.78}>
            <mesh>
              <torusGeometry args={[1.06, 0.055, 12, 64]} />
              <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={2.5} />
            </mesh>
          </group>
          <mesh rotation={[0, 0, Math.PI / 4]} scale={0.54}>
            <torusGeometry args={[1.06, 0.035, 10, 48]} />
            <meshBasicMaterial color="#f0abfc" />
          </mesh>
          <Sparkles count={42} scale={[2.8, 3.1, 0.5]} size={3} speed={0.8} color="#c4b5fd" />
        </group>
      </group>

      {/* 4 Harmonic Portal Pedestals where the 4 teammates place the sorted items to close the wormhole */}
      {TEAMMATES.map((member) => {
        const [px, , pz] = member.pedestalPos
        const color = BIN_CONFIG[member.type].color
        return (
          <group key={member.id} position={[px, 0, pz]}>
            <mesh position={[0, 0.12, 0]} receiveShadow>
              <cylinderGeometry args={[0.3, 0.36, 0.24, 20]} />
              <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.28, 0.025, 8, 24]} />
              <meshBasicMaterial color={color} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function CrateAndShapes() {
  const boxRef = useRef()
  const flapRef = useRef()
  const itemRefs = useRef([])

  useSimulationFrame((elapsed, dt) => {
    const phase = elapsed % CYCLE_DURATION

    // 1. Crate position & orientation
    let boxX = -4.2
    let boxY = 1.02
    let boxZ = 0.35
    let rotZ = 0
    let flapAngle = 0

    if (phase < 3.2) {
      boxX = THREE.MathUtils.lerp(-4.2, -1.55, phase / 3.2)
    } else if (phase < 4.0) {
      boxX = -1.55
    } else if (phase < 6.2) {
      // All 4 teammates drop the box onto the floor
      const dropT = THREE.MathUtils.clamp((phase - 4.0) / 0.55, 0, 1)
      boxX = THREE.MathUtils.lerp(-1.55, -1.25, dropT)
      boxY = THREE.MathUtils.lerp(1.02, 0.22, dropT)
      rotZ = -dropT * 1.12
      flapAngle = -dropT * 0.85
    } else if (phase < 9.5) {
      // Uprighted while the 4 teammates scoop the spilled shapes back into it
      const rightT = THREE.MathUtils.clamp((phase - 6.2) / 0.6, 0, 1)
      const liftT = THREE.MathUtils.clamp((phase - 8.9) / 0.6, 0, 1)
      boxX = -1.25
      boxY = THREE.MathUtils.lerp(0.16, 1.02, liftT)
      rotZ = THREE.MathUtils.lerp(-1.12, 0, rightT)
      flapAngle = THREE.MathUtils.lerp(-0.85, 0, rightT)
    } else if (phase < 11.4) {
      // Carried by all 4 teammates to the Sorting Machine Hopper
      const t = (phase - 9.5) / 1.9
      boxX = THREE.MathUtils.lerp(-1.25, 1.55, t)
      boxY = 1.05
      boxZ = THREE.MathUtils.lerp(0.35, 0.15, t)
    } else if (phase < 12.8) {
      // Tipped into the Sorting Machine Hopper
      const t = (phase - 11.4) / 1.4
      const dumpArc = Math.sin(t * Math.PI)
      boxX = 1.55 + dumpArc * 0.25
      boxY = 1.05 + dumpArc * 0.34
      boxZ = 0.15
      rotZ = -dumpArc * 1.18
      flapAngle = -dumpArc * 0.9
    } else {
      // Set down beside the hopper while sorting, portal sealing, and dancing take place
      const t = THREE.MathUtils.clamp((phase - 12.8) / 0.8, 0, 1)
      boxX = THREE.MathUtils.lerp(1.55, 1.35, t)
      boxY = THREE.MathUtils.lerp(1.05, 0.05, t)
      boxZ = THREE.MathUtils.lerp(0.15, -1.25, t)
    }

    boxRef.current.position.set(boxX, boxY, boxZ)
    boxRef.current.rotation.set(0, 0, rotZ)
    flapRef.current.rotation.z = flapAngle

    // Precompute the 4 teammates' hand positions for Beat 7 (carrying sorted items from bins to portal)
    const memberPoses = TEAMMATES.map((m) => getTeammatePose(m, phase))

    // 2. Individual shape trajectories across all 8 beats
    SPILL_ITEMS.forEach((item, index) => {
      const node = itemRefs.current[index]
      if (!node) return
      node.visible = true
      node.scale.setScalar(1)

      const cfg = BIN_CONFIG[item.type]
      const member = TEAMMATES[cfg.teammateIndex]
      const pose = memberPoses[cfg.teammateIndex]
      const pairOffset = index < 4 ? -0.14 : 0.14

      const col = (index % 4) - 1.5
      const row = Math.floor(index / 4) - 0.5
      const inCrateX = boxX + col * 0.22
      const inCrateY = boxY + 0.26
      const inCrateZ = boxZ + row * 0.24

      if (phase < 4.05) {
        // Beat 1–2: Inside the shared crate carried by the 4 teammates
        node.position.set(inCrateX, inCrateY, inCrateZ)
        node.rotation.set(0, index * 0.5, 0)
        return
      }

      if (phase < 6.5) {
        // Beat 3: Dropped and scattered across the Spill Zone
        const spillT = THREE.MathUtils.clamp((phase - 4.05 - index * 0.05) / 1.15, 0, 1)
        const bounce = Math.abs(Math.sin(spillT * Math.PI * 1.5)) * (1 - spillT * 0.65) * 0.75
        node.position.set(
          THREE.MathUtils.lerp(-1.45, item.scatterX, spillT),
          THREE.MathUtils.lerp(1.12, 0.22, spillT) + bounce,
          THREE.MathUtils.lerp(0.35, item.scatterZ, spillT),
        )
        node.rotation.set(spillT * 4, index + spillT * 5, spillT * 3)
        return
      }

      if (phase < 9.5) {
        // Beat 4A: Picked up by the 4 teammates and placed back into the crate
        const pickupStart = 6.6 + index * 0.27
        const pickupT = THREE.MathUtils.clamp((phase - pickupStart) / 0.55, 0, 1)
        const arc = Math.sin(pickupT * Math.PI) * 0.52
        node.position.set(
          THREE.MathUtils.lerp(item.scatterX, inCrateX, pickupT),
          THREE.MathUtils.lerp(0.22, inCrateY, pickupT) + arc,
          THREE.MathUtils.lerp(item.scatterZ, inCrateZ, pickupT),
        )
        node.rotation.set((1 - pickupT) * 2, index * 0.5, 0)
        return
      }

      if (phase < 11.7) {
        // Beat 4B: Carried inside the refilled crate to the Sorting Machine Hopper
        node.position.set(inCrateX, inCrateY, inCrateZ)
        node.rotation.set(0, index * 0.5, 0)
        return
      }

      const binDestX = cfg.binX + item.slotOffset[0]
      const binDestZ = cfg.binZ + item.slotOffset[1]

      if (phase < 19.6) {
        // Beat 5 & Beat 6: Sorted by the Sorting Machine into the 4 Collection Bins
        const sortStart = 11.75 + index * 0.52
        const sortElapsed = phase - sortStart

        if (sortElapsed < 0) {
          node.position.set(1.95 + col * 0.14, 1.15, 0.15 + row * 0.14)
        } else if (sortElapsed < 1.35) {
          const t = sortElapsed / 1.35
          node.position.set(
            THREE.MathUtils.lerp(2.05, 4.1, t),
            THREE.MathUtils.lerp(0.88, 2.95, t),
            0.15,
          )
          node.rotation.y -= dt * 3.5
        } else if (sortElapsed < 2.15) {
          const t = (sortElapsed - 1.35) / 0.8
          const angle = THREE.MathUtils.lerp(Math.PI, 0, t)
          node.position.set(
            4.25 + Math.cos(angle) * 0.45,
            THREE.MathUtils.lerp(2.95, cfg.platterY, t),
            0.15 + Math.sin(angle) * 0.45,
          )
          node.rotation.y -= dt * 4.5
        } else if (sortElapsed < 3.25) {
          const t = (sortElapsed - 2.15) / 1.1
          node.position.set(
            THREE.MathUtils.lerp(4.65, binDestX, t),
            THREE.MathUtils.lerp(cfg.platterY, 0.18, t),
            THREE.MathUtils.lerp(0.15, binDestZ, t),
          )
          node.rotation.z -= dt * 5.0
        } else {
          node.position.set(binDestX, 0.18, binDestZ)
          node.rotation.set(0, index * 0.4, 0)
        }
        return
      }

      const [pedX, pedY, pedZ] = member.pedestalPos

      if (phase < 20.6) {
        // Beat 7A: Teammate lifts their 2 sorted items out of their assigned Collection Bin
        const liftT = THREE.MathUtils.clamp((phase - 19.6) / 0.8, 0, 1)
        node.position.set(
          THREE.MathUtils.lerp(binDestX, pose.handX + pairOffset, liftT),
          THREE.MathUtils.lerp(0.18, pose.handY, liftT),
          THREE.MathUtils.lerp(binDestZ, pose.handZ, liftT),
        )
        node.rotation.set(0, index * 0.4, 0)
        return
      }

      if (phase < 23.8) {
        // Beat 7B: Teammate carries their sorted items in their hands over to the Portal Pedestal!
        node.position.set(pose.handX + pairOffset, pose.handY, pose.handZ)
        node.rotation.set(0, pose.yaw, 0)
        return
      }

      // Beat 7C & Beat 8: Placed onto the 4 Portal Pedestals around the Wormhole to seal it shut!
      const placeT = THREE.MathUtils.clamp((phase - 23.8) / 0.65, 0, 1)
      const targetPedX = pedX + pairOffset
      const targetPedY = pedY + (phase >= 24.5 && phase < 26.2 ? Math.sin(elapsed * 8) * 0.08 : 0)
      const targetPedZ = pedZ
      node.position.set(
        THREE.MathUtils.lerp(pose.handX + pairOffset, targetPedX, placeT),
        THREE.MathUtils.lerp(pose.handY, targetPedY, placeT),
        THREE.MathUtils.lerp(pose.handZ, targetPedZ, placeT),
      )
      node.rotation.set(0, elapsed * 2.2 + index, 0)
    })
  })

  return (
    <>
      <group ref={boxRef}>
        <mesh position={[0, 0.05, 0]} castShadow>
          <boxGeometry args={[0.96, 0.1, 0.82]} />
          <meshStandardMaterial color="#a16207" roughness={0.78} />
        </mesh>
        <mesh position={[0, 0.3, -0.37]} castShadow>
          <boxGeometry args={[0.96, 0.48, 0.08]} />
          <meshStandardMaterial color="#c0843c" roughness={0.78} />
        </mesh>
        <mesh position={[0, 0.3, 0.37]} castShadow>
          <boxGeometry args={[0.96, 0.48, 0.08]} />
          <meshStandardMaterial color="#c0843c" roughness={0.78} />
        </mesh>
        <mesh position={[-0.44, 0.3, 0]} castShadow>
          <boxGeometry args={[0.08, 0.48, 0.74]} />
          <meshStandardMaterial color="#d09a54" roughness={0.78} />
        </mesh>
        <mesh ref={flapRef} position={[0.44, 0.3, 0]} castShadow>
          <boxGeometry args={[0.08, 0.48, 0.74]} />
          <meshStandardMaterial color="#b77932" roughness={0.78} />
        </mesh>
      </group>
      {SPILL_ITEMS.map((item, index) => (
        <group
          key={item.id}
          ref={(node) => {
            itemRefs.current[index] = node
          }}
        >
          <Shape type={item.type} color={BIN_CONFIG[item.type].color} />
        </group>
      ))}
    </>
  )
}

function WorkshopSortingMachine() {
  const spindleRef = useRef()

  useSimulationFrame((_, dt) => {
    if (spindleRef.current) {
      spindleRef.current.rotation.y -= dt * 2.4
    }
  })

  return (
    <group>
      <group position={[2.05, 0.42, 0.15]}>
        <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.68, 0.38, 0.56, 6]} />
          <meshStandardMaterial color="#1e293b" metalness={0.65} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.67, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.67, 0.035, 8, 6]} />
          <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={0.45} />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.28, 0.36, 0.5, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.7} />
        </mesh>
      </group>

      <Conveyor position={[3.08, 1.88, 0.15]} length={2.95} rotation={[0, 0, 0.74]} speed={1.25} />

      <group position={[4.25, 0, 0.15]}>
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <cylinderGeometry args={[1.15, 1.25, 0.22, 32]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} />
        </mesh>
        <mesh ref={spindleRef} position={[0, 1.65, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 3.3, 16]} />
          <meshStandardMaterial color="#0ea5e9" metalness={0.8} roughness={0.25} />
        </mesh>
        {Object.values(BIN_CONFIG).map((cfg) => (
          <group key={cfg.label} position={[0, cfg.platterY - 0.15, 0]}>
            <mesh receiveShadow>
              <cylinderGeometry args={[0.82, 0.82, 0.11, 36]} />
              <meshStandardMaterial color="#334155" metalness={0.65} roughness={0.32} />
            </mesh>
            <mesh position={[0, 0.065, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.78, 0.025, 8, 36]} />
              <meshBasicMaterial color={cfg.color} />
            </mesh>
          </group>
        ))}
        <Html position={[0, 3.55, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div className="whitespace-nowrap rounded-lg border border-cyan-300/40 bg-slate-950/90 px-2.5 py-1 text-center font-mono text-[8px] tracking-wider text-cyan-200 shadow-xl">
            SORTING MACHINE
            <br />
            <span className="text-emerald-300">● 4 SORTED BINS</span>
          </div>
        </Html>
      </group>

      {Object.values(BIN_CONFIG).map((cfg) => {
        const startX = 4.65
        const startY = cfg.platterY - 0.15
        const startZ = 0.15
        const dx = cfg.binX - startX
        const dy = startY - 0.22
        const dz = cfg.binZ - startZ
        const horiz = Math.hypot(dx, dz)
        const len = Math.hypot(horiz, dy)
        const yaw = -Math.atan2(dz, dx)
        const pitch = -Math.atan2(dy, horiz)

        return (
          <group key={cfg.label}>
            <group
              position={[(startX + cfg.binX) / 2, (startY + 0.22) / 2, (startZ + cfg.binZ) / 2]}
              rotation={[0, yaw, 0]}
            >
              <mesh rotation={[0, 0, pitch]} receiveShadow>
                <boxGeometry args={[len, 0.08, 0.46]} />
                <meshStandardMaterial
                  color={cfg.color}
                  emissive={cfg.color}
                  emissiveIntensity={0.22}
                  metalness={0.45}
                />
              </mesh>
            </group>

            <group position={[cfg.binX, 0.18, cfg.binZ]}>
              <mesh receiveShadow>
                <boxGeometry args={[0.84, 0.52, 0.84]} />
                <meshStandardMaterial color="#182235" roughness={0.6} />
              </mesh>
              <mesh position={[0, 0.27, 0]}>
                <boxGeometry args={[0.74, 0.05, 0.74]} />
                <meshStandardMaterial color={cfg.color} emissive={cfg.color} emissiveIntensity={0.32} />
              </mesh>
              <Html position={[0, -0.44, 0.52]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
                <div
                  className="w-20 rounded border px-1 py-0.5 text-center font-mono text-[7px] font-bold tracking-wider"
                  style={{ background: `${cfg.color}22`, borderColor: cfg.color, color: cfg.color }}
                >
                  {cfg.icon} {cfg.label}
                </div>
              </Html>
            </group>
          </group>
        )
      })}
    </group>
  )
}

function StoryBeatBanner() {
  const beatIndexRef = useRef(0)
  const [beatIndex, setBeatIndex] = useState(0)

  useSimulationFrame((elapsed) => {
    const phase = elapsed % CYCLE_DURATION
    const nextIdx = STORY_BEATS.findIndex((b) => phase < b.until)
    const resolved = nextIdx === -1 ? 0 : nextIdx
    if (beatIndexRef.current !== resolved) {
      beatIndexRef.current = resolved
      setBeatIndex(resolved)
    }
  })

  const beat = STORY_BEATS[beatIndex]

  return (
    <Html position={[-0.35, 3.45, 0.4]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
      <div
        className="w-72 rounded-xl border bg-slate-950/90 px-3 py-2 text-center font-mono shadow-2xl"
        style={{ borderColor: `${beat.color}88` }}
      >
        <span className="block text-[8px] font-bold tracking-[0.2em]" style={{ color: beat.color }}>
          {beat.code}
        </span>
        <span className="mt-0.5 block text-[9px] text-slate-200">{beat.title}</span>
      </div>
    </Html>
  )
}

export function ArrivalEffectScene({ activePreset = 'overview' }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0.8, 6.6, 13.8]} fov={38} />
      <color attach="background" args={['#090b19']} />
      <fog attach="fog" args={['#090b19', 15, 29]} />
      <ambientLight intensity={0.54} />
      <directionalLight castShadow position={[3, 9, 7]} intensity={2.2} shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-0.3, 2.0, -1.2]} color="#8b5cf6" intensity={20} distance={8} />
      <pointLight position={[-2.5, 2.2, 2]} color="#fb923c" intensity={9} distance={7} />
      <pointLight position={[4.2, 3.2, 1.5]} color="#22d3ee" intensity={14} distance={9} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, -0.08, 0]} receiveShadow>
        <planeGeometry args={[28, 18]} />
        <meshStandardMaterial color="#111827" roughness={0.9} />
      </mesh>
      <gridHelper args={[26, 26, '#34245f', '#1b1c31']} position={[0.5, -0.065, 0]} />

      {/* Floor Spill Zone Marker */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.95, -0.05, 0.35]}>
        <ringGeometry args={[1.05, 1.12, 36]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      <WormholeAndPortalPedestals />
      {TEAMMATES.map((member) => (
        <WorkshopTeammate key={member.id} member={member} />
      ))}
      <InfluentialTimeBroVisitor />
      <CrateAndShapes />
      <WorkshopSortingMachine />
      <StoryBeatBanner />

      <CameraRig activePreset={activePreset} />
    </>
  )
}
