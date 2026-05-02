'use client'

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { gsap } from 'gsap'
import { Color, type DirectionalLight as DirectionalLightImpl, type Group } from 'three'

import { usePlanetScaleStore } from '~/features/home/components/3d/scenes/planet/PlanetScene/planet-scale.store'
import { getPlanetPresetForIndex } from '~/features/home/components/3d/scenes/planet/planetSectionPresets'
import { usePlanetGroupRefStore } from '~/features/home/components/3d/scenes/planet/planet-group-ref.store'
import { usePlanetStore } from '~/features/home/components/3d/models/Planet/planet.store'
import { useGlobeDangerDisplayStore } from '~/features/home/components/3d/models/Planet/globeDanger.store'
import {
  DANGER_RED_EMISSIVE_HEX,
  PLANET_SUPPRESS_SECTION_ROTATION_BURST_MIN_DISPLAY_THREAT
} from '~/features/home/components/3d/models/Planet/planetRotation.constants'
import { registerPlanetOrbitGlowHost } from '~/features/home/components/3d/models/Planet/homeDangerTheme.dom'
import { useSectionScrollerStore } from '~/features/home/components/common/SectionScroller/section-scroller.store'
import { useMobilePlanetScrollTimeline } from '~/features/home/hooks/planetScroll/useMobilePlanetScrollTimeline'
import GlobeCursorSync from '~/features/home/components/3d/scenes/planet/GlobeCursorSync'
import { HOME_DESKTOP_INTERACTION_MQ } from '~/shared/constants/homeDesktopInteractionMediaQuery'
import { useMatchMedia } from '~/shared/hooks/useMatchMedia'
import { readRootCssColorVar } from '~/shared/utils/cssCustomProperties'
import { CameraSetup } from '../CameraSetup'
import { ScalablePlanet } from '../ScalablePlanet'
import styles from './styles.module.scss'

const FALLBACK_R3F_LIGHT_WARM = '#fff1e0'
const FALLBACK_R3F_DIRECTIONAL = '#1B1EC8'
const SECTION_TWEEN_S = 1.15
const FOOTER_SECTION_INDEX = 5
const MOBILE_MQ = '(max-width: 768px)'
const ROTATION_BURST_DURATION_S = 2
const ROTATION_BURST_TURNS = 4

interface RotationTweenOptions {
  group: Group | null
  indexChanged: boolean
  delta: number
}

function tweenPlanetRotation(options: RotationTweenOptions): gsap.core.Tween | null {
  const { group, indexChanged, delta } = options
  if (!group || !indexChanged || delta === 0) return null
  gsap.killTweensOf(group.rotation)
  const sign = delta > 0 ? 1 : -1
  return gsap.to(group.rotation, {
    y: group.rotation.y + sign * ROTATION_BURST_TURNS * Math.PI,
    duration: ROTATION_BURST_DURATION_S,
    ease: 'power2.inOut',
    overwrite: 'auto'
  })
}

/** Scene “cool” directional — lerps toward coral as `displayThreat01` rises (sync with globe / `.homeShell`). */
const DANGER_DIRECTIONAL_MIX = new Color(DANGER_RED_EMISSIVE_HEX)

function ThreatSyncedDirectionalLight(
  props: Readonly<{
    presetColor: string | undefined
    baseFallback: string
    intensity: number
    position: readonly [number, number, number]
  }>
) {
  const { presetColor, baseFallback, intensity, position } = props
  const lightRef = useRef<DirectionalLightImpl>(null)
  const scratch = useRef(new Color())

  useFrame(() => {
    const threat = useGlobeDangerDisplayStore.getState().displayThreat01
    scratch.current.set(presetColor ?? baseFallback)
    scratch.current.lerp(DANGER_DIRECTIONAL_MIX, threat)
    const light = lightRef.current
    if (light) {
      light.color.copy(scratch.current)
    }
  })

  return <directionalLight ref={lightRef} position={[...position]} intensity={intensity} />
}

function PlanetR3FLights({
  warmBase,
  directionalBase
}: {
  warmBase: string
  directionalBase: string
}) {
  const activeIndex = useSectionScrollerStore(s => s.activeIndex)
  const preset = getPlanetPresetForIndex(activeIndex)
  const { warmIntensity, directionalIntensity, warmColor, directionalColor } = preset.lighting

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight
        color={warmColor ?? warmBase}
        position={[5000, 6000, 10000]}
        intensity={warmIntensity}
      />
      <ThreatSyncedDirectionalLight
        presetColor={directionalColor}
        baseFallback={directionalBase}
        position={[5000, 6000, 10000]}
        intensity={directionalIntensity}
      />
    </>
  )
}

