import { useCallback, useMemo, useState } from 'react'
import type { PixelCrop } from 'react-image-crop'
import styles from './App.module.scss'
import { AppLayout } from './components/AppLayout/AppLayout'
import { CropControls } from './components/CropControls/CropControls'
import { ExportControls } from './components/ExportControls/ExportControls'
import { Header } from './components/Header/Header'
import { ImageEditor } from './components/ImageEditor/ImageEditor'
import { PreviewPane } from './components/PreviewPane/PreviewPane'
import { UploadZone } from './components/UploadZone/UploadZone'
import { AdSection } from './components/AdSection/AdSection'
import {
  DEFAULT_EXPORT_COMPRESSION_ENABLED,
  DEFAULT_EXPORT_MAX_DIMENSION,
  DEFAULT_EXPORT_TARGET_SIZE_KB,
  EXPORT_MAX_DIMENSION_RANGE,
  EXPORT_TARGET_SIZE_RANGE,
} from './constants/compression'
import { CORNER_RADIUS_RANGE, DEFAULT_CORNER_RADII } from './constants/cornerRadii'
import { CROP_PRESETS } from './constants/cropPresets'
import { DEFAULT_EXPORT_FORMAT, DEFAULT_EXPORT_QUALITY, EXPORT_FORMAT_MAP, EXPORT_FORMATS } from './constants/exportFormats'
import { FILE_INPUT_ACCEPT } from './constants/fileValidation'
import { useClipboardImage } from './hooks/useClipboardImage'
import { useLanguage } from './hooks/useLanguage'
import { useObjectUrlRegistry } from './hooks/useObjectUrlRegistry'
import { useSeoMetadata } from './hooks/useSeoMetadata'
import type {
  CornerRadii,
  CropPresetId,
  ExportCompressionSettings,
  ExportFormatId,
  LoadedImage,
  StatusTone,
} from './types/editor'
import type { TranslationDictionary } from './types/i18n'
import { exportCroppedImage, exportImageFromUrl, exportRotatedImageFromUrl } from './utils/canvasExport'
import { downloadBlob } from './utils/download'
import { createExportFileName } from './utils/fileName'
import { readImageDimensions, validateImageDimensions } from './utils/imageMeta'
import { validateImageFile } from './utils/fileValidation'

interface EditorState {
  source: LoadedImage | null
  current: LoadedImage | null
}

type StatusMessageKey =
  | 'initial'
  | 'editor-cleared'
  | 'image-uploaded'
  | 'image-pasted'
  | 'image-open-failed'
  | 'image-rotated'
  | 'rotate-failed'
  | 'crop-applied'
  | 'crop-failed'
  | 'original-restored'
  | 'image-saved-as'
  | 'export-failed'
  | 'validation-not-image'
  | 'validation-unsupported-format'
  | 'validation-file-too-large'
  | 'validation-dimension-too-large'
  | 'validation-pixel-count-too-large'

interface StatusMessageState {
  tone: StatusTone
  key: StatusMessageKey
  payload?: string | number
}

const toneClassMap: Record<StatusTone, string> = {
  info: styles.messageInfo,
  success: styles.messageSuccess,
  error: styles.messageError,
}

const INITIAL_MESSAGE: StatusMessageState = {
  tone: 'info',
  key: 'initial',
}

const clampNumber = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max)
}

const resolveStatusMessage = (message: StatusMessageState, dictionary: TranslationDictionary): string => {
  switch (message.key) {
    case 'initial':
      return dictionary.status.initial
    case 'editor-cleared':
      return dictionary.status.editorCleared
    case 'image-uploaded':
      return dictionary.status.imageUploaded
    case 'image-pasted':
      return dictionary.status.imagePasted
    case 'image-open-failed':
      return dictionary.status.imageOpenFailed
    case 'image-rotated':
      return dictionary.status.imageRotated
    case 'rotate-failed':
      return dictionary.status.rotateFailed
    case 'crop-applied':
      return dictionary.status.cropApplied
    case 'crop-failed':
      return dictionary.status.cropFailed
    case 'original-restored':
      return dictionary.status.originalRestored
    case 'image-saved-as':
      return dictionary.status.imageSavedAs(typeof message.payload === 'string' ? message.payload : '')
    case 'export-failed':
      return dictionary.status.exportFailed
    case 'validation-not-image':
      return dictionary.validation.notImage
    case 'validation-unsupported-format':
      return dictionary.validation.unsupportedFormat
    case 'validation-file-too-large':
      return dictionary.validation.fileTooLarge(typeof message.payload === 'number' ? message.payload : 0)
    case 'validation-dimension-too-large':
      return dictionary.validation.dimensionTooLarge(typeof message.payload === 'number' ? message.payload : 0)
    case 'validation-pixel-count-too-large':
      return dictionary.validation.pixelCountTooLarge
    default:
      return dictionary.status.initial
  }
}

