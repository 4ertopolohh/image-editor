import { LanguageToggle } from '../LanguageToggle/LanguageToggle'
import type { Language, TranslationDictionary } from '../../types/i18n'
import styles from './Header.module.scss'
import DevelopedTitle from '../DevelopedTitle/DevelopedTitle'

interface HeaderProps {
  language: Language
  copy: TranslationDictionary['header']
  languageToggleCopy: TranslationDictionary['languageToggle']
  onLanguageChange: (language: Language) => void
}

export const Header = ({ language, copy, languageToggleCopy, onLanguageChange }: HeaderProps) => {
  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        {/* <p className={styles.kicker}>{copy.kicker}</p> */}
        <DevelopedTitle developedBy={copy.developedBy} studioName={copy.studioName} />
        <LanguageToggle
          language={language}
          ruLabel={languageToggleCopy.ruLabel}
          enLabel={languageToggleCopy.enLabel}
          ariaLabel={languageToggleCopy.ariaLabel}
          onChange={onLanguageChange}
        />
      </div>
      <h1 className={styles.title}>{copy.title}</h1>
      <p className={styles.subtitle}>{copy.subtitle}</p>
    </header>
  )
}
