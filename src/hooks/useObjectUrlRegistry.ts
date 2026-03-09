import { useCallback, useEffect, useRef } from 'react'

interface ObjectUrlRegistry {
  createUrl: (blob: Blob) => string
  revokeUrl: (url?: string | null) => void
}

export const useObjectUrlRegistry = (): ObjectUrlRegistry => {
  const urlRegistry = useRef<Set<string>>(new Set())

  const createUrl = useCallback((blob: Blob): string => {
    const objectUrl = URL.createObjectURL(blob)
    urlRegistry.current.add(objectUrl)
    return objectUrl
  }, [])

  const revokeUrl = useCallback((url?: string | null): void => {
    if (!url || !urlRegistry.current.has(url)) {
      return
    }

    URL.revokeObjectURL(url)
    urlRegistry.current.delete(url)
  }, [])

  useEffect(() => {
    const registrySnapshot = urlRegistry.current

    return () => {
      registrySnapshot.forEach((url) => URL.revokeObjectURL(url))
      registrySnapshot.clear()
    }
  }, [])

  return { createUrl, revokeUrl }
}
