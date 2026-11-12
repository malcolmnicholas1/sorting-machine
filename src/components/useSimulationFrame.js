import { useFrame } from '@react-three/fiber'
import { createContext, useContext } from 'react'

export const SimulationContext = createContext({ paused: false, timeRef: { current: 0 } })

export function useSimulationFrame(callback) {
  const { paused, timeRef } = useContext(SimulationContext)
  useFrame((state, delta) => {
    const dt = paused ? 0 : Math.min(delta, 0.1)
    callback(timeRef.current, dt, state)
  })
}

