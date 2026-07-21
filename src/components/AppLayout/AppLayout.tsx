import type { PropsWithChildren } from 'react'
import styles from './AppLayout.module.scss'
import type { TranslationDictionary } from '../../types/i18n'

interface AppLayoutProps {
  copy: TranslationDictionary['footer']
  studioHref: string
}

export const AppLayout = ({ children, copy, studioHref }: PropsWithChildren<AppLayoutProps>) => {
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
            href={studioHref}
            target="_blank"
            rel="noreferrer"
          >
            {copy.studioName}
          </a>
        </div>
      </footer>
    </div>
  )
}
