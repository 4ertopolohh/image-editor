import { useEffect, useRef, useState } from 'react'
import type { TranslationDictionary } from '../../types/i18n'
import glassSpiral1 from '../../assets/images/pictures/glassSpiral1.png'
import { GlassSpiral } from '../GlassSpiral/GlassSpiral'
import { WantButton } from '../WantButton/WantButton'
import styles from './AdSection.module.scss'

interface AdSectionProps {
  copy: TranslationDictionary['adSection']
}

export const AdSection = ({ copy }: AdSectionProps) => {
  const spiralsRef = useRef<HTMLDivElement | null>(null)
  const adSectionWrapperRef = useRef<HTMLDivElement | null>(null)
  const [isSpiralsVisible, setIsSpiralsVisible] = useState(() => typeof IntersectionObserver === 'undefined')
  const [isAdSectionWrapperVisible, setIsAdSectionWrapperVisible] = useState(
    () => typeof IntersectionObserver === 'undefined',
  )

  useEffect(() => {
    const element = spiralsRef.current
    if (!element || typeof IntersectionObserver === 'undefined') {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (!entry) {
          return
        }

        if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
          setIsSpiralsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: [0.3] },
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const element = adSectionWrapperRef.current
    if (!element || typeof IntersectionObserver === 'undefined') {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (!entry) {
          return
        }

        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          setIsAdSectionWrapperVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: [0.5] },
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <section className={styles.adSection} aria-label={copy.sectionAriaLabel}>
      <div
        ref={spiralsRef}
        className={`${styles.spirals}${isSpiralsVisible ? ` ${styles.spiralsVisible}` : ''}`}
      >
        <GlassSpiral image={glassSpiral1} width={480} height={853} rotation={0} />
        <GlassSpiral image={glassSpiral1} width={480} height={853} rotation={180} />
      </div>

      <div
        ref={adSectionWrapperRef}
        className={`${styles.adSectionWrapper}${isAdSectionWrapperVisible ? ` ${styles.adSectionWrapperVisible}` : ''}`}
      >
        <div className={styles.container}>
          <div className={styles.adSectionTitle}>
            <h2>{copy.title}</h2>
          </div>

          <div className={styles.adSectionDescription}>
            <p className={styles.adSectionSubtitle}>{copy.subtitle}</p>
            <WantButton width="100%" height={50} label={copy.wantButton} ariaLabel={copy.wantButtonAriaLabel} />
          </div>
        </div>
      </div>
    </section>
  )
}
