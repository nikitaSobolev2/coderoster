import type { UserRole } from '~/server/repositories/types'

export const PLATFORM_ROLE_LABEL: Record<UserRole, string> = {
  learner: 'Учащийся',
  author: 'Автор',
  moderator: 'Модератор',
  admin: 'Администратор'
}

export const PLATFORM_ROLE_OPTIONS: { value: UserRole; label: string }[] = (
  Object.keys(PLATFORM_ROLE_LABEL) as UserRole[]
).map(value => ({ value, label: PLATFORM_ROLE_LABEL[value] }))
