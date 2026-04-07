import { memo, useMemo } from 'react'
import { Button } from '../Button/Button'
import { Select } from '../Select/Select'
import type { EditorExportFormatId, EditorExportFormatOption } from '../../types/editor'
import type { TranslationDictionary } from '../../types/i18n'
import styles from './ExportControls.module.scss'

interface ExportControlsProps {
  format: EditorExportFormatId
  formatOptions: EditorExportFormatOption[]
  quality: number
  showQualityControl: boolean
  showTransparencyWarning: boolean
  backgroundFill: string
  disabled: boolean
  isExporting: boolean
  copy: TranslationDictionary['exportControls']
  onFormatChange: (format: EditorExportFormatId) => void
  onQualityChange: (value: number) => void
  onBackgroundFillChange: (value: string) => void
  onExport: () => void
}

const ExportControlsComponent = ({
  format,
  formatOptions,
  quality,
  showQualityControl,
  showTransparencyWarning,
  backgroundFill,
  disabled,
  isExporting,
  copy,
  onFormatChange,
  onQualityChange,
  onBackgroundFillChange,
  onExport,
}: ExportControlsProps) => {
  const currentOption = useMemo(
    () => formatOptions.find((option) => option.id === format) ?? formatOptions[0],
    [format, formatOptions],
  )

  return (
    <section className={styles.panel} aria-label={copy.sectionAriaLabel}>
      <h2 className={styles.title}>{copy.title}</h2>

      <Select
        id="export-format"
        label={copy.formatLabel}
        value={format}
        options={formatOptions.map((option) => ({ value: option.id, label: option.label }))}
        onChange={onFormatChange}
        disabled={disabled}
        aria-label={copy.formatAriaLabel}
      />

      <p className={styles.compressionHint}>{copy.outputSummaryLabel(currentOption.label)}</p>
      {currentOption.id === 'ico' ? <p className={styles.compressionHint}>{copy.compressionIcoHint}</p> : null}

      {showQualityControl ? (
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
          <p className={styles.qualityHint}>{copy.qualityHint}</p>
        </label>
      ) : (
        <p className={styles.qualityHint}>{copy.qualityDisabledHint}</p>
      )}

      {showTransparencyWarning ? (
        <>
          <p className={styles.compressionHint}>{copy.transparencyWarning}</p>
          <label className={styles.quality} htmlFor="export-background-fill">
            <span className={styles.qualityLabel}>{copy.backgroundFillLabel}</span>
            <input
              id="export-background-fill"
              className={styles.colorInput}
              type="color"
              value={backgroundFill}
              onChange={(event) => onBackgroundFillChange(event.target.value)}
              disabled={disabled}
            />
            <p className={styles.qualityHint}>{copy.backgroundFillHint}</p>
          </label>
        </>
      ) : null}

      <Button variant="primary" fullWidth onClick={onExport} disabled={disabled} aria-label={copy.saveAriaLabel}>
        {isExporting ? copy.savingButton : copy.saveButton}
      </Button>
    </section>
  )
}

export const ExportControls = memo(ExportControlsComponent)
