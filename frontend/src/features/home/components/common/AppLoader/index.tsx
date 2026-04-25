'use client'

import { useEffect, useState } from 'react'
import { DefaultLoadingManager } from 'three'
import Logo from '~/shared/components/common/Logo'
import { useLoadingStore } from './loading.store'
import styles from './styles.module.scss'

const FADE_OUT_MS = 600
const READY_HOLD_MS = 250
const FALLBACK_TIMEOUT_MS = 12000

export default function AppLoader() {
  const progress = useLoadingStore(state => state.progress)
  const isReady = useLoadingStore(state => state.isReady)
  const setProgress = useLoadingStore(state => state.setProgress)
  const markReady = useLoadingStore(state => state.markReady)

  const [hasUnmounted, setHasUnmounted] = useState(false)

  useEffect(() => {
    DefaultLoadingManager.onProgress = (_url, loaded, total) => {
      const ratio = total > 0 ? loaded / total : 0
      setProgress(ratio * 0.95)
    }
    DefaultLoadingManager.onLoad = () => {
      window.setTimeout(markReady, READY_HOLD_MS)
    }
    DefaultLoadingManager.onError = () => {
      markReady()
    }

    const fallbackTimer = window.setTimeout(markReady, FALLBACK_TIMEOUT_MS)
    return () => window.clearTimeout(fallbackTimer)
  }, [setProgress, markReady])

  useEffect(() => {
    if (!isReady) return
    const fadeTimer = window.setTimeout(() => setHasUnmounted(true), FADE_OUT_MS)
    return () => window.clearTimeout(fadeTimer)
  }, [isReady])

  if (hasUnmounted) return null

  return (
    <div className={`${styles.loader} ${isReady ? styles.loader_fading : ''}`}>
      <div className={styles.loader__inner}>
        <Logo className={styles.loader__logo} />
        <div className={styles.loader__bar}>
          <div className={styles.loader__fill} style={{ width: `${progress * 100}%` }} />
        </div>
        <div className={styles.loader__meta}>
          <span className={styles.loader__percent}>{Math.round(progress * 100)}%</span>
          <button className={styles.loader__skip} type="button" onClick={markReady}>
            Пропустить
          </button>
        </div>
      </div>
    </div>
  )
}
