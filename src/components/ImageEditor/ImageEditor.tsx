import { useCallback, useEffect, useRef, useState } from 'react'
import type { SyntheticEvent } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop'
import type { TranslationDictionary } from '../../types/i18n'
import styles from './ImageEditor.module.scss'
import 'react-image-crop/dist/ReactCrop.css'

interface ImageEditorProps {
  imageUrl: string | null
  aspect?: number
  copy: TranslationDictionary['imageEditor']
  onCropComplete: (crop: PixelCrop | undefined) => void
  onImageReady: (image: HTMLImageElement | null) => void
}

const createInitialCrop = (width: number, height: number, aspect?: number): Crop => {
  if (aspect) {
    return centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height), width, height)
  }

  return {
    unit: '%',
    x: 5,
    y: 5,
    width: 90,
    height: 90,
  }
}

export const ImageEditor = ({ imageUrl, aspect, copy, onCropComplete, onImageReady }: ImageEditorProps) => {
  const [crop, setCrop] = useState<Crop>()
  const imageRef = useRef<HTMLImageElement | null>(null)

  const resetCrop = useCallback(
    (imageElement: HTMLImageElement): void => {
      const nextCrop = createInitialCrop(imageElement.width, imageElement.height, aspect)
      setCrop(nextCrop)
      onCropComplete(undefined)
    },
    [aspect, onCropComplete],
  )

  const onImageLoad = useCallback(
    (event: SyntheticEvent<HTMLImageElement>): void => {
      const loadedImage = event.currentTarget
      imageRef.current = loadedImage
      onImageReady(loadedImage)
      resetCrop(loadedImage)
    },
    [onImageReady, resetCrop],
  )

  useEffect(() => {
    if (!imageUrl) {
      imageRef.current = null
      onCropComplete(undefined)
      onImageReady(null)
    }
  }, [imageUrl, onCropComplete, onImageReady])

  return (
    <section className={styles.panel} aria-label={copy.sectionAriaLabel}>
      {!imageUrl ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>{copy.emptyTitle}</p>
          <p className={styles.emptyText}>{copy.emptyText}</p>
        </div>
      ) : (
        <div className={styles.editorViewport}>
          <ReactCrop
            crop={crop}
            aspect={aspect}
            minWidth={24}
            minHeight={24}
            keepSelection
            ruleOfThirds
            onChange={(nextCrop) => setCrop(nextCrop)}
            onComplete={(nextCrop) =>
              onCropComplete(nextCrop.width > 1 && nextCrop.height > 1 ? nextCrop : undefined)
            }
          >
            <img src={imageUrl} alt={copy.imageAlt} onLoad={onImageLoad} className={styles.image} />
          </ReactCrop>
        </div>
      )}
    </section>
  )
}
