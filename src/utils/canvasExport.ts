import type { PixelCrop } from 'react-image-crop'
import { COMPRESSION_PROFILE_MAP } from '../constants/compression'
import { ALPHA_CAPABLE_FORMATS, EXPORT_FORMAT_MAP, LOSSY_IMAGE_FORMATS } from '../constants/exportFormats'
import { CORNER_RADIUS_RANGE, DEFAULT_CORNER_RADII } from '../constants/cornerRadii'
import type {
  CompressionAttempt,
  CompressionMode,
  CompressionResult,
  ConvertOptions,
  CornerRadii,
  ExportFormatId,
  ImageAssetMeta,
} from '../types/editor'
import { analyzeImageBlob, analyzeImageFile, normalizeToExportFormat, resolveConvertQuality } from './imageAsset'

const ICO_TARGET_SIZE = 256
const MIN_PROGRESSIVE_SIDE = 64

interface CropExportOptions {
  image: HTMLImageElement
  crop: PixelCrop
  formatId: ExportFormatId
  mimeType: string
  quality?: number
  cornerRadii?: CornerRadii
  backgroundFill?: string | null
}

interface UrlExportOptions {
  imageUrl: string
  formatId: ExportFormatId
  mimeType: string
  quality?: number
  cornerRadii?: CornerRadii
  backgroundFill?: string | null
}

interface ConvertResult {
  blob: Blob
  meta: ImageAssetMeta
}

export interface CanvasExportResult {
  blob: Blob
  width: number
  height: number
}

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max)
}

const createCanvas = (width: number, height: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  return canvas
}

const canvasToBlob = (canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob> => {
  const normalizedQuality = mimeType === 'image/jpeg' || mimeType === 'image/webp' ? quality : undefined

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas export returned empty blob.'))
          return
        }

        resolve(blob)
      },
      mimeType,
      normalizedQuality,
    )
  })
}

const loadImageFromUrl = async (imageUrl: string): Promise<HTMLImageElement> => {
  const image = new Image()
  image.src = imageUrl
  await image.decode()
  return image
}

