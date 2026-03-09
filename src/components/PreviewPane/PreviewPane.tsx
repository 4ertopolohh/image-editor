import { memo } from 'react'
import type { LoadedImage } from '../../types/editor'
import type { TranslationDictionary } from '../../types/i18n'
import styles from './PreviewPane.module.scss'

interface PreviewPaneProps {
  image: LoadedImage | null
  copy: TranslationDictionary['previewPane']
}

const PreviewPaneComponent = ({ image, copy }: PreviewPaneProps) => {
  return (
    <section className={styles.panel} aria-label={copy.sectionAriaLabel}>
      <div className={styles.header}>
        <p className={styles.title}>{copy.title}</p>
        {image ? (
          <span className={styles.meta}>
            {image.width}x{image.height}
          </span>
        ) : null}
      </div>

      {!image ? (
        <div className={styles.placeholder}>
          <p className={styles.placeholderTitle}>{copy.placeholderTitle}</p>
          <p className={styles.placeholderText}>{copy.placeholderText}</p>
        </div>
      ) : (
        <div className={styles.previewFrame}>
          <img src={image.url} alt={copy.imageAlt} className={styles.previewImage} />
          <p className={styles.fileName} title={image.name}>
            {image.name}
          </p>
        </div>
      )}
    </section>
  )
}

export const PreviewPane = memo(PreviewPaneComponent)
