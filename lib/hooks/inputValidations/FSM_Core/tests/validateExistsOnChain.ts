// File: lib/hooks/inputValidations/tests/validateExistsOnChain.ts

import { Address } from 'viem';
import { InputState } from '@/lib/structure';
import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME:boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const debugLog = createDebugLogger('validateExistsOnChain', DEBUG_ENABLED, LOG_TIME);

export async function validateExistsOnChain({
  debouncedHexInput,
  publicClient,
}: ValidateFSMInput): Promise<ValidateFSMOutput> {
alert(`Running validateExistsOnChain(${debouncedHexInput})`);
  debugLog.log(`Running validateExistsOnChain(${debouncedHexInput})`);
  if (!publicClient) {
    return {
      nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
      errorMessage: 'Public client missing',
    };
  }

  try {
    const code = await publicClient.getBytecode({
      address: debouncedHexInput as Address,
    });

    if (!code || code === '0x') {
      return { nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN };
    }

    return { nextState: InputState.RESOLVE_ASSET };
  } catch (err) {
    return { nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN };
  }
}

