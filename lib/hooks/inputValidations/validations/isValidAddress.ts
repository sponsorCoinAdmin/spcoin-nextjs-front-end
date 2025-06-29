// File: lib/hooks/inputValidations/validations/isValidAddress.ts

import { isAddress } from 'viem';
import { debugLog } from '../helpers/debugLogInstance';

export function isValidAddress(input: string): boolean {
  const validAddress = isAddress(input);
  if (validAddress) {
    debugLog.log(`✅ Valid address: ${input}`);
  } else {
    debugLog.log(`⛔ Invalid address: ${input}`);
  }
  return validAddress;
}
