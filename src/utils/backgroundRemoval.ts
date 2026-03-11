import { removeBackground as imglyRemoveBackground, type Config } from '@imgly/background-removal'

export interface BackgroundRemovalProgress {
  key: string
  current: number
  total: number
  percent: number | null
}

interface RemoveBackgroundOptions {
  onProgress?: (progress: BackgroundRemovalProgress) => void
}

interface DecodedImageSource {
  image: CanvasImageSource
  width: number
  height: number
  cleanup: () => void
}

interface RgbColor {
  r: number
  g: number
  b: number
}

const MAX_ANALYSIS_SIDE = 512
const MAX_FALLBACK_MASK_SIDE = 1024
const MIN_MODEL_VISIBLE_RATIO = 0.004
const MIN_ACCEPTED_VISIBLE_RATIO = 0.001
const VISIBLE_ALPHA_THRESHOLD = 16
const COLOR_QUANTIZATION_SHIFT = 4
const MIN_COLOR_THRESHOLD = 24
const MAX_COLOR_THRESHOLD = 80
const DEFAULT_COLOR_THRESHOLD = 42

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max)
}

const createCanvas = (width: number, height: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  return canvas
}

const canvasToBlob = (canvas: HTMLCanvasElement, mimeType: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Background removal export returned empty blob.'))
        return
      }

      resolve(blob)
    }, mimeType)
  })
}

const decodeImageSource = async (source: Blob): Promise<DecodedImageSource> => {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(source)
    return {
      image: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close(),
    }
  }

  const objectUrl = URL.createObjectURL(source)
  const image = new Image()
  image.src = objectUrl
  await image.decode()

  return {
    image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    cleanup: () => URL.revokeObjectURL(objectUrl),
  }
}

const drawImageToCanvas = (
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): HTMLCanvasElement => {
  const canvas = createCanvas(targetWidth, targetHeight)
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Unable to create 2D context for background removal.')
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight)
  return canvas
}

const calculateVisiblePixelRatioFromData = (data: Uint8ClampedArray): number => {
  if (data.length < 4) {
    return 0
  }

  let visiblePixels = 0
  const totalPixels = data.length / 4

  for (let offset = 3; offset < data.length; offset += 4) {
    if (data[offset] > VISIBLE_ALPHA_THRESHOLD) {
      visiblePixels += 1
    }
  }

  return visiblePixels / totalPixels
}

const calculateVisiblePixelRatio = async (source: Blob): Promise<number> => {
  const decoded = await decodeImageSource(source)

  try {
    const scale = Math.min(1, MAX_ANALYSIS_SIDE / Math.max(decoded.width, decoded.height))
    const sampleWidth = Math.max(1, Math.round(decoded.width * scale))
    const sampleHeight = Math.max(1, Math.round(decoded.height * scale))
    const sampleCanvas = drawImageToCanvas(decoded.image, decoded.width, decoded.height, sampleWidth, sampleHeight)
    const sampleContext = sampleCanvas.getContext('2d')

    if (!sampleContext) {
      throw new Error('Unable to create 2D context for alpha analysis.')
    }

    const imageData = sampleContext.getImageData(0, 0, sampleWidth, sampleHeight)
    return calculateVisiblePixelRatioFromData(imageData.data)
  } finally {
    decoded.cleanup()
  }
}

const getPixelOffset = (index: number): number => index * 4

const getColorDistanceSquared = (data: Uint8ClampedArray, index: number, color: RgbColor): number => {
  const pixelOffset = getPixelOffset(index)
  const dr = data[pixelOffset] - color.r
  const dg = data[pixelOffset + 1] - color.g
  const db = data[pixelOffset + 2] - color.b
  return dr * dr + dg * dg + db * db
}

