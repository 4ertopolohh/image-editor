import { memo } from 'react'
import type { Language } from '../../types/i18n'
import styles from './LanguageToggle.module.scss'

interface LanguageToggleProps {
  language: Language
  ruLabel: string
  enLabel: string
  ariaLabel: string
  onChange: (language: Language) => void
}

const LanguageToggleComponent = ({ language, ruLabel, enLabel, ariaLabel, onChange }: LanguageToggleProps) => {
  const nextLanguage: Language = language === 'ru' ? 'en' : 'ru'
  const nextLanguageLabel = nextLanguage === 'ru' ? ruLabel : enLabel

  return (
    <button
      type="button"
      className={styles.toggle}
      data-language={language}
      aria-label={ariaLabel}
      onClick={() => onChange(nextLanguage)}
      title={nextLanguageLabel}
    >
      <span className={`${styles.button} ${language === 'ru' ? styles.buttonActive : ''}`} aria-hidden="true">
        <span className={styles.label}>RU</span>
      </span>
      <span className={`${styles.button} ${language === 'en' ? styles.buttonActive : ''}`} aria-hidden="true">
        <span className={styles.label}>EN</span>
      </span>
    </button>
  )
}

export const LanguageToggle = memo(LanguageToggleComponent)
