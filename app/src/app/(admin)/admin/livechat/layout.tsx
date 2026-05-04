import type { ReactNode } from 'react'

import { requireBackofficePageRole } from '~/server/auth/requireBackofficeRole'

export default async function AdminLivechatLayout({ children }: { children: ReactNode }) {
  await requireBackofficePageRole(['admin'])
  return children
}
