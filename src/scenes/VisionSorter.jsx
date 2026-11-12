import { Html, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Conveyor } from '../components/Conveyor.jsx'
import { Shape } from '../components/Shape.jsx'
import { useSimulationFrame } from '../components/useSimulationFrame.js'

const VISION_TYPES = [
  { type: 'cube', color: '#ef4444', label: 'CUBE', binZ: -2.4 },
  { type: 'sphere', color: '#22c55e', label: 'SPHERE', binZ: 0 },
  { type: 'pyramid', color: '#3b82f6', label: 'PYRAMID', binZ: 2.4 },
]

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

function VisionRobot() {
  const upperArm = useRef()
  const forearm = useRef()
  const gripper = useRef()
  const leftFinger = useRef()
  const rightFinger = useRef()
  const upperStart = useMemo(() => new THREE.Vector3(1.2, 1.55, 0), [])
  const elbow = useRef(new THREE.Vector3())
  const end = useRef(new THREE.Vector3())

  useSimulationFrame((elapsed) => {
    const phase = elapsed % 13
    const target = VISION_TYPES[Math.floor(elapsed / 13) % VISION_TYPES.length]
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
      endPosition.set(
        THREE.MathUtils.lerp(1.2, 3.65, progress),
        1.65,
        THREE.MathUtils.lerp(0, target.binZ, progress),
      )
    } else if (phase >= 7 && phase < 7.8) {
      endPosition.set(3.65, THREE.MathUtils.lerp(1.65, 0.55, (phase - 7) / 0.8), target.binZ)
    } else if (phase >= 7.8 && phase < 10.6) {
      const progress = (phase - 7.8) / 2.8
      endPosition.set(
        THREE.MathUtils.lerp(3.65, 1.2, progress),
        THREE.MathUtils.lerp(0.55, 1.45, progress),
        THREE.MathUtils.lerp(target.binZ, 0, progress),
      )
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
      <mesh position={[1.2, 0.2, 0]}>
        <cylinderGeometry args={[0.55, 0.62, 0.4, 32]} />
        <meshStandardMaterial color="#253449" metalness={0.72} roughness={0.3} />
      </mesh>
      <mesh position={[1.2, 0.82, 0]}>
        <cylinderGeometry args={[0.32, 0.42, 0.95, 24]} />
        <meshStandardMaterial color="#0e7490" metalness={0.66} roughness={0.28} />
      </mesh>
      <mesh ref={upperArm} castShadow>
        <cylinderGeometry args={[0.13, 0.16, 1, 16]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.68} roughness={0.25} />
      </mesh>
      <mesh ref={forearm} castShadow>
        <cylinderGeometry args={[0.1, 0.13, 1, 16]} />
        <meshStandardMaterial color="#67e8f9" metalness={0.7} roughness={0.22} />
      </mesh>
      <mesh position={[1.2, 1.55, 0]}>
        <sphereGeometry args={[0.22, 20, 20]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.8} />
      </mesh>
      <group ref={gripper}>
        <group ref={leftFinger} position={[0, -0.12, -0.2]}>
          <mesh>
            <boxGeometry args={[0.12, 0.36, 0.1]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.75} />
          </mesh>
        </group>
        <group ref={rightFinger} position={[0, -0.12, 0.2]}>
          <mesh>
            <boxGeometry args={[0.12, 0.36, 0.1]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.75} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

function VisionCamera() {
  const scanLight = useRef()

  useSimulationFrame((elapsed) => {
    scanLight.current.material.opacity = 0.08 + (Math.sin(elapsed * 5) + 1) * 0.045
  })

  return (
    <group position={[-1.25, 3.1, 0]}>
      <mesh>
        <boxGeometry args={[0.9, 0.5, 0.66]} />
        <meshStandardMaterial color="#172b3e" metalness={0.72} roughness={0.25} />
      </mesh>
      <mesh position={[0, -0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.22, 24]} />
        <meshStandardMaterial color="#64748b" metalness={0.75} />
      </mesh>
      <mesh position={[0, -0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.105, 0.105, 0.04, 24]} />
        <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={2.2} />
      </mesh>
      <mesh ref={scanLight} position={[0, -1.28, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.75, 1.65, 24, 1, true]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <Html position={[0, 0.58, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div className="whitespace-nowrap rounded border border-cyan-300/50 bg-slate-950/90 px-2 py-1 text-center font-mono text-[8px] tracking-wider text-cyan-200">
          VISION SENSOR · LIVE CLASSIFY
        </div>
      </Html>
    </group>
  )
}

function VisionBins() {
  return VISION_TYPES.map((item) => (
    <group key={item.type} position={[3.65, -0.2, item.binZ]}>
      <mesh>
        <boxGeometry args={[1.25, 0.75, 1.2]} />
        <meshStandardMaterial color="#172235" roughness={0.58} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.1, 0.06, 1.05]} />
        <meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={0.28} />
      </mesh>
      <Html position={[0, -0.63, 0.72]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div
          className="w-20 rounded border px-1.5 py-1 text-center font-mono text-[8px] font-bold tracking-wider"
          style={{ color: item.color, borderColor: item.color, background: '#07111eee' }}
        >
          {item.label} BIN
        </div>
      </Html>
    </group>
  ))
}

function VisionObject() {
  const object = useRef()
  const activeTypeIndex = useRef(0)
  const [typeIndex, setTypeIndex] = useState(0)

  useSimulationFrame((elapsed) => {
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
        object.current.position.set(
          THREE.MathUtils.lerp(1.2, 3.65, progress),
          1.85,
          THREE.MathUtils.lerp(0, target.binZ, progress),
        )
      } else {
        object.current.position.set(
          3.65,
          THREE.MathUtils.lerp(1.85, 0.42, (phase - 7) / 0.8),
          target.binZ,
        )
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
  return (
    <group ref={object}>
      <Shape type={current.type} color={current.color} />
    </group>
  )
}

export function VisionSorterScene() {
  return (
    <>
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
    </>
  )
}
