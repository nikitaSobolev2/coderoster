"use client";

import React from 'react';
import { Canvas } from '@react-three/fiber'
import Planet from '~/features/home/components/3d/models/Planet'
import styles from './styles.module.scss'

export default function PlanetScene() {
  return (
    <div className={styles.container}>
      <Canvas camera={{ position: [200, 0, 100], fov: 50 }}>
        <ambientLight intensity={0.2} />
        <directionalLight 
          color="#fff1e0"
          position={[5000, 6000, 10000]}
          intensity={2.2}
        />
        <directionalLight 
          color="#1B1EC8"
          position={[5000, 6000, 10000]}
          intensity={2.5}
        />
        <React.Suspense fallback={<mesh><boxGeometry args={[1,1,1]}/><meshBasicMaterial color="orange" wireframe/></mesh>}>
          <Planet />
        </React.Suspense>
      </Canvas>
    </div>
  )
}