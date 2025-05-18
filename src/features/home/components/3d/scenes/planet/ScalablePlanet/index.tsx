import Planet from '~/features/home/components/3d/models/Planet'
import { usePlanetScaleStore } from '~/features/home/components/3d/scenes/planet/PlanetScene/planet-scale.store'

export function ScalablePlanet() {
  const planetScale = usePlanetScaleStore(state => state.planetScale)

  return (
    <group scale={planetScale}>
      <Planet />
    </group>
  )
}