const collectDominantBorderColor = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
): { color: RgbColor; samples: RgbColor[] } => {
  const samples: RgbColor[] = []
  const bins = new Map<number, { count: number; sumR: number; sumG: number; sumB: number }>()
  const step = Math.max(1, Math.floor(Math.max(width, height) / 80))

  const addSample = (x: number, y: number): void => {
    const index = y * width + x
    const offset = getPixelOffset(index)
    const r = data[offset]
    const g = data[offset + 1]
    const b = data[offset + 2]
    const key = ((r >> COLOR_QUANTIZATION_SHIFT) << 8) + ((g >> COLOR_QUANTIZATION_SHIFT) << 4) + (b >> COLOR_QUANTIZATION_SHIFT)
    const existingBin = bins.get(key)

    samples.push({ r, g, b })

    if (existingBin) {
      existingBin.count += 1
      existingBin.sumR += r
      existingBin.sumG += g
      existingBin.sumB += b
      return
    }

    bins.set(key, {
      count: 1,
      sumR: r,
      sumG: g,
      sumB: b,
    })
  }

  for (let x = 0; x < width; x += step) {
    addSample(x, 0)
    addSample(x, height - 1)
  }

  if ((width - 1) % step !== 0) {
    addSample(width - 1, 0)
    addSample(width - 1, height - 1)
  }

  for (let y = step; y < height - 1; y += step) {
    addSample(0, y)
    addSample(width - 1, y)
  }

  let dominantBin: { count: number; sumR: number; sumG: number; sumB: number } | null = null

  for (const bin of bins.values()) {
    if (!dominantBin || bin.count > dominantBin.count) {
      dominantBin = bin
    }
  }

  if (!dominantBin) {
    return {
      color: {
        r: 255,
        g: 255,
        b: 255,
      },
      samples,
    }
  }

  return {
    color: {
      r: Math.round(dominantBin.sumR / dominantBin.count),
      g: Math.round(dominantBin.sumG / dominantBin.count),
      b: Math.round(dominantBin.sumB / dominantBin.count),
    },
    samples,
  }
}

const resolveAdaptiveThreshold = (samples: RgbColor[], borderColor: RgbColor): number => {
  if (samples.length === 0) {
    return DEFAULT_COLOR_THRESHOLD
  }

  let distanceSum = 0

  for (const sample of samples) {
    const dr = sample.r - borderColor.r
    const dg = sample.g - borderColor.g
    const db = sample.b - borderColor.b
    distanceSum += Math.sqrt(dr * dr + dg * dg + db * db)
  }

  const averageDistance = distanceSum / samples.length
  const adaptiveThreshold = Math.round(averageDistance * 1.8 + 18)
  return clamp(adaptiveThreshold, MIN_COLOR_THRESHOLD, MAX_COLOR_THRESHOLD)
}

const buildForegroundMask = (
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  borderColor: RgbColor,
  colorThreshold: number,
): { maskCanvas: HTMLCanvasElement; foregroundRatio: number } => {
  const size = width * height
  const visited = new Uint8Array(size)
  const background = new Uint8Array(size)
  const queue = new Int32Array(size)
  const colorThresholdSquared = colorThreshold * colorThreshold
  let queueHead = 0
  let queueTail = 0

  const isBackgroundCandidate = (index: number): boolean => {
    const alpha = imageData[getPixelOffset(index) + 3]
    if (alpha <= VISIBLE_ALPHA_THRESHOLD) {
      return true
    }

    return getColorDistanceSquared(imageData, index, borderColor) <= colorThresholdSquared
  }

  const enqueueIfBackground = (index: number): void => {
    if (visited[index] === 1) {
      return
    }

    visited[index] = 1

    if (!isBackgroundCandidate(index)) {
      return
    }

    background[index] = 1
    queue[queueTail] = index
    queueTail += 1
  }

  for (let x = 0; x < width; x += 1) {
    enqueueIfBackground(x)
    enqueueIfBackground((height - 1) * width + x)
  }

  for (let y = 1; y < height - 1; y += 1) {
    enqueueIfBackground(y * width)
    enqueueIfBackground(y * width + (width - 1))
  }

  while (queueHead < queueTail) {
    const index = queue[queueHead]
    queueHead += 1
    const x = index % width
    const y = Math.floor(index / width)

    if (x > 0) {
      enqueueIfBackground(index - 1)
    }
    if (x < width - 1) {
      enqueueIfBackground(index + 1)
    }
    if (y > 0) {
      enqueueIfBackground(index - width)
    }
    if (y < height - 1) {
      enqueueIfBackground(index + width)
    }
  }

  const maskBytes = new Uint8ClampedArray(size * 4)
  let foregroundPixels = 0

  for (let index = 0; index < size; index += 1) {
    const offset = getPixelOffset(index)
    const alpha = background[index] === 1 ? 0 : 255

    if (alpha > VISIBLE_ALPHA_THRESHOLD) {
      foregroundPixels += 1
    }

    maskBytes[offset] = 255
    maskBytes[offset + 1] = 255
    maskBytes[offset + 2] = 255
    maskBytes[offset + 3] = alpha
  }

  const maskCanvas = createCanvas(width, height)
  const maskContext = maskCanvas.getContext('2d')

  if (!maskContext) {
    throw new Error('Unable to create 2D context for fallback mask.')
  }

  maskContext.putImageData(new ImageData(maskBytes, width, height), 0, 0)

  return {
    maskCanvas,
    foregroundRatio: foregroundPixels / size,
  }
}

