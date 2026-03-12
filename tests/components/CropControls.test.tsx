import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CropControls } from '../../src/components/CropControls/CropControls'
import { CROP_PRESETS } from '../../src/constants/cropPresets'
import { TRANSLATIONS } from '../../src/constants/translations'

describe('CropControls', () => {
  const copy = TRANSLATIONS.en.cropControls
  const baseCornerRadii = { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 }

  const renderControls = ({
    cornerRadii = baseCornerRadii,
    rotateDisabled = false,
    applyDisabled = false,
    resetDisabled = false,
    cornerControlsDisabled = false,
  }: {
    cornerRadii?: typeof baseCornerRadii
    rotateDisabled?: boolean
    applyDisabled?: boolean
    resetDisabled?: boolean
    cornerControlsDisabled?: boolean
  } = {}) => {
    const onPresetChange = vi.fn()
    const onCornerRadiusChange = vi.fn()
    const onResetCornerRadii = vi.fn()
    const onRotateRight = vi.fn()
    const onApplyCrop = vi.fn()
    const onResetToSource = vi.fn()

    render(
      <CropControls
        presets={CROP_PRESETS}
        activePresetId="free"
        disabled={false}
        cornerControlsDisabled={cornerControlsDisabled}
        rotateDisabled={rotateDisabled}
        applyDisabled={applyDisabled}
        resetDisabled={resetDisabled}
        isRotating={false}
        isApplying={false}
        cornerRadii={cornerRadii}
        copy={copy}
        onPresetChange={onPresetChange}
        onCornerRadiusChange={onCornerRadiusChange}
        onResetCornerRadii={onResetCornerRadii}
        onRotateRight={onRotateRight}
        onApplyCrop={onApplyCrop}
        onResetToSource={onResetToSource}
      />,
    )

    return {
      onPresetChange,
      onCornerRadiusChange,
      onResetCornerRadii,
      onRotateRight,
      onApplyCrop,
      onResetToSource,
    }
  }

  it('calls onPresetChange when another aspect preset is clicked', async () => {
    const user = userEvent.setup()
    const { onPresetChange } = renderControls()

    await user.click(screen.getByRole('button', { name: `${copy.aspectRatioAriaPrefix} 16:9` }))

    expect(onPresetChange).toHaveBeenCalledOnce()
    expect(onPresetChange).toHaveBeenCalledWith('16:9')
  })

  it('calls rotate, apply and reset callbacks when buttons are active', async () => {
    const user = userEvent.setup()
    const { onRotateRight, onApplyCrop, onResetToSource } = renderControls()

    await user.click(screen.getByRole('button', { name: copy.rotateAriaLabel }))
    await user.click(screen.getByRole('button', { name: copy.applyAriaLabel }))
    await user.click(screen.getByRole('button', { name: copy.resetAriaLabel }))

    expect(onRotateRight).toHaveBeenCalledOnce()
    expect(onApplyCrop).toHaveBeenCalledOnce()
    expect(onResetToSource).toHaveBeenCalledOnce()
  })

  it('forwards corner slider changes', async () => {
    const { onCornerRadiusChange } = renderControls()
    const slider = screen.getByLabelText(copy.cornerTopLeftLabel)

    fireEvent.change(slider, { target: { value: '20' } })

    expect(onCornerRadiusChange).toHaveBeenCalledOnce()
    expect(onCornerRadiusChange).toHaveBeenCalledWith('topLeft', 20)
  })

  it('disables corner reset while all corners are zero and enables it when corners are rounded', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <CropControls
        presets={CROP_PRESETS}
        activePresetId="free"
        disabled={false}
        cornerControlsDisabled={false}
        rotateDisabled={false}
        applyDisabled={false}
        resetDisabled={false}
        isRotating={false}
        isApplying={false}
        cornerRadii={baseCornerRadii}
        copy={copy}
        onPresetChange={vi.fn()}
        onCornerRadiusChange={vi.fn()}
        onResetCornerRadii={vi.fn()}
        onRotateRight={vi.fn()}
        onApplyCrop={vi.fn()}
        onResetToSource={vi.fn()}
      />,
    )

    const resetCornersButton = screen.getByRole('button', { name: copy.cornersResetAriaLabel })
    expect(resetCornersButton).toBeDisabled()

    const onResetCornerRadii = vi.fn()
    rerender(
      <CropControls
        presets={CROP_PRESETS}
        activePresetId="free"
        disabled={false}
        cornerControlsDisabled={false}
        rotateDisabled={false}
        applyDisabled={false}
        resetDisabled={false}
        isRotating={false}
        isApplying={false}
        cornerRadii={{ ...baseCornerRadii, topLeft: 20 }}
        copy={copy}
        onPresetChange={vi.fn()}
        onCornerRadiusChange={vi.fn()}
        onResetCornerRadii={onResetCornerRadii}
        onRotateRight={vi.fn()}
        onApplyCrop={vi.fn()}
        onResetToSource={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: copy.cornersResetAriaLabel }))
    expect(onResetCornerRadii).toHaveBeenCalledOnce()
  })

  it('respects disabled flags for action buttons', () => {
    renderControls({
      rotateDisabled: true,
      applyDisabled: true,
      resetDisabled: true,
      cornerControlsDisabled: true,
    })

    expect(screen.getByRole('button', { name: copy.rotateAriaLabel })).toBeDisabled()
    expect(screen.getByRole('button', { name: copy.applyAriaLabel })).toBeDisabled()
    expect(screen.getByRole('button', { name: copy.resetAriaLabel })).toBeDisabled()
    expect(screen.getByRole('button', { name: copy.cornersResetAriaLabel })).toBeDisabled()
  })
})
