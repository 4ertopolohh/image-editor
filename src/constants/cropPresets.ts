import type { CropPreset } from '../types/editor'

export const CROP_PRESETS: CropPreset[] = [
  { id: 'free', label: 'Free' },
  { id: '1:1', label: '1:1', aspect: 1 },
  { id: '16:9', label: '16:9', aspect: 16 / 9 },
  { id: '4:3', label: '4:3', aspect: 4 / 3 },
  { id: '3:4', label: '3:4', aspect: 3 / 4 },
  { id: '9:16', label: '9:16', aspect: 9 / 16 },
]
