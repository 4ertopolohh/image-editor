import type { CompressionMode, CompressionProfile } from '../types/editor'

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

export const COMPRESSION_MODES: CompressionMode[] = ['size-first', 'balanced', 'quality-first']

export const COMPRESSION_PROFILE_MAP: Record<CompressionMode, CompressionProfile> = {
  'size-first': {
    mode: 'size-first',
    allowFormatChange: true,
    preferLossyForOpaquePhotos: true,
    keepAlphaWhenNeeded: true,
    maxDimensionStrategy: {
      normal: 2560,
      oversized: 2200,
      extreme: 1920,
      oversizedMegapixels: 8,
      extremeMegapixels: 16,
    },
    qualityRange: {
      min: 0.58,
      max: 0.8,
      candidates: [0.76, 0.72, 0.68, 0.64, 0.6],
    },
    useBinarySearchQuality: false,
    maxPasses: 5,
    minimalSavingsRatio: 0.12,
  },
  balanced: {
    mode: 'balanced',
    allowFormatChange: true,
    preferLossyForOpaquePhotos: true,
    keepAlphaWhenNeeded: true,
    maxDimensionStrategy: {
      normal: 3000,
      oversized: 2800,
      extreme: 2560,
      oversizedMegapixels: 8,
      extremeMegapixels: 16,
    },
    qualityRange: {
      min: 0.72,
      max: 0.88,
      candidates: [0.86, 0.82, 0.78, 0.74],
    },
    useBinarySearchQuality: false,
    maxPasses: 4,
    minimalSavingsRatio: 0.08,
  },
  'quality-first': {
    mode: 'quality-first',
    allowFormatChange: false,
    preferLossyForOpaquePhotos: false,
    keepAlphaWhenNeeded: true,
    maxDimensionStrategy: {
      normal: 3840,
      oversized: 3600,
      extreme: 3200,
      oversizedMegapixels: 10,
      extremeMegapixels: 18,
    },
    qualityRange: {
      min: 0.84,
      max: 0.95,
      candidates: [0.94, 0.92, 0.9, 0.88, 0.86],
    },
    useBinarySearchQuality: false,
    maxPasses: 5,
    minimalSavingsRatio: 0.05,
  },
}
