import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '~/server/db'
import Markdown from '~/shared/components/ui/Markdown'
import styles from './styles.module.scss'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await db.contentPage.findFirst({
    where: { slug, published: true },
    select: { title: true, excerpt: true }
  })
  if (!page) return { title: 'Не найдено' }
  return {
    title: `${page.title} · CodeRoster`,
    description: page.excerpt
  }
}

export default async function PlatformContentPage({ params }: Props) {
  const { slug } = await params
  const page = await db.contentPage.findFirst({ where: { slug, published: true } })
  if (!page) notFound()
  return (
    <article className={styles.page}>
      <header className={styles.page__header}>
        <h1 className={styles.page__title}>{page.title}</h1>
        {page.excerpt ? <p className={styles.page__excerpt}>{page.excerpt}</p> : null}
      </header>
      <Markdown source={page.body} />
    </article>
  )
}
