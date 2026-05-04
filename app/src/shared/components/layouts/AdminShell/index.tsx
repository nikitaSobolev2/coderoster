import AdminBodyAttribute from './AdminBodyAttribute'
import AdminSidebar from './AdminSidebar'
import AdminTopbar, { type BackofficeShellViewer } from './AdminTopbar'
import { BackofficeRoleProvider } from './BackofficeRoleContext'
import { filterAdminNavForRole } from './AdminSidebar/nav-config'
import styles from './styles.module.scss'

export interface Props {
  children: React.ReactNode
  viewer: BackofficeShellViewer
}

/**
 * Top-level admin chrome: sticky left sidebar + content area with a slim
 * top bar. Hides the platform footer entirely; admin pages are dense and
 * benefit from full vertical space.
 */
export default function AdminShell({ children, viewer }: Readonly<Props>) {
  const navGroups = filterAdminNavForRole(viewer.role)
  return (
    <BackofficeRoleProvider role={viewer.role}>
      <div className={styles.shell}>
        <AdminBodyAttribute />
        <div className={styles.shell__sidebar}>
          <AdminSidebar navGroups={navGroups} />
        </div>
        <div className={styles.shell__main}>
          <AdminTopbar viewer={viewer} navGroups={navGroups} />
          <div className={styles.shell__content}>{children}</div>
        </div>
      </div>
    </BackofficeRoleProvider>
  )
}
