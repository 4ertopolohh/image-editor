import type { CornerRadii } from '../types/editor'

export const CORNER_RADIUS_RANGE = {
  min: 0,
  max: 50,
  step: 1,
} as const

export const DEFAULT_CORNER_RADII: CornerRadii = {
  topLeft: 0,
  topRight: 0,
  bottomRight: 0,
  bottomLeft: 0,
}