const loadImageFromBlob = async (blob: Blob): Promise<HTMLImageElement> => {
  const image = new Image()
  const objectUrl = URL.createObjectURL(blob)
  image.src = objectUrl

  try {
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

interface CornerRadiusEllipse {
  rx: number
  ry: number
}

interface CornerRadiusPixels {
  topLeft: CornerRadiusEllipse
  topRight: CornerRadiusEllipse
  bottomRight: CornerRadiusEllipse
  bottomLeft: CornerRadiusEllipse
}

const normalizeCornerRadii = (cornerRadii?: CornerRadii): CornerRadii => {
  return {
    topLeft: clamp(cornerRadii?.topLeft ?? DEFAULT_CORNER_RADII.topLeft, CORNER_RADIUS_RANGE.min, CORNER_RADIUS_RANGE.max),
    topRight: clamp(cornerRadii?.topRight ?? DEFAULT_CORNER_RADII.topRight, CORNER_RADIUS_RANGE.min, CORNER_RADIUS_RANGE.max),
    bottomRight: clamp(
      cornerRadii?.bottomRight ?? DEFAULT_CORNER_RADII.bottomRight,
      CORNER_RADIUS_RANGE.min,
      CORNER_RADIUS_RANGE.max,
    ),
    bottomLeft: clamp(cornerRadii?.bottomLeft ?? DEFAULT_CORNER_RADII.bottomLeft, CORNER_RADIUS_RANGE.min, CORNER_RADIUS_RANGE.max),
  }
}

const hasRoundedCorners = (cornerRadii: CornerRadii): boolean => {
  return Object.values(cornerRadii).some((value) => value > CORNER_RADIUS_RANGE.min)
}

const toCornerRadiusPixels = (width: number, height: number, cornerRadii: CornerRadii): CornerRadiusPixels => {
  const toEllipse = (value: number): CornerRadiusEllipse => ({
    rx: (value / 100) * width,
    ry: (value / 100) * height,
  })

  return {
    topLeft: toEllipse(cornerRadii.topLeft),
    topRight: toEllipse(cornerRadii.topRight),
    bottomRight: toEllipse(cornerRadii.bottomRight),
    bottomLeft: toEllipse(cornerRadii.bottomLeft),
  }
}

const buildRoundedRectPath = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  corners: CornerRadiusPixels,
): void => {
  context.beginPath()
  context.moveTo(corners.topLeft.rx, 0)
  context.lineTo(width - corners.topRight.rx, 0)

  if (corners.topRight.rx > 0 && corners.topRight.ry > 0) {
    context.ellipse(width - corners.topRight.rx, corners.topRight.ry, corners.topRight.rx, corners.topRight.ry, 0, -Math.PI / 2, 0)
  } else {
    context.lineTo(width, 0)
  }

  context.lineTo(width, height - corners.bottomRight.ry)

  if (corners.bottomRight.rx > 0 && corners.bottomRight.ry > 0) {
    context.ellipse(
      width - corners.bottomRight.rx,
      height - corners.bottomRight.ry,
      corners.bottomRight.rx,
      corners.bottomRight.ry,
      0,
      0,
      Math.PI / 2,
    )
  } else {
    context.lineTo(width, height)
  }

  context.lineTo(corners.bottomLeft.rx, height)

  if (corners.bottomLeft.rx > 0 && corners.bottomLeft.ry > 0) {
    context.ellipse(corners.bottomLeft.rx, height - corners.bottomLeft.ry, corners.bottomLeft.rx, corners.bottomLeft.ry, 0, Math.PI / 2, Math.PI)
  } else {
    context.lineTo(0, height)
  }

  context.lineTo(0, corners.topLeft.ry)

  if (corners.topLeft.rx > 0 && corners.topLeft.ry > 0) {
    context.ellipse(corners.topLeft.rx, corners.topLeft.ry, corners.topLeft.rx, corners.topLeft.ry, 0, Math.PI, Math.PI * 1.5)
  } else {
    context.lineTo(0, 0)
  }

  context.closePath()
}

const applyRoundedCornersMask = (sourceCanvas: HTMLCanvasElement, cornerRadii?: CornerRadii): HTMLCanvasElement => {
  const normalizedCornerRadii = normalizeCornerRadii(cornerRadii)

  if (!hasRoundedCorners(normalizedCornerRadii)) {
    return sourceCanvas
  }

  const maskedCanvas = createCanvas(sourceCanvas.width, sourceCanvas.height)
  const context = maskedCanvas.getContext('2d')

  if (!context) {
    throw new Error('Unable to create 2D context for rounded corner export.')
  }

  buildRoundedRectPath(context, maskedCanvas.width, maskedCanvas.height, toCornerRadiusPixels(maskedCanvas.width, maskedCanvas.height, normalizedCornerRadii))
  context.clip()
  context.drawImage(sourceCanvas, 0, 0)

  return maskedCanvas
}

const drawCanvas = (
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): HTMLCanvasElement => {
  const canvas = createCanvas(targetWidth, targetHeight)
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Unable to create 2D context for canvas export.')
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(source, 0, 0, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight)

  return canvas
}

const progressiveResize = (sourceCanvas: HTMLCanvasElement, targetWidth: number, targetHeight: number): HTMLCanvasElement => {
  let workingCanvas = sourceCanvas

  while (workingCanvas.width / 2 > targetWidth && workingCanvas.height / 2 > targetHeight) {
    const nextWidth = Math.max(targetWidth, Math.round(workingCanvas.width / 2))
    const nextHeight = Math.max(targetHeight, Math.round(workingCanvas.height / 2))
    workingCanvas = drawCanvas(workingCanvas, workingCanvas.width, workingCanvas.height, nextWidth, nextHeight)
  }

  if (workingCanvas.width !== targetWidth || workingCanvas.height !== targetHeight) {
    workingCanvas = drawCanvas(workingCanvas, workingCanvas.width, workingCanvas.height, targetWidth, targetHeight)
  }

  return workingCanvas
}

const drawCoverToSquare = (source: HTMLCanvasElement, size: number): HTMLCanvasElement => {
  const target = createCanvas(size, size)
  const context = target.getContext('2d')

  if (!context) {
    throw new Error('Unable to create 2D context for ICO export.')
  }

  const squareSize = Math.min(source.width, source.height)
  const sourceX = Math.round((source.width - squareSize) / 2)
  const sourceY = Math.round((source.height - squareSize) / 2)

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(source, sourceX, sourceY, squareSize, squareSize, 0, 0, size, size)

  return target
}

const buildIcoBlob = async (sourceCanvas: HTMLCanvasElement): Promise<Blob> => {
  const icoCanvas = drawCoverToSquare(sourceCanvas, ICO_TARGET_SIZE)
  const pngBlob = await canvasToBlob(icoCanvas, 'image/png')
  const pngBuffer = await pngBlob.arrayBuffer()

  const iconDirSize = 6 + 16
  const buffer = new ArrayBuffer(iconDirSize)
  const view = new DataView(buffer)

  view.setUint16(0, 0, true)
  view.setUint16(2, 1, true)
  view.setUint16(4, 1, true)
  view.setUint8(6, 0)
  view.setUint8(7, 0)
  view.setUint8(8, 0)
  view.setUint8(9, 0)
  view.setUint16(10, 1, true)
  view.setUint16(12, 32, true)
  view.setUint32(14, pngBuffer.byteLength, true)
  view.setUint32(18, iconDirSize, true)

  return new Blob([buffer, pngBuffer], { type: 'image/x-icon' })
}

const flattenCanvasForJpg = (
  sourceCanvas: HTMLCanvasElement,
  formatId: ExportFormatId,
  backgroundFill?: string | null,
): HTMLCanvasElement => {
  if (formatId !== 'jpg') {
    return sourceCanvas
  }

  const flattenedCanvas = createCanvas(sourceCanvas.width, sourceCanvas.height)
  const context = flattenedCanvas.getContext('2d')

  if (!context) {
    throw new Error('Unable to create 2D context for JPG export.')
  }

  context.fillStyle = backgroundFill ?? '#ffffff'
  context.fillRect(0, 0, flattenedCanvas.width, flattenedCanvas.height)
  context.drawImage(sourceCanvas, 0, 0)

  return flattenedCanvas
}

const encodeExportBlob = async (
  canvas: HTMLCanvasElement,
  formatId: ExportFormatId,
  mimeType: string,
  quality?: number,
): Promise<Blob> => {
  if (formatId === 'ico') {
    return buildIcoBlob(canvas)
  }

  return canvasToBlob(canvas, mimeType, quality)
}

const exportCanvas = async ({
  canvas,
  formatId,
  mimeType,
  quality,
  cornerRadii,
  backgroundFill,
}: {
  canvas: HTMLCanvasElement
  formatId: ExportFormatId
  mimeType: string
  quality?: number
  cornerRadii?: CornerRadii
  backgroundFill?: string | null
}): Promise<CanvasExportResult> => {
  const roundedCanvas = applyRoundedCornersMask(canvas, cornerRadii)
  const preparedCanvas = flattenCanvasForJpg(roundedCanvas, formatId, backgroundFill)

  if (formatId === 'ico') {
    const blob = await buildIcoBlob(preparedCanvas)
    return {
      blob,
      width: ICO_TARGET_SIZE,
      height: ICO_TARGET_SIZE,
    }
  }

  const blob = await encodeExportBlob(preparedCanvas, formatId, mimeType, quality)
  return {
    blob,
    width: preparedCanvas.width,
    height: preparedCanvas.height,
  }
}

const normalizeQuarterTurnAngle = (angle: number): 0 | 90 | 180 | 270 => {
  const normalizedTurns = ((Math.round(angle / 90) % 4) + 4) % 4

  if (normalizedTurns === 1) {
    return 90
  }

  if (normalizedTurns === 2) {
    return 180
  }

  if (normalizedTurns === 3) {
    return 270
  }

  return 0
}

const drawRotatedImageCanvas = (image: HTMLImageElement, angle: 0 | 90 | 180 | 270): HTMLCanvasElement => {
  if (angle === 0) {
    return drawCanvas(image, image.naturalWidth, image.naturalHeight, image.naturalWidth, image.naturalHeight)
  }

  const targetWidth = angle === 90 || angle === 270 ? image.naturalHeight : image.naturalWidth
  const targetHeight = angle === 90 || angle === 270 ? image.naturalWidth : image.naturalHeight
  const canvas = createCanvas(targetWidth, targetHeight)
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Unable to create 2D context for image rotation.')
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.translate(targetWidth / 2, targetHeight / 2)
  context.rotate((angle * Math.PI) / 180)
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2)

  return canvas
}

