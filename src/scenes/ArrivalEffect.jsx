import { Html, OrbitControls, PerspectiveCamera, Sparkles } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'
import { Shape } from '../components/Shape.jsx'
import { useSimulationFrame } from '../components/useSimulationFrame.js'

const SPILL_ITEMS = Array.from({ length: 9 }, (_, index) => ({
  type: ['sphere', 'cube', 'pyramid'][index % 3],
  color: ['#22c55e', '#ef4444', '#3b82f6'][index % 3],
  index,
}))

function ArrivalPerson({ influential }) {
  const figure = useRef()
  const head = useRef()
  const leftArm = useRef()
  const rightArm = useRef()
  const leftLeg = useRef()
  const rightLeg = useRef()

  useSimulationFrame((elapsed) => {
    const phase = elapsed % 13
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
  })

  const shirt = influential ? '#8b5cf6' : '#f97316'
  const pants = influential ? '#312e81' : '#1e3a8a'
  return (
    <group ref={figure}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <capsuleGeometry args={[0.27, 0.58, 4, 10]} />
        <meshStandardMaterial color={shirt} roughness={0.52} />
      </mesh>
      <group ref={head} position={[0, 1.75, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.28, 24, 24]} />
          <meshStandardMaterial color="#f1c6a8" roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.12, 0.12]}>
          <sphereGeometry args={[0.22, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
          <meshStandardMaterial color={influential ? '#4c1d95' : '#713f12'} />
        </mesh>
        <mesh position={[0.09, 0.02, 0.24]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[-0.09, 0.02, 0.24]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      </group>
      <mesh position={[-0.16, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.16, 0.56, 12]} />
        <meshStandardMaterial color={pants} />
      </mesh>
      <mesh position={[0.16, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.16, 0.56, 12]} />
        <meshStandardMaterial color={pants} />
      </mesh>
      <mesh position={[-0.16, 0.16, 0.07]}>
        <boxGeometry args={[0.3, 0.15, 0.46]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[0.16, 0.16, 0.07]}>
        <boxGeometry args={[0.3, 0.15, 0.46]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <group ref={leftArm} position={[-0.31, 1.38, 0]}>
        <mesh position={[0, -0.3, 0.24]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.11, 0.62, 12]} />
          <meshStandardMaterial color={shirt} />
        </mesh>
        <mesh position={[0, -0.3, 0.56]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color="#f1c6a8" />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.31, 1.38, 0]}>
        <mesh position={[0, -0.3, 0.24]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.11, 0.62, 12]} />
          <meshStandardMaterial color={shirt} />
        </mesh>
        <mesh position={[0, -0.3, 0.56]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color="#f1c6a8" />
        </mesh>
      </group>
      <group ref={leftLeg} position={[-0.16, 0.55, 0]}>
        <mesh>
          <cylinderGeometry args={[0.12, 0.14, 0.62, 12]} />
          <meshStandardMaterial color={pants} />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.16, 0.55, 0]}>
        <mesh>
          <cylinderGeometry args={[0.12, 0.14, 0.62, 12]} />
          <meshStandardMaterial color={pants} />
        </mesh>
      </group>
    </group>
  )
}

