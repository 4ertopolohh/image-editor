import {
  MAX_FILE_SIZE_BYTES,
  SUPPORTED_IMAGE_EXTENSIONS,
  SUPPORTED_IMAGE_MIME_TYPES,
} from '../constants/fileValidation'

export type FileValidationIssue = 'not-image' | 'unsupported-format' | 'file-too-large'

export type FileValidationResult =
  | { ok: true }
  | {
      ok: false
      issue: FileValidationIssue
      maxSizeMb?: number
    }

const getFileExtension = (filename: string): string | null => {
  const segments = filename.toLowerCase().split('.')
  if (segments.length < 2) {
    return null
  }

  return segments.at(-1) ?? null
}

const MAX_FILE_SIZE_MB = Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024))

export const validateImageFile = (file: File): FileValidationResult => {
  const mimeType = file.type.toLowerCase()
  const extension = getFileExtension(file.name)

  const isMimeSupported = mimeType.length > 0 && SUPPORTED_IMAGE_MIME_TYPES.has(mimeType)
  const isExtensionSupported = Boolean(extension && SUPPORTED_IMAGE_EXTENSIONS.has(extension))

  if (!mimeType.startsWith('image/')) {
    return {
      ok: false,
      issue: 'not-image',
    }
  }

  if (!isMimeSupported && !isExtensionSupported) {
    return {
      ok: false,
      issue: 'unsupported-format',
    }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      issue: 'file-too-large',
      maxSizeMb: MAX_FILE_SIZE_MB,
    }
  }

  return {
    ok: true,
  }
}
