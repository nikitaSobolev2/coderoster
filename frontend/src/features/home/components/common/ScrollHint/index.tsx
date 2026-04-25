'use client'

import { useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useSectionScrollerStore } from '~/features/home/components/common/SectionScroller/section-scroller.store'
import { scrollToSectionById } from '~/features/home/components/common/SectionScroller/section-scroll-api'
import { useLoadingStore } from '~/features/home/components/common/AppLoader/loading.store'
import { useCursorFillTarget } from '~/features/home/hooks/useCursorFillTarget'
import styles from './styles.module.scss'

const LABEL_ANIM_S = 0.45
const WIDTH_ANIM_S = 0.42

export default function ScrollHint() {
  const sections = useSectionScrollerStore(state => state.sections)
  const activeIndex = useSectionScrollerStore(state => state.activeIndex)
  const isReady = useLoadingStore(state => state.isReady)

  const actionRef = useRef<HTMLButtonElement>(null)
  const nextLabelRef = useRef<HTMLSpanElement>(null)
  const nextShellRef = useRef<HTMLSpanElement>(null)
  const widthTween = useRef<gsap.core.Tween | null>(null)

  useCursorFillTarget(actionRef)

  const nextSection = sections[activeIndex + 1]
  const nextLabel = nextSection?.label ?? ''
  const isVisible = isReady && nextSection != null

  const goToNextSection = useCallback(() => {
    if (!nextSection) return
    if (useSectionScrollerStore.getState().isAnimating) return
    scrollToSectionById(nextSection.id)
  }, [nextSection])

  useLayoutEffect(() => {
    const shell = nextShellRef.current
    const text = nextLabelRef.current
    if (!shell || !text || !nextLabel || !isVisible) return

    const targetWidth = text.offsetWidth
    widthTween.current?.kill()

    const startWidth = shell.getBoundingClientRect().width
    if (startWidth === 0 || Math.abs(startWidth - targetWidth) < 0.5) {
      gsap.set(shell, { width: targetWidth })
      return
    }

    widthTween.current = gsap.to(shell, {
      width: targetWidth,
      duration: WIDTH_ANIM_S,
      ease: 'power2.inOut',
      overwrite: 'auto'
    })
  }, [activeIndex, nextLabel, isVisible])

  useEffect(() => {
    const node = nextLabelRef.current
    if (!node || !nextLabel) return

    const animation = gsap.fromTo(
      node,
      { y: '0.45em', opacity: 0, filter: 'blur(5px)' },
      {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration: LABEL_ANIM_S,
        ease: 'power2.out'
      }
    )
    return () => {
      animation.kill()
    }
  }, [activeIndex, nextLabel])

  return (
    <button
      type="button"
      ref={actionRef}
      className={`${styles.scrollHint} ${isVisible ? '' : styles.scrollHint_hidden}`}
      onClick={goToNextSection}
      disabled={!isVisible}
      tabIndex={isVisible ? 0 : -1}
      aria-label={isVisible && nextLabel ? `Следующий раздел: ${nextLabel}` : undefined}
    >
      <span className={styles.scrollHint__label}>Прокрутите</span>
      <span className={styles.scrollHint__divider} aria-hidden="true" />
      <span ref={nextShellRef} className={styles.scrollHint__nextShell}>
        <span ref={nextLabelRef} className={styles.scrollHint__next}>
          {nextLabel}
        </span>
      </span>
      <FontAwesomeIcon className={styles.scrollHint__icon} icon={faChevronDown} aria-hidden />
    </button>
  )
}
