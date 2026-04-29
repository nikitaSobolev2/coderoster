'use client'

import { useLayoutEffect, useRef } from 'react'
import type { Group } from 'three'
import Planet from '~/features/home/components/3d/models/Planet'
import { usePlanetGroupRefStore } from '~/features/home/components/3d/scenes/planet/planet-group-ref.store'
import { usePlanetScaleStore } from '~/features/home/components/3d/scenes/planet/PlanetScene/planet-scale.store'

export function ScalablePlanet({ interactionDesktop }: { interactionDesktop: boolean }) {
  const planetScale = usePlanetScaleStore(state => state.planetScale)
  const setGroup = usePlanetGroupRefStore(s => s.setGroup)
  const groupRef = useRef<Group>(null)

  useLayoutEffect(() => {
    setGroup(groupRef.current)
    return () => {
      setGroup(null)
    }
  }, [setGroup])

  return (
    <group ref={groupRef} scale={planetScale}>
      <Planet interactionDesktop={interactionDesktop} />
    </group>
  )
}
