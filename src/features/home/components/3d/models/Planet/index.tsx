'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import type { Mesh } from 'three'
import { FrontSide, AdditiveBlending, NormalBlending } from 'three'
import { planetDimensions, usePlanetStore } from './planet.store'

export default function Planet() {
  const mesh = useRef<Mesh>(null)
  const settings = usePlanetStore(state => state.settings)

  // Load textures
  const [
    colorMap,
    normalMapTexture,
    roughnessMap,
    cloudsMap,
    lightsUrbanMap,
    lightsRuralMap,
    islandsReefsMap,
    elevationMapTexture
  ] = useTexture([
    '/assets/textures/planet/Oceanic 05 (Diffuse 4k).png',
    '/assets/textures/planet/Oceanic 05 (Bump 4k).png',
    '/assets/textures/planet/Oceanic 05 (Roughness 4k).png',
    '/assets/textures/planet/Oceanic 05 (Clouds 4k).png',
    '/assets/textures/planet/Oceanic 05 (Lights Urban 4k).png',
    '/assets/textures/planet/Oceanic 05 (Lights Rural 4k).png',
    '/assets/textures/planet/Oceanic 05 (Islands & Reefs 4k).png',
    '/assets/textures/planet/Oceanic 05 (Elevation 4k).png'
  ])

  // Animate rotation
  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.y += settings.rotationSpeed
    }
  })

  return (
    <group ref={mesh}>
      {/* Main Planet Opaque Layer */}
      <mesh>
        <sphereGeometry args={[planetDimensions.planetRadius, 64, 64]} />
        <meshStandardMaterial
          map={colorMap}
          normalMap={normalMapTexture}
          normalScale={settings.normalScale}
          bumpMap={elevationMapTexture}
          bumpScale={settings.bumpScale}
          roughnessMap={roughnessMap}
          emissiveMap={lightsUrbanMap}
          emissive={settings.emissiveColor}
          emissiveIntensity={settings.emissiveIntensity}
          transparent={false}
          depthWrite={true}
          side={FrontSide}
        />
      </mesh>

      {/* Islands & Reefs Layer */}
      <mesh>
        <sphereGeometry args={[planetDimensions.islandReefRadius, 64, 64]} />
        <meshStandardMaterial
          map={islandsReefsMap}
          transparent={true}
          opacity={1}
          depthWrite={false}
          side={FrontSide}
          alphaTest={0.1}
        />
      </mesh>

      {/* Rural Lights Layer */}
      <mesh>
        <sphereGeometry args={[planetDimensions.ruralLightsRadius, 64, 64]} />
        <meshStandardMaterial
          emissiveMap={lightsRuralMap}
          emissive={settings.emissiveColor}
          emissiveIntensity={1}
          transparent={true}
          depthWrite={false}
          side={FrontSide}
          blending={AdditiveBlending}
          opacity={0.04}
        />
      </mesh>

      {/* Clouds Layer */}
      <mesh>
        <sphereGeometry args={[planetDimensions.cloudRadius, 64, 64]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent={true}
          opacity={1}
          depthWrite={false}
          side={FrontSide}
          blending={NormalBlending}
        />
      </mesh>

      {/* Atmospheric Glow Layer */}
      <mesh>
        <sphereGeometry args={[planetDimensions.atmosphereRadius, 64, 64]} />
        <meshStandardMaterial
          transparent={true}
          opacity={0.05}
          color={settings.atmosphereColor}
          emissive={settings.atmosphereColor}
          emissiveIntensity={settings.atmosphereIntensity}
          side={FrontSide}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  )
}
