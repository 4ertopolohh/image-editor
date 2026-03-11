import { useEffect, useRef, useState } from 'react'
import styles from './NegativeCursor.module.scss'

const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const PARTICLE_MIN_INTERVAL_MS = 26
const PARTICLE_MIN_DISTANCE_PX = 9

export const NegativeCursor = () => {
  const cursorRef = useRef<HTMLDivElement | null>(null)
  const particleLayerRef = useRef<HTMLDivElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const positionRef = useRef({ x: -100, y: -100 })
  const isVisibleRef = useRef<boolean>(false)
  const prefersReducedMotionRef = useRef<boolean>(false)
  const lastParticleEmissionTimestampRef = useRef<number>(0)
  const lastParticlePositionRef = useRef({ x: -1000, y: -1000 })
  const [isEnabled, setIsEnabled] = useState<boolean>(false)
  const [isVisible, setIsVisible] = useState<boolean>(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(FINE_POINTER_QUERY)

    const syncCursorAvailability = (): void => {
      const nextEnabled = mediaQuery.matches
      setIsEnabled(nextEnabled)

      if (nextEnabled) {
        document.body.classList.add('negative-cursor-active')
        return
      }

      isVisibleRef.current = false
      setIsVisible(false)
      particleLayerRef.current?.replaceChildren()
      document.body.classList.remove('negative-cursor-active')
    }

    syncCursorAvailability()
    mediaQuery.addEventListener('change', syncCursorAvailability)

    return () => {
      mediaQuery.removeEventListener('change', syncCursorAvailability)
      document.body.classList.remove('negative-cursor-active')
    }
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY)

    const syncMotionPreference = (): void => {
      prefersReducedMotionRef.current = mediaQuery.matches
    }

    syncMotionPreference()
    mediaQuery.addEventListener('change', syncMotionPreference)

    return () => {
      mediaQuery.removeEventListener('change', syncMotionPreference)
    }
  }, [])

  useEffect(() => {
    if (!isEnabled) {
      return
    }

    const drawCursor = (): void => {
      animationFrameRef.current = null
      const node = cursorRef.current
      if (!node) {
        return
      }

      node.style.transform = `translate3d(${positionRef.current.x}px, ${positionRef.current.y}px, 0) translate(-50%, -50%)`
    }

    const scheduleDraw = (): void => {
      if (animationFrameRef.current === null) {
        animationFrameRef.current = window.requestAnimationFrame(drawCursor)
      }
    }

    const showCursor = (): void => {
      if (isVisibleRef.current) {
        return
      }

      isVisibleRef.current = true
      setIsVisible(true)
    }

    const hideCursor = (): void => {
      if (!isVisibleRef.current) {
        return
      }

      isVisibleRef.current = false
      setIsVisible(false)
    }

    const clearParticles = (): void => {
      particleLayerRef.current?.replaceChildren()
    }

    const emitParticle = (x: number, y: number): void => {
      if (prefersReducedMotionRef.current) {
        return
      }

      const layerNode = particleLayerRef.current
      if (!layerNode) {
        return
      }

      const particleNode = document.createElement('span')
      const size = 2 + Math.random() * 3
      const xOffset = (Math.random() - 0.5) * 12
      const yOffset = (Math.random() - 0.5) * 12
      const dx = (Math.random() - 0.5) * 10
      const dy = -(4 + Math.random() * 12)
      const duration = 420 + Math.random() * 220

      particleNode.className = styles.particle
      particleNode.style.setProperty('--particle-size', `${size}px`)
      particleNode.style.setProperty('--particle-x', `${x + xOffset}px`)
      particleNode.style.setProperty('--particle-y', `${y + yOffset}px`)
      particleNode.style.setProperty('--particle-dx', `${dx}px`)
      particleNode.style.setProperty('--particle-dy', `${dy}px`)
      particleNode.style.setProperty('--particle-duration', `${duration}ms`)
      particleNode.addEventListener(
        'animationend',
        () => {
          particleNode.remove()
        },
        { once: true },
      )

      layerNode.appendChild(particleNode)
    }

    const onPointerMove = (event: PointerEvent): void => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') {
        return
      }

      const { clientX, clientY } = event
      positionRef.current = {
        x: clientX,
        y: clientY,
      }
      showCursor()
      scheduleDraw()

      const elapsed = performance.now() - lastParticleEmissionTimestampRef.current
      const deltaX = clientX - lastParticlePositionRef.current.x
      const deltaY = clientY - lastParticlePositionRef.current.y
      const distanceSquared = deltaX * deltaX + deltaY * deltaY

      if (
        elapsed >= PARTICLE_MIN_INTERVAL_MS &&
        distanceSquared >= PARTICLE_MIN_DISTANCE_PX * PARTICLE_MIN_DISTANCE_PX
      ) {
        emitParticle(clientX, clientY)
        lastParticleEmissionTimestampRef.current = performance.now()
        lastParticlePositionRef.current = { x: clientX, y: clientY }
      }
    }

    const onMouseOut = (event: MouseEvent): void => {
      if (event.relatedTarget !== null) {
        return
      }

      hideCursor()
      clearParticles()
    }

    const onWindowBlur = (): void => {
      hideCursor()
      clearParticles()
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('mouseout', onMouseOut)
    window.addEventListener('blur', onWindowBlur)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('mouseout', onMouseOut)
      window.removeEventListener('blur', onWindowBlur)

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      hideCursor()
      clearParticles()
    }
  }, [isEnabled])

  if (!isEnabled) {
    return null
  }

  return (
    <>
      <div className={`${styles.cursor} ${isVisible ? styles.visible : ''}`} ref={cursorRef} aria-hidden="true" />
      <div className={styles.particleLayer} ref={particleLayerRef} aria-hidden="true" />
    </>
  )
}