function App() {
  const { language, setLanguage, dictionary } = useLanguage()
  useSeoMetadata(language)

  const [editorState, setEditorState] = useState<EditorState>({ source: null, current: null })
  const [cropPresetId, setCropPresetId] = useState<CropPresetId>('free')
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [currentImageElement, setCurrentImageElement] = useState<HTMLImageElement | null>(null)
  const [exportFormat, setExportFormat] = useState<ExportFormatId>(DEFAULT_EXPORT_FORMAT)
  const [exportQuality, setExportQuality] = useState<number>(DEFAULT_EXPORT_QUALITY)
  const [compressionEnabled, setCompressionEnabled] = useState<boolean>(DEFAULT_EXPORT_COMPRESSION_ENABLED)
  const [compressionTargetSizeKb, setCompressionTargetSizeKb] = useState<number>(DEFAULT_EXPORT_TARGET_SIZE_KB)
  const [compressionMaxDimension, setCompressionMaxDimension] = useState<number>(DEFAULT_EXPORT_MAX_DIMENSION)
  const [cornerRadii, setCornerRadii] = useState<CornerRadii>(DEFAULT_CORNER_RADII)
  const [message, setMessage] = useState<StatusMessageState>(INITIAL_MESSAGE)
  const [editorVersion, setEditorVersion] = useState<number>(0)
  const [isApplyingCrop, setIsApplyingCrop] = useState<boolean>(false)
  const [isRotating, setIsRotating] = useState<boolean>(false)
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const { createUrl, revokeUrl } = useObjectUrlRegistry()

  const localizedCropPresets = useMemo(
    () =>
      CROP_PRESETS.map((preset) => ({
        ...preset,
        label: dictionary.cropPresetLabels[preset.id],
      })),
    [dictionary.cropPresetLabels],
  )

  const localizedExportFormats = useMemo(
    () =>
      EXPORT_FORMATS.map((format) => ({
        ...format,
        label: dictionary.exportFormatLabels[format.id],
      })),
    [dictionary.exportFormatLabels],
  )

  const activePreset = useMemo(
    () => CROP_PRESETS.find((preset) => preset.id === cropPresetId) ?? CROP_PRESETS[0],
    [cropPresetId],
  )

  const selectedExportFormat = useMemo(() => EXPORT_FORMAT_MAP[exportFormat], [exportFormat])
  const currentImage = editorState.current
  const currentImageUrl = currentImage?.url ?? 'empty'
  const resolvedMessage = useMemo(() => resolveStatusMessage(message, dictionary), [message, dictionary])
  const hasImage = Boolean(currentImage)
  const hasRoundedCorners = useMemo(() => {
    return Object.values(cornerRadii).some((value) => value > CORNER_RADIUS_RANGE.min)
  }, [cornerRadii])
  const canApplyCrop = Boolean(
    hasImage &&
      completedCrop &&
      completedCrop.width > 1 &&
      completedCrop.height > 1 &&
      !isApplyingCrop &&
      !isRotating &&
      !isExporting,
  )
  const canResetToSource = Boolean(
    currentImage &&
      editorState.source &&
      (currentImage.url !== editorState.source.url || hasRoundedCorners) &&
      !isApplyingCrop &&
      !isRotating &&
      !isExporting,
  )
  const canExport = Boolean(currentImage && !isApplyingCrop && !isRotating && !isExporting)

  const setNewSourceImage = useCallback(
    (nextImage: LoadedImage): void => {
      setEditorState((previousState) => {
        if (previousState.source) {
          revokeUrl(previousState.source.url)
        }

        if (previousState.current && previousState.current.url !== previousState.source?.url) {
          revokeUrl(previousState.current.url)
        }

        return {
          source: nextImage,
          current: nextImage,
        }
      })
    },
    [revokeUrl],
  )

  const clearEditor = useCallback((): void => {
    setEditorState((previousState) => {
      if (previousState.source) {
        revokeUrl(previousState.source.url)
      }

      if (previousState.current && previousState.current.url !== previousState.source?.url) {
        revokeUrl(previousState.current.url)
      }

      return { source: null, current: null }
    })

    setCompletedCrop(undefined)
    setCurrentImageElement(null)
    setCornerRadii(DEFAULT_CORNER_RADII)
    setEditorVersion((version) => version + 1)
    setMessage({
      tone: 'info',
      key: 'editor-cleared',
    })
  }, [revokeUrl])

  const ingestImageFile = useCallback(
    async (file: File, source: 'upload' | 'clipboard'): Promise<void> => {
      const fileValidation = validateImageFile(file)
      if (!fileValidation.ok) {
        if (fileValidation.issue === 'not-image') {
          setMessage({ tone: 'error', key: 'validation-not-image' })
        } else if (fileValidation.issue === 'unsupported-format') {
          setMessage({ tone: 'error', key: 'validation-unsupported-format' })
        } else {
          setMessage({
            tone: 'error',
            key: 'validation-file-too-large',
            payload: fileValidation.maxSizeMb,
          })
        }

        return
      }

      try {
        const dimensions = await readImageDimensions(file)
        const dimensionValidation = validateImageDimensions(dimensions)
        if (!dimensionValidation.ok) {
          if (dimensionValidation.issue === 'dimension-too-large') {
            setMessage({
              tone: 'error',
              key: 'validation-dimension-too-large',
              payload: dimensionValidation.maxDimension,
            })
          } else {
            setMessage({ tone: 'error', key: 'validation-pixel-count-too-large' })
          }
          return
        }

        const imageUrl = createUrl(file)
        const name =
          file.name.trim().length > 0 ? file.name : dictionary.common.clipboardFallbackFileName

        setNewSourceImage({
          url: imageUrl,
          name,
          width: dimensions.width,
          height: dimensions.height,
        })

        setCompletedCrop(undefined)
        setCurrentImageElement(null)
        setCornerRadii(DEFAULT_CORNER_RADII)
        setEditorVersion((version) => version + 1)
        setMessage({
          tone: 'success',
          key: source === 'upload' ? 'image-uploaded' : 'image-pasted',
        })
      } catch (error) {
        console.error(error)
        setMessage({
          tone: 'error',
          key: 'image-open-failed',
        })
      }
    },
    [createUrl, dictionary.common.clipboardFallbackFileName, setNewSourceImage],
  )

  const onFileSelect = useCallback(
    (file: File): void => {
      void ingestImageFile(file, 'upload')
    },
    [ingestImageFile],
  )

  const onClipboardImage = useCallback(
    (file: File): void => {
      void ingestImageFile(file, 'clipboard')
    },
    [ingestImageFile],
  )

  useClipboardImage({ onImagePaste: onClipboardImage })

  const onApplyCrop = useCallback(async (): Promise<void> => {
    if (!currentImage || !currentImageElement || !completedCrop) {
      return
    }

    setIsApplyingCrop(true)

    try {
      const cropResult = await exportCroppedImage({
        image: currentImageElement,
        crop: completedCrop,
        formatId: 'png',
        mimeType: 'image/png',
      })

      const cropUrl = createUrl(cropResult.blob)

      setEditorState((previousState) => {
        if (!previousState.current) {
          return previousState
        }

        if (previousState.current.url !== previousState.source?.url) {
          revokeUrl(previousState.current.url)
        }

        return {
          ...previousState,
          current: {
            url: cropUrl,
            name: previousState.current.name,
            width: cropResult.width,
            height: cropResult.height,
          },
        }
      })

      setCompletedCrop(undefined)
      setEditorVersion((version) => version + 1)
      setMessage({
        tone: 'success',
        key: 'crop-applied',
      })
    } catch (error) {
      console.error(error)
      setMessage({
        tone: 'error',
        key: 'crop-failed',
      })
    } finally {
      setIsApplyingCrop(false)
    }
  }, [completedCrop, createUrl, currentImage, currentImageElement, revokeUrl])

  const onRotateRight = useCallback(async (): Promise<void> => {
    if (!currentImage) {
      return
    }

    setIsRotating(true)

    try {
      const rotatedResult = await exportRotatedImageFromUrl({
        imageUrl: currentImage.url,
        angle: 90,
      })

      const rotatedUrl = createUrl(rotatedResult.blob)

      setEditorState((previousState) => {
        if (!previousState.current) {
          return previousState
        }

        if (previousState.current.url !== previousState.source?.url) {
          revokeUrl(previousState.current.url)
        }

        return {
          ...previousState,
          current: {
            url: rotatedUrl,
            name: previousState.current.name,
            width: rotatedResult.width,
            height: rotatedResult.height,
          },
        }
      })

      setCompletedCrop(undefined)
      setCurrentImageElement(null)
      setEditorVersion((version) => version + 1)
      setMessage({
        tone: 'success',
        key: 'image-rotated',
      })
    } catch (error) {
      console.error(error)
      setMessage({
        tone: 'error',
        key: 'rotate-failed',
      })
    } finally {
      setIsRotating(false)
    }
  }, [createUrl, currentImage, revokeUrl])

  const onResetToSource = useCallback((): void => {
    setEditorState((previousState) => {
      if (!previousState.source || !previousState.current) {
        return previousState
      }

      if (previousState.current.url !== previousState.source.url) {
        revokeUrl(previousState.current.url)
      }

      return {
        ...previousState,
        current: previousState.source,
      }
    })

    setCompletedCrop(undefined)
    setCornerRadii(DEFAULT_CORNER_RADII)
    setEditorVersion((version) => version + 1)
    setMessage({
      tone: 'info',
      key: 'original-restored',
    })
  }, [revokeUrl])

  const onCompressionEnabledChange = useCallback((value: boolean): void => {
    setCompressionEnabled(value)
  }, [])

  const onCompressionTargetSizeChange = useCallback((value: number): void => {
    setCompressionTargetSizeKb(
      clampNumber(Math.round(value), EXPORT_TARGET_SIZE_RANGE.min, EXPORT_TARGET_SIZE_RANGE.max),
    )
  }, [])

  const onCompressionMaxDimensionChange = useCallback((value: number): void => {
    setCompressionMaxDimension(
      clampNumber(Math.round(value), EXPORT_MAX_DIMENSION_RANGE.min, EXPORT_MAX_DIMENSION_RANGE.max),
    )
  }, [])

  const onCornerRadiusChange = useCallback((corner: keyof CornerRadii, value: number): void => {
    const normalizedValue = clampNumber(Math.round(value), CORNER_RADIUS_RANGE.min, CORNER_RADIUS_RANGE.max)
    setCornerRadii((previousValue) => {
      if (previousValue[corner] === normalizedValue) {
        return previousValue
      }

      return {
        ...previousValue,
        [corner]: normalizedValue,
      }
    })
  }, [])

  const onResetCornerRadii = useCallback((): void => {
    setCornerRadii((previousValue) => {
      const hasAnyValue = Object.values(previousValue).some((value) => value > CORNER_RADIUS_RANGE.min)
      return hasAnyValue ? DEFAULT_CORNER_RADII : previousValue
    })
  }, [])

  const onExportImage = useCallback(async (): Promise<void> => {
    if (!currentImage) {
      return
    }

    setIsExporting(true)

    try {
      const quality = selectedExportFormat.supportsQuality ? exportQuality : undefined
      const compressionSettings: ExportCompressionSettings | undefined =
        compressionEnabled && selectedExportFormat.id !== 'ico'
          ? {
              enabled: true,
              targetSizeKb: compressionTargetSizeKb,
              maxDimension: compressionMaxDimension,
            }
          : undefined

      const result = await exportImageFromUrl({
        imageUrl: currentImage.url,
        formatId: selectedExportFormat.id,
        mimeType: selectedExportFormat.mimeType,
        quality,
        compression: compressionSettings,
        cornerRadii,
      })

      const fileName = createExportFileName(currentImage.name, selectedExportFormat.extension)
      downloadBlob(result.blob, fileName)
      setMessage({
        tone: 'success',
        key: 'image-saved-as',
        payload: fileName,
      })
    } catch (error) {
      console.error(error)
      setMessage({
        tone: 'error',
        key: 'export-failed',
      })
    } finally {
      setIsExporting(false)
    }
  }, [
    compressionEnabled,
    compressionMaxDimension,
    compressionTargetSizeKb,
    cornerRadii,
    currentImage,
    exportQuality,
    selectedExportFormat,
  ])

  const imageEditorKey = useMemo(
    () => `${editorVersion}-${cropPresetId}-${currentImageUrl}-${language}`,
    [cropPresetId, currentImageUrl, editorVersion, language],
  )

  return (
    <AppLayout>
      <div className={styles.app}>
        <Header
          language={language}
          copy={dictionary.header}
          languageToggleCopy={dictionary.languageToggle}
          onLanguageChange={setLanguage}
        />

        <div className={styles.workspace}>
          <aside className={styles.sidebar}>
            <UploadZone
              onFileSelect={onFileSelect}
              onClear={clearEditor}
              hasImage={hasImage}
              accept={FILE_INPUT_ACCEPT}
              copy={dictionary.uploadZone}
              disabled={isApplyingCrop || isRotating || isExporting}
            />

            <CropControls
              presets={localizedCropPresets}
              activePresetId={cropPresetId}
              disabled={!hasImage}
              cornerControlsDisabled={!hasImage || isApplyingCrop || isRotating || isExporting}
              rotateDisabled={!hasImage || isApplyingCrop || isRotating || isExporting}
              applyDisabled={!canApplyCrop}
              resetDisabled={!canResetToSource}
              isRotating={isRotating}
              isApplying={isApplyingCrop}
              cornerRadii={cornerRadii}
              copy={dictionary.cropControls}
              onPresetChange={setCropPresetId}
              onCornerRadiusChange={onCornerRadiusChange}
              onResetCornerRadii={onResetCornerRadii}
              onRotateRight={() => void onRotateRight()}
              onApplyCrop={() => void onApplyCrop()}
              onResetToSource={onResetToSource}
            />

            <ExportControls
              format={exportFormat}
              formatOptions={localizedExportFormats}
              quality={exportQuality}
              compressionEnabled={compressionEnabled}
              compressionTargetSizeKb={compressionTargetSizeKb}
              compressionMaxDimension={compressionMaxDimension}
              disabled={!canExport}
              isExporting={isExporting}
              copy={dictionary.exportControls}
              onFormatChange={setExportFormat}
              onQualityChange={setExportQuality}
              onCompressionEnabledChange={onCompressionEnabledChange}
              onCompressionTargetSizeChange={onCompressionTargetSizeChange}
              onCompressionMaxDimensionChange={onCompressionMaxDimensionChange}
              onExport={() => void onExportImage()}
            />

            <p
              className={`${styles.message} ${toneClassMap[message.tone]}`}
              role={message.tone === 'error' ? 'alert' : 'status'}
              aria-live="polite"
            >
              {resolvedMessage}
            </p>
          </aside>

          <div className={styles.editorColumn}>
            <ImageEditor
              key={imageEditorKey}
              imageUrl={editorState.current?.url ?? null}
              aspect={activePreset.aspect}
              copy={dictionary.imageEditor}
              onCropComplete={setCompletedCrop}
              onImageReady={setCurrentImageElement}
            />
            <PreviewPane image={editorState.current} cornerRadii={cornerRadii} copy={dictionary.previewPane} />
          </div>
        </div>

        <AdSection copy={dictionary.adSection} />
      </div>
    </AppLayout>
  )
}

export default App
