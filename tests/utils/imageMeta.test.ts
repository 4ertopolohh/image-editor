import { afterEach, describe, expect, it, vi } from 'vitest'
import { MAX_IMAGE_DIMENSION } from '../../src/constants/fileValidation'
import { readImageDimensions, validateImageDimensions } from '../../src/utils/imageMeta'

describe('imageMeta', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('returns dimensions from createImageBitmap when supported', async () => {
    const close = vi.fn()
    const createImageBitmapMock = vi.fn(async () => ({
      width: 640,
      height: 480,
      close,
    }))
    vi.stubGlobal('createImageBitmap', createImageBitmapMock)

    const result = await readImageDimensions(new Blob(['test'], { type: 'image/png' }))

    expect(createImageBitmapMock).toHaveBeenCalledOnce()
    expect(close).toHaveBeenCalledOnce()
    expect(result).toEqual({ width: 640, height: 480 })
  })

  it('rejects image dimensions larger than max side', () => {
    const result = validateImageDimensions({ width: MAX_IMAGE_DIMENSION + 1, height: 1000 })

    expect(result).toEqual({
      ok: false,
      issue: 'dimension-too-large',
      maxDimension: MAX_IMAGE_DIMENSION,
    })
  })

  it('rejects image dimensions with too many pixels', () => {
    const result = validateImageDimensions({ width: 7000, height: 7000 })

    expect(result).toEqual({
      ok: false,
      issue: 'pixel-count-too-large',
    })
  })

  it('accepts valid image dimensions', () => {
    const result = validateImageDimensions({ width: 1920, height: 1080 })

    expect(result).toEqual({ ok: true })
  })
})
