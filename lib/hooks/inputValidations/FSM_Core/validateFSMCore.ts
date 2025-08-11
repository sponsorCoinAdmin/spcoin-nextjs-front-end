// File: lib/hooks/inputValidations/FSM_Core/validateFSMCore.ts

import { InputState } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { ValidateFSMInput, ValidateFSMOutput } from './types/validateFSMTypes';

import { validateAddress } from './validationTests/validateAddress';
import { validateDuplicate } from './validationTests/validateDuplicate';
import { previewAsset } from './validationTests/previewAsset';
import { validateExistsOnChain } from './validationTests/validateExistsOnChain';
import { validateExistsLocally } from './validationTests/validateExistsLocally';
import { validateResolvedAsset } from './validationTests/validateResolvedAsset';
import { updateValidated } from './validationTests/updateValidated';
import { closeSelectPanel } from './validationTests/closeSelectPanel';

import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const debugLog = createDebugLogger('validateFSMCore', DEBUG_ENABLED, LOG_TIME);

const FSM_TEST_FLAGS = {
  TEST_VALID_ADDRESS: process.env.NEXT_PUBLIC_FSM_TEST_VALID_ADDRESS === 'true',
  TEST_DUPLICATE_INPUT: process.env.NEXT_PUBLIC_FSM_TEST_DUPLICATE_INPUT === 'true',
  TEST_VALIDATE_PREVIEW: process.env.NEXT_PUBLIC_FSM_TEST_VALIDATE_PREVIEW === 'false', // (defined, currently unused)
  TEST_PREVIEW_ADDRESS: process.env.NEXT_PUBLIC_FSM_TEST_PREVIEW_ADDRESS === 'false',
  TEST_CONTRACT_EXISTS_LOCALLY: process.env.NEXT_PUBLIC_FSM_TEST_EXISTS_LOCALLY === 'false',
  TEST_EXISTS_ON_CHAIN: process.env.NEXT_PUBLIC_FSM_TEST_EXISTS_ON_CHAIN === 'true',
  TEST_RESOLVE_ASSET: process.env.NEXT_PUBLIC_FSM_TEST_RESOLVE_ASSET === 'true',
  TEST_UPDATE_ASSET: process.env.NEXT_PUBLIC_FSM_TEST_UPDATE_ASSET === 'true',
  TEST_CLOSE_SELECT_PANEL: process.env.NEXT_PUBLIC_FSM_TEST_CLOSE_SELECT_PANEL === 'true',
};

debugLog.log(JSON.stringify(FSM_TEST_FLAGS));

/** Consolidated alert+log helper. If `debugOn` is false, it no-ops. */
function debugAlert(state: InputState, result: unknown, logOn: boolean = true, alertOn: boolean = false) {
  if (!logOn && !alertOn) return;
  const label = `debugAlert InputState: ${InputState[state]}`;
  const msg = `${label}: ${stringifyBigInt(result as any)}`;
  if (logOn) console.log(msg);
  if (alertOn) alert(msg);
}

