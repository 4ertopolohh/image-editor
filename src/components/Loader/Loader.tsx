import { memo } from 'react'
import styles from './Loader.module.scss'

interface LoaderProps {
  ariaLabel?: string
}

const LoaderComponent = ({ ariaLabel = 'Loading' }: LoaderProps) => {
  return (
    <div className={styles.overlay} role="status" aria-live="polite" aria-label={ariaLabel}>
      <span className={styles.ring} aria-hidden="true" />
    </div>
  )
}

export const Loader = memo(LoaderComponent)
