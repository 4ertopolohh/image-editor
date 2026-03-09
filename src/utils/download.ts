export const downloadBlob = (blob: Blob, fileName: string): void => {
  const temporaryUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = temporaryUrl
  anchor.download = fileName
  anchor.rel = 'noopener'

  document.body.append(anchor)
  anchor.click()
  anchor.remove()

  URL.revokeObjectURL(temporaryUrl)
}
