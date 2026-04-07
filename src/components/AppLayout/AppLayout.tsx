import type { PropsWithChildren } from 'react'
import styles from './AppLayout.module.scss'

export const AppLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className={styles.page}>
      <main className={styles.container}>{children}</main>
      <footer className={styles.footer} aria-label="Footer">
        <div className={styles.footerInner}>
          <a className={styles.footerLink} href="https://t.me/T3riadStudio" target="_blank" rel="noreferrer">
            Telegram
          </a>
          <a className={styles.footerLink} href="https://github.com/4ertopolohh" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a
            className={`${styles.footerLink} ${styles.footerPlaceholder}`}
            href=""
            onClick={(event) => event.preventDefault()}
          >
            Triad Studio
          </a>
        </div>
      </footer>
    </div>
  )
}
