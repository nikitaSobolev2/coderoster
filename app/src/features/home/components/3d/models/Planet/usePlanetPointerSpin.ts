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
  PLANET_COOLDOWN_OMEGA_COMPLETE_RAD_PER_S,
  PLANET_DANGER_ENTER_COARSE_RAD_PER_S,
  PLANET_DANGER_ENTER_RAD_PER_S,
  PLANET_DANGER_EXIT_COARSE_RAD_PER_S,
  PLANET_DANGER_EXIT_RAD_PER_S,
  PLANET_DRAG_COARSE_SENSITIVITY_MULTIPLIER,
  PLANET_DRAG_OMEGA_SMOOTH,
  PLANET_DRAG_OMEGA_SMOOTH_COARSE,
  PLANET_DRAG_RADIANS_PER_PIXEL,
  PLANET_MAX_USER_ANGULAR_VELOCITY_RAD_PER_S,
  PLANET_MOBILE_GESTURE_COMMIT_PX,
  PLANET_RECOVERY_ANGULAR_DAMPING
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
    dangerLatched: boolean
  }
  onGlobeSurfacePointerDown: (event: PointerSynthetic) => void
  onPointerLeave: (event: PointerSynthetic) => void
  onPointerCancel: (event: PointerSynthetic) => void
  onPointerOver: () => void
  onPointerOut: () => void
} {
  const { interactionDesktop, setPointerOverGlobe } = options

  const dangerEnterRadPerS = interactionDesktop
    ? PLANET_DANGER_ENTER_RAD_PER_S
    : PLANET_DANGER_ENTER_COARSE_RAD_PER_S
  const dangerExitRadPerS = interactionDesktop
    ? PLANET_DANGER_EXIT_RAD_PER_S
    : PLANET_DANGER_EXIT_COARSE_RAD_PER_S
  const dragRadiansPerPx =
    PLANET_DRAG_RADIANS_PER_PIXEL *
    (interactionDesktop ? 1 : PLANET_DRAG_COARSE_SENSITIVITY_MULTIPLIER)
  const dragOmegaSmooth = interactionDesktop
    ? PLANET_DRAG_OMEGA_SMOOTH
    : PLANET_DRAG_OMEGA_SMOOTH_COARSE

  const { gl } = useThree()
  const spinGroupRef = useRef<Group | null>(null)
  const omegaUserRadPerSec = useRef(0)
  const dragSmoothedOmega = useRef(0)
  const draggingRef = useRef(false)
  const lastClientX = useRef<number | null>(null)
  const lastEventTimeSeconds = useRef<number | null>(null)
  const activeDragPointerId = useRef<number | null>(null)
  const teardownWindowDragRef = useRef<(() => void) | null>(null)
  /** Coarse-pointer axis probe: listeners before `setPointerCapture` so vertical scroll can win. */
  const pendingGestureTeardownRef = useRef<(() => void) | null>(null)

  /** No angular decay while true (coasting at “red” speed bucket). */
  const dangerLatchedRef = useRef(false)
  /** Post-unlatch: stronger damping until user ω ≈ 0. */
  const cooldownRecoveryRef = useRef(false)

  const updateDangerLatchForOmegaMagnitude = useCallback(
    (omegaMag: number) => {
      if (omegaMag >= dangerEnterRadPerS) {
        dangerLatchedRef.current = true
      }
      if (dangerLatchedRef.current && omegaMag <= dangerExitRadPerS) {
        dangerLatchedRef.current = false
        cooldownRecoveryRef.current = true
      }
    },
    [dangerEnterRadPerS, dangerExitRadPerS]
  )

  const finalizeDragPhysics = useCallback(() => {
    draggingRef.current = false
    activeDragPointerId.current = null
    lastClientX.current = null
    lastEventTimeSeconds.current = null
    omegaUserRadPerSec.current = clampMagnitudeRadPerSec(
      dragSmoothedOmega.current,
      PLANET_MAX_USER_ANGULAR_VELOCITY_RAD_PER_S
    )
    updateDangerLatchForOmegaMagnitude(Math.abs(omegaUserRadPerSec.current))
  }, [updateDangerLatchForOmegaMagnitude])

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

  const clearPendingGestureListeners = useCallback(() => {
    pendingGestureTeardownRef.current?.()
    pendingGestureTeardownRef.current = null
  }, [])

  const endGlobeDrag = useCallback(() => {
    clearPendingGestureListeners()
    teardownWindowDragRef.current?.()
    teardownWindowDragRef.current = null
    releaseCapturedPointerIfAny()
    finalizeDragPhysics()
  }, [clearPendingGestureListeners, finalizeDragPhysics, releaseCapturedPointerIfAny])

  const onGlobeSurfacePointerDown = useCallback(
    (event: PointerSynthetic) => {
      event.stopPropagation()
      endGlobeDrag()

      const pointerId = event.pointerId

      omegaUserRadPerSec.current = clampMagnitudeRadPerSec(
        omegaUserRadPerSec.current,
        PLANET_MAX_USER_ANGULAR_VELOCITY_RAD_PER_S
      )

      const canvas = gl.domElement

      const setupCommittedGlobeDrag = (initial: PointerEvent) => {
        try {
          gl.domElement.setPointerCapture(pointerId)
        } catch {
          /* ignore */
        }

        draggingRef.current = true
        activeDragPointerId.current = pointerId
        lastClientX.current = initial.clientX
        lastEventTimeSeconds.current = initial.timeStamp / 1000

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

          const deltaThetaRad = dragRadiansPerPx * deltaX
          const instantaneousOmega = deltaThetaRad / deltaSeconds

          dragSmoothedOmega.current = expoSmooth(
            dragSmoothedOmega.current,
            instantaneousOmega,
            dragOmegaSmooth
          )

          omegaUserRadPerSec.current = clampMagnitudeRadPerSec(
            dragSmoothedOmega.current,
            PLANET_MAX_USER_ANGULAR_VELOCITY_RAD_PER_S
          )

          updateDangerLatchForOmegaMagnitude(Math.abs(omegaUserRadPerSec.current))

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

        window.addEventListener('pointermove', onWindowPointerMove, {
          capture: true,
          passive: true
        })
        window.addEventListener('pointerup', onWindowPointerEnd, { capture: true, passive: true })
        window.addEventListener('pointercancel', onWindowPointerEnd, {
          capture: true,
          passive: true
        })
      }

      if (interactionDesktop) {
        setupCommittedGlobeDrag(event.nativeEvent)
        return
      }

      const startX = event.clientX
      const startY = event.clientY

      const onPendingPointerMove = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return

        const dx = ev.clientX - startX
        const dy = ev.clientY - startY

        if (Math.max(Math.abs(dx), Math.abs(dy)) < PLANET_MOBILE_GESTURE_COMMIT_PX) {
          return
        }

        clearPendingGestureListeners()

        if (Math.abs(dy) >= Math.abs(dx)) {
          return
        }

        setupCommittedGlobeDrag(ev)
      }

      const onPendingPointerEnd = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return
        clearPendingGestureListeners()
      }

      pendingGestureTeardownRef.current = () => {
        window.removeEventListener('pointermove', onPendingPointerMove, true)
        window.removeEventListener('pointerup', onPendingPointerEnd, true)
        window.removeEventListener('pointercancel', onPendingPointerEnd, true)
      }

      window.addEventListener('pointermove', onPendingPointerMove, { capture: true, passive: true })
      window.addEventListener('pointerup', onPendingPointerEnd, { capture: true, passive: true })
      window.addEventListener('pointercancel', onPendingPointerEnd, {
        capture: true,
        passive: true
      })
    },
    [
      clearPendingGestureListeners,
      endGlobeDrag,
      finalizeDragPhysics,
      gl.domElement,
      interactionDesktop,
      updateDangerLatchForOmegaMagnitude,
      dragRadiansPerPx,
      dragOmegaSmooth
    ]
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
      const omegaMag = Math.abs(omegaUserRadPerSec.current)
      updateDangerLatchForOmegaMagnitude(omegaMag)

      if (!group) {
        return {
          userOmegaMagnitude: omegaMag,
          dangerLatched: dangerLatchedRef.current
        }
      }

      if (!draggingRef.current) {
        const latched = dangerLatchedRef.current

        if (latched) {
          group.rotation.y += omegaUserRadPerSec.current * deltaSeconds
        } else {
          const recovery = cooldownRecoveryRef.current
          const damping = recovery ? PLANET_RECOVERY_ANGULAR_DAMPING : PLANET_ANGULAR_DAMPING
          omegaUserRadPerSec.current = applyAngularDrag(
            omegaUserRadPerSec.current,
            damping,
            deltaSeconds
          )
          group.rotation.y += omegaUserRadPerSec.current * deltaSeconds

          const mag = Math.abs(omegaUserRadPerSec.current)
          if (recovery && mag < PLANET_COOLDOWN_OMEGA_COMPLETE_RAD_PER_S) {
            cooldownRecoveryRef.current = false
            omegaUserRadPerSec.current = 0
          }
          updateDangerLatchForOmegaMagnitude(Math.abs(omegaUserRadPerSec.current))
        }
      }

      const idleRadPerSec = planetIdleRotationRadiansPerSecond(legacyRotationTickRate)
      group.rotation.y += idleRadPerSec * deltaSeconds

      return {
        userOmegaMagnitude: Math.abs(omegaUserRadPerSec.current),
        dangerLatched: dangerLatchedRef.current
      }
    },
    [updateDangerLatchForOmegaMagnitude]
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
