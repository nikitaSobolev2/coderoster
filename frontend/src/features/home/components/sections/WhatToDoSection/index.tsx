'use client'

import { useRef } from 'react'
import { useCursorImageTarget } from '~/features/home/hooks/useCursorImageTarget'
import { useWhatToDoEntrance } from '~/features/home/hooks/sectionEntrance/useWhatToDoEntrance'
import SectionHeader from '~/features/home/components/ui/SectionHeader'
import { WHAT_TO_DO_SECTION_ID } from '~/features/home/components/sections/section-ids'
import styles from './styles.module.scss'

interface Solution {
  title: string
  description: string
  imageSrc: string
}

const SOLUTIONS: Solution[] = [
  {
    title: 'писать код, а не смотреть',
    description: 'Каждый урок — задача, которую ты решаешь сам. Видео и теория идут в нагрузку.',
    imageSrc:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=640&q=70'
  },
  {
    title: 'получать обратную связь',
    description:
      'Тесты прогоняют твоё решение и показывают, где сломалось. Никаких "посмотрите в комментариях".',
    imageSrc:
      'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=640&q=70'
  },
  {
    title: 'видеть прогресс ежедневно',
    description: 'XP, стрики и уровни превращают практику в петлю, к которой хочется возвращаться.',
    imageSrc:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=640&q=70'
  }
]

export default function WhatToDoSection() {
  const sectionRef = useRef<HTMLElement>(null)
  useWhatToDoEntrance(sectionRef, { solution: styles.solution as string })

  return (
    <section
      id={WHAT_TO_DO_SECTION_ID}
      className={styles.whatToDo}
      data-section="what-to-do"
      ref={sectionRef}
    >
      <div className={styles.whatToDo__inner}>
        <SectionHeader
          number="03"
          eyebrow="Решение"
          title="что же делать?"
          subtitle="Меняем привычки потребления контента на привычки производства кода. Три простых правила."
        />
        <ul className={styles.whatToDo__list}>
          {SOLUTIONS.map((solution, index) => (
            <SolutionRow key={solution.title} solution={solution} index={index + 1} />
          ))}
        </ul>
      </div>
    </section>
  )
}

function SolutionRow({ solution, index }: { solution: Solution; index: number }) {
  const ref = useRef<HTMLLIElement>(null)
  useCursorImageTarget(ref, solution.imageSrc)

  return (
    <li ref={ref} className={styles.solution}>
      <span className={styles.solution__index}>{`0${index}`}</span>
      <div className={styles.solution__body}>
        <h3 className={styles.solution__title}>{solution.title}</h3>
        <p className={styles.solution__description}>{solution.description}</p>
      </div>
    </li>
  )
}
