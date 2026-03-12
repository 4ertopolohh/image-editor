import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { exportCroppedImage, exportImageFromUrl, exportRotatedImageFromUrl } from '../../src/utils/canvasExport'

const createMockCanvas = (): HTMLCanvasElement => {
  const context = {
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    ellipse: vi.fn(),
    closePath: vi.fn(),
    clip: vi.fn(),
    fillRect: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    globalCompositeOperation: 'source-over',
    fillStyle: '#ffffff',
  }

  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => context),
    toBlob: vi.fn((callback: BlobCallback, mimeType?: string) => {
      callback(new Blob(['canvas-data'], { type: mimeType ?? 'image/png' }))
    }),
  }

  return canvas as unknown as HTMLCanvasElement
}

class MockImage {
  src = ''
  naturalWidth = 400
  naturalHeight = 300

  decode = vi.fn(async () => undefined)
}

describe('canvasExport', () => {
  beforeEach(() => {
    const nativeCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation(
      ((tagName: string) => {
        if (tagName.toLowerCase() === 'canvas') {
          return createMockCanvas() as unknown as HTMLElement
        }

        return nativeCreateElement(tagName)
      }) as typeof document.createElement,
    )

    vi.stubGlobal('Image', MockImage as unknown as typeof Image)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('throws if crop rectangle is smaller than one pixel', async () => {
    const image = {
      width: 500,
      height: 500,
      naturalWidth: 500,
      naturalHeight: 500,
    } as HTMLImageElement

    await expect(
      exportCroppedImage({
        image,
        crop: { x: 0, y: 0, width: 0, height: 100, unit: 'px' },
        formatId: 'png',
        mimeType: 'image/png',
      }),
    ).rejects.toThrow('Crop rectangle must be larger than 1px.')
  })

  it('exports cropped image with expected scaled dimensions', async () => {
    const image = {
      width: 500,
      height: 250,
      naturalWidth: 1000,
      naturalHeight: 500,
    } as HTMLImageElement

    const result = await exportCroppedImage({
      image,
      crop: { x: 50, y: 25, width: 100, height: 50, unit: 'px' },
      formatId: 'png',
      mimeType: 'image/png',
    })

    expect(result.width).toBe(200)
    expect(result.height).toBe(100)
    expect(result.blob).toBeInstanceOf(Blob)
  })

  it('rotates image by quarter turn and swaps dimensions for 90 degrees', async () => {
    const result = await exportRotatedImageFromUrl({
      imageUrl: 'blob:source',
      angle: 90,
    })

    expect(result.width).toBe(300)
    expect(result.height).toBe(400)
    expect(result.blob).toBeInstanceOf(Blob)
  })

  it('exports ico with fixed 256x256 dimensions', async () => {
    const result = await exportImageFromUrl({
      imageUrl: 'blob:source',
      formatId: 'ico',
      mimeType: 'image/x-icon',
    })

    expect(result.width).toBe(256)
    expect(result.height).toBe(256)
    expect(result.blob.type).toBe('image/x-icon')
  })
})
