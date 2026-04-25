'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import styles from './styles.module.scss'

const DEFAULT_INTERVAL_MS = 2400
const SWAP_DURATION_S = 0.5

export interface Props {
  words: string[]
  intervalMs?: number
  className?: string
}

export default function RotatingWord({
  words,
  intervalMs = DEFAULT_INTERVAL_MS,
  className = ''
}: Props) {
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (words.length <= 1) return
    const timer = window.setInterval(() => {
      setIndex(previous => (previous + 1) % words.length)
    }, intervalMs)
    return () => window.clearInterval(timer)
  }, [words.length, intervalMs])

  useEffect(() => {
    const node = wrapperRef.current
    if (!node) return

    const animation = gsap.fromTo(
      node,
      { y: '0.6em', opacity: 0, filter: 'blur(6px)' },
      {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration: SWAP_DURATION_S,
        ease: 'power2.out'
      }
    )
    return () => {
      animation.kill()
    }
  }, [index])

  return (
    <span className={`${styles.rotatingWord} ${className}`}>
      <span ref={wrapperRef} className={styles.rotatingWord__current}>
        {words[index]}
      </span>
    </span>
  )
}
