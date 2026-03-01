// File: @/lib/hooks/inputValidations/validations/isValidAddress.ts

import { isAddress } from 'viem';
import { getValidationDebugLogger } from '../helpers/debugLogInstance';

const log = getValidationDebugLogger('isValidAddress');

export function isValidAddress(input: string): boolean {
  const normalizedInput = /^0x/i.test(input) ? `0x${input.slice(2).toLowerCase()}` : input;
  const validAddress = isAddress(normalizedInput);
  if (validAddress) {
    log.log(`✅ Valid address: ${input}`);
  } else {
    log.log(`⛔ Invalid address: ${input}`);
  }
  return validAddress;
}
