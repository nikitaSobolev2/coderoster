'use client'

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { gsap } from 'gsap'
import { usePlanetScaleStore } from '~/features/home/components/3d/scenes/planet/PlanetScene/planet-scale.store'
import { getPlanetPresetForIndex } from '~/features/home/components/3d/scenes/planet/planetSectionPresets'
import { usePlanetGroupRefStore } from '~/features/home/components/3d/scenes/planet/planet-group-ref.store'
import { usePlanetStore } from '~/features/home/components/3d/models/Planet/planet.store'
import { useSectionScrollerStore } from '~/features/home/components/common/SectionScroller/section-scroller.store'
import { readRootCssColorVar } from '~/shared/utils/cssCustomProperties'
import { CameraSetup } from '../CameraSetup'
import { ScalablePlanet } from '../ScalablePlanet'
import styles from './styles.module.scss'

const FALLBACK_R3F_LIGHT_WARM = '#fff1e0'
const FALLBACK_R3F_DIRECTIONAL = '#1B1EC8'
const SECTION_TWEEN_S = 1.15
const FOOTER_SECTION_INDEX = 5

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
      <directionalLight
        color={directionalColor ?? directionalBase}
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

    const applySectionVisuals = () => {
      const patch = preset.getPlanetSettingsPatch()
      usePlanetStore.getState().applyPlanetSectionVisuals(patch)
    }

    applySectionVisuals()

    if (!didInitRef.current) {
      didInitRef.current = true
      gsap.set(el, { x: t.x, y: t.y, overwrite: 'auto' })
      setPlanetScale(targetScale)
      prevIndexRef.current = activeIndex
      return
    }

    const prev = prevIndexRef.current
    const indexChanged = prev !== activeIndex
    const delta = activeIndex - prev
    prevIndexRef.current = activeIndex

    const group = usePlanetGroupRefStore.getState().group
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
      tl.to(el, { x: t.x, y: t.y, duration: SECTION_TWEEN_S, overwrite: 'auto' }, 0)
    } else {
      tl.to(el, { x: t.x, y: t.y, duration: SECTION_TWEEN_S, overwrite: 'auto' }, 0)
    }

    tl.to(
      scaleProxy,
      {
        s: targetScale,
        duration: SECTION_TWEEN_S,
        ease: 'power2.inOut',
        onUpdate: () => {
          setPlanetScale(scaleProxy.s)
        }
      },
      0
    )

    if (indexChanged && group && delta !== 0) {
      const sign = delta > 0 ? 1 : -1
      const endY = group.rotation.y + sign * 4 * Math.PI
      gsap.to(group.rotation, {
        y: endY,
        duration: 2,
        ease: 'power2.inOut',
        overwrite: 'auto'
      })
    }

    return () => {
      tl.kill()
      if (group) {
        gsap.killTweensOf(group.rotation)
      }
    }
  }, [activeIndex, canvasSize, setPlanetScale, layoutTick])

  return (
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
              <ScalablePlanet />
            </React.Suspense>
          </Canvas>
        )}
      </div>
    </div>
  )
}
