'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef
} from 'react'
import clsx from 'clsx'
import {
  ActionIcon,
  Alert,
  Button,
  ColorInput,
  Group,
  Loader,
  Modal,
  Paper,
  Popover,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  useMantineTheme
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGear, faPaperPlane, faRotateRight } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'

import { api } from '~/trpc/react'
import {
  LIVECHAT_DEFAULT_USERNAME_COLOR,
  LIVECHAT_USERNAME_COLOR_SWATCHES,
  type LivechatUsernameColorToken
} from '~/shared/constants/livechatColors'
import { LIVECHAT_MESSAGE_BODY_MAX_CHARS } from '~/shared/constants/livechatLimits'
import {
  mantineTokenToHex,
  nearestLivechatUsernameToken
} from '~/features/livechat/lib/mantineTokenColor'
import HomeTooltip from '~/shared/components/ui/HomeTooltip'
import PlatformDrawerHeader from '~/shared/components/ui/PlatformDrawerHeader'

import {
  LIVECHAT_COLOR_INPUT_POPOVER_Z_INDEX,
  LIVECHAT_RULES_MODAL_Z_INDEX,
  LIVECHAT_SETTINGS_POPOVER_Z_INDEX
} from '~/features/livechat/livechatLayers'

import { useLivechatFeed } from '~/features/livechat/hooks/useLivechatFeed'
import { LiveChatVirtualFeed } from '~/features/livechat/components/LiveChatVirtualFeed'
import { toLivechatFeedMessage } from '~/features/livechat/model/livechatFeedMessage'
import { PLATFORM_NAV_UP_MEDIA_QUERY } from '~/shared/constants/platformLayoutMediaQuery'
import { useMatchMedia } from '~/shared/hooks/useMatchMedia'

import styles from '../../livechat.module.scss'

export interface LiveChatPanelProps {
  variant: 'rail' | 'overlay' | 'floating'
  /** Parent already shows «Живой чат» (e.g. legacy layout). Prefer one header row inside the panel. */
  suppressChromeTitle?: boolean
  /** Home mobile Drawer: close control in same row as title + refresh (matches desktop chrome). */
  onDrawerClose?: () => void
  /** Drag handles / cursor on floating shell header row */
  headerInteractiveProps?: ComponentPropsWithoutRef<'header'>
}

interface LivechatStreamPayload {
  type: string
  message?: {
    id: string
    createdAt: Date | string
    body: string
    authorKind: 'AUTH' | 'GUEST'
    authorLabel: string
    usernameColor: string
    authorProfileUsername?: string | null
    authorIsStaff?: boolean
    authorPlanTierLevel?: number
    authorPlanBadge?: string | null
  }
}

