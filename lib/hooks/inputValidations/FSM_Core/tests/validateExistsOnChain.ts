// File: lib/hooks/inputValidations/tests/validateExistsOnChain.ts

import { Address } from 'viem';
import { InputState } from '@/lib/structure';
import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';

export async function validateExistsOnChain({
  debouncedHexInput,
  publicClient,
}: ValidateFSMInput): Promise<ValidateFSMOutput> {
alert(`Running validateExistsOnChain(${debouncedHexInput})`);
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

    return { nextState: InputState.VALIDATE_ASSET };
  } catch (err) {
    return { nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN };
  }
}

