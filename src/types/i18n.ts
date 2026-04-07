import type { CompressionMode, CropPresetId, EditorExportFormatId, ExportFormatId } from './editor'

export type Language = 'ru' | 'en'

export interface TranslationDictionary {
  header: {
    kicker: string
    title: string
    subtitle: string
    developedBy: string
    studioName: string
  }
  languageToggle: {
    ariaLabel: string
    ruLabel: string
    enLabel: string
  }
  uploadZone: {
    sectionAriaLabel: string
    inputAriaLabel: string
    title: string
    description: string
    selectButton: string
    clearButton: string
  }
  backgroundRemovalControls: {
    sectionAriaLabel: string
    title: string
    description: string
    autoToggleLabel: string
    autoToggleAriaLabel: string
    actionButton: string
    processingButton: string
    actionAriaLabel: string
    hint: string
    progressLabel: (value: number) => string
  }
  cropControls: {
    sectionAriaLabel: string
    title: string
    rotateAriaLabel: string
    rotatingAriaLabel: string
    rotateIconTitle: string
    presetGroupAriaLabel: string
    aspectRatioAriaPrefix: string
    cornersGroupAriaLabel: string
    cornersTitle: string
    cornersHint: string
    cornerTopLeftLabel: string
    cornerTopRightLabel: string
    cornerBottomRightLabel: string
    cornerBottomLeftLabel: string
    cornerValueLabel: (value: number) => string
    cornersResetButton: string
    cornersResetAriaLabel: string
    applyButton: string
    applyingButton: string
    applyAriaLabel: string
    resetButton: string
    resetAriaLabel: string
  }
  exportControls: {
    sectionAriaLabel: string
    title: string
    formatLabel: string
    formatAriaLabel: string
    originalFormatLabel: (label: string) => string
    originalFormatFallbackLabel: string
    compressionIcoHint: string
    qualityLabel: (value: number) => string
    qualityAriaLabel: string
    qualityHint: string
    qualityDisabledHint: string
    transparencyWarning: string
    backgroundFillLabel: string
    backgroundFillHint: string
    outputSummaryLabel: (format: string) => string
    saveButton: string
    savingButton: string
    saveAriaLabel: string
  }
  convertSection: {
    sectionAriaLabel: string
    title: string
    uploadTitle: string
    uploadDescription: string
    selectButton: string
    resetButton: string
    sourceSummaryTitle: string
    targetFormatLabel: string
    targetFormatAriaLabel: string
    qualityLabel: (value: number) => string
    qualityAriaLabel: string
    qualityHint: string
    previewTitle: string
    resultTitle: string
    emptyTitle: string
    emptyText: string
    sourceFileLabel: string
    sourceFormatLabel: string
    sourceSizeLabel: string
    sourceDimensionsLabel: string
    resultSizeLabel: string
    resultFormatLabel: string
    resultDimensionsLabel: string
    downloadButton: string
    convertButton: string
    convertingButton: string
    downloadAriaLabel: string
    convertAriaLabel: string
    transparencyWarning: string
    backgroundFillLabel: string
    backgroundFillHint: string
    resultReady: string
    errorGeneric: string
  }
  compressionSection: {
    sectionAriaLabel: string
    title: string
    uploadTitle: string
    uploadDescription: string
    selectButton: string
    resetButton: string
    retryButton: string
    sourceSummaryTitle: string
    modeLabel: string
    modeAriaLabel: string
    modeDescriptions: Record<CompressionMode, string>
    previewTitle: string
    resultTitle: string
    emptyTitle: string
    emptyText: string
    sourceFileLabel: string
    sourceFormatLabel: string
    sourceSizeLabel: string
    sourceDimensionsLabel: string
    resultSizeLabel: string
    resultFormatLabel: string
    resultDimensionsLabel: string
    compressButton: string
    compressingButton: string
    downloadButton: string
    compressAriaLabel: string
    downloadAriaLabel: string
    alreadyOptimized: string
    minimalGain: string
    resultReady: (percent: number) => string
    warningsTitle: string
    stepsTitle: string
    attemptsTitle: string
    errorGeneric: string
  }
  imageEditor: {
    sectionAriaLabel: string
    emptyTitle: string
    emptyText: string
    imageAlt: string
  }
  previewPane: {
    sectionAriaLabel: string
    title: string
    placeholderTitle: string
    placeholderText: string
    imageAlt: string
  }
  adSection: {
    sectionAriaLabel: string
    title: string
    subtitle: string
    wantButton: string
    wantButtonAriaLabel: string
  }
  status: {
    initial: string
    editorCleared: string
    imageUploaded: string
    imagePasted: string
    imageOpenFailed: string
    backgroundRemovalStarted: string
    backgroundRemovalCompleted: string
    backgroundRemovalFailed: string
    imageRotated: string
    rotateFailed: string
    cropApplied: string
    cropFailed: string
    originalRestored: string
    imageSavedAs: (fileName: string) => string
    exportFailed: string
  }
  validation: {
    notImage: string
    unsupportedFormat: string
    fileTooLarge: (maxSizeMb: number) => string
    dimensionTooLarge: (maxDimension: number) => string
    pixelCountTooLarge: string
  }
  common: {
    clipboardFallbackFileName: string
    formatOriginalUnknown: string
    formatUnknown: string
    backgroundFillWhite: string
    downloadReady: string
    notAvailable: string
    bytesLabel: (value: number) => string
    dimensionsLabel: (width: number, height: number) => string
  }
  cropPresetLabels: Record<CropPresetId, string>
  editorExportFormatLabels: Record<EditorExportFormatId, string>
  exportFormatLabels: Record<ExportFormatId, string>
}
