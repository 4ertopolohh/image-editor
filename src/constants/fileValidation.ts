export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024
export const MAX_IMAGE_DIMENSION = 8_000
export const MAX_IMAGE_PIXELS = 36_000_000

export const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/bmp',
  'image/gif',
  'image/x-icon',
  'image/vnd.microsoft.icon',
])

export const SUPPORTED_IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'ico'])

export const FILE_INPUT_ACCEPT = [
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.bmp',
  '.gif',
  '.ico',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/x-icon',
  'image/vnd.microsoft.icon',
].join(',')
