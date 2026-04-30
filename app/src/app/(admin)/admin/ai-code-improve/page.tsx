import { HydrateClient, api } from '~/trpc/server'
import AdminPageHeader from '~/features/admin/_shared/AdminPageHeader'
import AiCodeImproveSettingsPanel from '~/features/admin/ai-code-improve/AiCodeImproveSettingsPanel'

export const dynamic = 'force-dynamic'

export default async function AdminAiCodeImprovePage() {
  await api.admin.aiCodeImprove.get.prefetch()
  return (
    <>
      <AdminPageHeader
        title="ИИ: разбор кода"
        subtitle="Глобальная модель для потокового улучшения кода учеников (очередь RabbitMQ → consumer)."
      />
      <HydrateClient>
        <AiCodeImproveSettingsPanel />
      </HydrateClient>
    </>
  )
}