const pickCompressionFormat = ({
  meta,
  mode,
}: {
  meta: ImageAssetMeta
  mode: CompressionMode
}): ExportFormatId => {
  const originalExportFormat = normalizeToExportFormat(meta.format)

  if (meta.hasAlpha) {
    if (mode === 'quality-first' && originalExportFormat && ALPHA_CAPABLE_FORMATS.has(originalExportFormat)) {
      return originalExportFormat
    }

    return meta.format === 'webp' ? 'webp' : 'png'
  }

  if (mode === 'quality-first') {
    if (originalExportFormat && originalExportFormat !== 'ico') {
      return originalExportFormat
    }

    return meta.isPhotographic ? 'jpg' : 'png'
  }

  if (meta.isPhotographic) {
    return 'webp'
  }

  if (mode === 'size-first' && (meta.format === 'jpg' || meta.format === 'jpeg' || meta.format === 'webp')) {
    return 'webp'
  }

  return originalExportFormat && originalExportFormat !== 'ico' ? originalExportFormat : 'png'
}

const resolveCompressionMaxSide = (meta: ImageAssetMeta, mode: CompressionMode): number => {
  const profile = COMPRESSION_PROFILE_MAP[mode]

  if (meta.megapixels >= profile.maxDimensionStrategy.extremeMegapixels) {
    return profile.maxDimensionStrategy.extreme
  }

  if (meta.megapixels >= profile.maxDimensionStrategy.oversizedMegapixels) {
    return profile.maxDimensionStrategy.oversized
  }

  return profile.maxDimensionStrategy.normal
}

