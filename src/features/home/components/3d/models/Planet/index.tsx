"use client";

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { Mesh, Vector2 as ThreeVector2, FrontSide, AdditiveBlending, NormalBlending, Color as ThreeColor } from 'three'

export default function Planet() {
  const mesh = useRef<Mesh>(null)
  const { viewport } = useThree() // Get viewport data

  // Calculate radius based on viewport width
  let targetDiameter = viewport.width * 0.45;
  // Ensure a minimum diameter in case viewport.width is very small initially
  if (targetDiameter < 0.5) targetDiameter = 0.5; // Minimum diameter of 0.5 world units

  const planetRadius = targetDiameter / 2;
  const islandReefRadius = planetRadius * 1.001;
  const ruralLightsRadius = planetRadius * 1.002;
  const cloudRadius = planetRadius * 1.015; // Clouds slightly larger
  const atmosphereRadius = planetRadius * 1.025; // Atmosphere slightly larger than clouds

  console.log('[Planet Component] Viewport Width:', viewport.width, 'Calculated Planet Radius:', planetRadius);

  // Load textures
  const [
    colorMap,       // Diffuse (color)
    normalMapTexture, // Bump (normal) - should be used as normalMap
    roughnessMap,
    cloudsMap,
    lightsUrbanMap,
    lightsRuralMap,   // Rural Night City Lights (with alpha channel)
    islandsReefsMap,  // Island/Reef Layer (with alpha channel)
    elevationMapTexture, // Elevation (height) - can be used as bumpMap
  ] = useTexture([
    '/assets/textures/planet/Oceanic 05 (Diffuse 4k).png',    // for colorMap
    '/assets/textures/planet/Oceanic 05 (Bump 4k).png',        // for normalMapTexture
    '/assets/textures/planet/Oceanic 05 (Roughness 4k).png', // for roughnessMap
    '/assets/textures/planet/Oceanic 05 (Clouds 4k).png',      // for cloudsMap
    '/assets/textures/planet/Oceanic 05 (Lights Urban 4k).png',// for lightsUrbanMap
    '/assets/textures/planet/Oceanic 05 (Lights Rural 4k).png',
    '/assets/textures/planet/Oceanic 05 (Islands & Reefs 4k).png',
    '/assets/textures/planet/Oceanic 05 (Elevation 4k).png',
  ])

  // Animate rotation
  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.y += 0.0003
    }
  })

  return (
    <group ref={mesh}>
      {/* Main Planet Opaque Layer */}
      <mesh >
        <sphereGeometry args={[planetRadius, 64, 64]} />
        <meshStandardMaterial
          map={colorMap}
          normalMap={normalMapTexture}
          normalScale={new ThreeVector2(0.8, 0.8)}
          bumpMap={elevationMapTexture}
          bumpScale={.05}
          roughnessMap={roughnessMap}
          emissiveMap={lightsUrbanMap}
          emissive={new ThreeColor(0x1B1EC8)}
          emissiveIntensity={0.4}
          transparent={false}
          depthWrite={true}
          side={FrontSide}
        />
      </mesh>

      {/* Islands & Reefs Layer */}
      <mesh>
        <sphereGeometry args={[islandReefRadius, 64, 64]} />
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
        <sphereGeometry args={[ruralLightsRadius, 64, 64]} />
        <meshStandardMaterial
          emissiveMap={lightsRuralMap}
          emissive={new ThreeColor(0x1B1EC8)}
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
        <sphereGeometry args={[cloudRadius, 64, 64]} />
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
        <sphereGeometry args={[atmosphereRadius, 64, 64]} />
        <meshStandardMaterial
          transparent={true}
          opacity={0.05}
          color={new ThreeColor(0x4682b4)}
          emissive={new ThreeColor(0x4682b4)}
          emissiveIntensity={0.3}
          side={FrontSide}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  )
}