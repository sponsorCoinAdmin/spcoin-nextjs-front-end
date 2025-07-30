// File: lib/hooks/inputValidations/FSM_Core/validateFSMCore.ts

import { InputState, SP_COIN_DISPLAY, FEED_TYPE } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { ValidateFSMInput, ValidateFSMOutput } from './types/validateFSMTypes';

import { validateAddress } from './tests/validateAddress';
import { validateDuplicate } from './tests/validateDuplicate';
import { previewAsset } from './tests/previewAsset';
import { validateExistsOnChain } from './tests/validateExistsOnChain';
import { validateExistsLocally } from './tests/validateExistsLocally';
import { validateResolvedAsset } from './tests/validateResolvedAsset';

import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

const LOG_TIME = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const debugLog = createDebugLogger('validateFSMCore', DEBUG_ENABLED, LOG_TIME);

const FSM_TEST_FLAGS = {
  TEST_VALID_ADDRESS: process.env.NEXT_PUBLIC_FSM_TEST_VALID_ADDRESS === 'false',
  TEST_DUPLICATE_INPUT: process.env.NEXT_PUBLIC_FSM_TEST_DUPLICATE_INPUT === 'true',
  TEST_VALIDATE_PREVIEW: process.env.NEXT_PUBLIC_FSM_TEST_VALIDATE_PREVIEW === 'false',
  TEST_PREVIEW_ADDRESS: process.env.NEXT_PUBLIC_FSM_TEST_PREVIEW_ADDRESS === 'false',
  TEST_CONTRACT_EXISTS_LOCALLY: process.env.NEXT_PUBLIC_FSM_TEST_EXISTS_LOCALLY === 'false',
  TEST_EXISTS_ON_CHAIN: process.env.NEXT_PUBLIC_FSM_TEST_EXISTS_ON_CHAIN === 'false',
  TEST_RESOLVE_ASSET: process.env.NEXT_PUBLIC_FSM_TEST_RESOLVE_ASSET === 'true',
};

debugLog.log(JSON.stringify(FSM_TEST_FLAGS));

export async function validateFSMCore(input: ValidateFSMInput): Promise<ValidateFSMOutput> {
  const { inputState, debouncedHexInput } = input;

  const summary = `
⚙️ FSM Input Debug:
─────────────────────────────
inputState:   ${InputState[input.inputState]} (${input.inputState})
feedType:     ${FEED_TYPE[input.feedType]} (${input.feedType})
containerType:${SP_COIN_DISPLAY[input.containerType]} (${input.containerType})
debouncedHex: ${input.debouncedHexInput}
sellAddress:  ${input.sellAddress || 'none'}
buyAddress:   ${input.buyAddress || 'none'}
chainId:      ${input.chainId}
accountAddr:  ${input.accountAddress || 'none'}
validatedTok: ${input.validatedToken?.symbol || 'none'}
validatedWal: ${input.validatedWallet?.name || 'none'}
─────────────────────────────
`;
  console.log(summary);

  debugLog.log(`🛠 ENTRY → inputState: ${InputState[inputState]}, debouncedHexInput: "${debouncedHexInput}"`);

  let result: ValidateFSMOutput;

  switch (inputState) {
    case InputState.VALIDATE_ADDRESS:
      debugLog.log(`🔍 VALIDATE_ADDRESS → running ${FSM_TEST_FLAGS.TEST_VALID_ADDRESS ? 'validateAddress' : '→ TEST_DUPLICATE_INPUT'}`);
      result = FSM_TEST_FLAGS.TEST_VALID_ADDRESS
        ? validateAddress(input)
        : { nextState: InputState.TEST_DUPLICATE_INPUT };
      break;

    case InputState.TEST_DUPLICATE_INPUT:
      debugLog.log(`🔁 TEST_DUPLICATE_INPUT → running ${FSM_TEST_FLAGS.TEST_DUPLICATE_INPUT ? 'validateDuplicate' : '→ VALIDATE_PREVIEW'}`);
      result = FSM_TEST_FLAGS.TEST_DUPLICATE_INPUT
        ? validateDuplicate(input)
        : { nextState: InputState.VALIDATE_PREVIEW };
      break;

    case InputState.VALIDATE_PREVIEW:
      debugLog.log('🧪 VALIDATE_PREVIEW → → PREVIEW_ADDRESS');
      result = { nextState: InputState.PREVIEW_ADDRESS };
      break;

    case InputState.PREVIEW_ADDRESS:
      debugLog.log(`🔎 PREVIEW_ADDRESS → running ${FSM_TEST_FLAGS.TEST_PREVIEW_ADDRESS ? 'previewAsset' : '→ PREVIEW_CONTRACT_EXISTS_LOCALLY'}`);
      result = FSM_TEST_FLAGS.TEST_PREVIEW_ADDRESS
        ? previewAsset(input)
        : { nextState: InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY };
      break;

    case InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY:
      debugLog.log(`🧩 PREVIEW_CONTRACT_EXISTS_LOCALLY → running ${FSM_TEST_FLAGS.TEST_CONTRACT_EXISTS_LOCALLY ? 'validateExistsLocally' : '→ VALIDATE_EXISTS_ON_CHAIN'}`);
      result = FSM_TEST_FLAGS.TEST_CONTRACT_EXISTS_LOCALLY
        ? validateExistsLocally(input)
        : { nextState: InputState.VALIDATE_EXISTS_ON_CHAIN };
      break;

    case InputState.VALIDATE_EXISTS_ON_CHAIN:
      debugLog.log(`🌐 VALIDATE_EXISTS_ON_CHAIN → running ${FSM_TEST_FLAGS.TEST_EXISTS_ON_CHAIN ? 'validateExistsOnChain' : '→ RESOLVE_ASSET'}`);
      result = FSM_TEST_FLAGS.TEST_EXISTS_ON_CHAIN
        ? await validateExistsOnChain(input)
        : { nextState: InputState.RESOLVE_ASSET };
      break;

    case InputState.RESOLVE_ASSET:
      debugLog.log(`🧬 RESOLVE_ASSET → running ${FSM_TEST_FLAGS.TEST_RESOLVE_ASSET ? 'validateResolvedAsset' : '→ UPDATE_VALIDATED_ASSET'}`);
      if (FSM_TEST_FLAGS.TEST_RESOLVE_ASSET) {
        result = await validateResolvedAsset(input);
        const msg = `RESOLVE_ASSET: ${stringifyBigInt(result)}`;
        if (process.env.NEXT_PUBLIC_SHOW_RESOLVE_ALERT === 'true') alert(msg);
        console.log(msg);
      } else {
        result = { nextState: InputState.UPDATE_VALIDATED_ASSET };
      }
      break;

    default:
      debugLog.error(`🚨 Unhandled FSM state: ${InputState[inputState]}`);
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