const runFlatBackgroundFallback = async (source: Blob): Promise<{ blob: Blob; visibleRatio: number }> => {
  const decoded = await decodeImageSource(source)

  try {
    const maskScale = Math.min(1, MAX_FALLBACK_MASK_SIDE / Math.max(decoded.width, decoded.height))
    const maskWidth = Math.max(1, Math.round(decoded.width * maskScale))
    const maskHeight = Math.max(1, Math.round(decoded.height * maskScale))
    const sampleCanvas = drawImageToCanvas(decoded.image, decoded.width, decoded.height, maskWidth, maskHeight)
    const sampleContext = sampleCanvas.getContext('2d')

    if (!sampleContext) {
      throw new Error('Unable to create 2D context for fallback sampling.')
    }

    const sampledImageData = sampleContext.getImageData(0, 0, maskWidth, maskHeight)
    const { color: borderColor, samples } = collectDominantBorderColor(sampledImageData.data, maskWidth, maskHeight)
    const threshold = resolveAdaptiveThreshold(samples, borderColor)
    const { maskCanvas, foregroundRatio } = buildForegroundMask(
      sampledImageData.data,
      maskWidth,
      maskHeight,
      borderColor,
      threshold,
    )

    if (foregroundRatio < MIN_ACCEPTED_VISIBLE_RATIO) {
      throw new Error('Fallback background removal produced an empty foreground mask.')
    }

    const outputCanvas = drawImageToCanvas(decoded.image, decoded.width, decoded.height, decoded.width, decoded.height)
    const outputContext = outputCanvas.getContext('2d')

    if (!outputContext) {
      throw new Error('Unable to create 2D context for fallback compositing.')
    }

    outputContext.imageSmoothingEnabled = true
    outputContext.imageSmoothingQuality = 'high'
    outputContext.globalCompositeOperation = 'destination-in'
    outputContext.drawImage(maskCanvas, 0, 0, decoded.width, decoded.height)
    outputContext.globalCompositeOperation = 'source-over'

    const blob = await canvasToBlob(outputCanvas, 'image/png')
    const visibleRatio = await calculateVisiblePixelRatio(blob)

    return {
      blob,
      visibleRatio,
    }
  } finally {
    decoded.cleanup()
  }
}

const resolvePreferredDevice = (): Config['device'] => {
  if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
    return 'gpu'
  }

  return 'cpu'
}

const createBaseConfig = (onProgress?: RemoveBackgroundOptions['onProgress']): Config => {
  return {
    device: resolvePreferredDevice(),
    model: 'isnet_fp16',
    output: {
      format: 'image/png',
      quality: 1,
    },
    progress:
      onProgress === undefined
        ? undefined
        : (key: string, current: number, total: number): void => {
            const normalizedPercent = total > 0 ? Math.min(100, Math.max(0, Math.round((current / total) * 100))) : null
            onProgress({
              key,
              current,
              total,
              percent: normalizedPercent,
            })
          },
  }
}

const createCpuFallbackConfig = (config: Config): Config => ({
  ...config,
  device: 'cpu',
})

const runModelBackgroundRemoval = async (
  source: Blob,
  options: RemoveBackgroundOptions = {},
): Promise<Blob> => {
  const config = createBaseConfig(options.onProgress)

  try {
    return await imglyRemoveBackground(source, config)
  } catch (error) {
    if (config.device !== 'gpu') {
      throw error
    }

    return imglyRemoveBackground(source, createCpuFallbackConfig(config))
  }
}

export const removeImageBackground = async (
  source: Blob,
  options: RemoveBackgroundOptions = {},
): Promise<Blob> => {
  let modelResult: Blob

  try {
    modelResult = await runModelBackgroundRemoval(source, options)
  } catch {
    const fallbackResult = await runFlatBackgroundFallback(source)
    return fallbackResult.blob
  }

  const modelVisibleRatio = await calculateVisiblePixelRatio(modelResult)

  if (modelVisibleRatio >= MIN_MODEL_VISIBLE_RATIO) {
    return modelResult
  }

  try {
    const fallbackResult = await runFlatBackgroundFallback(source)
    return fallbackResult.visibleRatio > modelVisibleRatio ? fallbackResult.blob : modelResult
  } catch {
    return modelResult
  }
}
