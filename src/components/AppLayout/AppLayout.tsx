import type { PropsWithChildren } from 'react'
import styles from './AppLayout.module.scss'

export const AppLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className={styles.page}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <main className={styles.container}>{children}</main>
    </div>
  )
}
