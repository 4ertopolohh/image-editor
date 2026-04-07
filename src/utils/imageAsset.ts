import { ALPHA_CAPABLE_FORMATS, DEFAULT_CONVERT_JPG_QUALITY, DEFAULT_CONVERT_WEBP_QUALITY, EXPORT_FORMAT_MAP, isExportFormatId } from '../constants/exportFormats'
import type {
  CompressionMode,
  CompressionResult,
  ConvertOptions,
  EditorExportOptions,
  ExportFormatId,
  ImageAssetMeta,
  SupportedImageFormat,
} from '../types/editor'

const ANALYSIS_SAMPLE_SIZE = 128

const MIME_FORMAT_MAP: Record<string, SupportedImageFormat> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
}

const EXTENSION_FORMAT_MAP: Record<string, SupportedImageFormat> = {
  png: 'png',
  jpg: 'jpg',
  jpeg: 'jpeg',
  webp: 'webp',
  ico: 'ico',
}

const createCanvas = (width: number, height: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  return canvas
}

const blobToObjectUrl = (blob: Blob): string => URL.createObjectURL(blob)

const loadImage = async (blob: Blob): Promise<HTMLImageElement> => {
  const image = new Image()
  const url = blobToObjectUrl(blob)
  image.src = url

  try {
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

const getFileExtension = (name: string): string | null => {
  const normalizedName = name.trim().toLowerCase()
  const parts = normalizedName.split('.')
  return parts.length > 1 ? parts.at(-1) ?? null : null
}

export const detectImageFormat = ({
  mimeType,
  fileName,
}: {
  mimeType?: string | null
  fileName?: string | null
}): SupportedImageFormat | null => {
  const normalizedMimeType = mimeType?.toLowerCase() ?? ''
  const byMime = normalizedMimeType ? MIME_FORMAT_MAP[normalizedMimeType] : undefined

  if (byMime) {
    return byMime
  }

  const extension = fileName ? getFileExtension(fileName) : null
  return extension ? EXTENSION_FORMAT_MAP[extension] ?? null : null
}

const sampleImageData = (image: HTMLImageElement): ImageData => {
  const maxSide = Math.max(image.naturalWidth, image.naturalHeight)
  const scale = maxSide > ANALYSIS_SAMPLE_SIZE ? ANALYSIS_SAMPLE_SIZE / maxSide : 1
  const targetWidth = Math.max(1, Math.round(image.naturalWidth * scale))
  const targetHeight = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = createCanvas(targetWidth, targetHeight)
  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context) {
    throw new Error('Unable to create analysis canvas.')
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, targetWidth, targetHeight)
  return context.getImageData(0, 0, targetWidth, targetHeight)
}

const detectAlphaFromImage = (image: HTMLImageElement, format: SupportedImageFormat | null): boolean => {
  if (format && !ALPHA_CAPABLE_FORMATS.has(format)) {
    return false
  }

  const imageData = sampleImageData(image)

  for (let index = 3; index < imageData.data.length; index += 4) {
    if (imageData.data[index] < 250) {
      return true
    }
  }

  return false
}

const detectPhotographicContent = (image: HTMLImageElement, format: SupportedImageFormat | null, hasAlpha: boolean): boolean => {
  if (format === 'jpg' || format === 'jpeg') {
    return true
  }

  if (hasAlpha || format === 'ico') {
    return false
  }

  const imageData = sampleImageData(image)
  const coarseColors = new Set<number>()
  let smoothDeltaTotal = 0
  let comparisons = 0

  for (let y = 0; y < imageData.height; y += 1) {
    for (let x = 0; x < imageData.width; x += 1) {
      const index = (y * imageData.width + x) * 4
      const red = imageData.data[index]
      const green = imageData.data[index + 1]
      const blue = imageData.data[index + 2]

      coarseColors.add(((red >> 4) << 8) | ((green >> 4) << 4) | (blue >> 4))

      if (x > 0) {
        const previousIndex = index - 4
        const delta =
          Math.abs(red - imageData.data[previousIndex]) +
          Math.abs(green - imageData.data[previousIndex + 1]) +
          Math.abs(blue - imageData.data[previousIndex + 2])
        smoothDeltaTotal += delta
        comparisons += 1
      }
    }
  }

  const averageDelta = comparisons > 0 ? smoothDeltaTotal / comparisons : 0
  return coarseColors.size > 500 && averageDelta < 80
}

export const analyzeImageBlob = async (blob: Blob, name: string): Promise<ImageAssetMeta> => {
  const image = await loadImage(blob)
  const format = detectImageFormat({ mimeType: blob.type, fileName: name })
  const hasAlpha = detectAlphaFromImage(image, format)
  const isPhotographic = detectPhotographicContent(image, format, hasAlpha)

  return {
    name,
    mimeType: blob.type || '',
    format,
    sizeBytes: blob.size,
    width: image.naturalWidth,
    height: image.naturalHeight,
    megapixels: Number(((image.naturalWidth * image.naturalHeight) / 1_000_000).toFixed(2)),
    hasAlpha,
    isPhotographic,
  }
}

export const analyzeImageFile = async (file: File): Promise<ImageAssetMeta> => analyzeImageBlob(file, file.name)

export const normalizeToExportFormat = (format: SupportedImageFormat | null): ExportFormatId | null => {
  if (format === 'jpeg') {
    return 'jpg'
  }

  if (format && isExportFormatId(format)) {
    return format
  }

  return null
}

export const resolveEditorExportFormat = ({
  sourceMeta,
  currentImageHasAlpha,
  outputFormat,
}: {
  sourceMeta: ImageAssetMeta | null
  currentImageHasAlpha: boolean
  outputFormat: EditorExportOptions['outputFormat']
}): ExportFormatId => {
  if (outputFormat && outputFormat !== 'original') {
    const normalized = normalizeToExportFormat(outputFormat)
    return normalized ?? 'png'
  }

  const originalFormat = normalizeToExportFormat(sourceMeta?.format ?? null)

  if (!originalFormat) {
    return 'png'
  }

  if (currentImageHasAlpha && !ALPHA_CAPABLE_FORMATS.has(originalFormat)) {
    return 'png'
  }

  return originalFormat
}

export const shouldWarnAboutJpgTransparency = ({
  targetFormat,
  hasAlpha,
}: {
  targetFormat: SupportedImageFormat | ExportFormatId
  hasAlpha: boolean
}): boolean => {
  return hasAlpha && (targetFormat === 'jpg' || targetFormat === 'jpeg')
}

export const getDefaultQualityForFormat = (format: SupportedImageFormat | ExportFormatId): number | undefined => {
  if (format === 'jpg' || format === 'jpeg') {
    return DEFAULT_CONVERT_JPG_QUALITY
  }

  if (format === 'webp') {
    return DEFAULT_CONVERT_WEBP_QUALITY
  }

  return undefined
}

export const buildDownloadName = (name: string, extension: string, suffix: 'edited' | 'converted' | 'compressed'): string => {
  const baseName = name.replace(/\.[^/.]+$/, '').trim().replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-')
  const safeBase = baseName.length > 0 ? baseName : 'image'
  return `${safeBase}-${suffix}.${extension}`
}

export const buildCompressionWarnings = (result: CompressionResult, mode: CompressionMode): string[] => {
  const warnings = [...result.warnings]

  if (result.savingsRatio <= 0) {
    warnings.push('output-not-smaller')
  } else if (result.savingsRatio < 0.05) {
    warnings.push('minimal-gain')
  }

  if (mode === 'quality-first' && result.inputMeta.isPhotographic === false && result.outputMeta.format !== result.inputMeta.format) {
    warnings.push('format-changed-conservatively')
  }

  return warnings
}

export const getExportFormatOption = (formatId: ExportFormatId) => EXPORT_FORMAT_MAP[formatId]

export const resolveConvertQuality = (options: ConvertOptions): number | undefined => {
  if (options.targetFormat === 'jpg' || options.targetFormat === 'jpeg' || options.targetFormat === 'webp') {
    return options.quality ?? getDefaultQualityForFormat(options.targetFormat)
  }

  return undefined
}
