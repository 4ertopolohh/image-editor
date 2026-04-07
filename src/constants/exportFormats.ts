import type {
  EditorExportFormatOption,
  ExportFormatId,
  ExportFormatOption,
  SupportedImageFormat,
} from '../types/editor'

export const DEFAULT_EXPORT_FORMAT: ExportFormatId = 'png'
export const DEFAULT_EDITOR_EXPORT_FORMAT = 'original'
export const DEFAULT_EXPORT_QUALITY = 0.92
export const DEFAULT_CONVERT_JPG_QUALITY = 0.92
export const DEFAULT_CONVERT_WEBP_QUALITY = 0.9

export const ALPHA_CAPABLE_FORMATS = new Set<SupportedImageFormat>(['png', 'webp', 'ico'])
export const LOSSY_IMAGE_FORMATS = new Set<SupportedImageFormat>(['jpg', 'jpeg', 'webp'])

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

export const EDITOR_EXPORT_FORMATS: EditorExportFormatOption[] = [
  {
    id: 'original',
    label: 'Original',
    mimeType: '',
    extension: '',
    supportsQuality: false,
  },
  ...EXPORT_FORMATS,
]

export const EXPORT_FORMAT_MAP: Record<ExportFormatId, ExportFormatOption> = EXPORT_FORMATS.reduce(
  (accumulator, format) => {
    accumulator[format.id] = format
    return accumulator
  },
  {} as Record<ExportFormatId, ExportFormatOption>,
)

export const isExportFormatId = (value: string): value is ExportFormatId => {
  return value === 'png' || value === 'jpg' || value === 'webp' || value === 'ico'
}
