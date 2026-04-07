import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../Button/Button'
import { Select } from '../Select/Select'
import styles from '../ImageToolSection/ImageToolSection.module.scss'
import { FILE_INPUT_ACCEPT } from '../../constants/fileValidation'
import { EXPORT_FORMATS } from '../../constants/exportFormats'
import type { ConvertOptions, ExportFormatId, ImageAssetMeta } from '../../types/editor'
import type { TranslationDictionary } from '../../types/i18n'
import { convertImageFile } from '../../utils/canvasExport'
import { downloadBlob } from '../../utils/download'
import { createDerivedFileName } from '../../utils/fileName'
import { analyzeImageFile, shouldWarnAboutJpgTransparency } from '../../utils/imageAsset'
import { readImageDimensions, validateImageDimensions } from '../../utils/imageMeta'
import { validateImageFile } from '../../utils/fileValidation'

interface ConvertSectionProps {
  copy: TranslationDictionary['convertSection']
  commonCopy: TranslationDictionary['common']
  exportFormatLabels: TranslationDictionary['exportFormatLabels']
}

const formatBytes = (value: number, formatter: TranslationDictionary['common']['bytesLabel']): string => formatter(value)

const formatDimensions = (
  width: number,
  height: number,
  formatter: TranslationDictionary['common']['dimensionsLabel'],
): string => formatter(width, height)

const ConvertSectionComponent = ({ copy, commonCopy, exportFormatLabels }: ConvertSectionProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [sourceMeta, setSourceMeta] = useState<ImageAssetMeta | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultMeta, setResultMeta] = useState<ImageAssetMeta | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [targetFormat, setTargetFormat] = useState<ExportFormatId>('webp')
  const [quality, setQuality] = useState<number>(0.9)
  const [backgroundFill, setBackgroundFill] = useState<string>('#ffffff')
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
    setResultBlob(null)
    setResultMeta(null)
    setResultUrl(null)
    setError(null)
    setIsProcessing(false)
  }

  const handleFile = async (nextFile: File): Promise<void> => {
    const fileValidation = validateImageFile(nextFile)
    if (!fileValidation.ok) {
      setError(
        fileValidation.issue === 'file-too-large'
          ? copy.errorGeneric
          : fileValidation.issue === 'unsupported-format'
            ? copy.errorGeneric
            : copy.errorGeneric,
      )
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
    setTargetFormat(nextMeta.format === 'png' ? 'webp' : nextMeta.format === 'ico' ? 'png' : 'png')
    setResultBlob(null)
    setResultMeta(null)
    setResultUrl(null)
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

  const onConvert = async (): Promise<void> => {
    if (!file || !sourceMeta || isProcessing) {
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const options: ConvertOptions = {
        targetFormat,
        quality,
        backgroundFill,
      }
      const result = await convertImageFile(file, options)
      const nextUrl = URL.createObjectURL(result.blob)

      if (resultUrl) {
        URL.revokeObjectURL(resultUrl)
      }

      setResultBlob(result.blob)
      setResultMeta(result.meta)
      setResultUrl(nextUrl)
    } catch (caughtError) {
      console.error(caughtError)
      setError(copy.errorGeneric)
    } finally {
      setIsProcessing(false)
    }
  }

  const onDownload = (): void => {
    if (!file || !resultBlob) {
      return
    }

    downloadBlob(resultBlob, createDerivedFileName(file.name, targetFormat === 'jpg' ? 'jpg' : targetFormat, 'converted'))
  }

  const formatOptions = useMemo(
    () => EXPORT_FORMATS.map((option) => ({ value: option.id, label: exportFormatLabels[option.id] })),
    [exportFormatLabels],
  )

  const showsQuality = targetFormat === 'jpg' || targetFormat === 'webp'
  const showTransparencyWarning = Boolean(sourceMeta && shouldWarnAboutJpgTransparency({ targetFormat, hasAlpha: sourceMeta.hasAlpha }))

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
          <Button variant="ghost" fullWidth onClick={resetState} disabled={isProcessing && !file}>
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
          id="convert-target-format"
          label={copy.targetFormatLabel}
          value={targetFormat}
          options={formatOptions}
          onChange={setTargetFormat}
          aria-label={copy.targetFormatAriaLabel}
          disabled={!sourceMeta || isProcessing}
        />

        {showsQuality ? (
          <label className={styles.controlGroup} htmlFor="convert-quality">
            <span className={styles.label}>{copy.qualityLabel(quality)}</span>
            <input
              id="convert-quality"
              className={styles.range}
              type="range"
              min={0.6}
              max={1}
              step={0.01}
              value={quality}
              onChange={(event) => setQuality(Number(event.target.value))}
              disabled={!sourceMeta || isProcessing}
              aria-label={copy.qualityAriaLabel}
            />
            <span className={styles.hint}>{copy.qualityHint}</span>
          </label>
        ) : null}

        {showTransparencyWarning ? (
          <>
            <p className={`${styles.message} ${styles.warning}`}>{copy.transparencyWarning}</p>
            <label className={styles.controlGroup} htmlFor="convert-background-fill">
              <span className={styles.label}>{copy.backgroundFillLabel}</span>
              <input
                id="convert-background-fill"
                className={styles.colorInput}
                type="color"
                value={backgroundFill}
                onChange={(event) => setBackgroundFill(event.target.value)}
                disabled={!sourceMeta || isProcessing}
              />
              <span className={styles.hint}>{copy.backgroundFillHint}</span>
            </label>
          </>
        ) : null}

        <Button variant="primary" fullWidth onClick={() => void onConvert()} disabled={!sourceMeta || isProcessing}>
          {isProcessing ? copy.convertingButton : copy.convertButton}
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

      {resultMeta && resultBlob ? (
        <>
          <p className={`${styles.message} ${styles.success}`}>{copy.resultReady}</p>
          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>{copy.resultFormatLabel}</span>
              <span className={styles.metaValue}>{exportFormatLabels[targetFormat]}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>{copy.resultSizeLabel}</span>
              <span className={styles.metaValue}>{formatBytes(resultMeta.sizeBytes, commonCopy.bytesLabel)}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>{copy.resultDimensionsLabel}</span>
              <span className={styles.metaValue}>{formatDimensions(resultMeta.width, resultMeta.height, commonCopy.dimensionsLabel)}</span>
            </div>
          </div>
          <Button variant="secondary" fullWidth onClick={onDownload} aria-label={copy.downloadAriaLabel}>
            {copy.downloadButton}
          </Button>
        </>
      ) : null}
    </section>
  )
}

export const ConvertSection = memo(ConvertSectionComponent)
