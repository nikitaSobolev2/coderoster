'use client'

import { useState } from 'react'
import { Drawer } from '@mantine/core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../AdminSidebar'
import styles from './styles.module.scss'

/**
 * Mobile-only burger trigger that hosts the admin sidebar inside a Mantine
 * `Drawer`. Re-uses the desktop sidebar component so admin nav structure
 * stays a single source of truth.
 */
export default function AdminMobileMenu() {
  const [opened, setOpened] = useState(false)
  const close = () => setOpened(false)

  return (
    <>
      <button
        type="button"
        aria-label="Открыть админ-меню"
        aria-expanded={opened}
        className={styles.burger}
        onClick={() => setOpened(true)}
      >
        <FontAwesomeIcon icon={faBars} />
      </button>

      <Drawer
        opened={opened}
        onClose={close}
        position="left"
        size="min(85vw, 320px)"
        withCloseButton={false}
        overlayProps={{ backgroundOpacity: 0.55, blur: 6 }}
        classNames={{ content: styles.drawer, body: styles.drawer__body }}
      >
        <header className={styles.drawer__head}>
          <span className={styles.drawer__title}>Админ-панель</span>
          <button
            type="button"
            className={styles.drawer__close}
            onClick={close}
            aria-label="Закрыть"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>
        <div className={styles.drawer__nav}>
          <AdminSidebar onNavigate={close} />
        </div>
      </Drawer>
    </>
  )
}