function Wormhole() {
  const portal = useRef()
  const inner = useRef()
  const outerRing = useRef()
  const middleRing = useRef()

  useSimulationFrame((elapsed, dt) => {
    const phase = elapsed % 13
    const open = THREE.MathUtils.clamp((phase - 2.1) / 1.5, 0, 1)
    portal.current.scale.setScalar(Math.max(0.001, open))
    outerRing.current.rotation.z += dt * 0.55
    middleRing.current.rotation.z -= dt * 0.85
    inner.current.material.opacity = 0.55 + Math.sin(elapsed * 3.5) * 0.15
  })

  return (
    <group ref={portal} position={[0.15, 1.55, 0.72]}>
      <mesh ref={inner} position={[0, 0, -0.02]}>
        <circleGeometry args={[0.88, 48]} />
        <meshBasicMaterial color="#160d36" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>
      <group ref={outerRing}>
        <mesh>
          <torusGeometry args={[1.03, 0.09, 16, 64]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#7c3aed" emissiveIntensity={2.3} metalness={0.3} />
        </mesh>
      </group>
      <group ref={middleRing} scale={0.78}>
        <mesh>
          <torusGeometry args={[1.03, 0.055, 12, 64]} />
          <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={2.5} />
        </mesh>
      </group>
      <mesh rotation={[0, 0, Math.PI / 4]} scale={0.54}>
        <torusGeometry args={[1.03, 0.035, 10, 48]} />
        <meshBasicMaterial color="#f0abfc" />
      </mesh>
      <Sparkles count={40} scale={[2.8, 3.1, 0.4]} size={3} speed={0.8} color="#c4b5fd" />
    </group>
  )
}

function ArrivalBox() {
  const boxRef = useRef()
  const flap = useRef()
  const itemRefs = useRef([])

  useSimulationFrame((elapsed) => {
    const phase = elapsed % 13
    const carrierX = -3.55 + THREE.MathUtils.clamp(phase / 3.9, 0, 1) * 1.18
    const spill = THREE.MathUtils.clamp((phase - 7.15) / 1.25, 0, 1)
    const drop = THREE.MathUtils.clamp((phase - 7.15) / 0.65, 0, 1)
    boxRef.current.position.set(carrierX + 0.05, THREE.MathUtils.lerp(1.3, 0.18, drop), 0.95)
    boxRef.current.rotation.x = -spill * 0.95
    boxRef.current.rotation.z = spill * 0.25
    flap.current.rotation.x = -spill * 0.65

    SPILL_ITEMS.forEach((_, index) => {
      const object = itemRefs.current[index]
      if (!object) return
      const column = (index % 3) - 1
      const row = Math.floor(index / 3) - 1
      if (phase < 7.15) {
        object.visible = true
        object.position.set(
          carrierX + 0.05 + column * 0.32,
          2.12 + (index % 2) * 0.08,
          0.95 + row * 0.28,
        )
        object.rotation.set(0, index * 0.4, 0)
      } else if (phase < 9.1) {
        object.visible = true
        const progress = THREE.MathUtils.clamp((phase - 7.15 - (index % 3) * 0.1) / 1.6, 0, 1)
        const startX = carrierX + 0.05 + column * 0.25
        const startZ = 0.95 + row * 0.2
        const endX = -2.35 + column * 0.68
        const endZ = 1.0 + row * 0.72
        object.position.set(
          THREE.MathUtils.lerp(startX, endX, progress),
          0.32 + Math.sin(progress * Math.PI) * (0.45 + (index % 3) * 0.12),
          THREE.MathUtils.lerp(startZ, endZ, progress),
        )
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
        <mesh position={[0, 0.06, 0]} castShadow>
          <boxGeometry args={[1.2, 0.12, 1]} />
          <meshStandardMaterial color="#a16207" roughness={0.78} />
        </mesh>
        <mesh position={[0, 0.39, -0.45]} castShadow>
          <boxGeometry args={[1.2, 0.62, 0.1]} />
          <meshStandardMaterial color="#c0843c" roughness={0.78} />
        </mesh>
        <mesh position={[-0.55, 0.39, 0]} castShadow>
          <boxGeometry args={[0.1, 0.62, 0.9]} />
          <meshStandardMaterial color="#d09a54" roughness={0.78} />
        </mesh>
        <mesh position={[0.55, 0.39, 0]} castShadow>
          <boxGeometry args={[0.1, 0.62, 0.9]} />
          <meshStandardMaterial color="#d09a54" roughness={0.78} />
        </mesh>
        <mesh ref={flap} position={[0, 0.39, 0.45]} castShadow>
          <boxGeometry args={[1.2, 0.62, 0.1]} />
          <meshStandardMaterial color="#b77932" roughness={0.78} />
        </mesh>
        <mesh position={[0, 0.08, 0.055]}>
          <boxGeometry args={[0.55, 0.04, 0.06]} />
          <meshBasicMaterial color="#fef3c7" />
        </mesh>
      </group>
      {SPILL_ITEMS.map((item, index) => (
        <group
          key={item.index}
          ref={(node) => {
            itemRefs.current[index] = node
          }}
        >
          <Shape type={item.type} color={item.color} />
        </group>
      ))}
    </>
  )
}

export function ArrivalEffectScene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[6.5, 5.6, 11.5]} fov={38} />
      <color attach="background" args={['#090b19']} />
      <fog attach="fog" args={['#090b19', 12, 24]} />
      <ambientLight intensity={0.52} />
      <directionalLight castShadow position={[3, 8, 6]} intensity={2.1} shadow-mapSize={[1024, 1024]} />
      <pointLight position={[0.3, 1.8, 1.2]} color="#8b5cf6" intensity={20} distance={7} />
      <pointLight position={[-3, 2.2, 2]} color="#fb923c" intensity={8} distance={6} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[22, 16]} />
        <meshStandardMaterial color="#111827" roughness={0.9} />
      </mesh>
      <gridHelper args={[20, 20, '#34245f', '#1b1c31']} position={[0, -0.065, 0]} />
      <Wormhole />
      <ArrivalPerson />
      <ArrivalPerson influential />
      <ArrivalBox />
      <Html position={[-1.15, 2.72, 1.5]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div className="whitespace-nowrap rounded-lg border border-violet-300/40 bg-slate-950/85 px-3 py-2 text-center font-mono text-[9px] tracking-wider text-violet-200">
          ARRIVAL EVENT
          <br />
          <span className="text-slate-400">UNEXPECTED VISITOR</span>
        </div>
      </Html>
      <OrbitControls target={[-0.7, 1.1, 0.2]} minDistance={6} maxDistance={17} maxPolarAngle={Math.PI / 2.02} />
    </>
  )
}
