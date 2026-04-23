'use client'

import React, { useLayoutEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePlanetScaleStore } from '~/features/home/components/3d/scenes/planet/PlanetScene/planet-scale.store'
import { CameraSetup } from '../CameraSetup'
import { ScalablePlanet } from '../ScalablePlanet'
import styles from './styles.module.scss'

gsap.registerPlugin(ScrollTrigger)

export default function PlanetScene() {
  const animatedContainerRef = useRef<HTMLDivElement>(null)
  const canvasHolderRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState<{
    width: number
    height: number
  } | null>(null)
  const setPlanetScale = usePlanetScaleStore(state => state.setPlanetScale)
  const planetScale = usePlanetScaleStore(state => state.planetScale)

  useLayoutEffect(() => {
    if (canvasHolderRef.current && !canvasSize) {
      const rect = canvasHolderRef.current.getBoundingClientRect()
      setCanvasSize({ width: rect.width, height: rect.height })
    }
  }, [canvasSize])

  useLayoutEffect(() => {
    if (!animatedContainerRef.current || !canvasHolderRef.current || !canvasSize) return

    const bigTrueSection = document.getElementById('big-true')
    if (!bigTrueSection) return

    const initialRect = animatedContainerRef.current.getBoundingClientRect()
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

    timeline.to(animatedContainerRef.current, {
      x: () => window.innerWidth * 0.85 - initialWidth / 2,
      y: () => window.innerHeight / 2 - initialHeight / 2,
      ease: 'power1.inOut'
    })

    return () => {
      timeline.kill()
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
      gsap.set(animatedContainerRef.current, { clearProps: 'transform' })
      setPlanetScale(1.0)
    }
  }, [canvasSize, canvasHolderRef, setPlanetScale])

  return (
    <div
      ref={animatedContainerRef}
      className={styles.container}
      style={{ '--planet-scale': planetScale } as React.CSSProperties}
    >
      <div
        ref={canvasHolderRef}
        className={styles.canvasHolder}
        style={
          canvasSize
            ? {
                width: `${canvasSize.width}px`,
                height: `${canvasSize.height}px`
              }
            : { width: '100%', height: '100%' }
        }
      >
        {canvasSize && (
          <Canvas>
            <CameraSetup fixedSize={canvasSize} />
            <ambientLight intensity={0.2} />
            <directionalLight color="#fff1e0" position={[5000, 6000, 10000]} intensity={2.2} />
            <directionalLight color="#1B1EC8" position={[5000, 6000, 10000]} intensity={2.5} />
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
