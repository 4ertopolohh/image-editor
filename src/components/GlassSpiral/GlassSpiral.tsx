import type { CSSProperties } from 'react'
import styles from './GlassSpiral.module.scss'

export interface GlassSpiralProps {
  image: string
  width: number
  height: number
  rotation: number
}

export const GlassSpiral = ({ image, width, height, rotation }: GlassSpiralProps) => {
  const spiralStyles: CSSProperties = {
    width,
    height,
    transform: `rotate(${rotation}deg)`,
  }

  return <img className={styles.glassSprial} loading="lazy" src={image} style={spiralStyles} alt="" aria-hidden="true" />
}
