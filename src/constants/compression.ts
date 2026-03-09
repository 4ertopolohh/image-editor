export const DEFAULT_EXPORT_COMPRESSION_ENABLED = true
export const DEFAULT_EXPORT_TARGET_SIZE_KB = 1024
export const DEFAULT_EXPORT_MAX_DIMENSION = 2560

export const EXPORT_TARGET_SIZE_RANGE = {
  min: 100,
  max: 6000,
  step: 50,
} as const

export const EXPORT_MAX_DIMENSION_RANGE = {
  min: 512,
  max: 4096,
  step: 64,
} as const

export const MIN_LOSSY_COMPRESSION_QUALITY = 0.6
