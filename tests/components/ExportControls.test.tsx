import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ExportControls } from '../../src/components/ExportControls/ExportControls'
import { EXPORT_FORMATS } from '../../src/constants/exportFormats'
import { TRANSLATIONS } from '../../src/constants/translations'
import type { ExportFormatId } from '../../src/types/editor'

describe('ExportControls', () => {
  const copy = TRANSLATIONS.en.exportControls

  const renderControls = ({
    format = 'png',
    compressionEnabled = false,
    disabled = false,
  }: {
    format?: ExportFormatId
    compressionEnabled?: boolean
    disabled?: boolean
  } = {}) => {
    const onFormatChange = vi.fn()
    const onQualityChange = vi.fn()
    const onCompressionEnabledChange = vi.fn()
    const onCompressionTargetSizeChange = vi.fn()
    const onCompressionMaxDimensionChange = vi.fn()
    const onExport = vi.fn()

    const renderResult = render(
      <ExportControls
        format={format}
        formatOptions={EXPORT_FORMATS}
        quality={0.92}
        compressionEnabled={compressionEnabled}
        compressionTargetSizeKb={500}
        compressionMaxDimension={2400}
        disabled={disabled}
        isExporting={false}
        copy={copy}
        onFormatChange={onFormatChange}
        onQualityChange={onQualityChange}
        onCompressionEnabledChange={onCompressionEnabledChange}
        onCompressionTargetSizeChange={onCompressionTargetSizeChange}
        onCompressionMaxDimensionChange={onCompressionMaxDimensionChange}
        onExport={onExport}
      />,
    )

    return {
      ...renderResult,
      onFormatChange,
      onQualityChange,
      onCompressionEnabledChange,
      onCompressionTargetSizeChange,
      onCompressionMaxDimensionChange,
      onExport,
    }
  }

  it('changes export format from the select control', () => {
    const { onFormatChange } = renderControls()
    const select = screen.getByLabelText(copy.formatAriaLabel)

    fireEvent.change(select, { target: { value: 'jpg' } })

    expect(onFormatChange).toHaveBeenCalledOnce()
    expect(onFormatChange).toHaveBeenCalledWith('jpg')
  })

  it('shows quality slider only for formats that support quality', () => {
    const { rerender } = render(
      <ExportControls
        format="png"
        formatOptions={EXPORT_FORMATS}
        quality={0.92}
        compressionEnabled={false}
        compressionTargetSizeKb={500}
        compressionMaxDimension={2400}
        disabled={false}
        isExporting={false}
        copy={copy}
        onFormatChange={vi.fn()}
        onQualityChange={vi.fn()}
        onCompressionEnabledChange={vi.fn()}
        onCompressionTargetSizeChange={vi.fn()}
        onCompressionMaxDimensionChange={vi.fn()}
        onExport={vi.fn()}
      />,
    )

    expect(screen.queryByLabelText(copy.qualityAriaLabel)).not.toBeInTheDocument()
    expect(screen.getByText(copy.qualityHint)).toBeInTheDocument()

    rerender(
      <ExportControls
        format="jpg"
        formatOptions={EXPORT_FORMATS}
        quality={0.92}
        compressionEnabled={false}
        compressionTargetSizeKb={500}
        compressionMaxDimension={2400}
        disabled={false}
        isExporting={false}
        copy={copy}
        onFormatChange={vi.fn()}
        onQualityChange={vi.fn()}
        onCompressionEnabledChange={vi.fn()}
        onCompressionTargetSizeChange={vi.fn()}
        onCompressionMaxDimensionChange={vi.fn()}
        onExport={vi.fn()}
      />,
    )

    expect(screen.getByLabelText(copy.qualityAriaLabel)).toBeInTheDocument()
    expect(screen.queryByText(copy.qualityHint)).not.toBeInTheDocument()
  })

  it('forwards compression controls when smart compression is enabled', () => {
    const { onCompressionTargetSizeChange, onCompressionMaxDimensionChange, onQualityChange } = renderControls({
      format: 'jpg',
      compressionEnabled: true,
    })

    fireEvent.change(screen.getByLabelText(copy.compressionTargetAriaLabel), { target: { value: '350' } })
    fireEvent.change(screen.getByLabelText(copy.compressionMaxDimensionAriaLabel), { target: { value: '1800' } })
    fireEvent.change(screen.getByLabelText(copy.qualityAriaLabel), { target: { value: '0.8' } })

    expect(onCompressionTargetSizeChange).toHaveBeenCalledWith(350)
    expect(onCompressionMaxDimensionChange).toHaveBeenCalledWith(1800)
    expect(onQualityChange).toHaveBeenCalledWith(0.8)
  })

  it('disables smart compression for ico format', () => {
    renderControls({ format: 'ico', compressionEnabled: true })

    expect(screen.getByLabelText(copy.compressionToggleAriaLabel)).toBeDisabled()
    expect(screen.getByText(copy.compressionIcoHint)).toBeInTheDocument()
  })

  it('calls export callback from save button and respects disabled state', async () => {
    const user = userEvent.setup()
    const firstRender = renderControls({ disabled: false })

    await user.click(screen.getByRole('button', { name: copy.saveAriaLabel }))
    expect(firstRender.onExport).toHaveBeenCalledOnce()

    firstRender.unmount()
    renderControls({ disabled: true })
    expect(screen.getByRole('button', { name: copy.saveAriaLabel })).toBeDisabled()
  })
})
