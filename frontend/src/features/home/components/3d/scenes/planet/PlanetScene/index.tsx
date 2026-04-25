'use client'

import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePlanetScaleStore } from '~/features/home/components/3d/scenes/planet/PlanetScene/planet-scale.store'
import { readRootCssColorVar } from '~/shared/utils/cssCustomProperties'
import { CameraSetup } from '../CameraSetup'
import { ScalablePlanet } from '../ScalablePlanet'
import styles from './styles.module.scss'

gsap.registerPlugin(ScrollTrigger)

const FALLBACK_R3F_LIGHT_WARM = '#fff1e0'
const FALLBACK_R3F_DIRECTIONAL = '#1B1EC8'

export default function PlanetScene() {
  const animatedContainerRef = useRef<HTMLDivElement>(null)
  const canvasHolderRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState<{
    width: number
    height: number
  } | null>(null)
  const setPlanetScale = usePlanetScaleStore(state => state.setPlanetScale)
  const planetScale = usePlanetScaleStore(state => state.planetScale)
  const r3fLightColors = useMemo(
    () => ({
      warm: readRootCssColorVar('--color-r3f-light-warm', FALLBACK_R3F_LIGHT_WARM),
      directional: readRootCssColorVar('--color-r3f-directional', FALLBACK_R3F_DIRECTIONAL)
    }),
    []
  )

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
    const animatedContainer = animatedContainerRef.current
    const canvasHolder = canvasHolderRef.current
    if (!animatedContainer || !canvasHolder || !canvasSize) return

    const bigTrueSection = document.getElementById('big-true')
    if (!bigTrueSection) return

    const initialRect = animatedContainer.getBoundingClientRect()
    const initialWidth = initialRect.width
    const initialHeight = initialRect.height

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: 'main',
        start: 'top top',
        endTrigger: '#big-true',
        end: 'start center',
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: self => {
          const newScale = 1.0 - 0.2 * self.progress
          setPlanetScale(newScale)
        }
      }
    })

    timeline.to(animatedContainer, {
      x: () => window.innerWidth * 0.85 - initialWidth / 2,
      y: () => window.innerHeight / 2 - initialHeight / 2,
      ease: 'power1.inOut'
    })

    return () => {
      timeline.kill()
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
      gsap.set(animatedContainer, { clearProps: 'transform' })
      setPlanetScale(1.0)
    }
  }, [canvasSize, setPlanetScale])

  return (
    <div ref={animatedContainerRef} className={styles.container}>
      <div ref={canvasHolderRef} className={styles.canvasHolder}>
        {canvasSize && (
          <Canvas>
            <CameraSetup fixedSize={canvasSize} />
            <ambientLight intensity={0.2} />
            <directionalLight
              color={r3fLightColors.warm}
              position={[5000, 6000, 10000]}
              intensity={2.2}
            />
            <directionalLight
              color={r3fLightColors.directional}
              position={[5000, 6000, 10000]}
              intensity={2.5}
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
