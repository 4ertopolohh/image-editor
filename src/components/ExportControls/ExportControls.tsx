import { memo, useMemo } from 'react'
import {
  EXPORT_MAX_DIMENSION_RANGE,
  EXPORT_TARGET_SIZE_RANGE,
} from '../../constants/compression'
import { Button } from '../Button/Button'
import { Select } from '../Select/Select'
import type { ExportFormatId, ExportFormatOption } from '../../types/editor'
import type { TranslationDictionary } from '../../types/i18n'
import styles from './ExportControls.module.scss'

interface ExportControlsProps {
  format: ExportFormatId
  formatOptions: ExportFormatOption[]
  quality: number
  compressionEnabled: boolean
  compressionTargetSizeKb: number
  compressionMaxDimension: number
  disabled: boolean
  isExporting: boolean
  copy: TranslationDictionary['exportControls']
  onFormatChange: (format: ExportFormatId) => void
  onQualityChange: (value: number) => void
  onCompressionEnabledChange: (value: boolean) => void
  onCompressionTargetSizeChange: (value: number) => void
  onCompressionMaxDimensionChange: (value: number) => void
  onExport: () => void
}

const ExportControlsComponent = ({
  format,
  formatOptions,
  quality,
  compressionEnabled,
  compressionTargetSizeKb,
  compressionMaxDimension,
  disabled,
  isExporting,
  copy,
  onFormatChange,
  onQualityChange,
  onCompressionEnabledChange,
  onCompressionTargetSizeChange,
  onCompressionMaxDimensionChange,
  onExport,
}: ExportControlsProps) => {
  const currentOption = useMemo(
    () => formatOptions.find((option) => option.id === format) ?? formatOptions[0],
    [format, formatOptions],
  )
  const isIcoExport = currentOption.id === 'ico'
  const smartCompressionDisabled = disabled || isIcoExport

  return (
    <section className={styles.panel} aria-label={copy.sectionAriaLabel}>
      <p className={styles.title}>{copy.title}</p>

      <Select
        id="export-format"
        label={copy.formatLabel}
        value={format}
        options={formatOptions.map((option) => ({ value: option.id, label: option.label }))}
        onChange={onFormatChange}
        disabled={disabled}
        aria-label={copy.formatAriaLabel}
      />

      <label className={styles.compressionToggle} htmlFor="export-compression-enabled">
        <input
          id="export-compression-enabled"
          className={styles.compressionCheckbox}
          type="checkbox"
          checked={compressionEnabled}
          onChange={(event) => onCompressionEnabledChange(event.target.checked)}
          disabled={smartCompressionDisabled}
          aria-label={copy.compressionToggleAriaLabel}
        />
        <span className={styles.compressionLabel}>{copy.compressionToggleLabel}</span>
      </label>

      {isIcoExport ? <p className={styles.compressionHint}>{copy.compressionIcoHint}</p> : null}

      {!isIcoExport && compressionEnabled ? (
        <>
          <label className={styles.quality} htmlFor="export-compression-target-size">
            <span className={styles.qualityLabel}>{copy.compressionTargetLabel(compressionTargetSizeKb)}</span>
            <input
              id="export-compression-target-size"
              className={styles.qualityRange}
              type="range"
              min={EXPORT_TARGET_SIZE_RANGE.min}
              max={EXPORT_TARGET_SIZE_RANGE.max}
              step={EXPORT_TARGET_SIZE_RANGE.step}
              value={compressionTargetSizeKb}
              onChange={(event) => onCompressionTargetSizeChange(Number(event.target.value))}
              disabled={disabled}
              aria-label={copy.compressionTargetAriaLabel}
            />
          </label>

          <label className={styles.quality} htmlFor="export-compression-max-dimension">
            <span className={styles.qualityLabel}>{copy.compressionMaxDimensionLabel(compressionMaxDimension)}</span>
            <input
              id="export-compression-max-dimension"
              className={styles.qualityRange}
              type="range"
              min={EXPORT_MAX_DIMENSION_RANGE.min}
              max={EXPORT_MAX_DIMENSION_RANGE.max}
              step={EXPORT_MAX_DIMENSION_RANGE.step}
              value={compressionMaxDimension}
              onChange={(event) => onCompressionMaxDimensionChange(Number(event.target.value))}
              disabled={disabled}
              aria-label={copy.compressionMaxDimensionAriaLabel}
            />
          </label>
          <p className={styles.compressionHint}>{copy.compressionHint}</p>
        </>
      ) : null}

      {currentOption.supportsQuality ? (
        <label className={styles.quality} htmlFor="export-quality">
          <span className={styles.qualityLabel}>{copy.qualityLabel(quality)}</span>
          <input
            id="export-quality"
            className={styles.qualityRange}
            type="range"
            min={0.6}
            max={1}
            step={0.01}
            value={quality}
            onChange={(event) => onQualityChange(Number(event.target.value))}
            disabled={disabled}
            aria-label={copy.qualityAriaLabel}
          />
        </label>
      ) : (
        <p className={styles.qualityHint}>{copy.qualityHint}</p>
      )}

      <Button variant="primary" fullWidth onClick={onExport} disabled={disabled} aria-label={copy.saveAriaLabel}>
        {isExporting ? copy.savingButton : copy.saveButton}
      </Button>
    </section>
  )
}

export const ExportControls = memo(ExportControlsComponent)
