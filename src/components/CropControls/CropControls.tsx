import { memo } from 'react'
import { Button } from '../Button/Button'
import type { CropPreset, CropPresetId } from '../../types/editor'
import type { TranslationDictionary } from '../../types/i18n'
import styles from './CropControls.module.scss'

interface CropControlsProps {
  presets: CropPreset[]
  activePresetId: CropPresetId
  disabled: boolean
  applyDisabled: boolean
  resetDisabled: boolean
  isApplying: boolean
  copy: TranslationDictionary['cropControls']
  onPresetChange: (presetId: CropPresetId) => void
  onApplyCrop: () => void
  onResetToSource: () => void
}

const CropControlsComponent = ({
  presets,
  activePresetId,
  disabled,
  applyDisabled,
  resetDisabled,
  isApplying,
  copy,
  onPresetChange,
  onApplyCrop,
  onResetToSource,
}: CropControlsProps) => {
  return (
    <section className={styles.panel} aria-label={copy.sectionAriaLabel}>
      <p className={styles.title}>{copy.title}</p>

      <div className={styles.presetGrid} role="radiogroup" aria-label={copy.presetGroupAriaLabel}>
        {presets.map((preset) => {
          const isActive = preset.id === activePresetId

          return (
            <button
              type="button"
              key={preset.id}
              className={`${styles.presetButton} ${isActive ? styles.presetButtonActive : ''}`}
              aria-pressed={isActive}
              aria-label={`${copy.aspectRatioAriaPrefix} ${preset.label}`}
              disabled={disabled}
              onClick={() => onPresetChange(preset.id)}
            >
              {preset.label}
            </button>
          )
        })}
      </div>

      <div className={styles.actions}>
        <Button
          variant="secondary"
          fullWidth
          onClick={onApplyCrop}
          disabled={applyDisabled}
          aria-label={copy.applyAriaLabel}
        >
          {isApplying ? copy.applyingButton : copy.applyButton}
        </Button>
        <Button variant="ghost" fullWidth onClick={onResetToSource} disabled={resetDisabled} aria-label={copy.resetAriaLabel}>
          {copy.resetButton}
        </Button>
      </div>
    </section>
  )
}

export const CropControls = memo(CropControlsComponent)
