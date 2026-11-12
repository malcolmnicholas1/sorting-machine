import { useMemo, useRef } from 'react'
import { useSimulationFrame } from './useSimulationFrame.js'

export function Conveyor({ position, length = 5.4, rotation = [0, 0, 0], speed = 1.15 }) {
  const rollers = useMemo(() => [-length / 2 + 0.25, length / 2 - 0.25], [length])
  const usableLength = length - 0.5
  const slatCount = useMemo(() => Math.max(4, Math.floor(usableLength * 2)), [usableLength])
  const slatsRef = useRef([])
  const rollerRefs = useRef([])

  useSimulationFrame((elapsed, dt) => {
    const offset = (elapsed * speed) % 0.5
    for (let i = 0; i < slatCount; i += 1) {
      const slat = slatsRef.current[i]
      if (slat) {
        const x = -usableLength / 2 + ((i * 0.5 + offset) % usableLength)
        slat.position.x = x
      }
    }
    for (let i = 0; i < rollerRefs.current.length; i += 1) {
      const roller = rollerRefs.current[i]
      if (roller) {
        roller.rotation.y -= dt * speed * 4.2
      }
    }
  })

  return (
    <group position={position} rotation={rotation}>
      <mesh receiveShadow>
        <boxGeometry args={[length, 0.22, 1.35]} />
        <meshStandardMaterial color="#263447" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.125, 0]}>
        <boxGeometry args={[length - 0.08, 0.035, 1.08]} />
        <meshStandardMaterial color="#111827" roughness={0.85} />
      </mesh>
      {[-0.62, 0.62].map((zRail) => (
        <mesh key={zRail} position={[0, 0.19, zRail]}>
          <boxGeometry args={[length - 0.1, 0.1, 0.06]} />
          <meshStandardMaterial color="#334155" metalness={0.65} roughness={0.35} />
        </mesh>
      ))}
      {rollers.map((x, index) => (
        <mesh
          key={x}
          ref={(node) => {
            rollerRefs.current[index] = node
          }}
          position={[x, 0, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.22, 0.22, 1.48, 18]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} />
        </mesh>
      ))}
      {Array.from({ length: slatCount }, (_, index) => (
        <mesh
          key={index}
          ref={(node) => {
            slatsRef.current[index] = node
          }}
          position={[-usableLength / 2 + index * 0.5, 0.16, 0]}
        >
          <boxGeometry args={[0.045, 0.03, 1.06]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.32} />
        </mesh>
      ))}
    </group>
  )
}
