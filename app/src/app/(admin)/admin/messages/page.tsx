import { api, HydrateClient } from '~/trpc/server'
import AdminPageHeader from '~/features/admin/_shared/AdminPageHeader'
import ContactMessagesAdmin from '~/features/admin/contact-messages/ContactMessagesAdmin'

export const dynamic = 'force-dynamic'

export default async function AdminContactMessagesPage() {
  await api.admin.contactMessages.list.prefetch({})
  return (
    <>
      <AdminPageHeader
        title="Сообщения"
        subtitle="Обращения через форму на лендинге и в подвале платформы. «Ответить» открывает почтовый клиент с цитируемым текстом."
      />
      <HydrateClient>
        <ContactMessagesAdmin />
      </HydrateClient>
    </>
  )
}