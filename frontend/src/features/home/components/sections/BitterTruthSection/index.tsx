'use client'

import { useRef } from 'react'
import { useBitterTruthEntrance } from '~/features/home/hooks/sectionEntrance/useBitterTruthEntrance'
import { faHourglassHalf, faMaskFace, faRoadCircleXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { useCursorOutlineTarget } from '~/features/home/hooks/useCursorOutlineTarget'
import SectionHeader from '~/features/home/components/ui/SectionHeader'
import { BITTER_TRUTH_SECTION_ID } from '~/features/home/components/sections/section-ids'
import styles from './styles.module.scss'

interface FearFact {
  icon: IconDefinition
  title: string
  description: string
}

const FEAR_FACTS: FearFact[] = [
  {
    icon: faMaskFace,
    title: 'Страх показаться глупым',
    description:
      'Кажется, что все вокруг уже умеют, а вы только начинаете. На самом деле каждый разработчик помнит свой первый print("hello").'
  },
  {
    icon: faHourglassHalf,
    title: 'Иллюзия "слишком поздно"',
    description:
      'Возраст и опыт — миф. Программирование выбирает упрямых, а не молодых. Мы видели джуниоров и в 18, и в 45.'
  },
  {
    icon: faRoadCircleXmark,
    title: 'Хаос вместо плана',
    description:
      '20 курсов в открытых вкладках, 5 каналов на YouTube, ноль кода в редакторе. Без структуры теория не превращается в навык.'
  }
]

export default function BitterTruthSection() {
  const sectionRef = useRef<HTMLElement>(null)
  useBitterTruthEntrance(sectionRef, { item: styles.fearFact as string })

  return (
    <section
      ref={sectionRef}
      id={BITTER_TRUTH_SECTION_ID}
      className={styles.bitterTruth}
      data-section="bitter-truth"
    >
      <div className={styles.bitterTruth__inner}>
        <SectionHeader
          number="02"
          eyebrow="Горькая правда"
          title="почему большинство боятся начать"
          subtitle="Не код пугает — пугают внутренние истории, которые мы рассказываем себе раньше, чем нажмём первую клавишу."
        />
        <ul className={styles.bitterTruth__list}>
          {FEAR_FACTS.map(fact => (
            <FearFactItem key={fact.title} fact={fact} />
          ))}
        </ul>
      </div>
    </section>
  )
}

function FearFactItem({ fact }: { fact: FearFact }) {
  const itemRef = useRef<HTMLLIElement>(null)
  useCursorOutlineTarget(itemRef)

  return (
    <li ref={itemRef} className={styles.fearFact}>
      <span className={styles.fearFact__icon}>
        <FontAwesomeIcon icon={fact.icon} />
      </span>
      <h3 className={styles.fearFact__title}>{fact.title}</h3>
      <p className={styles.fearFact__description}>{fact.description}</p>
    </li>
  )
}
