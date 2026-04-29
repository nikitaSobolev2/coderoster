'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import type { MeshStandardMaterial } from 'three'
import {
  FrontSide,
  AdditiveBlending,
  NormalBlending,
  Color as ThreeColor,
  MathUtils as ThreeMathUtils
} from 'three'

import {
  PLANET_DANGER_ENTER_COARSE_RAD_PER_S,
  PLANET_DANGER_ENTER_RAD_PER_S,
  DANGER_RED_EMISSIVE_HEX,
  PLANET_ATMOSPHERE_OPACITY_IDLE,
  PLANET_ATMOSPHERE_DANGER_OPACITY_MAX,
  PLANET_DISPLAY_THREAT_SMOOTH_HZ
} from './planetRotation.constants'
import { angularVelocityDangerFactor } from './planetRotationPhysics'

import { planetDimensions, usePlanetStore } from './planet.store'
import { useGlobePointerStore } from './globePointer.store'
import { usePlanetPointerPhysics } from './usePlanetPointerSpin'
import { disableMeshRaycast } from './disableMeshRaycast'
import { useGlobeDangerDisplayStore } from './globeDanger.store'
import { setPlanetOrbitGlowFromHeat, syncHomeThreatGlobe01 } from './homeDangerTheme.dom'
import { useCursorStore } from '~/features/home/components/common/Cursor/cursor.store'

const SCRATCH_DEST = new ThreeColor(DANGER_RED_EMISSIVE_HEX)

interface Props {
  /** Fine-pointer desktop: globe hover sets custom cursor glyph. Physics active on all pointers. */
  interactionDesktop: boolean
}

