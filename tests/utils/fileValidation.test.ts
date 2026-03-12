import { describe, expect, it } from 'vitest'
import { MAX_FILE_SIZE_BYTES } from '../../src/constants/fileValidation'
import { validateImageFile } from '../../src/utils/fileValidation'

describe('validateImageFile', () => {
  it('rejects files that are not images', () => {
    const file = { name: 'notes.txt', type: 'text/plain', size: 1000 } as File

    expect(validateImageFile(file)).toEqual({
      ok: false,
      issue: 'not-image',
    })
  })

  it('rejects unsupported image format', () => {
    const file = { name: 'photo.tiff', type: 'image/tiff', size: 1000 } as File

    expect(validateImageFile(file)).toEqual({
      ok: false,
      issue: 'unsupported-format',
    })
  })

  it('accepts file when extension is supported even if mime type is unusual', () => {
    const file = { name: 'photo.png', type: 'image/unknown', size: 1000 } as File

    expect(validateImageFile(file)).toEqual({ ok: true })
  })

  it('rejects files larger than limit', () => {
    const file = {
      name: 'huge.png',
      type: 'image/png',
      size: MAX_FILE_SIZE_BYTES + 1,
    } as File

    expect(validateImageFile(file)).toEqual({
      ok: false,
      issue: 'file-too-large',
      maxSizeMb: 25,
    })
  })

  it('accepts valid image file', () => {
    const file = { name: 'photo.webp', type: 'image/webp', size: 512000 } as File

    expect(validateImageFile(file)).toEqual({ ok: true })
  })
})
