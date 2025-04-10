'use client'

import ConfigDialog from './Popup/ConfigDialog'
import ErrorDialog from './ErrorDialog'
import RecipientDialog from './AccountSelectDialog'
import TokenSelectDialog from './AssetSelectDialog'

/** 
 * List of allowed dialog CSS ID selectors.
 * Helps prevent typos and ensures only known dialogs are targeted.
 */
type DialogSelector =
  | '#TokenSelectDialog'
  | '#AccountSelectDialog'
  | '#ErrorDialog'
  | '#ConfigDialog'

/**
 * Open a dialog by CSS selector (e.g., '#TokenSelectDialog').
 * Logs a warning if the dialog is not found.
 */
const openDialog = (dialogType: DialogSelector) => {
  const dialog = document.querySelector(dialogType) as HTMLDialogElement | null
  if (dialog) {
    dialog.showModal()
  } else {
    console.warn(`Dialog not found for selector: ${dialogType}`)
  }
}

/**
 * Close a dialog by CSS selector.
 * Logs a warning if the dialog is not found.
 */
const closeDialog = (dialogType: DialogSelector) => {
  const dialog = document.querySelector(dialogType) as HTMLDialogElement | null
  if (dialog) {
    dialog.close()
  } else {
    console.warn(`Dialog not found for selector: ${dialogType}`)
  }
}

export {
  openDialog,
  closeDialog,
  ConfigDialog,
  RecipientDialog,
  TokenSelectDialog,
  ErrorDialog
}
