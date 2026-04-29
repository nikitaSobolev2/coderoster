'use client'

import { ActionIcon, Drawer } from '@mantine/core'

import HomeTooltip from '~/shared/components/ui/HomeTooltip'
import { useLocalStorage, useMediaQuery } from '@mantine/hooks'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAnglesRight, faComments } from '@fortawesome/free-solid-svg-icons'

import LiveChatPanel from '~/features/livechat/components/LiveChatPanel'
import { LIVECHAT_HOME_DRAWER_Z_INDEX } from '~/features/livechat/livechatLayers'
import { useLiveChatPlatform } from '~/features/livechat/platform/livechatPlatform.context'

import styles from '../../livechat.module.scss'

export default function LiveChatDock() {
  const platform = useLiveChatPlatform()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [railCollapsed, setRailCollapsed] = useLocalStorage({
    key: 'coderoster-livechat-rail-collapsed',
    defaultValue: false
  })

  if (isMobile && platform) {
    return (
      <Drawer
        opened={platform.open}
        onClose={() => platform.setOpen(false)}
        position="bottom"
        size="100%"
        padding={0}
        withCloseButton={false}
        zIndex={LIVECHAT_HOME_DRAWER_Z_INDEX}
        classNames={{
          inner: styles.homeChatDrawerInner,
          content: styles.homeChatDrawerContent,
          header: styles.homeChatDrawerHeaderHidden,
          body: styles.homeChatDrawerBody
        }}
      >
        <div className={styles.homeChatCursorSuspendWrap} data-livechat-cursor-isolate="">
          <LiveChatPanel variant="floating" onDrawerClose={() => platform.setOpen(false)} />
        </div>
      </Drawer>
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
