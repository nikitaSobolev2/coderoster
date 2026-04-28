import AdminBodyAttribute from './AdminBodyAttribute'
import AdminSidebar from './AdminSidebar'
import AdminTopbar, { type AdminViewer } from './AdminTopbar'
import styles from './styles.module.scss'

export interface Props {
  children: React.ReactNode
  viewer: AdminViewer
}

/**
 * Top-level admin chrome: sticky left sidebar + content area with a slim
 * top bar. Hides the platform footer entirely; admin pages are dense and
 * benefit from full vertical space.
 */
export default function AdminShell({ children, viewer }: Readonly<Props>) {
  return (
    <div className={styles.shell}>
      <AdminBodyAttribute />
      <div className={styles.shell__sidebar}>
        <AdminSidebar />
      </div>
      <div className={styles.shell__main}>
        <AdminTopbar viewer={viewer} />
        <div className={styles.shell__content}>{children}</div>
      </div>
    </div>
  )
}
