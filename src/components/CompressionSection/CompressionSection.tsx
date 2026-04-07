import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../Button/Button'
import { Select } from '../Select/Select'
import styles from '../ImageToolSection/ImageToolSection.module.scss'
import { FILE_INPUT_ACCEPT } from '../../constants/fileValidation'
import { COMPRESSION_MODES } from '../../constants/compression'
import type { CompressionMode, CompressionResult, ImageAssetMeta } from '../../types/editor'
import type { TranslationDictionary } from '../../types/i18n'
import { compressImageFile } from '../../utils/canvasExport'
import { downloadBlob } from '../../utils/download'
import { createDerivedFileName } from '../../utils/fileName'
import { analyzeImageFile } from '../../utils/imageAsset'
import { readImageDimensions, validateImageDimensions } from '../../utils/imageMeta'
import { validateImageFile } from '../../utils/fileValidation'

interface CompressionSectionProps {
  copy: TranslationDictionary['compressionSection']
  commonCopy: TranslationDictionary['common']
  exportFormatLabels: TranslationDictionary['exportFormatLabels']
}

const formatBytes = (value: number, formatter: TranslationDictionary['common']['bytesLabel']): string => formatter(value)

const formatDimensions = (
  width: number,
  height: number,
  formatter: TranslationDictionary['common']['dimensionsLabel'],
): string => formatter(width, height)

