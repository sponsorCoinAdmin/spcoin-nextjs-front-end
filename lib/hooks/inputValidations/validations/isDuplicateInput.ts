// File: lib/hooks/inputValidations/validations/isDuplicateInput.ts

import { CONTAINER_TYPE } from '@/lib/structure';
import { debugLog } from '../helpers/debugLogInstance';

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

  const isDuplicate =
    input.toLowerCase() === oppositeAddress.toLowerCase();

  if (isDuplicate) {
    debugLog.log(`⛔ Duplicate token input: ${input} matches ${oppositeAddress}`);
  } else {
    debugLog.log(`✅ Unique token input: ${input} ≠ ${oppositeAddress}`);
  }

  return isDuplicate;
}
