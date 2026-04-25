'use client'

import { useRef } from 'react'
import { useFeaturesEntrance } from '~/features/home/hooks/sectionEntrance/useFeaturesEntrance'
import { faBookOpen, faLaptopCode, faStar, faTrophy } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import InteractiveButton from '~/features/home/components/ui/InteractiveButton'
import SectionHeader from '~/features/home/components/ui/SectionHeader'
import FeatureCard from '~/features/home/components/ui/FeatureCard'
import featureCardStyles from '~/features/home/components/ui/FeatureCard/styles.module.scss'
import { FEATURES_SECTION_ID } from '~/features/home/components/sections/section-ids'
import styles from './styles.module.scss'

interface Feature {
  icon: IconDefinition
  title: string
  description: string
  comingSoon?: boolean
}

const FEATURES: Feature[] = [
  {
    icon: faLaptopCode,
    title: 'Онлайн редактор',
    description:
      'Пиши и запускай код прямо в браузере. Несколько языков, тесты, вывод результатов.',
    comingSoon: true
  },
  {
    icon: faTrophy,
    title: 'Геймификация',
    description:
      'XP за задачи и уроки, уровни, стрики и глобальные лидерборды. Прогресс, который мотивирует.'
  },
  {
    icon: faBookOpen,
    title: 'Курсы',
    description:
      'Структурированные треки от нуля до реального проекта. Видео, теория, практика в одном месте.',
    comingSoon: true
  },
  {
    icon: faStar,
    title: 'Достижения',
    description:
      'Разблокируй награды за прогресс, стрики и скорость. Показывай результаты на публичном профиле.'
  }
]

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null)
  useFeaturesEntrance(sectionRef, {
    cta: styles.features__cta!,
    ctaTitle: styles.features__ctaTitle!,
    card: featureCardStyles.featureCard!
  })

  return (
    <section
      ref={sectionRef}
      id={FEATURES_SECTION_ID}
      className={styles.features}
      data-section="features"
    >
      <div className={styles.features__inner}>
        <SectionHeader
          number="05"
          eyebrow="Платформа"
          title="всё что нужно для роста"
          subtitle="CodeRoster объединяет инструменты, мотивацию и структуру в одной платформе."
        />
        <ul className={styles.features__grid}>
          {FEATURES.map(feature => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              comingSoon={feature.comingSoon}
            />
          ))}
        </ul>
        <div className={styles.features__cta}>
          <p className={styles.features__ctaTitle}>готов начать?</p>
          <InteractiveButton href="/login">Начать бесплатно</InteractiveButton>
        </div>
      </div>
    </section>
  )
}
