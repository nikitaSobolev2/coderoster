'use client'

import { useRef } from 'react'
import { useHowToStartEntrance } from '~/features/home/hooks/sectionEntrance/useHowToStartEntrance'
import { faBookOpen, faCodeCompare, faRocket, faUserPlus } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import SectionHeader from '~/features/home/components/ui/SectionHeader'
import StepCard from '~/features/home/components/ui/StepCard'
import { HOW_TO_START_SECTION_ID } from '~/features/home/components/sections/section-ids'
import styles from './styles.module.scss'

interface Step {
  index: string
  icon: IconDefinition
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    index: '01',
    icon: faUserPlus,
    title: 'Создай профиль',
    description: 'Минута на регистрацию через WorkOS — без подтверждения email вручную.'
  },
  {
    index: '02',
    icon: faBookOpen,
    title: 'Выбери трек',
    description:
      'JavaScript, Python, алгоритмы или веб. Каждый трек — структурированный путь от нуля.'
  },
  {
    index: '03',
    icon: faCodeCompare,
    title: 'Реши первую задачу',
    description: 'Открой редактор в браузере, напиши код, прогон тестов покажет, что сломалось.'
  },
  {
    index: '04',
    icon: faRocket,
    title: 'Получи первый результат',
    description: 'Закрытая задача = +XP, +стрик, +достижение. Цикл, который тянет дальше.'
  }
]

export default function HowToStartSection() {
  const sectionRef = useRef<HTMLElement>(null)
  useHowToStartEntrance(sectionRef)

  return (
    <section
      ref={sectionRef}
      id={HOW_TO_START_SECTION_ID}
      className={styles.howToStart}
      data-section="how-to-start"
    >
      <div className={styles.howToStart__inner}>
        <SectionHeader
          number="04"
          eyebrow="Как начать"
          title="четыре шага до первого результата"
          subtitle="От регистрации до решённой задачи — меньше десяти минут."
        />
        <ol className={styles.howToStart__list}>
          {STEPS.map(step => (
            <StepCard
              key={step.index}
              index={step.index}
              icon={step.icon}
              title={step.title}
              description={step.description}
            />
          ))}
        </ol>
      </div>
    </section>
  )
}