export default function Planet(props: Readonly<Props>) {
  const { interactionDesktop } = props
  const settings = usePlanetStore(state => state.settings)
  const setPointerOverGlobe = useGlobePointerStore(state => state.setPointerOverGlobe)
  const homeCursorSuspended = useCursorStore(state => state.homeCursorSuspended)

  const urbanMatRef = useRef<MeshStandardMaterial>(null!)
  const ruralMatRef = useRef<MeshStandardMaterial>(null!)
  const atmMatRef = useRef<MeshStandardMaterial>(null!)

  const displayThreatSmoothRef = useRef(0)
  const setDisplayThreatGlobeStore = useGlobeDangerDisplayStore(s => s.setDisplayThreat01)

  const baseUrban = useRef(new ThreeColor())
  const baseUrbanIntensity = useRef(0)
  const baseRural = useRef(new ThreeColor())
  const baseAtmosphere = useRef(new ThreeColor())
  const baseAtmosphereIntensity = useRef(0)

  useLayoutEffect(() => {
    baseUrban.current.copy(settings.emissiveColor)
    baseUrbanIntensity.current = settings.emissiveIntensity
    baseRural.current.copy(settings.emissiveColor)
    baseAtmosphere.current.copy(settings.atmosphereColor)
    baseAtmosphereIntensity.current = settings.atmosphereIntensity

    urbanMatRef.current?.emissive.copy(baseUrban.current)
    ruralMatRef.current?.emissive.copy(baseRural.current)
    atmMatRef.current?.color.copy(baseAtmosphere.current)
    atmMatRef.current?.emissive.copy(baseAtmosphere.current)
  }, [settings])

  useEffect(() => {
    if (homeCursorSuspended) setPointerOverGlobe(false)
  }, [homeCursorSuspended, setPointerOverGlobe])

  const {
    spinGroupRef,
    applyIdleAndUserSpinStep,
    onGlobeSurfacePointerDown,
    onPointerCancel,
    onPointerLeave,
    onPointerOver,
    onPointerOut
  } = usePlanetPointerPhysics({
    interactionDesktop,
    setPointerOverGlobe
  })

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

  const dangerRampCriticalRadPerS = interactionDesktop
    ? PLANET_DANGER_ENTER_RAD_PER_S
    : PLANET_DANGER_ENTER_COARSE_RAD_PER_S

  useFrame((_state, deltaSeconds) => {
    const idleTick = settings.rotationSpeed

    const step = applyIdleAndUserSpinStep(deltaSeconds, idleTick)

    const instantaneousSeverity = ThreeMathUtils.clamp(
      angularVelocityDangerFactor(step.userOmegaMagnitude, dangerRampCriticalRadPerS) * 1.15,
      0,
      1
    )
    const targetThreat = step.dangerLatched ? 1 : instantaneousSeverity

    displayThreatSmoothRef.current = ThreeMathUtils.damp(
      displayThreatSmoothRef.current,
      targetThreat,
      PLANET_DISPLAY_THREAT_SMOOTH_HZ,
      deltaSeconds
    )
    const tintStrength = ThreeMathUtils.clamp(displayThreatSmoothRef.current, 0, 1)

    setPlanetOrbitGlowFromHeat(tintStrength)
    syncHomeThreatGlobe01(tintStrength)
    setDisplayThreatGlobeStore(tintStrength)

    const urban = urbanMatRef.current
    const rural = ruralMatRef.current
    const atm = atmMatRef.current
    if (!urban || !rural || !atm) return

    SCRATCH_DEST.setHex(DANGER_RED_EMISSIVE_HEX)
    urban.emissive.copy(baseUrban.current).lerp(SCRATCH_DEST, tintStrength)
    rural.emissive.copy(baseRural.current).lerp(SCRATCH_DEST, tintStrength)

    urban.emissiveIntensity = ThreeMathUtils.lerp(
      baseUrbanIntensity.current,
      baseUrbanIntensity.current * (1 + tintStrength * 1.45),
      tintStrength
    )

    rural.emissiveIntensity = ThreeMathUtils.lerp(1, 1 + tintStrength * 2.25, tintStrength)

    atm.emissive.copy(baseAtmosphere.current).lerp(SCRATCH_DEST, tintStrength)
    atm.color.copy(atm.emissive)

    atm.emissiveIntensity = ThreeMathUtils.lerp(
      baseAtmosphereIntensity.current,
      baseAtmosphereIntensity.current * (1 + tintStrength * 1.75),
      tintStrength
    )

    atm.opacity = ThreeMathUtils.lerp(
      PLANET_ATMOSPHERE_OPACITY_IDLE,
      PLANET_ATMOSPHERE_DANGER_OPACITY_MAX,
      tintStrength
    )
  })

  const pointerPresence = interactionDesktop ? { onPointerOver, onPointerOut } : {}

  return (
    <group ref={spinGroupRef}>
      <mesh
        onPointerCancel={onPointerCancel}
        onPointerLeave={onPointerLeave}
        onPointerDown={onGlobeSurfacePointerDown}
        {...pointerPresence}
      >
        <sphereGeometry args={[planetDimensions.planetRadius, 64, 64]} />
        <meshStandardMaterial
          ref={urbanMatRef}
          map={colorMap}
          normalMap={normalMapTexture}
          normalScale={settings.normalScale}
          bumpMap={elevationMapTexture}
          bumpScale={settings.bumpScale}
          roughnessMap={roughnessMap}
          emissiveMap={lightsUrbanMap}
          emissive={settings.emissiveColor.clone()}
          emissiveIntensity={settings.emissiveIntensity}
          transparent={false}
          depthWrite={true}
          side={FrontSide}
        />
      </mesh>

      {/* Islands & Reefs Layer — no raycast */}
      <mesh ref={element => disableMeshRaycast(element)}>
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

      {/* Rural Lights Layer — no raycast */}
      <mesh ref={element => disableMeshRaycast(element)}>
        <sphereGeometry args={[planetDimensions.ruralLightsRadius, 64, 64]} />
        <meshStandardMaterial
          ref={ruralMatRef}
          emissiveMap={lightsRuralMap}
          emissive={settings.emissiveColor.clone()}
          emissiveIntensity={1}
          transparent={true}
          depthWrite={false}
          side={FrontSide}
          blending={AdditiveBlending}
          opacity={0.04}
        />
      </mesh>

      {/* Clouds Layer — no raycast */}
      <mesh ref={element => disableMeshRaycast(element)}>
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

      {/* Atmospheric Glow Layer — no raycast */}
      <mesh ref={element => disableMeshRaycast(element)}>
        <sphereGeometry args={[planetDimensions.atmosphereRadius, 64, 64]} />
        <meshStandardMaterial
          ref={atmMatRef}
          transparent={true}
          opacity={PLANET_ATMOSPHERE_OPACITY_IDLE}
          color={settings.atmosphereColor}
          emissive={settings.atmosphereColor.clone()}
          emissiveIntensity={settings.atmosphereIntensity}
          side={FrontSide}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  )
}
