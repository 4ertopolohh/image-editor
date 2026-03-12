import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TRANSLATIONS } from '../../src/constants/translations'
import { UploadZone } from '../../src/components/UploadZone/UploadZone'

describe('UploadZone', () => {
  const copy = TRANSLATIONS.en.uploadZone

  it('opens file dialog when select button is clicked', async () => {
    const onFileSelect = vi.fn()
    const onClear = vi.fn()
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click')
    const user = userEvent.setup()

    render(
      <UploadZone
        onFileSelect={onFileSelect}
        onClear={onClear}
        hasImage={false}
        accept="image/*"
        copy={copy}
      />,
    )

    await user.click(screen.getByRole('button', { name: copy.selectButton }))

    expect(clickSpy).toHaveBeenCalledOnce()
  })

  it('forwards selected file to callback', async () => {
    const onFileSelect = vi.fn()
    const onClear = vi.fn()
    const user = userEvent.setup()

    render(
      <UploadZone
        onFileSelect={onFileSelect}
        onClear={onClear}
        hasImage={false}
        accept="image/*"
        copy={copy}
      />,
    )

    const input = screen.getByLabelText(copy.inputAriaLabel)
    const file = new File(['content'], 'photo.png', { type: 'image/png' })

    await user.upload(input, file)

    expect(onFileSelect).toHaveBeenCalledOnce()
    expect(onFileSelect).toHaveBeenCalledWith(file)
  })

  it('disables clear button without image and enables callback when image exists', async () => {
    const onFileSelect = vi.fn()
    const onClear = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(
      <UploadZone
        onFileSelect={onFileSelect}
        onClear={onClear}
        hasImage={false}
        accept="image/*"
        copy={copy}
      />,
    )

    const clearButton = screen.getByRole('button', { name: copy.clearButton })
    expect(clearButton).toBeDisabled()

    rerender(
      <UploadZone
        onFileSelect={onFileSelect}
        onClear={onClear}
        hasImage
        accept="image/*"
        copy={copy}
      />,
    )

    await user.click(screen.getByRole('button', { name: copy.clearButton }))

    expect(onClear).toHaveBeenCalledOnce()
  })

  it('disables both action buttons when component is disabled', () => {
    const onFileSelect = vi.fn()
    const onClear = vi.fn()

    render(
      <UploadZone
        onFileSelect={onFileSelect}
        onClear={onClear}
        hasImage
        accept="image/*"
        copy={copy}
        disabled
      />,
    )

    expect(screen.getByRole('button', { name: copy.selectButton })).toBeDisabled()
    expect(screen.getByRole('button', { name: copy.clearButton })).toBeDisabled()
  })
})
