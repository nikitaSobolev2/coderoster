import PlatformHeader from './PlatformHeader'
import PlatformFooter from './PlatformFooter'
import PlatformBodyAttribute from './PlatformBodyAttribute'
import SearchSpotlight from '~/shared/components/ui/search/SearchSpotlight'
import styles from './styles.module.scss'

export interface Props {
  children: React.ReactNode
  /** When true, suppresses the footer (in-course pages occupy the full viewport). */
  hideFooter?: boolean
  /** Removes the default content padding for pages that handle their own layout. */
  fluid?: boolean
}

/**
 * Top-level chrome for every authenticated/platform-facing page. Owns the
 * fixed header, optional footer and the global spotlight search bound to the
 * tRPC `search.global` procedure.
 */
export default function PlatformShell({ children, hideFooter = false, fluid = false }: Props) {
  return (
    <div className={styles.shell}>
      <PlatformBodyAttribute />
      <SearchSpotlight />
      <PlatformHeader />
      <main className={`${styles.shell__main} ${fluid ? styles.shell__main_fluid : ''}`}>
        {children}
      </main>
      {hideFooter ? null : <PlatformFooter />}
    </div>
  )
}
