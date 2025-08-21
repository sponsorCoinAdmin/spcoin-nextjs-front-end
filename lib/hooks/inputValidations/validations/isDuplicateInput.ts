// File: lib/hooks/inputValidations/validations/isDuplicateInput.ts

import { SP_COIN_DISPLAY } from '@/lib/structure';
import { getDuplicateMessage } from './getDuplicateMessage';
import { getValidationDebugLogger } from '../helpers/debugLogInstance';

const log = getValidationDebugLogger('isDuplicateInput');

/**
 * Checks if the input address is a duplicate based on containerType and logs details.
 */
export function isDuplicateInput(
  containerType: SP_COIN_DISPLAY,
  input: string,
  sellAddress?: string,
  buyAddress?: string
): boolean {
  const containerName =
    (SP_COIN_DISPLAY as any)?.[containerType] ?? String(containerType);

  log.log(
    `🔍 ENTRY → isDuplicateInput | container=${containerName} | input=${input} | sell=${sellAddress ?? '—'} | buy=${buyAddress ?? '—'}`
  );

  if (!sellAddress || !buyAddress) {
    log.log('ℹ️ Missing sell or buy address — cannot be duplicate.');
    return false;
  }

  const oppositeAddress =
    containerType === SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL
      ? buyAddress
      : sellAddress;

  const isDuplicate =
    input.toLowerCase() === oppositeAddress.toLowerCase();

  if (isDuplicate) {
    const msg = getDuplicateMessage(containerType);
    log.warn(`⛔ Duplicate detected. ${msg}`);
    // (no alert; logging only)
  } else {
    log.log('✅ Not a duplicate.');
  }

  return isDuplicate;
}