export default function LiveChatPanel({
  variant,
  suppressChromeTitle = false,
  onDrawerClose,
  headerInteractiveProps
}: LiveChatPanelProps) {
  const theme = useMantineTheme()
  const utils = api.useUtils()
  const composerAutofocusEnabled = useMatchMedia(PLATFORM_NAV_UP_MEDIA_QUERY)

  const viewportRef = useRef<HTMLDivElement>(null)

  const feed = useLivechatFeed(viewportRef)
  const {
    messages,
    listQuery,
    appendIncomingStream,
    onViewportScrollChange,
    isNearBottomRef,
    prependBusyRef,
    loadingOlder
  } = feed

  const policiesQuery = api.livechat.getPolicies.useQuery(undefined, { staleTime: 10_000 })
  const [draft, setDraft] = useState('')
  const [rulesOpen, setRulesOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const composerInputRef = useRef<HTMLInputElement>(null)

  const [feedBootstrapped, setFeedBootstrapped] = useState(false)
  /** Bumps when list snapshot hydrates so bootstrap scroll runs after DOM matches query rows. */
  const [feedHydrationTick, setFeedHydrationTick] = useState(0)
  useEffect(() => {
    void fetch('/api/livechat/guest-session', { method: 'POST', credentials: 'include' })
  }, [])

  useEffect(() => {
    if (!listQuery.isFetched) return
    setFeedHydrationTick(t => t + 1)
  }, [listQuery.isFetched, listQuery.dataUpdatedAt])

  /** First paint after snapshot hydrates: scroll to bottom (instant), then reveal feed (hide Loader). */
  useEffect(() => {
    if (listQuery.isLoading) {
      setFeedBootstrapped(false)
      return
    }

    if (!listQuery.isFetched) return

    let cancelled = false
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled) return
        const viewport = viewportRef.current
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight
        }
        setFeedBootstrapped(true)
      })
    })

    return () => {
      cancelled = true
    }
  }, [listQuery.isLoading, listQuery.isFetched, feedHydrationTick])

  useEffect(() => {
    let es: EventSource | null = null
    try {
      es = new EventSource('/api/livechat/stream')
      es.onmessage = (event: MessageEvent<string>) => {
        try {
          const rawData = event.data
          if (typeof rawData !== 'string') return
          const parsedRaw = JSON.parse(rawData) as unknown
          const parsed = parsedRaw as LivechatStreamPayload
          if (parsed.type !== 'message' || !parsed.message) return
          const incoming = parsed.message
          const normalized = toLivechatFeedMessage(incoming)

          appendIncomingStream(normalized)
          void utils.livechat.listMessages.invalidate()
        } catch {
          /* noop */
        }
      }
    } catch {
      /* noop */
    }
    return () => {
      es?.close()
    }
  }, [appendIncomingStream, utils.livechat.listMessages])

  const sendMutation = api.livechat.sendMessage.useMutation({
    onSuccess: () => {
      setDraft('')
      void utils.livechat.getPolicies.invalidate()
      requestAnimationFrame(() => {
        if (
          typeof window !== 'undefined' &&
          window.matchMedia(PLATFORM_NAV_UP_MEDIA_QUERY).matches
        ) {
          composerInputRef.current?.focus()
        }
      })
    },
    onError: error => notifications.show({ color: 'red', title: 'Чат', message: error.message })
  })

  const consentGuestMutation = api.livechat.acceptGuestConsent.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Правила приняты.' })
      setRulesOpen(false)
      await utils.livechat.getPolicies.invalidate()
    },
    onError: error => notifications.show({ color: 'red', title: 'Чат', message: error.message })
  })

  const consentUserMutation = api.livechat.acceptUserConsent.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Правила приняты.' })
      setRulesOpen(false)
      await utils.livechat.getPolicies.invalidate()
    },
    onError: error => notifications.show({ color: 'red', title: 'Чат', message: error.message })
  })

  const policies = policiesQuery.data

  const needsConsent = useMemo(() => {
    if (!policies) return false
    if (policies.isAuthenticated && policies.authNeedsConsent) return true
    if (
      !policies.isAuthenticated &&
      policies.allowGuests &&
      !policies.mustLoginToSend &&
      !policies.guestHasConsent
    ) {
      return true
    }
    return false
  }, [policies])

  const canCompose = useMemo(() => {
    if (!policies) return false
    if (policies.mustLoginToSend) return false
    if (policies.platformBanned || policies.chatBanned) return false
    return !needsConsent
  }, [policies, needsConsent])

  const colorMutation = api.livechat.setUsernameColor.useMutation({
    onSuccess: async () => {
      notifications.show({ color: 'teal', message: 'Цвет сохранён.' })
      setSettingsOpen(false)
      await utils.livechat.getPolicies.invalidate()
    },
    onError: error => notifications.show({ color: 'red', title: 'Чат', message: error.message })
  })

  const [pendingColor, setPendingColor] = useState<LivechatUsernameColorToken>(
    LIVECHAT_DEFAULT_USERNAME_COLOR
  )

  useEffect(() => {
    if (policies?.preferredUsernameColor) {
      setPendingColor(policies.preferredUsernameColor)
    }
  }, [policies?.preferredUsernameColor])

  const trimmedDraftLen = draft.trim().length
  const draftTooLong = trimmedDraftLen > LIVECHAT_MESSAGE_BODY_MAX_CHARS

  const handleSend = () => {
    if (!draft.trim()) return
    const trimmed = draft.trim()
    if (trimmed.length > LIVECHAT_MESSAGE_BODY_MAX_CHARS) return
    sendMutation.mutate({
      body: trimmed,
      usernameColor:
        policies?.isAuthenticated === false && policies.allowGuests ? pendingColor : undefined
    })
  }

  const usernameHex = useCallback(
    (token: string) => mantineTokenToHex(theme, token) ?? theme.colors.gray[5],
    [theme]
  )

  const swatches = useMemo(
    () =>
      LIVECHAT_USERNAME_COLOR_SWATCHES.map(token => mantineTokenToHex(theme, token)).filter(
        (hex): hex is string => Boolean(hex)
      ),
    [theme]
  )

  useEffect(() => {
    /** Only close when we know user is guest; `undefined` during loading/refetch must not snap closed. */
    if (policies?.isAuthenticated === false) setSettingsOpen(false)
  }, [policies?.isAuthenticated])

  /** Focus composer when composing becomes allowed (desktop only — mobile avoids keyboard covering feed). */
  useEffect(() => {
    if (!canCompose || !composerAutofocusEnabled) return
    const id = requestAnimationFrame(() => composerInputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [canCompose, composerAutofocusEnabled])

  const panelClasses = `${styles.panel} ${variant === 'floating' ? styles.panelFloating : ''} ${
    variant === 'overlay' ? styles.panelOverlay : ''
  }`

  const { className: headerInteractiveClassName, ...headerInteractiveRest } =
    headerInteractiveProps ?? {}

  return (
    <Paper radius={0} className={panelClasses}>
      <PlatformDrawerHeader
        title={suppressChromeTitle ? undefined : 'Живой чат'}
        actionsOnly={suppressChromeTitle}
        onClose={onDrawerClose}
        closeAriaLabel="Закрыть чат"
        className={clsx(styles.panelHeader, headerInteractiveClassName)}
        trailing={
          <HomeTooltip label="Обновить ленту">
            <ActionIcon
              className={styles.headerRefresh}
              size="sm"
              variant="subtle"
              color="gray"
              loading={listQuery.isFetching}
              onClick={() => void listQuery.refetch()}
              aria-label="Обновить сообщения"
            >
              <FontAwesomeIcon icon={faRotateRight} />
            </ActionIcon>
          </HomeTooltip>
        }
        {...headerInteractiveRest}
      />

      <ScrollArea
        className={styles.feed}
        classNames={{ viewport: styles.feedViewport }}
        viewportRef={viewportRef}
        type="scroll"
        scrollbars="y"
        onScrollPositionChange={onViewportScrollChange}
      >
        {!feedBootstrapped ? (
          <div className={styles.feedOverlayLoader} aria-busy="true" aria-live="polite">
            <Loader size="sm" color="dimmed" />
          </div>
        ) : null}
        <div className={styles.feedBootstrapWrap}>
          <div className={styles.feedInner} aria-hidden={!feedBootstrapped}>
            {loadingOlder ? (
              <div className={styles.olderFetching} aria-live="polite">
                Загружаются более ранние сообщения…
              </div>
            ) : null}
            <LiveChatVirtualFeed
              messages={messages}
              viewportRef={viewportRef}
              feedBootstrapped={feedBootstrapped}
              usernameHex={usernameHex}
              isNearBottomRef={isNearBottomRef}
              prependBusyRef={prependBusyRef}
            />
          </div>
        </div>
      </ScrollArea>

      <div className={styles.composer}>
        {policies?.mustLoginToSend ? (
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Войди, чтобы писать в чат.
            </Text>
            <Button
              className={styles.composerLoginBtn}
              component={Link}
              href="/login"
              variant="light"
            >
              Войти
            </Button>
          </Stack>
        ) : null}

        {policies?.chatBanned ? (
          <Alert color="red" variant="light">
            Чат для аккаунта заблокирован модератором.
          </Alert>
        ) : null}

        {policies?.platformBanned ? (
          <Alert color="red" variant="light">
            Аккаунт заблокирован на платформе.
          </Alert>
        ) : null}

        {needsConsent ? (
          <Button
            className={styles.consentRulesBtn}
            variant="light"
            color="yellow"
            fullWidth
            onClick={() => setRulesOpen(true)}
          >
            Принять правила чата
          </Button>
        ) : null}

        {!canCompose && policies && !policies.mustLoginToSend && !policies.chatBanned ? (
          <Text size="sm" c="dimmed">
            Примите правила, чтобы отправлять сообщения.
          </Text>
        ) : null}

        <div className={styles.composerStack}>
          <div className={styles.composerInputFull}>
            <TextInput
              ref={composerInputRef}
              placeholder="Написать сообщение..."
              disabled={!canCompose || sendMutation.isPending}
              value={draft}
              onChange={event => setDraft(event.currentTarget.value)}
              aria-invalid={draftTooLong}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  handleSend()
                }
              }}
            />
            <div className={styles.composerCounterWrap}>
              <Text size="xs" c={draftTooLong ? 'red' : 'dimmed'}>
                {trimmedDraftLen}/{LIVECHAT_MESSAGE_BODY_MAX_CHARS}
              </Text>
            </div>
          </div>
          <div className={styles.composerActionsRow}>
            {policies?.isAuthenticated === true ? (
              <div className={styles.composerGearWrap}>
                <Popover
                  opened={settingsOpen}
                  onChange={setSettingsOpen}
                  position="top-end"
                  withArrow
                  withinPortal
                  floatingStrategy="fixed"
                  zIndex={LIVECHAT_SETTINGS_POPOVER_Z_INDEX}
                  closeOnClickOutside={false}
                >
                  {/* Tooltip must not wrap the Popover control: nested floating + Target ref breaks touch toggling on phones. */}
                  <Popover.Target>
                    <ActionIcon
                      className={styles.composerGearBtn}
                      variant="default"
                      aria-expanded={settingsOpen}
                      aria-label="Настройки чата"
                      title="Цвет имени в чате"
                      disabled={policies?.mustLoginToSend === true}
                      onClick={() => setSettingsOpen(o => !o)}
                    >
                      <FontAwesomeIcon icon={faGear} />
                    </ActionIcon>
                  </Popover.Target>
                  <Popover.Dropdown data-livechat-cursor-isolate="">
                    <Stack gap="xs" maw={280}>
                      <Text size="sm" fw={600}>
                        Цвет имени
                      </Text>
                      <ColorInput
                        format="hex"
                        swatches={swatches}
                        value={mantineTokenToHex(theme, pendingColor) ?? ''}
                        onChange={hex => {
                          const trimmed = hex?.trim()
                          if (!trimmed) return
                          setPendingColor(nearestLivechatUsernameToken(theme, trimmed))
                        }}
                        disabled={policies?.mustLoginToSend === true}
                        disallowInput
                        popoverProps={{
                          withinPortal: false,
                          zIndex: LIVECHAT_COLOR_INPUT_POPOVER_Z_INDEX
                        }}
                      />
                      <Button
                        size="xs"
                        onClick={() => colorMutation.mutate({ color: pendingColor })}
                        loading={colorMutation.isPending}
                        disabled={policies?.mustLoginToSend === true}
                      >
                        Сохранить цвет
                      </Button>
                    </Stack>
                  </Popover.Dropdown>
                </Popover>
              </div>
            ) : null}
            <Button
              className={styles.composerSendBtn}
              leftSection={<FontAwesomeIcon icon={faPaperPlane} />}
              onClick={handleSend}
              loading={sendMutation.isPending}
              disabled={!canCompose || !draft.trim() || draftTooLong || sendMutation.isPending}
            >
              Отправить
            </Button>
          </div>
        </div>

        {/* <div className={styles.footerActions}>
          <Anchor
            className={styles.footerPlatformLink}
            component={Link}
            href="/courses"
            size="xs"
            c="dimmed"
          >
            На платформу
          </Anchor>
        </div> */}
      </div>

      <Modal.Root
        opened={rulesOpen}
        onClose={() => setRulesOpen(false)}
        zIndex={LIVECHAT_RULES_MODAL_Z_INDEX}
        centered
      >
        <Modal.Overlay data-livechat-cursor-isolate="" />
        <Modal.Content data-livechat-cursor-isolate="">
          <Modal.Header>
            <Modal.Title>Правила чата</Modal.Title>
            <Modal.CloseButton />
          </Modal.Header>
          <Modal.Body>
            <Stack gap="sm">
              <Text size="sm">
                Запрещены оскорбления по расовому и религиозному признакам, пропаганда ненависти,
                разжигание конфликтов, спам и вредоносные ссылки. Нарушение может привести к
                блокировке чата или аккаунта.
              </Text>
              <Group justify="flex-end">
                <Button
                  className={styles.rulesModalBtn}
                  variant="default"
                  onClick={() => setRulesOpen(false)}
                >
                  Отмена
                </Button>
                <Button
                  className={styles.rulesModalBtn}
                  onClick={() => {
                    if (policies?.isAuthenticated) {
                      consentUserMutation.mutate()
                    } else {
                      consentGuestMutation.mutate()
                    }
                  }}
                  loading={consentGuestMutation.isPending || consentUserMutation.isPending}
                >
                  Принимаю
                </Button>
              </Group>
            </Stack>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>
    </Paper>
  )
}
