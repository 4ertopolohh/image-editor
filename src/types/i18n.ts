import type { CropPresetId, ExportFormatId } from './editor'

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
    compressionToggleLabel: string
    compressionToggleAriaLabel: string
    compressionTargetLabel: (value: number) => string
    compressionTargetAriaLabel: string
    compressionMaxDimensionLabel: (value: number) => string
    compressionMaxDimensionAriaLabel: string
    compressionHint: string
    compressionIcoHint: string
    qualityLabel: (value: number) => string
    qualityAriaLabel: string
    qualityHint: string
    saveButton: string
    savingButton: string
    saveAriaLabel: string
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
  }
  cropPresetLabels: Record<CropPresetId, string>
  exportFormatLabels: Record<ExportFormatId, string>
}
