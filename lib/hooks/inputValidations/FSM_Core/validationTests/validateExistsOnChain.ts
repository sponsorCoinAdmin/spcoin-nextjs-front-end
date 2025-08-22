// File: lib/hooks/inputValidations/tests/validateExistsOnChain.ts

import { Address, isAddress } from 'viem';
import { InputState } from '@/lib/structure/assetSelection';
import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';
import { NATIVE_TOKEN_ADDRESS } from '@/lib/network/utils';
import { getValidationDebugLogger } from '../../helpers/debugLogInstance';

const log = getValidationDebugLogger('validateExistsOnChain');

export async function validateExistsOnChain({
  debouncedHexInput,
  publicClient,
}: ValidateFSMInput): Promise<ValidateFSMOutput> {
  const addr = debouncedHexInput;

  log.log(`📥 validateExistsOnChain(${addr})`);

  // Native token is always "existent" (no bytecode)
  if (addr === NATIVE_TOKEN_ADDRESS) {
    log.log('💡 Native token sentinel detected → RESOLVE_ASSET');
    return { nextState: InputState.RESOLVE_ASSET };
  }

  // Basic guards
  if (!publicClient) {
    log.warn('⛔ Missing publicClient');
    return {
      nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
      errorMessage: 'Public client missing',
    };
  }

  if (!addr || !isAddress(addr)) {
    log.warn('⛔ Invalid address format');
    return {
      nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
      errorMessage: 'Invalid address',
    };
  }

  try {
    const code = await publicClient.getBytecode({ address: addr as Address });
    // EVM returns "0x" (or null) when no contract exists at the address
    if (!code || code === '0x') {
      log.log('🔎 No bytecode found → CONTRACT_NOT_FOUND_ON_BLOCKCHAIN');
      return { nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN };
    }

    log.log(`✅ Bytecode present (length=${code.length}) → RESOLVE_ASSET`);
    return { nextState: InputState.RESOLVE_ASSET };
  } catch (err) {
    log.warn('⚠️ getBytecode threw:', err as any);
    return { nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN };
  }
}