const CompressionSectionComponent = ({ copy, commonCopy, exportFormatLabels }: CompressionSectionProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [sourceMeta, setSourceMeta] = useState<ImageAssetMeta | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [result, setResult] = useState<CompressionResult | null>(null)
  const [mode, setMode] = useState<CompressionMode>('balanced')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      if (resultUrl) {
        URL.revokeObjectURL(resultUrl)
      }
    }
  }, [previewUrl, resultUrl])

  const resetState = (): void => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl)
    }

    setFile(null)
    setSourceMeta(null)
    setPreviewUrl(null)
    setResultUrl(null)
    setResult(null)
    setError(null)
    setIsProcessing(false)
  }

  const handleFile = async (nextFile: File): Promise<void> => {
    const fileValidation = validateImageFile(nextFile)
    if (!fileValidation.ok) {
      setError(copy.errorGeneric)
      return
    }

    const dimensions = await readImageDimensions(nextFile)
    const dimensionValidation = validateImageDimensions(dimensions)
    if (!dimensionValidation.ok) {
      setError(copy.errorGeneric)
      return
    }

    const nextMeta = await analyzeImageFile(nextFile)
    const nextPreviewUrl = URL.createObjectURL(nextFile)

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl)
    }

    setFile(nextFile)
    setSourceMeta(nextMeta)
    setPreviewUrl(nextPreviewUrl)
    setResultUrl(null)
    setResult(null)
    setError(null)
  }

  const onInputChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const nextFile = event.target.files?.[0]

    if (nextFile) {
      try {
        await handleFile(nextFile)
      } catch (caughtError) {
        console.error(caughtError)
        setError(copy.errorGeneric)
      }
    }

    event.target.value = ''
  }

  const onCompress = async (): Promise<void> => {
    if (!file || isProcessing) {
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const nextResult = await compressImageFile(file, mode)
      const nextUrl = URL.createObjectURL(nextResult.blob)

      if (resultUrl) {
        URL.revokeObjectURL(resultUrl)
      }

      setResult(nextResult)
      setResultUrl(nextUrl)
    } catch (caughtError) {
      console.error(caughtError)
      setError(copy.errorGeneric)
    } finally {
      setIsProcessing(false)
    }
  }

  const onDownload = (): void => {
    if (!file || !result) {
      return
    }

    const extension = result.outputMeta.format === 'jpeg' ? 'jpg' : result.outputMeta.format ?? 'png'
    downloadBlob(result.blob, createDerivedFileName(file.name, extension, 'compressed'))
  }

  const warningMessages = useMemo(() => {
    if (!result) {
      return []
    }

    return result.warnings.map((warning) => {
      if (warning === 'already-optimized') {
        return copy.alreadyOptimized
      }

      if (warning === 'minimal-gain') {
        return copy.minimalGain
      }

      if (warning === 'alpha-preserved') {
        return `${commonCopy.downloadReady}.`
      }

      return warning
    })
  }, [commonCopy.downloadReady, copy.alreadyOptimized, copy.minimalGain, result])

  const modeOptions = useMemo(
    () =>
      COMPRESSION_MODES.map((option) => ({
        value: option,
        label: copy.modeDescriptions[option],
      })),
    [copy.modeDescriptions],
  )

  return (
    <section className={styles.panel} aria-label={copy.sectionAriaLabel}>
      <div className={styles.header}>
        <h2 className={styles.title}>{copy.title}</h2>
      </div>

      <div className={styles.uploadBox}>
        <input
          ref={inputRef}
          type="file"
          accept={FILE_INPUT_ACCEPT}
          className={styles.hiddenInput}
          onChange={(event) => void onInputChange(event)}
        />
        <p className={styles.uploadTitle}>{copy.uploadTitle}</p>
        <p className={styles.hint}>{copy.uploadDescription}</p>
        <div className={styles.actions}>
          <Button variant="primary" fullWidth onClick={() => inputRef.current?.click()} disabled={isProcessing}>
            {copy.selectButton}
          </Button>
          <Button variant="ghost" fullWidth onClick={resetState} disabled={!file && !result}>
            {copy.resetButton}
          </Button>
        </div>
      </div>

      {sourceMeta ? (
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>{copy.sourceFileLabel}</span>
            <span className={styles.metaValue}>{sourceMeta.name}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>{copy.sourceFormatLabel}</span>
            <span className={styles.metaValue}>
              {sourceMeta.format ? exportFormatLabels[sourceMeta.format === 'jpeg' ? 'jpg' : sourceMeta.format] : commonCopy.formatUnknown}
            </span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>{copy.sourceSizeLabel}</span>
            <span className={styles.metaValue}>{formatBytes(sourceMeta.sizeBytes, commonCopy.bytesLabel)}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>{copy.sourceDimensionsLabel}</span>
            <span className={styles.metaValue}>{formatDimensions(sourceMeta.width, sourceMeta.height, commonCopy.dimensionsLabel)}</span>
          </div>
        </div>
      ) : null}

      <div className={styles.controls}>
        <Select
          id="compression-mode"
          label={copy.modeLabel}
          value={mode}
          options={modeOptions}
          onChange={setMode}
          disabled={!sourceMeta || isProcessing}
          aria-label={copy.modeAriaLabel}
        />
        <p className={styles.modeDescription}>{copy.modeDescriptions[mode]}</p>
        <Button variant="primary" fullWidth onClick={() => void onCompress()} disabled={!sourceMeta || isProcessing}>
          {isProcessing ? copy.compressingButton : copy.compressButton}
        </Button>
      </div>

      {!previewUrl ? (
        <div className={styles.placeholder}>
          <p className={styles.placeholderTitle}>{copy.emptyTitle}</p>
          <p className={styles.hint}>{copy.emptyText}</p>
        </div>
      ) : (
        <div className={styles.previewSurface}>
          <img className={styles.previewImage} src={resultUrl ?? previewUrl} alt={copy.previewTitle} />
        </div>
      )}

      {error ? <p className={`${styles.message} ${styles.error}`}>{error}</p> : null}

      {result ? (
        <>
          <p className={`${styles.message} ${styles.success}`}>
            {copy.resultReady(Math.max(0, Math.round(result.savingsRatio * 100)))}
          </p>

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>{copy.resultSizeLabel}</span>
              <span className={styles.metaValue}>
                {formatBytes(result.inputMeta.sizeBytes, commonCopy.bytesLabel)} {'->'} {formatBytes(result.outputMeta.sizeBytes, commonCopy.bytesLabel)}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>{copy.resultFormatLabel}</span>
              <span className={styles.metaValue}>
                {(result.inputMeta.format ? exportFormatLabels[result.inputMeta.format === 'jpeg' ? 'jpg' : result.inputMeta.format] : commonCopy.formatUnknown)} {'->'}{' '}
                {(result.outputMeta.format ? exportFormatLabels[result.outputMeta.format === 'jpeg' ? 'jpg' : result.outputMeta.format] : commonCopy.formatUnknown)}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>{copy.resultDimensionsLabel}</span>
              <span className={styles.metaValue}>
                {formatDimensions(result.inputMeta.width, result.inputMeta.height, commonCopy.dimensionsLabel)} {'->'}{' '}
                {formatDimensions(result.outputMeta.width, result.outputMeta.height, commonCopy.dimensionsLabel)}
              </span>
            </div>
          </div>

          {warningMessages.length > 0 ? (
            <>
              <p className={styles.label}>{copy.warningsTitle}</p>
              <ul className={styles.list}>
                {warningMessages.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </>
          ) : null}

          {result.appliedSteps.length > 0 ? (
            <>
              <p className={styles.label}>{copy.stepsTitle}</p>
              <ul className={styles.list}>
                {result.appliedSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </>
          ) : null}

          {result.attempts.length > 0 ? (
            <>
              <p className={styles.label}>{copy.attemptsTitle}</p>
              <ul className={styles.list}>
                {result.attempts.map((attempt, index) => (
                  <li key={`${attempt.format}-${attempt.quality ?? 'na'}-${index}`}>
                    {attempt.format.toUpperCase()} {attempt.quality ? `${Math.round(attempt.quality * 100)}%` : ''} {formatBytes(attempt.outputBytes, commonCopy.bytesLabel)}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <div className={styles.actions}>
            <Button variant="secondary" fullWidth onClick={onDownload} aria-label={copy.downloadAriaLabel}>
              {copy.downloadButton}
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setResult(null)}>
              {copy.retryButton}
            </Button>
          </div>
        </>
      ) : null}
    </section>
  )
}

export const CompressionSection = memo(CompressionSectionComponent)
