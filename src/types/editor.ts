export type CropPresetId = 'free' | '1:1' | '16:9' | '4:3' | '3:4' | '9:16'

export interface CropPreset {
  id: CropPresetId
  label: string
  aspect?: number
}

export type ExportFormatId = 'png' | 'jpg' | 'webp' | 'ico'
export type SupportedImageFormat = 'png' | 'jpg' | 'jpeg' | 'webp' | 'ico'
export type EditorExportFormatId = ExportFormatId | 'original'
export type CompressionMode = 'size-first' | 'balanced' | 'quality-first'

export interface ExportFormatOption {
  id: ExportFormatId
  label: string
  mimeType: string
  extension: string
  supportsQuality: boolean
}

export interface EditorExportFormatOption extends Omit<ExportFormatOption, 'id'> {
  id: EditorExportFormatId
}

export interface ExportCompressionSettings {
  enabled: boolean
  targetSizeKb: number
  maxDimension: number
}

export interface ImageAssetMeta {
  name: string
  mimeType: string
  format: SupportedImageFormat | null
  sizeBytes: number
  width: number
  height: number
  megapixels: number
  hasAlpha: boolean
  isPhotographic: boolean
}

export interface EditorExportOptions {
  outputFormat?: SupportedImageFormat | 'original'
  quality?: number
  backgroundFill?: string | null
}

export interface ConvertOptions {
  targetFormat: SupportedImageFormat
  quality?: number
  backgroundFill?: string | null
}

export interface CompressionProfile {
  mode: CompressionMode
  allowFormatChange: boolean
  preferLossyForOpaquePhotos: boolean
  keepAlphaWhenNeeded: boolean
  maxDimensionStrategy: {
    normal: number
    oversized: number
    extreme: number
    oversizedMegapixels: number
    extremeMegapixels: number
  }
  qualityRange: {
    min: number
    max: number
    candidates: number[]
  }
  useBinarySearchQuality: boolean
  maxPasses: number
  minimalSavingsRatio: number
}

export interface CompressionAttempt {
  format: ExportFormatId
  quality?: number
  width: number
  height: number
  outputBytes: number
  accepted: boolean
  reason: string
}

export interface CompressionResult {
  inputMeta: ImageAssetMeta
  outputMeta: ImageAssetMeta
  blob: Blob
  savingsBytes: number
  savingsRatio: number
  attempts: CompressionAttempt[]
  warnings: string[]
  appliedSteps: string[]
}

export interface CornerRadii {
  topLeft: number
  topRight: number
  bottomRight: number
  bottomLeft: number
}

export interface LoadedImage {
  url: string
  name: string
  width: number
  height: number
  hasAlpha: boolean
  mimeType: string
  format: SupportedImageFormat | null
}

export type StatusTone = 'info' | 'success' | 'error'
