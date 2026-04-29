'use client'

import { ActionIcon } from '@mantine/core'

import HomeTooltip from '~/shared/components/ui/HomeTooltip'
import { useLocalStorage } from '@mantine/hooks'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAnglesRight, faComments } from '@fortawesome/free-solid-svg-icons'

import LiveChatPanel from '~/features/livechat/components/LiveChatPanel'

import styles from '../../livechat.module.scss'

export interface Props {
  variant: 'rail' | 'overlay'
}

export default function LiveChatDock({ variant }: Props) {
  const [railCollapsed, setRailCollapsed] = useLocalStorage({
    key: 'coderoster-livechat-rail-collapsed',
    defaultValue: false
  })
  const [overlayOpen, setOverlayOpen] = useLocalStorage({
    key: 'coderoster-livechat-overlay-open',
    defaultValue: false
  })

  if (variant === 'overlay') {
    return (
      <>
        {!overlayOpen ? (
          <div className={styles.fabLearn}>
            <HomeTooltip label="Открыть чат">
              <ActionIcon
                size="xl"
                radius="xl"
                variant="filled"
                color="brand"
                onClick={() => setOverlayOpen(true)}
                aria-label="Открыть чат"
              >
                <FontAwesomeIcon icon={faComments} />
              </ActionIcon>
            </HomeTooltip>
          </div>
        ) : null}
        {overlayOpen ? (
          <div className={styles.overlayWrap}>
            <div className={styles.overlayToolbar}>
              <HomeTooltip label="Скрыть чат">
                <ActionIcon
                  variant="subtle"
                  onClick={() => setOverlayOpen(false)}
                  aria-label="Скрыть чат"
                >
                  <FontAwesomeIcon icon={faAnglesRight} />
                </ActionIcon>
              </HomeTooltip>
            </div>
            <div className={styles.overlayBody}>
              <LiveChatPanel variant="overlay" />
            </div>
          </div>
        ) : null}
      </>
    )
  }

  return (
    <div className={styles.railWrap}>
      <div
        className={`${styles.railWrapInner} ${railCollapsed ? styles.railCollapsed : styles.railOpen}`}
      >
        {railCollapsed ? (
          <HomeTooltip label="Открыть чат" position="left">
            <ActionIcon
              variant="filled"
              color="brand"
              radius={0}
              h="100%"
              w="100%"
              onClick={() => setRailCollapsed(false)}
              aria-label="Открыть чат"
            >
              <FontAwesomeIcon icon={faComments} />
            </ActionIcon>
          </HomeTooltip>
        ) : (
          <div className={styles.railExpand}>
            <div className={styles.railToolbar}>
              <HomeTooltip label="Свернуть чат">
                <ActionIcon
                  variant="subtle"
                  onClick={() => setRailCollapsed(true)}
                  aria-label="Свернуть чат"
                >
                  <FontAwesomeIcon icon={faAnglesRight} />
                </ActionIcon>
              </HomeTooltip>
            </div>
            <div className={styles.railBody}>
              <LiveChatPanel variant="rail" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
