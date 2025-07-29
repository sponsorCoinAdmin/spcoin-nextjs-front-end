// File: lib/hooks/inputValidations/FSM_Core/validateFSMCore.ts

import { InputState, FEED_TYPE } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { isTerminalFSMState } from './fSMInputStates';
import { ValidateFSMInput, ValidateFSMOutput } from './types/validateFSMTypes';

// Imported individual test modules
import { validateAddress } from './tests/validateAddress';
import { validateDuplicate } from './tests/validateDuplicate';
import { previewAsset } from './tests/previewAsset';
import { validateExistsOnChain } from './tests/validateExistsOnChain';
import { validateTokenAsset } from './tests/validateTokenAsset';
import { validateWalletAsset } from './tests/validateWalletAsset';
import { validateExistsLocally } from './tests/validateExistsLocally';

import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import { resolveContract } from '@/lib/utils/publicERC20/resolveContract';
import { validateResolvedAsset } from './tests/validateResolvedAsset';

const LOG_TIME: boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const debugLog = createDebugLogger('validateFSMCore', DEBUG_ENABLED, LOG_TIME);

const FSM_TEST_FLAGS = {
  TEST_VALID_ADDRESS: process.env.NEXT_PUBLIC_FSM_TEST_VALID_ADDRESS === 'false',
  TEST_DUPLICATE_INPUT: process.env.NEXT_PUBLIC_FSM_TEST_DUPLICATE_INPUT === 'false',
  TEST_VALIDATE_PREVIEW: process.env.NEXT_PUBLIC_FSM_TEST_VALIDATE_PREVIEW === 'false',
  TEST_PREVIEW_ADDRESS: process.env.NEXT_PUBLIC_FSM_TEST_PREVIEW_ADDRESS === 'false',
  TEST_CONTRACT_EXISTS_LOCALLY: process.env.NEXT_PUBLIC_FSM_TEST_EXISTS_LOCALLY === 'false',
  TEST_EXISTS_ON_CHAIN: process.env.NEXT_PUBLIC_FSM_TEST_EXISTS_ON_CHAIN === 'false',
  TEST_RESOLVE_ASSET: process.env.NEXT_PUBLIC_FSM_TEST_RESOLVE_ASSET === 'true',
};

debugLog.log(JSON.stringify(FSM_TEST_FLAGS));

export async function validateFSMCore(input: ValidateFSMInput): Promise<ValidateFSMOutput> {
  const { inputState, debouncedHexInput, feedType } = input;

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
      result = { nextState: InputState.PREVIEW_ADDRESS };
      break;

    case InputState.PREVIEW_ADDRESS:
      result = FSM_TEST_FLAGS.TEST_PREVIEW_ADDRESS
        ? previewAsset(input)
        : { nextState: InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY };
      break;

    case InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY:
      result = FSM_TEST_FLAGS.TEST_CONTRACT_EXISTS_LOCALLY
        ? validateExistsLocally(input)
        : { nextState: InputState.VALIDATE_EXISTS_ON_CHAIN };
      break;

    case InputState.VALIDATE_EXISTS_ON_CHAIN:
      result = FSM_TEST_FLAGS.TEST_EXISTS_ON_CHAIN
        ? await validateExistsOnChain(input)
        : { nextState: InputState.RESOLVE_ASSET };
      break;

    // Inside your FSM switch statement
    case InputState.RESOLVE_ASSET:
      if (FSM_TEST_FLAGS.TEST_RESOLVE_ASSET) {
        result = await validateResolvedAsset(input);
        const msg:string = `RESOLVE_ASSET: ${stringifyBigInt(result)}`
        // alert(msg)
        console.log(msg)
      } else {
        result = { nextState: InputState.UPDATE_VALIDATED_ASSET };
      }
      break;

    default:
      result = {
        nextState: inputState,
        errorMessage: 'Unhandled input state',
      };
      break;
  }

  debugLog.log(
    `✅ EXIT → nextState: ${InputState[result.nextState]} | validatedToken: ${result.validatedToken?.symbol || 'none'} | error: ${result.errorMessage || 'none'}`
  );

  return result;
}
