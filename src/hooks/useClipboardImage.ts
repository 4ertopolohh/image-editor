import { useEffect } from 'react'

interface UseClipboardImageOptions {
  enabled?: boolean
  onImagePaste: (file: File) => void
}

export const useClipboardImage = ({ enabled = true, onImagePaste }: UseClipboardImageOptions): void => {
  useEffect(() => {
    if (!enabled) {
      return
    }

    const handlePaste = (event: ClipboardEvent): void => {
      const items = event.clipboardData?.items
      if (!items?.length) {
        return
      }

      for (const item of items) {
        if (!item.type.startsWith('image/')) {
          continue
        }

        const imageFile = item.getAsFile()
        if (!imageFile) {
          continue
        }

        event.preventDefault()
        onImagePaste(imageFile)
        break
      }
    }

    window.addEventListener('paste', handlePaste)

    return () => {
      window.removeEventListener('paste', handlePaste)
    }
  }, [enabled, onImagePaste])
}
