// File: lib/hooks/inputValidations/validations/isDuplicateInput.ts

import { CONTAINER_TYPE } from '@/lib/structure';
import { getDuplicateMessage } from './getDuplicateMessage';

/**
 * Checks if the input address is a duplicate based on containerType and triggers an alert with explanation.
 */
export function isDuplicateInput(
  containerType: CONTAINER_TYPE,
  input: string,
  sellAddress?: string,
  buyAddress?: string
): boolean {
  if (!sellAddress || !buyAddress) return false;

  const oppositeAddress =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? buyAddress
      : sellAddress;

  const isDuplicate = input.toLowerCase() === oppositeAddress.toLowerCase();

  if (isDuplicate) {
    const msg = getDuplicateMessage(containerType);
    alert(msg);
  }

  return isDuplicate;
}