const maybeResizeCanvas = (canvas: HTMLCanvasElement, maxSide: number): HTMLCanvasElement => {
  const largestSide = Math.max(canvas.width, canvas.height)

  if (largestSide <= maxSide) {
    return canvas
  }

  const scale = maxSide / largestSide
  const targetWidth = Math.max(MIN_PROGRESSIVE_SIDE, Math.round(canvas.width * scale))
  const targetHeight = Math.max(MIN_PROGRESSIVE_SIDE, Math.round(canvas.height * scale))

  return progressiveResize(canvas, targetWidth, targetHeight)
}

const makeAttempt = ({
  format,
  quality,
  width,
  height,
  outputBytes,
  accepted,
  reason,
}: CompressionAttempt): CompressionAttempt => ({
  format,
  quality,
  width,
  height,
  outputBytes,
  accepted,
  reason,
})

const encodeCandidateBlob = async ({
  canvas,
  formatId,
  quality,
  backgroundFill,
}: {
  canvas: HTMLCanvasElement
  formatId: ExportFormatId
  quality?: number
  backgroundFill?: string | null
}): Promise<Blob> => {
  const option = EXPORT_FORMAT_MAP[formatId]
  const preparedCanvas = flattenCanvasForJpg(canvas, formatId, backgroundFill)
  return encodeExportBlob(preparedCanvas, formatId, option.mimeType, quality)
}

export const convertImageFile = async (file: File, options: ConvertOptions): Promise<ConvertResult> => {
  const sourceImage = await loadImageFromBlob(file)
  const targetFormatId = normalizeToExportFormat(options.targetFormat) ?? 'png'
  const targetOption = EXPORT_FORMAT_MAP[targetFormatId]
  const canvas = drawCanvas(
    sourceImage,
    sourceImage.naturalWidth,
    sourceImage.naturalHeight,
    sourceImage.naturalWidth,
    sourceImage.naturalHeight,
  )
  const blob = await encodeCandidateBlob({
    canvas,
    formatId: targetFormatId,
    quality: resolveConvertQuality(options),
    backgroundFill: options.backgroundFill,
  })
  const outputMeta = await analyzeImageBlob(blob, file.name.replace(/\.[^/.]+$/, `.${targetOption.extension}`))

  return {
    blob,
    meta: outputMeta,
  }
}

