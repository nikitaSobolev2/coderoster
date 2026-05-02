import type { Mesh, Object3D } from 'three'

/** Skip Three.js raycaster for this mesh so pointer events hit another mesh (e.g. inner planet surface). */
export function disableMeshRaycast(object: Object3D | null): void {
  if (!object) return
  const mesh = object as Mesh
  mesh.raycast = () => {
    /* no-op: ray passes through to geometry behind */
  }
}
