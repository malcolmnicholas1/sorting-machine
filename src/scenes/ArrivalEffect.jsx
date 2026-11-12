import { Html, OrbitControls, PerspectiveCamera, Sparkles } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Conveyor } from '../components/Conveyor.jsx'
import { Shape } from '../components/Shape.jsx'
import { useSimulationFrame } from '../components/useSimulationFrame.js'

const CAMERA_PRESETS = {
  overview: { position: [0.8, 6.2, 13.4], target: [0.5, 1.3, 0.1] },
  portal: { position: [-2.2, 3.6, 5.4], target: [-0.35, 1.4, -1.1] },
  spill: { position: [-1.4, 3.4, 5.8], target: [-1.1, 0.8, 0.35] },
  hopper: { position: [0.8, 3.5, 5.4], target: [1.65, 1.2, 0.15] },
  sorter: { position: [5.2, 4.6, 7.2], target: [4.35, 1.3, 0.15] },
}

const CYCLE_DURATION = 28.0

const STORY_BEATS = [
  {
    until: 3.2,
    code: 'BEAT 01 · ROUTINE DELIVERY',
    title: 'Carrying shapes through the workshop',
    color: '#38bdf8',
  },
  {
    until: 4.1,
    code: 'BEAT 02 · TEMPORAL BREACH',
    title: 'Wormhole opens & Time Traveler arrives',
    color: '#a855f7',
  },
  {
    until: 6.2,
    code: 'BEAT 03 · STARTLED SPILL!',
    title: 'Shockwave startles carrier — shapes scatter!',
    color: '#ef4444',
  },
  {
    until: 11.4,
    code: 'BEAT 04 · GATHER & RECOVER',
    title: 'Main character picks up all spilled shapes',
    color: '#f59e0b',
  },
  {
    until: 12.8,
    code: 'BEAT 05 · LOADING THE SORTER',
    title: 'Dumping mixed shapes into the infeed hopper',
    color: '#22d3ee',
  },
  {
    until: 19.2,
    code: 'BEAT 06 · SORTING MACHINE ACTIVE',
    title: 'Machine sorts every recovered shape into bins',
    color: '#3b82f6',
  },
  {
    until: 23.6,
    code: 'BEAT 07 · SEALING THE WORMHOLE',
    title: 'Sorted shapes channel harmonic energy to close the rift!',
    color: '#c084fc',
  },
  {
    until: CYCLE_DURATION,
    code: 'BEAT 08 · TIMELINE RESTORED!',
    title: 'Wormhole sealed — everyone celebrates!',
    color: '#22c55e',
  },
]

const BIN_CONFIG = {
  sphere: { color: '#22c55e', label: 'SPHERES', icon: '●', binX: 5.75, binZ: -1.65, platterY: 2.85 },
  cube: { color: '#ef4444', label: 'CUBES', icon: '■', binX: 5.75, binZ: -0.55, platterY: 2.15 },
  pyramid: { color: '#3b82f6', label: 'PYRAMIDS', icon: '▲', binX: 5.75, binZ: 0.55, platterY: 1.45 },
  unsorted: { color: '#f59e0b', label: 'UNSORTED', icon: '↻', binX: 5.75, binZ: 1.65, platterY: 0.75 },
}

const PORTAL_POS = { x: -0.35, y: 1.55, z: -1.65 }

const SPILL_ITEMS = [
  { id: 0, type: 'sphere', scatterX: -1.35, scatterZ: -0.15, slotOffset: [-0.18, -0.14] },
  { id: 1, type: 'cube', scatterX: -0.68, scatterZ: 0.22, slotOffset: [-0.18, -0.14] },
  { id: 2, type: 'pyramid', scatterX: -1.12, scatterZ: 0.85, slotOffset: [-0.18, -0.14] },
  { id: 3, type: 'unsorted', scatterX: -0.32, scatterZ: 0.72, slotOffset: [-0.18, -0.14] },
  { id: 4, type: 'sphere', scatterX: -0.82, scatterZ: -0.32, slotOffset: [0.18, 0.14] },
  { id: 5, type: 'cube', scatterX: -1.48, scatterZ: 0.52, slotOffset: [0.18, 0.14] },
  { id: 6, type: 'pyramid', scatterX: -0.45, scatterZ: -0.12, slotOffset: [0.18, 0.14] },
  { id: 7, type: 'unsorted', scatterX: -0.78, scatterZ: 1.08, slotOffset: [0.18, 0.14] },
]

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
      target={[0.5, 1.3, 0.1]}
      minDistance={4.5}
      maxDistance={22}
      maxPolarAngle={Math.PI / 2.02}
    />
  )
}

