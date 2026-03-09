import type { ExportFormatId, ExportFormatOption } from '../types/editor'

export const DEFAULT_EXPORT_FORMAT: ExportFormatId = 'png'
export const DEFAULT_EXPORT_QUALITY = 0.92

export const EXPORT_FORMATS: ExportFormatOption[] = [
  {
    id: 'png',
    label: 'PNG',
    mimeType: 'image/png',
    extension: 'png',
    supportsQuality: false,
  },
  {
    id: 'jpg',
    label: 'JPG / JPEG',
    mimeType: 'image/jpeg',
    extension: 'jpg',
    supportsQuality: true,
  },
  {
    id: 'webp',
    label: 'WebP',
    mimeType: 'image/webp',
    extension: 'webp',
    supportsQuality: true,
  },
  {
    id: 'ico',
    label: 'ICO (256x256)',
    mimeType: 'image/x-icon',
    extension: 'ico',
    supportsQuality: false,
  },
]

export const EXPORT_FORMAT_MAP: Record<ExportFormatId, ExportFormatOption> = EXPORT_FORMATS.reduce(
  (accumulator, format) => {
    accumulator[format.id] = format
    return accumulator
  },
  {} as Record<ExportFormatId, ExportFormatOption>,
)
