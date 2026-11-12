import { useMemo } from 'react'
import * as THREE from 'three'

const GEOMETRIES = {
  sphere: new THREE.SphereGeometry(0.28, 24, 24),
  pyramid: new THREE.ConeGeometry(0.37, 0.62, 4),
  cube: new THREE.BoxGeometry(0.5, 0.5, 0.5),
}

const MATERIAL_PROPS = {
  sphere: { roughness: 0.24, metalness: 0.25 },
  pyramid: { roughness: 0.3, metalness: 0.18 },
  cube: { roughness: 0.24, metalness: 0.22 },
}

const materialCache = new Map()

function getSharedMaterial(type, color) {
  const key = `${type}:${color}`
  if (!materialCache.has(key)) {
    const props = MATERIAL_PROPS[type] || MATERIAL_PROPS.cube
    materialCache.set(key, new THREE.MeshStandardMaterial({ color, ...props }))
  }
  return materialCache.get(key)
}

export function Shape({ type, color }) {
  const material = useMemo(() => getSharedMaterial(type, color), [type, color])
  const geometry = GEOMETRIES[type] || GEOMETRIES.cube
  const rotation = type === 'pyramid' ? [0, Math.PI / 4, 0] : undefined

  return <mesh castShadow geometry={geometry} material={material} rotation={rotation} />
}

