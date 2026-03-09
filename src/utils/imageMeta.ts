import { MAX_IMAGE_DIMENSION, MAX_IMAGE_PIXELS } from '../constants/fileValidation'

export interface ImageDimensions {
  width: number
  height: number
}

export type DimensionValidationIssue = 'dimension-too-large' | 'pixel-count-too-large'

export type DimensionValidationResult =
  | { ok: true }
  | {
      ok: false
      issue: DimensionValidationIssue
      maxDimension?: number
    }

const readDimensionsWithImageElement = async (blob: Blob): Promise<ImageDimensions> => {
  const tempUrl = URL.createObjectURL(blob)

  try {
    const image = new Image()
    image.src = tempUrl
    await image.decode()

    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
    }
  } finally {
    URL.revokeObjectURL(tempUrl)
  }
}

export const readImageDimensions = async (blob: Blob): Promise<ImageDimensions> => {
  if ('createImageBitmap' in window) {
    const bitmap = await createImageBitmap(blob)
    const dimensions: ImageDimensions = {
      width: bitmap.width,
      height: bitmap.height,
    }
    bitmap.close()
    return dimensions
  }

  return readDimensionsWithImageElement(blob)
}

export const validateImageDimensions = ({ width, height }: ImageDimensions): DimensionValidationResult => {
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    return {
      ok: false,
      issue: 'dimension-too-large',
      maxDimension: MAX_IMAGE_DIMENSION,
    }
  }

  if (width * height > MAX_IMAGE_PIXELS) {
    return {
      ok: false,
      issue: 'pixel-count-too-large',
    }
  }

  return {
    ok: true,
  }
}
