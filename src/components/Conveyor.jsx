import { useMemo } from 'react'

export function Conveyor({ position, length = 5.4, rotation = [0, 0, 0] }) {
  const rollers = useMemo(() => [-length / 2 + 0.25, length / 2 - 0.25], [length])
  const slats = useMemo(
    () => Array.from({ length: Math.floor(length * 2) }, (_, index) => -length / 2 + 0.3 + index * 0.5),
    [length],
  )

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
      {rollers.map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 1.48, 18]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} />
        </mesh>
      ))}
      {slats.map((x) => (
        <mesh key={x} position={[x, 0.16, 0]}>
          <boxGeometry args={[0.045, 0.03, 1.12]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} />
        </mesh>
      ))}
    </group>
  )
}

