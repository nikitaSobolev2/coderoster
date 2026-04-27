import styles from './layout.module.scss'

export default function HomeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={styles.homeShell}>{children}</div>
}