/**
 * Reusable articulated character with 2 hip-pivoted legs (with attached shoes),
 * torso pitch group (bodyRef), head group, and shoulder-pivoted arms.
 * Local +Z is forward; rotation.y = Math.PI / 2 faces +X.
 */
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
        {/* Torso */}
        <mesh position={[0, 0.34, 0]} castShadow>
          <capsuleGeometry args={[0.25, 0.52, 4, 10]} />
          <meshStandardMaterial color={shirt} roughness={0.48} />
        </mesh>

        {/* Time Traveler glowing chrono-emblem & collar */}
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

        {/* Head */}
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

        {/* Left & Right Arms (extending forward along +Z when rotation.x = 0) */}
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

      {/* Hip-pivoted Left & Right Legs with attached shoes */}
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

function MainCharacterCarrier() {
  const figure = useRef()
  const body = useRef()
  const head = useRef()
  const leftArm = useRef()
  const rightArm = useRef()
  const leftLeg = useRef()
  const rightLeg = useRef()

  useSimulationFrame((elapsed) => {
    const phase = elapsed % CYCLE_DURATION
    let x = -4.6
    let y = 0
    let z = 0.35
    let yaw = Math.PI / 2 // Facing +X
    let bodyPitch = 0
    let leftArmPitch = 0.15
    let rightArmPitch = 0.15
    let isWalking = false
    let walkSpeed = 7.5

    if (phase < 3.2) {
      // Beat 1: Walk in from left carrying crate
      const t = phase / 3.2
      x = THREE.MathUtils.lerp(-4.6, -2.25, t)
      isWalking = true
    } else if (phase < 3.9) {
      // Beat 2: Stop and glance toward the opening wormhole
      const t = (phase - 3.2) / 0.7
      x = -2.25
      yaw = THREE.MathUtils.lerp(Math.PI / 2, Math.PI * 0.68, t)
    } else if (phase < 6.0) {
      // Beat 3: Startled by temporal shockwave -> jump back and fling arms up, spilling crate!
      const t = THREE.MathUtils.clamp((phase - 3.9) / 0.65, 0, 1)
      const hop = phase < 4.55 ? Math.sin(((phase - 3.9) / 0.65) * Math.PI) * 0.28 : 0
      x = THREE.MathUtils.lerp(-2.25, -2.65, t)
      y = hop
      yaw = Math.PI * 0.62
      const recover = THREE.MathUtils.clamp((phase - 5.1) / 0.9, 0, 1)
      bodyPitch = THREE.MathUtils.lerp(-0.28, 0, recover)
      const arm = THREE.MathUtils.lerp(-1.35, 0.2, recover)
      leftArmPitch = arm
      rightArmPitch = arm
    } else if (phase < 9.5) {
      // Beat 4: Step up to spill zone and bend down 3 times to scoop up all spilled shapes into the crate
      const walkIn = THREE.MathUtils.clamp((phase - 6.0) / 0.7, 0, 1)
      x = THREE.MathUtils.lerp(-2.65, -1.82, walkIn)
      yaw = Math.PI / 2
      isWalking = phase < 6.7
      if (phase >= 6.7) {
        const gatherWave = Math.sin(((phase - 6.7) / 2.8) * Math.PI * 3)
        const bend = Math.max(0, gatherWave)
        bodyPitch = bend * 0.58
        leftArmPitch = 0.25 + bend * 0.48
        rightArmPitch = 0.25 + bend * 0.48
        yaw = Math.PI / 2 + Math.sin((phase - 6.7) * 2.2) * 0.22
      }
    } else if (phase < 11.4) {
      // Beat 5A: Carry the refilled crate over to the Sorting Machine Infeed Hopper
      const t = (phase - 9.5) / 1.9
      x = THREE.MathUtils.lerp(-1.82, 1.05, t)
      z = THREE.MathUtils.lerp(0.35, 0.15, t)
      yaw = Math.PI / 2
      leftArmPitch = 0.12
      rightArmPitch = 0.12
      isWalking = true
      walkSpeed = 9.0
    } else if (phase < 12.8) {
      // Beat 5B: Lift and tip the crate into the Sorting Machine Hopper
      const t = (phase - 11.4) / 1.4
      const liftArc = Math.sin(t * Math.PI)
      x = 1.05
      z = 0.15
      yaw = Math.PI / 2
      bodyPitch = -liftArc * 0.15
      leftArmPitch = 0.12 - liftArc * 0.68
      rightArmPitch = 0.12 - liftArc * 0.68
    } else if (phase < 19.2) {
      // Beat 6: Step back slightly and watch the Sorting Machine sort all the shapes
      const stepBack = THREE.MathUtils.clamp((phase - 12.8) / 0.8, 0, 1)
      x = THREE.MathUtils.lerp(1.05, 0.65, stepBack)
      z = THREE.MathUtils.lerp(0.15, 0.65, stepBack)
      yaw = Math.PI * 0.45
      leftArmPitch = 0.45
      rightArmPitch = 0.45
      isWalking = phase < 13.6
    } else if (phase < 23.6) {
      // Beat 7: Turn toward the Wormhole and channel the sorted shapes to seal the rift!
      const turnT = THREE.MathUtils.clamp((phase - 19.2) / 0.8, 0, 1)
      x = THREE.MathUtils.lerp(0.65, -0.35, turnT * 0.4)
      z = 0.65
      yaw = THREE.MathUtils.lerp(Math.PI * 0.45, Math.PI * 0.92, turnT)
      leftArmPitch = -0.65 + Math.sin(elapsed * 4) * 0.12
      rightArmPitch = -0.75 - Math.sin(elapsed * 4) * 0.12
    } else {
      // Beat 8: Wormhole is closed! Jump for joy and wave both arms in celebration!
      x = -0.55
      z = 0.65
      const cheerWave = Math.abs(Math.sin((phase - 23.6) * 5.2))
      y = cheerWave * 0.3
      yaw = Math.sin((phase - 23.6) * 2.5) * 0.35
      bodyPitch = -0.08
      leftArmPitch = -1.45 + Math.sin((phase - 23.6) * 10) * 0.25
      rightArmPitch = -1.45 - Math.sin((phase - 23.6) * 10) * 0.25
    }

    figure.current.position.set(x, y, z)
    figure.current.rotation.set(0, yaw, 0)
    body.current.rotation.x = bodyPitch
    head.current.rotation.z = phase >= 3.9 && phase < 5.4 ? 0.22 : 0
    leftArm.current.rotation.x = leftArmPitch
    rightArm.current.rotation.x = rightArmPitch

    const stride = isWalking ? Math.sin(phase * walkSpeed) * 0.48 : 0
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
      shirt="#f97316"
      pants="#1e3a8a"
      hairColor="#713f12"
    />
  )
}

function TimeTravelerVisitor() {
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

    const emerge = THREE.MathUtils.clamp((phase - 3.1) / 1.4, 0, 1)
    const walkToSorter = THREE.MathUtils.clamp((phase - 9.8) / 2.0, 0, 1)
    const walkToCenter = THREE.MathUtils.clamp((phase - 19.2) / 1.2, 0, 1)

    const x = THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(-0.35, 0.35, walkToSorter),
      0.45,
      walkToCenter,
    )
    const z = THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(-1.55, -0.65, emerge),
      0.45,
      walkToCenter,
    )

    let y = 0
    let yaw = THREE.MathUtils.lerp(-0.48, Math.PI * 0.38, walkToSorter)
    let leftArmPitch = 0.35
    let rightArmPitch = -0.35

    if (phase >= 5.8 && phase < 19.2) {
      rightArmPitch = -0.45 + Math.sin(elapsed * 3.2) * 0.15
    } else if (phase >= 19.2 && phase < 23.6) {
      // Channeling the sorted shapes to close the wormhole alongside the main character
      yaw = -Math.PI * 0.82
      leftArmPitch = -0.85 + Math.sin(elapsed * 5) * 0.15
      rightArmPitch = -0.85 - Math.sin(elapsed * 5) * 0.15
    } else if (phase >= 23.6) {
      // Celebrating with the main character once the wormhole is closed!
      const cheerWave = Math.abs(Math.sin((phase - 23.6) * 5.2 + 0.8))
      y = cheerWave * 0.28
      yaw = -Math.sin((phase - 23.6) * 2.5) * 0.35
      leftArmPitch = -1.42 - Math.sin((phase - 23.6) * 10) * 0.25
      rightArmPitch = -1.42 + Math.sin((phase - 23.6) * 10) * 0.25
    }

    figure.current.position.set(x, y, z)
    figure.current.rotation.set(0, yaw, 0)
    figure.current.scale.setScalar(0.65 + emerge * 0.35)

    const isWalking =
      (phase >= 3.1 && phase < 4.5) ||
      (phase >= 9.8 && phase < 11.8) ||
      (phase >= 19.2 && phase < 20.4)
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

