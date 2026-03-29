import type { CSSProperties } from 'react'
import styles from './WantButton.module.scss'

export interface WantButtonProps {
  width?: CSSProperties['width']
  height?: CSSProperties['height']
  label?: string
  ariaLabel?: string
}

export const WantButton = ({ width, height, label = 'ХОЧУ!', ariaLabel }: WantButtonProps) => {
  const wantButtonStyles: CSSProperties = {
    width,
    height,
  }

  return (
    <a href='https://t.me/T3riadStudio' className={styles.wantButton} style={wantButtonStyles} aria-label={ariaLabel}>
      <span>{label}</span>
    </a>
  )
}

