'use client'

import { useState } from 'react'
import {
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  NumberInput,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Tooltip
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { api } from '~/trpc/react'
import AdminCard from '~/features/admin/_shared/AdminCard'
import MarkdownEditor from '~/shared/components/ui/MarkdownEditor'
import PlanMarketingBulletsEditor from '~/features/admin/plans/PlanMarketingBulletsEditor'
import type { PlanMarketingBullet } from '~/shared/plan/planMarketing'

type PlanRow = {
  id: string
  slug: string
  name: string
  shortDescription: string
  marketingMarkdown: string
  marketingFeatures: PlanMarketingBullet[]
  isBestseller: boolean
  tierLevel: number
  xpBonusPercent: number
  sortOrder: number
  isDefaultFree: boolean
  maxActiveCourses: number | null
  userCount: number
}

export default function PlansAdminPanel() {
  const list = api.admin.plans.list.useQuery()
  const utils = api.useUtils()
  const [editing, setEditing] = useState<PlanRow | null>(null)
  const [creating, { open: openCreate, close: closeCreate }] = useDisclosure(false)

  const setDefault = api.admin.plans.setDefaultFree.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Бесплатный по умолчанию обновлён.' })
      await utils.admin.plans.list.invalidate()
    },
    onError: e => notifications.show({ color: 'red', message: e.message })
  })

  const setBestseller = api.admin.plans.setBestseller.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Хит продаж на витрине обновлён.' })
      await utils.admin.plans.list.invalidate()
    },
    onError: e => notifications.show({ color: 'red', message: e.message })
  })

  const clearBestseller = api.admin.plans.clearBestseller.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Подсветка снята.' })
      await utils.admin.plans.list.invalidate()
    },
    onError: e => notifications.show({ color: 'red', message: e.message })
  })

  if (list.isLoading) {
    return <Loader />
  }

  if (!list.data) return null

  return (
    <Stack gap="lg">
      <AdminCard
        title="Тарифные планы"
        description="Уровень tierLevel уникален. Один план isDefaultFree — для новых пользователей. Один isBestseller — акцент на /plans."
        actions={<Button onClick={openCreate}>Новый план</Button>}
      >
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Имя</Table.Th>
              <Table.Th>Slug</Table.Th>
              <Table.Th>Tier</Table.Th>
              <Table.Th>XP %</Table.Th>
              <Table.Th>Max курсов</Table.Th>
              <Table.Th>Юзеров</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {list.data.map(row => (
              <Table.Tr key={row.id}>
                <Table.Td>
                  <Group gap={6}>
                    {row.name}
                    {row.isBestseller ? (
                      <Badge size="xs" variant="outline" color="grape">
                        хит
                      </Badge>
                    ) : null}
                    {row.isDefaultFree ? (
                      <Badge size="xs" variant="light">
                        free default
                      </Badge>
                    ) : null}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" ff="monospace">
                    {row.slug}
                  </Text>
                </Table.Td>
                <Table.Td>{row.tierLevel}</Table.Td>
                <Table.Td>{row.xpBonusPercent}</Table.Td>
                <Table.Td>{row.maxActiveCourses ?? '∞'}</Table.Td>
                <Table.Td>{row.userCount}</Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end" wrap="nowrap">
                    {!row.isBestseller ? (
                      <Tooltip label="Сделать хитом на /plans">
                        <Button
                          size="xs"
                          variant="light"
                          color="grape"
                          onClick={() => setBestseller.mutate({ planId: row.id })}
                          loading={setBestseller.isPending}
                        >
                          Хит
                        </Button>
                      </Tooltip>
                    ) : (
                      <Tooltip label="Снять подсветку «хит»">
                        <Button
                          size="xs"
                          variant="default"
                          onClick={() => clearBestseller.mutate({ planId: row.id })}
                          loading={clearBestseller.isPending}
                        >
                          Снять хит
                        </Button>
                      </Tooltip>
                    )}
                    {!row.isDefaultFree ? (
                      <Tooltip label="Сделать бесплатным по умолчанию">
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => setDefault.mutate({ planId: row.id })}
                          loading={setDefault.isPending}
                        >
                          Default free
                        </Button>
                      </Tooltip>
                    ) : null}
                    <Button size="xs" variant="default" onClick={() => setEditing(row)}>
                      Изменить
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </AdminCard>

      <PlanFormModal
        key={creating ? 'plan-create-open' : 'plan-create-closed'}
        opened={creating}
        onClose={closeCreate}
        mode="create"
        onSaved={async () => {
          closeCreate()
          await utils.admin.plans.list.invalidate()
        }}
      />

      {editing ? (
        <PlanFormModal
          key={editing.id}
          opened
          onClose={() => setEditing(null)}
          mode="edit"
          initial={editing}
          onSaved={async () => {
            setEditing(null)
            await utils.admin.plans.list.invalidate()
          }}
        />
      ) : null}
    </Stack>
  )
}

function PlanFormModal(props: {
  opened: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  initial?: PlanRow
  onSaved: () => void | Promise<void>
}) {
  const { opened, onClose, mode, initial, onSaved } = props

  const [slug, setSlug] = useState(() => (mode === 'edit' && initial ? initial.slug : ''))
  const [name, setName] = useState(() => (mode === 'edit' && initial ? initial.name : ''))
  const [shortDescription, setShortDescription] = useState(() =>
    mode === 'edit' && initial ? initial.shortDescription : ''
  )
  const [marketingMarkdown, setMarketingMarkdown] = useState(() =>
    mode === 'edit' && initial ? initial.marketingMarkdown : ''
  )
  const [marketingFeatures, setMarketingFeatures] = useState<PlanMarketingBullet[]>(() =>
    mode === 'edit' && initial ? [...initial.marketingFeatures] : []
  )
  const [tierLevel, setTierLevel] = useState(() =>
    mode === 'edit' && initial ? initial.tierLevel : 0
  )
  const [xpBonusPercent, setXpBonusPercent] = useState(() =>
    mode === 'edit' && initial ? initial.xpBonusPercent : 0
  )
  const [sortOrder, setSortOrder] = useState(() =>
    mode === 'edit' && initial ? initial.sortOrder : 0
  )
  const [maxActiveCourses, setMaxActiveCourses] = useState<number | ''>(() =>
    mode === 'edit' && initial ? (initial.maxActiveCourses ?? '') : ''
  )
  const [isDefaultFree, setIsDefaultFree] = useState(() =>
    mode === 'edit' && initial ? initial.isDefaultFree : false
  )
  const [isBestseller, setIsBestseller] = useState(() =>
    mode === 'edit' && initial ? initial.isBestseller : false
  )

  const create = api.admin.plans.create.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'План создан.' })
      await onSaved()
    },
    onError: e => notifications.show({ color: 'red', message: e.message })
  })

  const update = api.admin.plans.update.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'План обновлён.' })
      await onSaved()
    },
    onError: e => notifications.show({ color: 'red', message: e.message })
  })

  const filterValidBullets = (rows: PlanMarketingBullet[]) =>
    rows.map(r => ({ iconKey: r.iconKey, text: r.text.trim() })).filter(r => r.text.length > 0)

  const save = () => {
    const cap =
      maxActiveCourses === '' || maxActiveCourses === undefined ? null : Number(maxActiveCourses)
    const bullets = filterValidBullets(marketingFeatures)
    if (mode === 'create') {
      create.mutate({
        slug,
        name,
        shortDescription: shortDescription || undefined,
        marketingMarkdown: marketingMarkdown || undefined,
        marketingFeatures: bullets.length ? bullets : undefined,
        isBestseller: isBestseller || undefined,
        tierLevel,
        xpBonusPercent,
        sortOrder,
        maxActiveCourses: cap,
        isDefaultFree
      })
      return
    }
    if (!initial) return
    update.mutate({
      id: initial.id,
      patch: {
        slug,
        name,
        shortDescription,
        marketingMarkdown,
        marketingFeatures: bullets,
        isBestseller,
        tierLevel,
        xpBonusPercent,
        sortOrder,
        maxActiveCourses: cap,
        isDefaultFree
      }
    })
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={mode === 'create' ? 'Новый план' : 'План'}
      size="xl"
    >
      <Stack>
        <TextInput label="Slug" value={slug} onChange={e => setSlug(e.target.value)} required />
        <TextInput label="Название" value={name} onChange={e => setName(e.target.value)} required />
        <TextInput
          label="Кратко"
          description="Строка под заголовком карточки"
          value={shortDescription}
          onChange={e => setShortDescription(e.target.value)}
        />
        <MarkdownEditor
          label="Сводка (Markdown для /plans)"
          value={marketingMarkdown}
          onChange={setMarketingMarkdown}
          minRows={4}
          defaultMode="split"
        />
        <PlanMarketingBulletsEditor value={marketingFeatures} onChange={setMarketingFeatures} />
        <NumberInput
          label="Tier level"
          value={tierLevel}
          onChange={v => setTierLevel(Number(v))}
          min={0}
        />
        <NumberInput
          label="XP бонус %"
          value={xpBonusPercent}
          onChange={v => setXpBonusPercent(Number(v))}
          min={0}
        />
        <NumberInput
          label="Sort order"
          value={sortOrder}
          onChange={v => setSortOrder(Number(v))}
          min={0}
        />
        <NumberInput
          label="Max активных курсов (пусто = без лимита)"
          value={maxActiveCourses === '' ? undefined : maxActiveCourses}
          onChange={v => setMaxActiveCourses(v === '' || v === undefined ? '' : Number(v))}
          min={1}
          allowDecimal={false}
        />
        <Switch
          label="План по умолчанию (free)"
          checked={isDefaultFree}
          onChange={e => setIsDefaultFree(e.currentTarget.checked)}
        />
        <Switch
          label="Хит продаж (акцент на /plans; снимет флаг с других)"
          checked={isBestseller}
          onChange={e => setIsBestseller(e.currentTarget.checked)}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={save} loading={create.isPending || update.isPending}>
            Сохранить
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
