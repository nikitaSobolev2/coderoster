'use client'

import { useState } from 'react'
import { Avatar, Button, Textarea } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '~/trpc/react'
import { formatStableDateDdMmYyyy } from '~/shared/lib/formatStableDate'
import styles from './styles.module.scss'

export interface Props {
  username: string
  isAuthenticated: boolean
}

const PAGE_SIZE = 10

export default function ProfileComments({ username, isAuthenticated }: Props) {
  const [draft, setDraft] = useState('')
  const utils = api.useUtils()
  const list = api.comment.listOnProfile.useQuery({ username, cursor: null })

  const post = api.comment.post.useMutation({
    onSuccess: async () => {
      setDraft('')
      await utils.comment.listOnProfile.invalidate({ username })
      notifications.show({ color: 'green', message: 'Комментарий опубликован.' })
    }
  })

  const items = list.data?.items ?? []

  return (
    <section className={styles.section}>
      <header className={styles.section__head}>
        <h3 className={styles.section__title}>Комментарии</h3>
        <span className={styles.section__count}>
          {items.length} • показаны последние {PAGE_SIZE}
        </span>
      </header>

      {isAuthenticated ? (
        <div className={styles.composer}>
          <Textarea
            value={draft}
            onChange={event => setDraft(event.currentTarget.value)}
            placeholder="Напиши что-нибудь хорошее…"
            autosize
            minRows={2}
            maxRows={6}
          />
          <div className={styles.composer__actions}>
            <Button
              disabled={!draft.trim()}
              loading={post.isPending}
              onClick={() => post.mutate({ username, body: draft.trim() })}
            >
              Опубликовать
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.composer}>
          <p className={styles.composer__signin}>
            Чтобы оставить комментарий, <a href="/login">войди в профиль</a>.
          </p>
        </div>
      )}

      {list.isLoading ? (
        <div className={styles.empty}>Загружаем…</div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>Пока тихо. Стань первым.</div>
      ) : (
        <ul className={styles.list}>
          {items.map(comment => (
            <li key={comment.id} className={styles.comment}>
              <Avatar
                src={comment.authorAvatarUrl ?? undefined}
                radius="xl"
                size={36}
                color="grape"
              >
                {comment.authorDisplayName[0]}
              </Avatar>
              <div className={styles.comment__body}>
                <div className={styles.comment__head}>
                  <span className={styles.comment__name}>{comment.authorDisplayName}</span>
                  <span className={styles.comment__handle}>@{comment.authorUsername}</span>
                  <span className={styles.comment__time}>
                    {formatStableDateDdMmYyyy(comment.createdAt)}
                  </span>
                </div>
                <p className={styles.comment__text}>{comment.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
