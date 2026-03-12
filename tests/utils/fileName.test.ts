import { describe, expect, it } from 'vitest'
import { createExportFileName } from '../../src/utils/fileName'

describe('createExportFileName', () => {
  it('adds edited suffix and keeps readable characters', () => {
    expect(createExportFileName('summer photo.jpg', 'png')).toBe('summer-photo-edited.png')
  })

  it('falls back to default name when source name is empty', () => {
    expect(createExportFileName('   ', 'webp')).toBe('edited-image-edited.webp')
  })
})
