'use client'

import dynamic from 'next/dynamic'

const PlanetScene = dynamic(
  () => import('~/features/home/components/3d/scenes/planet/PlanetScene'),
  {
    ssr: false,
    loading: () => null // No visible loading indicator
  }
)

export default function ClientPlanetSceneLoader() {
  return <PlanetScene />
}
