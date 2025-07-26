// File: lib/hooks/inputValidations/FSM_Core/validateFSMCore.ts

import { InputState, SP_COIN_DISPLAY, FEED_TYPE, TokenContract, WalletAccount } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { isTerminalFSMState } from './terminalStates';
import { ValidateFSMInput, ValidateFSMOutput } from './types/validateFSMTypes';

// Imported individual test modules
import { validateAddress } from './tests/validateAddress';
import { validateDuplicate } from './tests/validateDuplicate';
import { previewAsset } from './tests/previewAsset';
import { validateExistsOnChain } from './tests/validateExistsOnChain';
import { validateAsset } from './tests/validateAsset';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const debugLog = createDebugLogger('validateFSMCore', DEBUG_ENABLED);

const FSM_TEST_FLAGS = {
  TEST_VALID_ADDRESS: process.env.NEXT_PUBLIC_FSM_TEST_VALID_ADDRESS === 'false',
  TEST_DUPLICATE_INPUT: process.env.NEXT_PUBLIC_FSM_TEST_DUPLICATE_INPUT === 'true',
  TEST_VALIDATE_PREVIEW: process.env.NEXT_PUBLIC_FSM_TEST_VALIDATE_PREVIEW === 'false',
  TEST_PREVIEW_ADDRESS: process.env.NEXT_PUBLIC_FSM_TEST_PREVIEW_ADDRESS === 'false',
  TEST_CONTRACT_EXISTS_LOCALLY: process.env.NEXT_PUBLIC_FSM_TEST_CONTRACT_EXISTS_LOCALLY === 'false',
  TEST_EXISTS_ON_CHAIN: process.env.NEXT_PUBLIC_FSM_TEST_EXISTS_ON_CHAIN === 'false',
  TEST_VALIDATE_ASSET: process.env.NEXT_PUBLIC_FSM_TEST_VALIDATE_ASSET === 'false',
};

debugLog.log(JSON.stringify(FSM_TEST_FLAGS));

export async function validateFSMCore(input: ValidateFSMInput): Promise<ValidateFSMOutput> {
  const { inputState, debouncedHexInput } = input;

  debugLog.log(
    `🛠 ENTRY → inputState: ${InputState[inputState]}, debouncedHexInput: "${debouncedHexInput}"`
  );

  if (isTerminalFSMState(inputState)) {
    return { nextState: inputState };
  }

  if (inputState === InputState.EMPTY_INPUT && debouncedHexInput.trim() !== '') {
    debugLog.log('🚀 FSM auto-transition from EMPTY_INPUT → VALIDATE_ADDRESS');
    return { nextState: InputState.VALIDATE_ADDRESS };
  }

  let result: ValidateFSMOutput;

  switch (inputState) {
    case InputState.VALIDATE_ADDRESS:
      result = FSM_TEST_FLAGS.TEST_VALID_ADDRESS
        ? validateAddress(input)
        : { nextState: InputState.TEST_DUPLICATE_INPUT };
      break;

    case InputState.TEST_DUPLICATE_INPUT:
      result = FSM_TEST_FLAGS.TEST_DUPLICATE_INPUT
        ? validateDuplicate(input)
        : { nextState: InputState.VALIDATE_PREVIEW };
      break;

    case InputState.VALIDATE_PREVIEW:
      result = FSM_TEST_FLAGS.TEST_VALIDATE_PREVIEW
        ? { nextState: InputState.PREVIEW_ADDRESS }
        : { nextState: InputState.PREVIEW_ADDRESS };
      break;

    case InputState.PREVIEW_ADDRESS:
      result = FSM_TEST_FLAGS.TEST_PREVIEW_ADDRESS
        ? previewAsset(input)
        : { nextState: InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY };
      break;

    case InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY:
      result = FSM_TEST_FLAGS.TEST_CONTRACT_EXISTS_LOCALLY
        ? { nextState: InputState.VALIDATE_EXISTS_ON_CHAIN }
        : { nextState: InputState.VALIDATE_EXISTS_ON_CHAIN };
      break;

    case InputState.VALIDATE_EXISTS_ON_CHAIN:
      result = FSM_TEST_FLAGS.TEST_EXISTS_ON_CHAIN
        ? await validateExistsOnChain(input)
        : { nextState: InputState.VALIDATE_ASSET };
      break;

    case InputState.VALIDATE_ASSET:
      result = FSM_TEST_FLAGS.TEST_VALIDATE_ASSET
        ? await validateAsset(input)
        : { nextState: InputState.UPDATE_VALIDATED_ASSET };
      break;

    default:
      result = {
        nextState: inputState,
        errorMessage: 'Unhandled input state',
      };
      break;
  }

  debugLog.log(
    `✅ EXIT → nextState: ${InputState[result.nextState]}, validatedAsset: ${result.validatedAsset?.address || 'none'}, error: ${result.errorMessage || 'none'}`
  );

  return result;
}
