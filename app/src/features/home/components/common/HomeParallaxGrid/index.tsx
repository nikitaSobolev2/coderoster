'use client'

import { useMediaQuery } from '@mantine/hooks'
import { useHomeGridPointerParallax } from '~/features/home/hooks/useHomeGridPointerParallax'
import { HOME_DESKTOP_INTERACTION_MQ } from '~/shared/constants/homeDesktopInteractionMediaQuery'
import styles from './styles.module.scss'

export default function HomeParallaxGrid() {
  const isDesktop = useMediaQuery(HOME_DESKTOP_INTERACTION_MQ)
  if (!isDesktop) return null
  return <HomeParallaxGridRuntime />
}

function HomeParallaxGridRuntime() {
  const layerRef = useHomeGridPointerParallax()
  return (
    <div className={styles.wrapper} aria-hidden>
      <div ref={layerRef} className={styles.layer} />
      <div className={styles.vignette} aria-hidden />
    </div>
  )
}
