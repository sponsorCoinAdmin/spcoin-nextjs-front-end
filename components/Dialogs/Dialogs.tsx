'use client'
import { JUNK_ALERTS } from '@/lib/utils/JUNK_ALERTS';

import ConfigPanel from '../views/Config/ConfigPanel'
import ErrorPanel from './ErrorPanel';

/** 
 * List of allowed dialog CSS ID selectors.
 * Helps prevent typos and ensures only known dialogs are targeted.
 */
type DialogSelector =
  | '#TokenSelectDialog'
  | '#AccountSelectDialog'
  | '#ErrorPanel'
  | '#ConfigPanel'

/**
 * Open a dialog by CSS selector (e.g., '#TokenSelectDialog').
 * Logs a warning if the dialog is not found.
 */
const openDialog = (dialogType: DialogSelector) => {
  JUNK_ALERTS('Opening Slippage Dialog')
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
const closePanel = (dialogType: DialogSelector) => {
  const dialog = document.querySelector(dialogType) as HTMLDialogElement | null
  if (dialog) {
    dialog.close()
  } else {
    console.warn(`Dialog not found for selector: ${dialogType}`)
  }
}

export {
  openDialog,
  closePanel,
  ConfigPanel,
  ErrorPanel
}
