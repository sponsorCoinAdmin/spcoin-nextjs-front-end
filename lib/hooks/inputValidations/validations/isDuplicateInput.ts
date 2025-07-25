// File: lib/hooks/inputValidations/validations/isDuplicateInput.ts

import { SP_COIN_DISPLAY } from '@/lib/structure';
import { getDuplicateMessage } from './getDuplicateMessage';

/**
 * Checks if the input address is a duplicate based on containerType and triggers an alert with explanation.
 */
export function isDuplicateInput(
  containerType: SP_COIN_DISPLAY,
  input: string,
  sellAddress?: string,
  buyAddress?: string
): boolean {
  if (!sellAddress || !buyAddress) return false;

  const oppositeAddress =
    containerType === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL
      ? buyAddress
      : sellAddress;

  const isDuplicate = input.toLowerCase() === oppositeAddress.toLowerCase();

  if (isDuplicate) {
    const msg = getDuplicateMessage(containerType);
    // alert(msg);
  }

  return isDuplicate;
}
