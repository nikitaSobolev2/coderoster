import HomeParallaxGrid from '~/features/home/components/common/HomeParallaxGrid'
import styles from './layout.module.scss'

export default function HomeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={styles.homeShell}>
      <HomeParallaxGrid />
      {children}
    </div>
  )
}
