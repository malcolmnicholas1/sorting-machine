import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { SimulationContext } from './useSimulationFrame.js'

export function SimulationClock({ paused, children }) {
  const timeRef = useRef(0)

  useFrame((_, delta) => {
    if (!paused) {
      timeRef.current += Math.min(delta, 0.1)
    }
  })

  return (
    <SimulationContext.Provider value={{ paused, timeRef }}>
      {children}
    </SimulationContext.Provider>
  )
}
