'use client'

import { useRef } from 'react'
import { useHeroEntrance } from '~/features/home/hooks/sectionEntrance/useHeroEntrance'
import InteractiveButton from '~/features/home/components/ui/InteractiveButton'
import InteractiveHeading from '~/features/home/components/ui/InteractiveHeading'
import RotatingWord from '~/features/home/components/ui/RotatingWord'
import { HERO_SECTION_ID } from '~/features/home/components/sections/section-ids'
import styles from './styles.module.scss'

const ROTATING_OUTCOMES = [
  'навыки программирования',
  'инженерное мышление',
  'софт-скиллы разработчика',
  'свою карьеру в IT',
  'уверенность в коде'
]

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  useHeroEntrance(sectionRef, {
    title: styles.hero__title as string,
    description: styles.hero__description as string,
    button: styles.hero__button as string
  })

  return (
    <section ref={sectionRef} id={HERO_SECTION_ID} className={styles.hero} data-section="hero">
      <div className={styles.hero__inner}>
        <InteractiveHeading as="h1" size={120} className={styles.hero__title}>
          освой программирование быстрее
        </InteractiveHeading>
        <p className={styles.hero__description}>
          CodeRoster — увлекательный способ прокачать
          <br />
          <RotatingWord className={styles.hero__rotator} words={ROTATING_OUTCOMES} />
        </p>
        <InteractiveButton className={styles.hero__button} href="/login">
          Начать сейчас
        </InteractiveButton>
      </div>
    </section>
  )
}