function WormholeAndShockwave() {
  const portal = useRef()
  const inner = useRef()
  const outerRing = useRef()
  const middleRing = useRef()
  const shockwaveRef = useRef()
  const sealFlashRef = useRef()
  const padRingRef = useRef()

  useSimulationFrame((elapsed, dt) => {
    const phase = elapsed % CYCLE_DURATION
    // Opens at 2.0..3.2s; shrinks and seals shut between 21.6s and 23.4s as the sorted shapes converge!
    const open =
      phase < 21.6
        ? THREE.MathUtils.clamp((phase - 2.0) / 1.2, 0, 1)
        : THREE.MathUtils.clamp((23.4 - phase) / 1.8, 0, 1)

    const spinBoost = phase >= 19.4 && phase < 23.6 ? 4.2 : 1.0
    portal.current.scale.setScalar(Math.max(0.001, open))
    portal.current.visible = open > 0.005
    outerRing.current.rotation.z += dt * 0.75 * spinBoost
    middleRing.current.rotation.z -= dt * 1.15 * spinBoost
    inner.current.material.opacity = 0.55 + Math.sin(elapsed * 4.0) * 0.15

    // Pad ring turns calm emerald green once the wormhole is sealed (phase >= 23.4s)
    if (padRingRef.current) {
      padRingRef.current.material.color.set(phase >= 23.4 ? '#22c55e' : '#a855f7')
    }

    // Expanding temporal shockwave ring on arrival (phase 3.4s..5.3s)
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

    // Harmonic sealing burst when the sorted shapes close the wormhole (phase 22.4s..24.4s)
    if (sealFlashRef.current) {
      const sealActive = phase >= 22.4 && phase <= 24.4
      sealFlashRef.current.visible = sealActive
      if (sealActive) {
        const sealT = (phase - 22.4) / 2.0
        const scale = 0.25 + sealT * 3.2
        sealFlashRef.current.scale.set(scale, scale, 1)
        sealFlashRef.current.material.opacity = (1 - sealT) * 0.85
      }
    }
  })

  return (
    <group position={[PORTAL_POS.x, 0, PORTAL_POS.z]}>
      {/* Chrono-Portal Floor Pad */}
      <mesh position={[0, -0.03, 0]} receiveShadow>
        <cylinderGeometry args={[1.35, 1.48, 0.1, 32]} />
        <meshStandardMaterial color="#1e1b4b" metalness={0.75} roughness={0.3} />
      </mesh>
      <mesh ref={padRingRef} position={[0, 0.025, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.32, 0.035, 8, 48]} />
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
  )
}