export const compressImageFile = async (file: File, mode: CompressionMode): Promise<CompressionResult> => {
  const inputMeta = await analyzeImageFile(file)
  const sourceImage = await loadImageFromBlob(file)
  const originalCanvas = drawCanvas(
    sourceImage,
    sourceImage.naturalWidth,
    sourceImage.naturalHeight,
    sourceImage.naturalWidth,
    sourceImage.naturalHeight,
  )
  const targetFormat = pickCompressionFormat({ meta: inputMeta, mode })
  const targetOption = EXPORT_FORMAT_MAP[targetFormat]
  const maxSide = resolveCompressionMaxSide(inputMeta, mode)
  const workingCanvas = maybeResizeCanvas(originalCanvas, maxSide)
  const profile = COMPRESSION_PROFILE_MAP[mode]
  const attempts: CompressionAttempt[] = []
  const appliedSteps: string[] = []

  if (workingCanvas.width !== originalCanvas.width || workingCanvas.height !== originalCanvas.height) {
    appliedSteps.push(`resize:${workingCanvas.width}x${workingCanvas.height}`)
  }

  if (targetFormat !== normalizeToExportFormat(inputMeta.format)) {
    appliedSteps.push(`format:${targetFormat}`)
  }

  const backgroundFill = targetFormat === 'jpg' ? '#ffffff' : null
  let bestBlob: Blob | null = null
  let bestQuality: number | undefined

  if (LOSSY_IMAGE_FORMATS.has(targetFormat)) {
    const candidates = profile.qualityRange.candidates.slice(0, profile.maxPasses)

    for (const quality of candidates) {
      const blob = await encodeCandidateBlob({
        canvas: workingCanvas,
        formatId: targetFormat,
        quality,
        backgroundFill,
      })
      const accepted = blob.size < file.size && (!bestBlob || blob.size < bestBlob.size)
      attempts.push(
        makeAttempt({
          format: targetFormat,
          quality,
          width: workingCanvas.width,
          height: workingCanvas.height,
          outputBytes: blob.size,
          accepted,
          reason: accepted ? 'smaller' : blob.size >= file.size ? 'not-smaller' : 'bigger-than-best',
        }),
      )

      if (accepted) {
        bestBlob = blob
        bestQuality = quality
      }
    }
  } else {
    const blob = await encodeCandidateBlob({
      canvas: workingCanvas,
      formatId: targetFormat,
      backgroundFill,
    })
    const accepted = blob.size < file.size
    attempts.push(
      makeAttempt({
        format: targetFormat,
        width: workingCanvas.width,
        height: workingCanvas.height,
        outputBytes: blob.size,
        accepted,
        reason: accepted ? 'smaller' : 'not-smaller',
      }),
    )

    if (accepted) {
      bestBlob = blob
    }
  }

  const finalBlob = bestBlob ?? file
  if (bestQuality !== undefined) {
    appliedSteps.push(`quality:${Math.round(bestQuality * 100)}`)
  }

  const outputMeta = await analyzeImageBlob(finalBlob, file.name.replace(/\.[^/.]+$/, `.${targetOption.extension}`))
  const savingsBytes = inputMeta.sizeBytes - finalBlob.size
  const savingsRatio = inputMeta.sizeBytes > 0 ? savingsBytes / inputMeta.sizeBytes : 0
  const warnings: string[] = []

  if (!bestBlob) {
    warnings.push('already-optimized')
  } else if (savingsRatio < profile.minimalSavingsRatio) {
    warnings.push('minimal-gain')
  }

  if (inputMeta.hasAlpha && targetFormat === 'png') {
    warnings.push('alpha-preserved')
  }

  return {
    inputMeta,
    outputMeta,
    blob: finalBlob,
    savingsBytes,
    savingsRatio,
    attempts,
    warnings,
    appliedSteps,
  }
}

export const exportCroppedImage = async ({
  image,
  crop,
  formatId,
  mimeType,
  quality,
  cornerRadii,
  backgroundFill,
}: CropExportOptions): Promise<CanvasExportResult> => {
  if (crop.width < 1 || crop.height < 1) {
    throw new Error('Crop rectangle must be larger than 1px.')
  }

  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  const cropX = clamp(Math.round(crop.x * scaleX), 0, image.naturalWidth - 1)
  const cropY = clamp(Math.round(crop.y * scaleY), 0, image.naturalHeight - 1)
  const cropWidth = clamp(Math.round(crop.width * scaleX), 1, image.naturalWidth - cropX)
  const cropHeight = clamp(Math.round(crop.height * scaleY), 1, image.naturalHeight - cropY)
  const canvas = createCanvas(cropWidth, cropHeight)
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Unable to create 2D context for crop.')
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)

  return exportCanvas({
    canvas,
    formatId,
    mimeType,
    quality,
    cornerRadii,
    backgroundFill,
  })
}

export const exportRotatedImageFromUrl = async ({
  imageUrl,
  angle,
}: {
  imageUrl: string
  angle: number
}): Promise<CanvasExportResult> => {
  const image = await loadImageFromUrl(imageUrl)
  const normalizedAngle = normalizeQuarterTurnAngle(angle)
  const canvas = drawRotatedImageCanvas(image, normalizedAngle)
  const blob = await canvasToBlob(canvas, 'image/png')

  return {
    blob,
    width: canvas.width,
    height: canvas.height,
  }
}

export const exportImageFromUrl = async ({
  imageUrl,
  formatId,
  mimeType,
  quality,
  cornerRadii,
  backgroundFill,
}: UrlExportOptions): Promise<CanvasExportResult> => {
  const image = await loadImageFromUrl(imageUrl)
  const canvas = drawCanvas(image, image.naturalWidth, image.naturalHeight, image.naturalWidth, image.naturalHeight)

  return exportCanvas({
    canvas,
    formatId,
    mimeType,
    quality,
    cornerRadii,
    backgroundFill,
  })
}
