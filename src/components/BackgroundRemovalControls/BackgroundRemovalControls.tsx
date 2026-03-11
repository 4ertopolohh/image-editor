import { memo } from 'react'
import { Button } from '../Button/Button'
import type { TranslationDictionary } from '../../types/i18n'
import styles from './BackgroundRemovalControls.module.scss'

interface BackgroundRemovalControlsProps {
  hasImage: boolean
  disabled: boolean
  isRemoving: boolean
  autoEnabled: boolean
  progressPercent: number | null
  copy: TranslationDictionary['backgroundRemovalControls']
  onAutoEnabledChange: (enabled: boolean) => void
  onRemoveBackground: () => void
}

const BackgroundRemovalControlsComponent = ({
  hasImage,
  disabled,
  isRemoving,
  autoEnabled,
  progressPercent,
  copy,
  onAutoEnabledChange,
  onRemoveBackground,
}: BackgroundRemovalControlsProps) => {
  return (
    <section className={styles.panel} aria-label={copy.sectionAriaLabel}>
      <h2 className={styles.title}>{copy.title}</h2>
      <p className={styles.description}>{copy.description}</p>

      <label className={styles.autoToggle} htmlFor="background-removal-auto">
        <input
          id="background-removal-auto"
          className={styles.autoCheckbox}
          type="checkbox"
          checked={autoEnabled}
          onChange={(event) => onAutoEnabledChange(event.target.checked)}
          disabled={disabled || isRemoving}
          aria-label={copy.autoToggleAriaLabel}
        />
        <span className={styles.autoLabel}>{copy.autoToggleLabel}</span>
      </label>

      <Button
        variant="secondary"
        fullWidth
        onClick={onRemoveBackground}
        disabled={disabled || !hasImage}
        aria-label={copy.actionAriaLabel}
      >
        {isRemoving ? copy.processingButton : copy.actionButton}
      </Button>

      <p className={styles.hint}>
        {isRemoving && progressPercent !== null ? copy.progressLabel(progressPercent) : copy.hint}
      </p>
    </section>
  )
}

export const BackgroundRemovalControls = memo(BackgroundRemovalControlsComponent)