export default function PlanetScene() {
  const animatedContainerRef = useRef<HTMLDivElement>(null)
  const canvasHolderRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState<{
    width: number
    height: number
  } | null>(null)
  const [layoutTick, setLayoutTick] = useState(0)

  const setPlanetScale = usePlanetScaleStore(state => state.setPlanetScale)
  const planetScale = usePlanetScaleStore(state => state.planetScale)
  const activeIndex = useSectionScrollerStore(s => s.activeIndex)
  const prevIndexRef = useRef(activeIndex)
  const didInitRef = useRef(false)
  const isMobile = useMatchMedia(MOBILE_MQ)
  const interactionDesktop = useMatchMedia(HOME_DESKTOP_INTERACTION_MQ)

  useMobilePlanetScrollTimeline({
    enabled: isMobile && canvasSize !== null,
    containerRef: animatedContainerRef,
    setPlanetScale
  })

  const r3fLightColors = useMemo(
    () => ({
      warm: readRootCssColorVar('--color-r3f-light-warm', FALLBACK_R3F_LIGHT_WARM),
      directional: readRootCssColorVar('--color-r3f-directional', FALLBACK_R3F_DIRECTIONAL)
    }),
    []
  )

  useEffect(() => {
    const onResize = () => setLayoutTick(t => t + 1)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useLayoutEffect(() => {
    registerPlanetOrbitGlowHost(animatedContainerRef.current)
    return () => registerPlanetOrbitGlowHost(null)
  }, [])

  useLayoutEffect(() => {
    const el = animatedContainerRef.current
    if (!el) return
    el.style.setProperty('--planet-scale', String(planetScale))
  }, [planetScale])

  useLayoutEffect(() => {
    const el = canvasHolderRef.current
    if (!el) return
    if (canvasSize) {
      el.style.setProperty('--canvas-width', `${canvasSize.width}px`)
      el.style.setProperty('--canvas-height', `${canvasSize.height}px`)
    } else {
      el.style.removeProperty('--canvas-width')
      el.style.removeProperty('--canvas-height')
    }
  }, [canvasSize])

  useLayoutEffect(() => {
    if (canvasHolderRef.current && !canvasSize) {
      const rect = canvasHolderRef.current.getBoundingClientRect()
      setCanvasSize({ width: rect.width, height: rect.height })
    }
  }, [canvasSize])

  useLayoutEffect(() => {
    const el = animatedContainerRef.current
    if (!el || !canvasSize) return

    const w = window.innerWidth
    const h = window.innerHeight
    const preset = getPlanetPresetForIndex(activeIndex)
    const t = preset.getTranslate({ innerWidth: w, innerHeight: h })
    const targetScale = preset.targetScale

    usePlanetStore.getState().applyPlanetSectionVisuals(preset.getPlanetSettingsPatch())

    const prev = prevIndexRef.current
    const indexChanged = prev !== activeIndex
    const delta = activeIndex - prev
    const group = usePlanetGroupRefStore.getState().group

    const burstFromSectionChange =
      indexChanged &&
      useGlobeDangerDisplayStore.getState().displayThreat01 <
        PLANET_SUPPRESS_SECTION_ROTATION_BURST_MIN_DISPLAY_THREAT

    if (isMobile) {
      prevIndexRef.current = activeIndex
      const rotationTween = tweenPlanetRotation({
        group,
        indexChanged: burstFromSectionChange,
        delta
      })
      return () => {
        rotationTween?.kill()
      }
    }

    if (!didInitRef.current) {
      didInitRef.current = true
      gsap.set(el, { x: t.x, y: t.y, overwrite: 'auto' })
      setPlanetScale(targetScale)
      prevIndexRef.current = activeIndex
      return
    }

    prevIndexRef.current = activeIndex

    const enterFromTop =
      preset.enterFromTop === true &&
      activeIndex === FOOTER_SECTION_INDEX &&
      prev !== FOOTER_SECTION_INDEX

    gsap.killTweensOf(el)
    if (group) {
      gsap.killTweensOf(group.rotation)
    }

    const scaleProxy = { s: usePlanetScaleStore.getState().planetScale }
    const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } })

    if (enterFromTop) {
      gsap.set(el, { x: t.x, y: t.y - h * 0.4 })
    }
    tl.to(el, { x: t.x, y: t.y, duration: SECTION_TWEEN_S, overwrite: 'auto' }, 0)
    tl.to(
      scaleProxy,
      {
        s: targetScale,
        duration: SECTION_TWEEN_S,
        ease: 'power2.inOut',
        onUpdate: () => setPlanetScale(scaleProxy.s)
      },
      0
    )

    const rotationTween = tweenPlanetRotation({
      group,
      indexChanged: burstFromSectionChange,
      delta
    })

    return () => {
      tl.kill()
      rotationTween?.kill()
    }
  }, [activeIndex, canvasSize, setPlanetScale, layoutTick, isMobile])

  return (
    <>
      <GlobeCursorSync />
      <div ref={animatedContainerRef} className={styles.container}>
        <div ref={canvasHolderRef} className={styles.canvasHolder}>
          {canvasSize && (
            <Canvas>
              <CameraSetup fixedSize={canvasSize} />
              <PlanetR3FLights
                warmBase={r3fLightColors.warm}
                directionalBase={r3fLightColors.directional}
              />
              <React.Suspense
                fallback={
                  <mesh>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshBasicMaterial color="orange" wireframe />
                  </mesh>
                }
              >
                <ScalablePlanet interactionDesktop={interactionDesktop} />
              </React.Suspense>
            </Canvas>
          )}
        </div>
      </div>
    </>
  )
}