export async function validateFSMCore(input: ValidateFSMInput): Promise<ValidateFSMOutput> {
  const { inputState, debouncedHexInput } = input;

  debugLog.log(`🛠 ENTRY → inputState: ${InputState[inputState]}, debouncedHexInput: \`${debouncedHexInput}\``);

  let result: ValidateFSMOutput;

  switch (inputState) {
    case InputState.VALIDATE_ADDRESS: {
      debugLog.log(
        `🔍 VALIDATE_ADDRESS → running ${FSM_TEST_FLAGS.TEST_VALID_ADDRESS ? 'validateAddress' : '→ TEST_DUPLICATE_INPUT'}`
      );
      result = FSM_TEST_FLAGS.TEST_VALID_ADDRESS
        ? validateAddress(input)
        : { nextState: InputState.TEST_DUPLICATE_INPUT };
      debugAlert(InputState.VALIDATE_ADDRESS, result, true);
      break;
    }

    case InputState.TEST_DUPLICATE_INPUT: {
      debugLog.log(
        `🔁 TEST_DUPLICATE_INPUT → running ${FSM_TEST_FLAGS.TEST_DUPLICATE_INPUT ? 'validateDuplicate' : '→ VALIDATE_PREVIEW'}`
      );
      alert(
        `🔁 TEST_DUPLICATE_INPUT → running ${FSM_TEST_FLAGS.TEST_DUPLICATE_INPUT ? 'validateDuplicate' : '→ VALIDATE_PREVIEW'}`
      );
      result = FSM_TEST_FLAGS.TEST_DUPLICATE_INPUT
        ? validateDuplicate(input)
        : { nextState: InputState.VALIDATE_PREVIEW };

      if (!result?.nextState) {
        console.warn('❌ [FSM ERROR] validateDuplicate() did not return a valid FSM result object');
        result = {
          nextState: InputState.VALIDATE_ADDRESS,
          errorMessage: 'Internal error: Missing nextState in TEST_DUPLICATE_INPUT',
        };
      }
      debugAlert(InputState.TEST_DUPLICATE_INPUT, result, true);
      break;
    }

    case InputState.VALIDATE_PREVIEW: {
      // (Optional: wire TEST_VALIDATE_PREVIEW if/when needed)
      result = { nextState: InputState.PREVIEW_ADDRESS };
      debugAlert(InputState.VALIDATE_PREVIEW, result, true);
      break;
    }

    case InputState.PREVIEW_ADDRESS: {
      debugLog.log(
        `🔎 PREVIEW_ADDRESS → running ${FSM_TEST_FLAGS.TEST_PREVIEW_ADDRESS ? 'previewAsset' : '→ PREVIEW_CONTRACT_EXISTS_LOCALLY'}`
      );
      result = FSM_TEST_FLAGS.TEST_PREVIEW_ADDRESS
        ? previewAsset(input)
        : { nextState: InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY };
      debugAlert(InputState.PREVIEW_ADDRESS, result, true);
      break;
    }

    case InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY: {
      debugLog.log(
        `🧩 PREVIEW_CONTRACT_EXISTS_LOCALLY → running ${FSM_TEST_FLAGS.TEST_CONTRACT_EXISTS_LOCALLY ? 'validateExistsLocally' : '→ VALIDATE_EXISTS_ON_CHAIN'}`
      );
      result = FSM_TEST_FLAGS.TEST_CONTRACT_EXISTS_LOCALLY
        ? validateExistsLocally(input)
        : { nextState: InputState.VALIDATE_EXISTS_ON_CHAIN };
      debugAlert(InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY, result, true);
      break;
    }
  
    case InputState.VALIDATE_EXISTS_ON_CHAIN: {
      debugLog.log(
        `🌐 VALIDATE_EXISTS_ON_CHAIN → running ${FSM_TEST_FLAGS.TEST_EXISTS_ON_CHAIN ? 'validateExistsOnChain' : '→ RESOLVE_ASSET'}`
      );
      result = FSM_TEST_FLAGS.TEST_EXISTS_ON_CHAIN
        ? await validateExistsOnChain(input)
        : { nextState: InputState.RESOLVE_ASSET };
      debugAlert(InputState.VALIDATE_EXISTS_ON_CHAIN, result, true);
      break;
    }

    case InputState.RESOLVE_ASSET: {
      debugLog.log(
        `🧬 RESOLVE_ASSET → running ${FSM_TEST_FLAGS.TEST_RESOLVE_ASSET ? 'validateResolvedAsset' : '→ UPDATE_VALIDATED_ASSET'}`
      );
      result = FSM_TEST_FLAGS.TEST_RESOLVE_ASSET
        ? await validateResolvedAsset(input)
        : { nextState: InputState.UPDATE_VALIDATED_ASSET };
      debugAlert(InputState.RESOLVE_ASSET, result, true, false);
      break;
    }

    case InputState.UPDATE_VALIDATED_ASSET: {
      debugLog.log(
        `🧬 UPDATE_VALIDATED_ASSET → running ${FSM_TEST_FLAGS.TEST_UPDATE_ASSET ? 'updateValidated' : '→ CLOSE_SELECT_PANEL'}`
      );
      result = FSM_TEST_FLAGS.TEST_UPDATE_ASSET
        ? updateValidated(input)
        : { nextState: InputState.CLOSE_SELECT_PANEL };
      debugAlert(InputState.UPDATE_VALIDATED_ASSET, result, true, false);
      break;
    }

    case InputState.CLOSE_SELECT_PANEL: {
      debugLog.log(
        `🧬 CLOSE_SELECT_PANEL → running ${FSM_TEST_FLAGS.TEST_CLOSE_SELECT_PANEL ? 'closeSelectPanel' : '→ DONE'}`
      );
      result = FSM_TEST_FLAGS.TEST_CLOSE_SELECT_PANEL
        ? closeSelectPanel(input)
        : { nextState: InputState.CLOSE_SELECT_PANEL }; // terminal: remain here
      debugAlert(InputState.CLOSE_SELECT_PANEL, result, true);
      break;
    }

    default: {
      debugLog.warn(`🚨 Unhandled FSM state: ${InputState[inputState]}`);
      result = {
        nextState: inputState,
        errorMessage: 'Unhandled input state',
      };
      debugAlert(inputState, result, true);
      break;
    }
  }

  result.stateTrace = [...(input.stateTrace ?? []), inputState, result.nextState];
  result.humanTraceSummary = result.stateTrace.map((s) => InputState[s]).join(' → ');

  debugLog.log(`📊 FSM Trace: ${result.humanTraceSummary}`);
  debugLog.log(
    `✅ EXIT → nextState: ${InputState[result.nextState]} | validatedToken: ${result.validatedToken?.symbol || 'none'} | error: ${result.errorMessage || 'none'}`
  );

  return result;
}
