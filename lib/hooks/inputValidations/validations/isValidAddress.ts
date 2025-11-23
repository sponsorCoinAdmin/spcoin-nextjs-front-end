// File: @/lib/hooks/inputValidations/validations/isValidAddress.ts

import { isAddress } from 'viem';
import { getValidationDebugLogger } from '../helpers/debugLogInstance';

const log = getValidationDebugLogger('isValidAddress');

export function isValidAddress(input: string): boolean {
  const validAddress = isAddress(input);
  if (validAddress) {
    log.log(`✅ Valid address: ${input}`);
  } else {
    log.log(`⛔ Invalid address: ${input}`);
  }
  return validAddress;
}
