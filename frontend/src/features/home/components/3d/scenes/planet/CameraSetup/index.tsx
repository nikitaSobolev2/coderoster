import { useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { PerspectiveCamera } from 'three'

const INITIAL_CAMERA_FOV = 50

interface CameraSetupProps {
  fixedSize: { width: number; height: number } | null
}

export function CameraSetup({ fixedSize }: CameraSetupProps) {
  const { camera } = useThree()

  useLayoutEffect(() => {
    if (
      !(camera instanceof PerspectiveCamera) ||
      !fixedSize ||
      fixedSize.width === 0 ||
      fixedSize.height === 0
    )
      return

    const objectWorldDiameter = 30 // Double the planet radius to account for full diameter
    const verticalFovRadians = (INITIAL_CAMERA_FOV * Math.PI) / 180
    const aspectRatio = fixedSize.width / fixedSize.height
    const targetFrustumWidthForObject = objectWorldDiameter / 0.5
    const D = targetFrustumWidthForObject / (2 * Math.tan(verticalFovRadians / 2) * aspectRatio)

    camera.position.set(0, 0, D)
    camera.fov = INITIAL_CAMERA_FOV
    camera.aspect = aspectRatio
    camera.updateProjectionMatrix()
  }, [camera, fixedSize])

  return null
}
