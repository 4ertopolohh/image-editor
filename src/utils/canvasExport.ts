import type { PixelCrop } from 'react-image-crop'
import { MIN_LOSSY_COMPRESSION_QUALITY } from '../constants/compression'
import type { ExportCompressionSettings, ExportFormatId } from '../types/editor'

const ICO_TARGET_SIZE = 256
const QUALITY_SEARCH_STEPS = 7
const RESIZE_SEARCH_STEPS = 7
const SCALE_SAFETY_FACTOR = 0.97
const MIN_EXPORT_SIDE = 64

interface CropExportOptions {
  image: HTMLImageElement
  crop: PixelCrop
  formatId: ExportFormatId
  mimeType: string
  quality?: number
}

interface UrlExportOptions {
  imageUrl: string
  formatId: ExportFormatId
  mimeType: string
  quality?: number
  compression?: ExportCompressionSettings
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

const canvasToBlob = (canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob> => {
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
      quality,
    )
  })
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

const loadImageFromUrl = async (imageUrl: string): Promise<HTMLImageElement> => {
  const image = new Image()
  image.src = imageUrl
  await image.decode()
  return image
}

const supportsQuality = (formatId: ExportFormatId): boolean => {
  return formatId === 'jpg' || formatId === 'webp'
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

const resizeToMaxDimension = (sourceCanvas: HTMLCanvasElement, maxDimension: number): HTMLCanvasElement => {
  if (maxDimension < 1) {
    return sourceCanvas
  }

  const largestSide = Math.max(sourceCanvas.width, sourceCanvas.height)

  if (largestSide <= maxDimension) {
    return sourceCanvas
  }

  const scale = maxDimension / largestSide
  const nextWidth = Math.max(MIN_EXPORT_SIDE, Math.round(sourceCanvas.width * scale))
  const nextHeight = Math.max(MIN_EXPORT_SIDE, Math.round(sourceCanvas.height * scale))

  return drawCanvas(sourceCanvas, sourceCanvas.width, sourceCanvas.height, nextWidth, nextHeight)
}

interface LossySearchResult {
  blob: Blob
  quality: number
  hitTarget: boolean
}

const findBestLossyBlob = async ({
  canvas,
  mimeType,
  initialQuality,
  minimumQuality,
  targetBytes,
}: {
  canvas: HTMLCanvasElement
  mimeType: string
  initialQuality: number
  minimumQuality: number
  targetBytes: number
}): Promise<LossySearchResult> => {
  const normalizedMinimumQuality = clamp(minimumQuality, 0.05, 1)
  const normalizedInitialQuality = clamp(initialQuality, normalizedMinimumQuality, 1)

  let smallestBlob = await canvasToBlob(canvas, mimeType, normalizedInitialQuality)
  let smallestQuality = normalizedInitialQuality
  let bestUnderTargetBlob: Blob | null = smallestBlob.size <= targetBytes ? smallestBlob : null
  let bestUnderTargetQuality = normalizedInitialQuality
  let low = normalizedMinimumQuality
  let high = normalizedInitialQuality

  for (let step = 0; step < QUALITY_SEARCH_STEPS; step += 1) {
    const candidateQuality = clamp((low + high) / 2, normalizedMinimumQuality, normalizedInitialQuality)
    const candidateBlob = await canvasToBlob(canvas, mimeType, candidateQuality)

    if (candidateBlob.size < smallestBlob.size) {
      smallestBlob = candidateBlob
      smallestQuality = candidateQuality
    }

    if (candidateBlob.size <= targetBytes) {
      bestUnderTargetBlob = candidateBlob
      bestUnderTargetQuality = candidateQuality
      low = candidateQuality
    } else {
      high = candidateQuality
    }

    if (Math.abs(high - low) <= 0.005) {
      break
    }
  }

  if (bestUnderTargetBlob) {
    return {
      blob: bestUnderTargetBlob,
      quality: bestUnderTargetQuality,
      hitTarget: true,
    }
  }

  return {
    blob: smallestBlob,
    quality: smallestQuality,
    hitTarget: false,
  }
}

interface CompressionCandidate {
  blob: Blob
  width: number
  height: number
}

const optimizeCanvasForTargetSize = async ({
  canvas,
  formatId,
  mimeType,
  quality,
  targetBytes,
  minimumQuality,
}: {
  canvas: HTMLCanvasElement
  formatId: ExportFormatId
  mimeType: string
  quality: number
  targetBytes: number
  minimumQuality: number
}): Promise<CompressionCandidate> => {
  const isLossy = supportsQuality(formatId)
  let workingCanvas = canvas
  let currentCandidate: CompressionCandidate

  if (isLossy) {
    const lossyResult = await findBestLossyBlob({
      canvas: workingCanvas,
      mimeType,
      initialQuality: quality,
      minimumQuality,
      targetBytes,
    })

    currentCandidate = {
      blob: lossyResult.blob,
      width: workingCanvas.width,
      height: workingCanvas.height,
    }

    if (lossyResult.hitTarget) {
      return currentCandidate
    }
  } else {
    const initialBlob = await encodeExportBlob(workingCanvas, formatId, mimeType)
    currentCandidate = {
      blob: initialBlob,
      width: workingCanvas.width,
      height: workingCanvas.height,
    }

    if (initialBlob.size <= targetBytes) {
      return currentCandidate
    }
  }

  let bestCandidate = currentCandidate

  for (let step = 0; step < RESIZE_SEARCH_STEPS; step += 1) {
    if (workingCanvas.width <= MIN_EXPORT_SIDE && workingCanvas.height <= MIN_EXPORT_SIDE) {
      break
    }

    const ratio = Math.sqrt(targetBytes / currentCandidate.blob.size)
    const scale = clamp(ratio * SCALE_SAFETY_FACTOR, 0.5, 0.95)
    const nextWidth = Math.max(MIN_EXPORT_SIDE, Math.round(workingCanvas.width * scale))
    const nextHeight = Math.max(MIN_EXPORT_SIDE, Math.round(workingCanvas.height * scale))

    if (nextWidth === workingCanvas.width && nextHeight === workingCanvas.height) {
      break
    }

    workingCanvas = drawCanvas(workingCanvas, workingCanvas.width, workingCanvas.height, nextWidth, nextHeight)

    if (isLossy) {
      const lossyResult = await findBestLossyBlob({
        canvas: workingCanvas,
        mimeType,
        initialQuality: quality,
        minimumQuality,
        targetBytes,
      })

      currentCandidate = {
        blob: lossyResult.blob,
        width: workingCanvas.width,
        height: workingCanvas.height,
      }

      if (currentCandidate.blob.size <= targetBytes) {
        return currentCandidate
      }
    } else {
      const resizedBlob = await encodeExportBlob(workingCanvas, formatId, mimeType)
      currentCandidate = {
        blob: resizedBlob,
        width: workingCanvas.width,
        height: workingCanvas.height,
      }

      if (resizedBlob.size <= targetBytes) {
        return currentCandidate
      }
    }

    if (currentCandidate.blob.size < bestCandidate.blob.size) {
      bestCandidate = currentCandidate
    }
  }

  return bestCandidate
}

const normalizeCompressionSettings = (
  compression?: ExportCompressionSettings,
): ExportCompressionSettings | null => {
  if (!compression || !compression.enabled) {
    return null
  }

  return {
    enabled: true,
    targetSizeKb: Math.max(1, Math.round(compression.targetSizeKb)),
    maxDimension: Math.max(1, Math.round(compression.maxDimension)),
  }
}

const exportCanvas = async ({
  canvas,
  formatId,
  mimeType,
  quality,
  compression,
}: {
  canvas: HTMLCanvasElement
  formatId: ExportFormatId
  mimeType: string
  quality?: number
  compression?: ExportCompressionSettings
}): Promise<CanvasExportResult> => {
  if (formatId === 'ico') {
    const blob = await buildIcoBlob(canvas)
    return {
      blob,
      width: ICO_TARGET_SIZE,
      height: ICO_TARGET_SIZE,
    }
  }

  const normalizedCompression = normalizeCompressionSettings(compression)

  if (!normalizedCompression) {
    const blob = await encodeExportBlob(canvas, formatId, mimeType, quality)
    return {
      blob,
      width: canvas.width,
      height: canvas.height,
    }
  }

  const normalizedQuality = clamp(quality ?? 0.92, MIN_LOSSY_COMPRESSION_QUALITY, 1)
  const targetBytes = normalizedCompression.targetSizeKb * 1024
  const dimensionLimitedCanvas = resizeToMaxDimension(canvas, normalizedCompression.maxDimension)

  const compressed = await optimizeCanvasForTargetSize({
    canvas: dimensionLimitedCanvas,
    formatId,
    mimeType,
    quality: normalizedQuality,
    targetBytes,
    minimumQuality: MIN_LOSSY_COMPRESSION_QUALITY,
  })

  return {
    blob: compressed.blob,
    width: compressed.width,
    height: compressed.height,
  }
}

export const exportCroppedImage = async ({
  image,
  crop,
  formatId,
  mimeType,
  quality,
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
  })
}

export const exportImageFromUrl = async ({
  imageUrl,
  formatId,
  mimeType,
  quality,
  compression,
}: UrlExportOptions): Promise<CanvasExportResult> => {
  const image = await loadImageFromUrl(imageUrl)
  const canvas = drawCanvas(image, image.naturalWidth, image.naturalHeight, image.naturalWidth, image.naturalHeight)

  return exportCanvas({
    canvas,
    formatId,
    mimeType,
    quality,
    compression,
  })
}
