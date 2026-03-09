const sanitizeBaseName = (fileName: string): string => {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, '')
  const trimmed = withoutExtension.trim()

  if (trimmed.length === 0) {
    return 'edited-image'
  }

  return trimmed.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-')
}

export const createExportFileName = (originalName: string, extension: string): string => {
  const baseName = sanitizeBaseName(originalName)
  return `${baseName}-edited.${extension}`
}