function CrateAndShapes() {
  const boxRef = useRef()
  const flapRef = useRef()
  const itemRefs = useRef([])

  useSimulationFrame((elapsed, dt) => {
    const phase = elapsed % CYCLE_DURATION

    // 1. Crate position & orientation across all 8 story beats
    let boxX = -4.0
    let boxY = 1.05
    let boxZ = 0.35
    let rotX = 0
    let rotZ = 0
    let flapAngle = 0

    if (phase < 3.2) {
      const t = phase / 3.2
      boxX = THREE.MathUtils.lerp(-4.0, -1.65, t)
    } else if (phase < 3.9) {
      boxX = -1.65
    } else if (phase < 6.0) {
      // Dropped and tipped forward onto the spill zone floor
      const dropT = THREE.MathUtils.clamp((phase - 3.9) / 0.55, 0, 1)
      boxX = THREE.MathUtils.lerp(-1.65, -1.25, dropT)
      boxY = THREE.MathUtils.lerp(1.05, 0.22, dropT)
      rotZ = -dropT * 1.12
      flapAngle = -dropT * 0.85
    } else if (phase < 9.5) {
      // Uprighted on the floor while the main character scoops shapes back into it
      const rightT = THREE.MathUtils.clamp((phase - 6.0) / 0.6, 0, 1)
      const liftT = THREE.MathUtils.clamp((phase - 8.9) / 0.6, 0, 1)
      boxX = -1.25
      boxY = THREE.MathUtils.lerp(0.16, 1.05, liftT)
      rotZ = THREE.MathUtils.lerp(-1.12, 0, rightT)
      flapAngle = THREE.MathUtils.lerp(-0.85, 0, rightT)
    } else if (phase < 11.4) {
      // Carried over to the Sorting Machine Infeed Hopper
      const t = (phase - 9.5) / 1.9
      boxX = THREE.MathUtils.lerp(-1.25, 1.62, t)
      boxY = 1.08
      boxZ = THREE.MathUtils.lerp(0.35, 0.15, t)
    } else if (phase < 12.8) {
      // Lifted and tipped into the Sorting Machine Hopper at (2.05, 1.15, 0.15)
      const t = (phase - 11.4) / 1.4
      const dumpArc = Math.sin(t * Math.PI)
      boxX = 1.62 + dumpArc * 0.22
      boxY = 1.08 + dumpArc * 0.34
      boxZ = 0.15
      rotZ = -dumpArc * 1.18
      flapAngle = -dumpArc * 0.9
    } else {
      // Placed neatly on the workshop floor beside the hopper while watching sorting & celebrating
      const t = THREE.MathUtils.clamp((phase - 12.8) / 0.8, 0, 1)
      boxX = THREE.MathUtils.lerp(1.62, 1.25, t)
      boxY = THREE.MathUtils.lerp(1.08, 0.05, t)
      boxZ = THREE.MathUtils.lerp(0.15, -0.85, t)
    }

    boxRef.current.position.set(boxX, boxY, boxZ)
    boxRef.current.rotation.set(rotX, 0, rotZ)
    flapRef.current.rotation.z = flapAngle

    // 2. Individual shape trajectories across all 8 beats
    SPILL_ITEMS.forEach((item, index) => {
      const node = itemRefs.current[index]
      if (!node) return
      node.visible = true
      node.scale.setScalar(1)

      const cfg = BIN_CONFIG[item.type]
      const col = (index % 4) - 1.5
      const row = Math.floor(index / 4) - 0.5
      const inCrateX = boxX + col * 0.22
      const inCrateY = boxY + 0.26
      const inCrateZ = boxZ + row * 0.24

      if (phase < 3.95) {
        // Beat 1–2: Nestled inside the crate
        node.position.set(inCrateX, inCrateY, inCrateZ)
        node.rotation.set(0, index * 0.5, 0)
        return
      }

      if (phase < 6.5) {
        // Beat 3: Parabolic bounce spill onto the floor scatter positions
        const spillT = THREE.MathUtils.clamp((phase - 3.95 - index * 0.05) / 1.15, 0, 1)
        const bounce = Math.abs(Math.sin(spillT * Math.PI * 1.5)) * (1 - spillT * 0.65) * 0.75
        node.position.set(
          THREE.MathUtils.lerp(-1.45, item.scatterX, spillT),
          THREE.MathUtils.lerp(1.15, 0.22, spillT) + bounce,
          THREE.MathUtils.lerp(0.35, item.scatterZ, spillT),
        )
        node.rotation.set(spillT * 4, index + spillT * 5, spillT * 3)
        return
      }

      if (phase < 9.5) {
        // Beat 4: Scooped up one by one from the floor back into the upright crate
        const pickupStart = 6.55 + index * 0.28
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
        // Beat 5A: Carried inside the refilled crate to the Sorting Machine Hopper
        node.position.set(inCrateX, inCrateY, inCrateZ)
        node.rotation.set(0, index * 0.5, 0)
        return
      }

      const binDestX = cfg.binX + item.slotOffset[0]
      const binDestZ = cfg.binZ + item.slotOffset[1]

      if (phase < 19.3) {
        // Beat 5B & Beat 6: Poured into the Sorting Machine Hopper and sorted into the 4 collection bins
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

      if (phase < 23.5) {
        // Beat 7: Sorted shapes launch from their pure bins in a harmonic stream to seal the Wormhole!
        const flyStart = 19.35 + (index % 4) * 0.18 + Math.floor(index / 4) * 0.35
        const flyT = THREE.MathUtils.clamp((phase - flyStart) / 1.65, 0, 1)
        const convergeT = THREE.MathUtils.clamp((phase - 21.6) / 1.75, 0, 1)

        // Orbit nodes around the Wormhole perimeter before converging to seal the center
        const ringAngle = (index * Math.PI) / 4 + (phase - 19.3) * 3.2
        const ringRadius = THREE.MathUtils.lerp(1.05, 0.02, convergeT)
        const portalNodeX = PORTAL_POS.x + Math.cos(ringAngle) * ringRadius
        const portalNodeY = PORTAL_POS.y + Math.sin(ringAngle) * ringRadius
        const portalNodeZ = PORTAL_POS.z + 0.12

        const arcHeight = Math.sin(flyT * Math.PI) * 1.65
        node.position.set(
          THREE.MathUtils.lerp(binDestX, portalNodeX, flyT),
          THREE.MathUtils.lerp(0.18, portalNodeY, flyT) + arcHeight,
          THREE.MathUtils.lerp(binDestZ, portalNodeZ, flyT),
        )
        node.rotation.set(phase * 4, phase * 5, 0)
        node.scale.setScalar(THREE.MathUtils.lerp(1, 0.05, convergeT))
        return
      }

      // Beat 8: Wormhole is sealed; sorted shapes rest back in their collection bins as trophies!
      const appearT = THREE.MathUtils.clamp((phase - 23.6) / 0.6, 0, 1)
      node.position.set(binDestX, 0.18, binDestZ)
      node.scale.setScalar(appearT)
      node.rotation.set(0, elapsed * 1.5 + index * 0.4, 0)
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
      {/* Infeed Hopper at x = 2.05, z = 0.15 */}
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

      {/* Incline Conveyor from Hopper up to Rotary Sorter Tower */}
      <Conveyor position={[3.08, 1.88, 0.15]} length={2.95} rotation={[0, 0, 0.74]} speed={1.25} />

      {/* 4-Level Rotary Sorter Tower at x = 4.25, z = 0.15 */}
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
            <span className="text-emerald-300">● HARMONIC SORTER</span>
          </div>
        </Html>
      </group>

      {/* 4 Color-Coded Chutes & Collection Bins */}
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
    <Html position={[-0.35, 3.35, 0.4]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
      <div
        className="w-64 rounded-xl border bg-slate-950/90 px-3 py-2 text-center font-mono shadow-2xl"
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
      <PerspectiveCamera makeDefault position={[0.8, 6.2, 13.4]} fov={38} />
      <color attach="background" args={['#090b19']} />
      <fog attach="fog" args={['#090b19', 15, 29]} />
      <ambientLight intensity={0.54} />
      <directionalLight castShadow position={[3, 9, 7]} intensity={2.2} shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-0.3, 2.0, -1.2]} color="#8b5cf6" intensity={20} distance={8} />
      <pointLight position={[-2.5, 2.2, 2]} color="#fb923c" intensity={9} distance={7} />
      <pointLight position={[4.2, 3.2, 1.5]} color="#22d3ee" intensity={14} distance={9} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, -0.08, 0]} receiveShadow>
        <planeGeometry args={[26, 18]} />
        <meshStandardMaterial color="#111827" roughness={0.9} />
      </mesh>
      <gridHelper args={[24, 24, '#34245f', '#1b1c31']} position={[0.5, -0.065, 0]} />

      {/* Floor Spill Zone Marker */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.95, -0.05, 0.35]}>
        <ringGeometry args={[1.05, 1.12, 36]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      <WormholeAndShockwave />
      <MainCharacterCarrier />
      <TimeTravelerVisitor />
      <CrateAndShapes />
      <WorkshopSortingMachine />
      <StoryBeatBanner />

      <CameraRig activePreset={activePreset} />
    </>
  )
}
