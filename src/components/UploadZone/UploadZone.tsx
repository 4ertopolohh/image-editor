import { useRef } from 'react'
import type { ChangeEvent } from 'react'
import { Button } from '../Button/Button'
import type { TranslationDictionary } from '../../types/i18n'
import styles from './UploadZone.module.scss'

interface UploadZoneProps {
  onFileSelect: (file: File) => void
  onClear: () => void
  hasImage: boolean
  accept: string
  copy: TranslationDictionary['uploadZone']
  disabled?: boolean
}

export const UploadZone = ({ onFileSelect, onClear, hasImage, accept, copy, disabled = false }: UploadZoneProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openFileDialog = (): void => {
    fileInputRef.current?.click()
  }

  const onInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      onFileSelect(selectedFile)
    }

    event.target.value = ''
  }

  return (
    <section className={styles.zone} aria-label={copy.sectionAriaLabel}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className={styles.hiddenInput}
        onChange={onInputChange}
        aria-label={copy.inputAriaLabel}
      />

      <h2 className={styles.title}>{copy.title}</h2>
      <p className={styles.description}>{copy.description}</p>

      <div className={styles.actions}>
        <Button variant="primary" fullWidth onClick={openFileDialog} disabled={disabled}>
          {copy.selectButton}
        </Button>
        <Button variant="ghost" fullWidth onClick={onClear} disabled={disabled || !hasImage}>
          {copy.clearButton}
        </Button>
      </div>
    </section>
  )
}
