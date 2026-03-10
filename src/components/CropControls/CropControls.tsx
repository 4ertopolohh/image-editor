import { memo } from 'react'
import { Button } from '../Button/Button'
import { CORNER_RADIUS_RANGE } from '../../constants/cornerRadii'
import type { CornerRadii, CropPreset, CropPresetId } from '../../types/editor'
import type { TranslationDictionary } from '../../types/i18n'
import styles from './CropControls.module.scss'

interface CropControlsProps {
  presets: CropPreset[]
  activePresetId: CropPresetId
  disabled: boolean
  cornerControlsDisabled: boolean
  rotateDisabled: boolean
  applyDisabled: boolean
  resetDisabled: boolean
  isRotating: boolean
  isApplying: boolean
  cornerRadii: CornerRadii
  copy: TranslationDictionary['cropControls']
  onPresetChange: (presetId: CropPresetId) => void
  onCornerRadiusChange: (corner: keyof CornerRadii, value: number) => void
  onResetCornerRadii: () => void
  onRotateRight: () => void
  onApplyCrop: () => void
  onResetToSource: () => void
}

const CropControlsComponent = ({
  presets,
  activePresetId,
  disabled,
  cornerControlsDisabled,
  rotateDisabled,
  applyDisabled,
  resetDisabled,
  isRotating,
  isApplying,
  cornerRadii,
  copy,
  onPresetChange,
  onCornerRadiusChange,
  onResetCornerRadii,
  onRotateRight,
  onApplyCrop,
  onResetToSource,
}: CropControlsProps) => {
  const cornerControls: Array<{ key: keyof CornerRadii; label: string }> = [
    { key: 'topLeft', label: copy.cornerTopLeftLabel },
    { key: 'topRight', label: copy.cornerTopRightLabel },
    { key: 'bottomRight', label: copy.cornerBottomRightLabel },
    { key: 'bottomLeft', label: copy.cornerBottomLeftLabel },
  ]

  const hasRoundedCorners = Object.values(cornerRadii).some((value) => value > 0)

  return (
    <section className={styles.panel} aria-label={copy.sectionAriaLabel}>
      <div className={styles.titleRow}>
        <h2 className={styles.title}>{copy.title}</h2>
        <button
          type="button"
          className={styles.rotateButton}
          onClick={onRotateRight}
          disabled={rotateDisabled}
          aria-label={isRotating ? copy.rotatingAriaLabel : copy.rotateAriaLabel}
          title={copy.rotateIconTitle}
        >
          <svg
            className={`${styles.rotateIcon} ${isRotating ? styles.rotateIconSpinning : ''}`}
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M12 4V1L16 5L12 9V6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C14.54 18 16.71 16.41 17.57 14.17H19.69C18.78 17.5 15.74 20 12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4Z" />
          </svg>
        </button>
      </div>

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

      <div className={styles.cornersSection} role="group" aria-label={copy.cornersGroupAriaLabel}>
        <div className={styles.cornersHeader}>
          <h3 className={styles.cornersTitle}>{copy.cornersTitle}</h3>
          <button
            type="button"
            className={styles.cornersReset}
            onClick={onResetCornerRadii}
            disabled={cornerControlsDisabled || !hasRoundedCorners}
            aria-label={copy.cornersResetAriaLabel}
          >
            {copy.cornersResetButton}
          </button>
        </div>

        <div className={styles.cornerGrid}>
          {cornerControls.map((corner) => (
            <label key={corner.key} className={styles.cornerControl} htmlFor={`corner-radius-${corner.key}`}>
              <span className={styles.cornerLabel}>
                {corner.label}
                <strong className={styles.cornerValue}>{copy.cornerValueLabel(cornerRadii[corner.key])}</strong>
              </span>
              <input
                id={`corner-radius-${corner.key}`}
                className={styles.cornerRange}
                type="range"
                min={CORNER_RADIUS_RANGE.min}
                max={CORNER_RADIUS_RANGE.max}
                step={CORNER_RADIUS_RANGE.step}
                value={cornerRadii[corner.key]}
                onChange={(event) => onCornerRadiusChange(corner.key, Number(event.target.value))}
                disabled={cornerControlsDisabled}
                aria-label={corner.label}
              />
            </label>
          ))}
        </div>

        <p className={styles.cornersHint}>{copy.cornersHint}</p>
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
