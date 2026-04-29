import Link from 'next/link'
import { FakerOnly, RealOnly } from '~/shared/components/system/FakerGate'
import { pageTitle } from '~/shared/constants/site'
import styles from './styles.module.scss'

export const metadata = { title: pageTitle('Скоро будет') }

export default function ComingSoonPage() {
  return (
    <section className={styles.section}>
      <div className={styles.section__inner}>
        <span className={styles.section__eyebrow}>Скоро</span>
        <h1 className={styles.section__title}>Эту страницу ещё пишем</h1>
        <p className={styles.section__copy}>
          Мы выкатываем платформу по частям. Пока посмотрите курсы или зайдите в свой профиль.
        </p>
        <div className={styles.section__actions}>
          <Link href="/courses" className={styles.section__button}>
            Каталог курсов
          </Link>
          <RealOnly>
            <Link href="/u/me" className={styles.section__buttonGhost}>
              Мой профиль
            </Link>
          </RealOnly>
          <FakerOnly>
            <Link href="/u/codenikita" className={styles.section__buttonGhost}>
              Пример профиля
            </Link>
          </FakerOnly>
        </div>
      </div>
    </section>
  )
}
