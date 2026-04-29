'use client'

import type { RefObject } from 'react'
import { useCallback, useEffect, useRef } from 'react'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import type { Group } from 'three'

import {
  applyAngularDrag,
  clampMagnitudeRadPerSec,
  expoSmooth,
  planetIdleRotationRadiansPerSecond
} from '~/features/home/components/3d/models/Planet/planetRotationPhysics'

import {
  PLANET_ANGULAR_DAMPING,
  PLANET_DRAG_OMEGA_SMOOTH,
  PLANET_DRAG_RADIANS_PER_PIXEL,
  PLANET_MAX_USER_ANGULAR_VELOCITY_RAD_PER_S
} from '~/features/home/components/3d/models/Planet/planetRotation.constants'

interface PlanetPointerPhysicsOptions {
  interactionDesktop: boolean
  setPointerOverGlobe: (next: boolean) => void
}

const TIME_EPSILON_S = 1e-4

type PointerSynthetic = ThreeEvent<PointerEvent>

/** Pointer inertia + drag via `window` (works outside canvas after capture). */
export function usePlanetPointerPhysics(options: PlanetPointerPhysicsOptions): {
  spinGroupRef: RefObject<Group | null>
  omegaUserRadPerSec: RefObject<number>
  draggingRef: RefObject<boolean>
  applyIdleAndUserSpinStep: (
    deltaSeconds: number,
    legacyRotationTickRate: number
  ) => {
    userOmegaMagnitude: number
  }
  onGlobeSurfacePointerDown: (event: PointerSynthetic) => void
  onPointerLeave: (event: PointerSynthetic) => void
  onPointerCancel: (event: PointerSynthetic) => void
  onPointerOver: () => void
  onPointerOut: () => void
} {
  const { interactionDesktop, setPointerOverGlobe } = options

  const { gl } = useThree()
  const spinGroupRef = useRef<Group | null>(null)
  const omegaUserRadPerSec = useRef(0)
  const dragSmoothedOmega = useRef(0)
  const draggingRef = useRef(false)
  const lastClientX = useRef<number | null>(null)
  const lastEventTimeSeconds = useRef<number | null>(null)
  const activeDragPointerId = useRef<number | null>(null)
  /** Teardown window listeners for current globe drag */
  const teardownWindowDragRef = useRef<(() => void) | null>(null)

  const finalizeDragPhysics = useCallback(() => {
    draggingRef.current = false
    activeDragPointerId.current = null
    lastClientX.current = null
    lastEventTimeSeconds.current = null
    omegaUserRadPerSec.current = clampMagnitudeRadPerSec(
      dragSmoothedOmega.current,
      PLANET_MAX_USER_ANGULAR_VELOCITY_RAD_PER_S
    )
  }, [])

  const releaseCapturedPointerIfAny = useCallback(() => {
    const prevId = activeDragPointerId.current
    if (prevId == null) return
    try {
      const dom = gl.domElement
      if (typeof dom.releasePointerCapture === 'function') {
        if ('hasPointerCapture' in dom && typeof dom.hasPointerCapture === 'function') {
          if (dom.hasPointerCapture(prevId)) {
            dom.releasePointerCapture(prevId)
          }
        } else {
          dom.releasePointerCapture(prevId)
        }
      }
    } catch {
      /* already released */
    }
  }, [gl.domElement])

  const endGlobeDrag = useCallback(() => {
    teardownWindowDragRef.current?.()
    teardownWindowDragRef.current = null
    releaseCapturedPointerIfAny()
    finalizeDragPhysics()
  }, [finalizeDragPhysics, releaseCapturedPointerIfAny])

  const onGlobeSurfacePointerDown = useCallback(
    (event: PointerSynthetic) => {
      event.stopPropagation()
      /** Replaces stray session — fixes fast clicks / reorder. Must not pass new event to releasePrev. */
      endGlobeDrag()

      const pointerId = event.pointerId

      omegaUserRadPerSec.current = clampMagnitudeRadPerSec(
        omegaUserRadPerSec.current,
        PLANET_MAX_USER_ANGULAR_VELOCITY_RAD_PER_S
      )

      try {
        gl.domElement.setPointerCapture(pointerId)
      } catch {
        /* ignore */
      }

      draggingRef.current = true
      activeDragPointerId.current = pointerId
      lastClientX.current = event.clientX
      lastEventTimeSeconds.current = event.nativeEvent.timeStamp / 1000

      const canvas = gl.domElement

      const onWindowPointerMove = (ev: PointerEvent) => {
        if (
          ev.pointerId !== pointerId ||
          !draggingRef.current ||
          lastClientX.current === null ||
          lastEventTimeSeconds.current === null
        ) {
          return
        }

        const seconds = ev.timeStamp / 1000
        let deltaSeconds = seconds - lastEventTimeSeconds.current
        if (deltaSeconds < TIME_EPSILON_S) deltaSeconds = TIME_EPSILON_S

        const deltaX = ev.clientX - lastClientX.current
        lastClientX.current = ev.clientX
        lastEventTimeSeconds.current = seconds

        const deltaThetaRad = PLANET_DRAG_RADIANS_PER_PIXEL * deltaX
        const instantaneousOmega = deltaThetaRad / deltaSeconds

        dragSmoothedOmega.current = expoSmooth(
          dragSmoothedOmega.current,
          instantaneousOmega,
          PLANET_DRAG_OMEGA_SMOOTH
        )

        omegaUserRadPerSec.current = clampMagnitudeRadPerSec(
          dragSmoothedOmega.current,
          PLANET_MAX_USER_ANGULAR_VELOCITY_RAD_PER_S
        )

        const group = spinGroupRef.current
        if (group) {
          group.rotation.y += deltaThetaRad
        }
      }

      const onWindowPointerEnd = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return
        if (!draggingRef.current) return
        teardownWindowDragRef.current?.()
        teardownWindowDragRef.current = null
        try {
          if (
            typeof canvas.releasePointerCapture === 'function' &&
            canvas.hasPointerCapture?.(pointerId)
          ) {
            canvas.releasePointerCapture(pointerId)
          }
        } catch {
          /* */
        }

        finalizeDragPhysics()
      }

      teardownWindowDragRef.current = () => {
        window.removeEventListener('pointermove', onWindowPointerMove, true)
        window.removeEventListener('pointerup', onWindowPointerEnd, true)
        window.removeEventListener('pointercancel', onWindowPointerEnd, true)
      }

      window.addEventListener('pointermove', onWindowPointerMove, { capture: true, passive: true })
      window.addEventListener('pointerup', onWindowPointerEnd, { capture: true, passive: true })
      window.addEventListener('pointercancel', onWindowPointerEnd, { capture: true, passive: true })
    },
    [endGlobeDrag, finalizeDragPhysics, gl.domElement]
  )

  const onPointerOver = useCallback(() => {
    if (!interactionDesktop) return
    setPointerOverGlobe(true)
  }, [interactionDesktop, setPointerOverGlobe])

  const onPointerOut = useCallback(() => {
    if (!interactionDesktop || draggingRef.current) return
    setPointerOverGlobe(false)
  }, [interactionDesktop, setPointerOverGlobe])

  const onPointerLeave = useCallback(
    (_event: PointerSynthetic) => {
      if (!interactionDesktop || draggingRef.current) return
      setPointerOverGlobe(false)
    },
    [interactionDesktop, setPointerOverGlobe]
  )

  const onPointerCancel = useCallback(
    (event: PointerSynthetic) => {
      if (event.pointerId !== activeDragPointerId.current) return
      endGlobeDrag()
    },
    [endGlobeDrag]
  )

  useEffect(() => {
    const el = gl.domElement
    function onLost(ev: Event) {
      const pe = ev as PointerEvent
      if (pe.pointerId !== activeDragPointerId.current || !draggingRef.current) return
      endGlobeDrag()
    }
    el.addEventListener('lostpointercapture', onLost)
    return () => el.removeEventListener('lostpointercapture', onLost)
  }, [gl.domElement, endGlobeDrag])

  useEffect(() => () => endGlobeDrag(), [endGlobeDrag])

  const applyIdleAndUserSpinStep = useCallback(
    (deltaSeconds: number, legacyRotationTickRate: number) => {
      const group = spinGroupRef.current
      if (!group) {
        return {
          userOmegaMagnitude: Math.abs(omegaUserRadPerSec.current)
        }
      }

      if (!draggingRef.current) {
        omegaUserRadPerSec.current = applyAngularDrag(
          omegaUserRadPerSec.current,
          PLANET_ANGULAR_DAMPING,
          deltaSeconds
        )
        group.rotation.y += omegaUserRadPerSec.current * deltaSeconds
      }

      const idleRadPerSec = planetIdleRotationRadiansPerSecond(legacyRotationTickRate)
      group.rotation.y += idleRadPerSec * deltaSeconds

      return { userOmegaMagnitude: Math.abs(omegaUserRadPerSec.current) }
    },
    []
  )

  return {
    spinGroupRef,
    omegaUserRadPerSec,
    draggingRef,
    applyIdleAndUserSpinStep,
    onGlobeSurfacePointerDown,
    onPointerLeave,
    onPointerCancel,
    onPointerOver,
    onPointerOut
  }
}
