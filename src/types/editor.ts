export type CropPresetId = 'free' | '1:1' | '16:9' | '4:3' | '3:4' | '9:16'

export interface CropPreset {
  id: CropPresetId
  label: string
  aspect?: number
}

export type ExportFormatId = 'png' | 'jpg' | 'webp' | 'ico'

export interface ExportFormatOption {
  id: ExportFormatId
  label: string
  mimeType: string
  extension: string
  supportsQuality: boolean
}

export interface ExportCompressionSettings {
  enabled: boolean
  targetSizeKb: number
  maxDimension: number
}

export interface LoadedImage {
  url: string
  name: string
  width: number
  height: number
}

export type StatusTone = 'info' | 'success' | 'error'
