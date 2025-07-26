// File: lib/hooks/inputValidations/validateFSMCore.ts

import { Address, isAddress } from 'viem';
import {
  InputState,
  SP_COIN_DISPLAY,
  FEED_TYPE,
  TokenContract,
  WalletAccount,
} from '@/lib/structure';
import { getLogoURL } from '@/lib/network/utils';
import { isEmptyInput } from '../validations/isEmptyInput';
import { isDuplicateInput } from '../validations/isDuplicateInput';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { isTerminalFSMState } from './terminalStates';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const debugLog = createDebugLogger('validateFSMCore', DEBUG_ENABLED);

const FSM_TEST_FLAGS = {
  TEST_VALID_ADDRESS: process.env.NEXT_PUBLIC_FSM_TEST_VALID_ADDRESS !== 'false',
  TEST_DUPLICATE_INPUT: process.env.NEXT_PUBLIC_FSM_TEST_DUPLICATE_INPUT !== 'false',
  TEST_VALIDATE_PREVIEW: process.env.NEXT_PUBLIC_FSM_TEST_VALIDATE_PREVIEW !== 'false',
  TEST_PREVIEW_ADDRESS: process.env.NEXT_PUBLIC_FSM_TEST_PREVIEW_ADDRESS !== 'false',
  TEST_CONTRACT_EXISTS_LOCALLY: process.env.NEXT_PUBLIC_FSM_TEST_CONTRACT_EXISTS_LOCALLY !== 'false',
  TEST_EXISTS_ON_CHAIN: process.env.NEXT_PUBLIC_FSM_TEST_EXISTS_ON_CHAIN !== 'false',
  TEST_VALIDATE_ASSET: process.env.NEXT_PUBLIC_FSM_TEST_VALIDATE_ASSET !== 'false',
};

debugLog.log(JSON.stringify(FSM_TEST_FLAGS));

export interface ValidateFSMInput {
  inputState: InputState;
  debouncedHexInput: string;
  containerType: SP_COIN_DISPLAY;
  sellAddress?: string;
  buyAddress?: string;
  chainId: number;
  publicClient: any;
  accountAddress?: string;
  seenBrokenLogos: Set<string>;
  feedType: FEED_TYPE;
  validatedAsset?: TokenContract | WalletAccount;
}

export interface ValidateFSMOutput {
  nextState: InputState;
  validatedAsset?: TokenContract | WalletAccount;
  updatedBalance?: bigint;
  errorMessage?: string;
}

export async function validateFSMCore(
  input: ValidateFSMInput
): Promise<ValidateFSMOutput> {
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

function validateAddress({ debouncedHexInput }: ValidateFSMInput): ValidateFSMOutput {
  debugLog.warn('⚠️ validateAddress() was CALLED');
  if (isEmptyInput(debouncedHexInput)) {
    return { nextState: InputState.EMPTY_INPUT };
  } else if (!isAddress(debouncedHexInput)) {
    return { nextState: InputState.INCOMPLETE_ADDRESS };
  }
  return { nextState: InputState.TEST_DUPLICATE_INPUT };
}

function validateDuplicate({
  containerType,
  debouncedHexInput,
  sellAddress,
  buyAddress,
}: ValidateFSMInput): ValidateFSMOutput {
  debugLog.warn('⚠️ validateDuplicate() was CALLED');
  if (isDuplicateInput(containerType, debouncedHexInput, sellAddress, buyAddress)) {
    return {
      nextState: InputState.DUPLICATE_INPUT_ERROR,
      errorMessage: 'Duplicate address detected',
    };
  }
  return { nextState: InputState.VALIDATE_PREVIEW };
}

function previewAsset({
  debouncedHexInput,
  seenBrokenLogos,
}: ValidateFSMInput): ValidateFSMOutput {
  debugLog.warn('⚠️ previewAsset() was CALLED');
  if (seenBrokenLogos.has(debouncedHexInput)) {
    return { nextState: InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY };
  }
  return { nextState: InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY };
}

async function validateExistsOnChain({
  debouncedHexInput,
  publicClient,
}: ValidateFSMInput): Promise<ValidateFSMOutput> {
  debugLog.warn('⚠️ validateExistsOnChain() was CALLED');
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
    debugLog.warn(`⚠️ validateExistsOnChain → Error fetching bytecode:`, err);
    return { nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN };
  }
}

// File: lib/hooks/inputValidations/validateFSMCore.ts (fragment)

async function validateAsset({
  debouncedHexInput,
  publicClient,
  accountAddress,
  feedType,
  chainId,
}: ValidateFSMInput): Promise<ValidateFSMOutput> {
  debugLog.warn('⚠️ validateAsset() was CALLED');

  if (feedType !== FEED_TYPE.TOKEN_LIST) {
    debugLog.warn(`⏭️ Skipping validateAsset → feedType is not TOKEN_LIST`);
    return { nextState: InputState.UPDATE_VALIDATED_ASSET };
  }

  if (!isAddress(debouncedHexInput)) {
    debugLog.warn(`⚠️ validateAsset → Invalid or missing debouncedHexInput`, {
      debouncedHexInput,
    });
    return {
      nextState: InputState.VALIDATE_ASSET_ERROR,
      errorMessage: 'Invalid or missing token address.',
    };
  }

  if (!accountAddress) {
    debugLog.warn(`⚠️ validateAsset → Missing account address`, {
      accountAddressExists: false,
      publicClientExists: !!publicClient,
    });
    return {
      nextState: InputState.MISSING_ACCOUNT_ADDRESS,
      errorMessage: 'Missing account address.',
    };
  }

  if (!publicClient) {
    debugLog.warn(`⚠️ validateAsset → Missing publicClient`, {
      accountAddressExists: !!accountAddress,
      publicClientExists: false,
    });
    return {
      nextState: InputState.VALIDATE_ASSET_ERROR,
      errorMessage: 'Missing public client.',
    };
  }

  try {
    const balance: bigint = await publicClient.readContract({
      address: debouncedHexInput as Address,
      abi: [
        {
          type: 'function',
          name: 'balanceOf',
          stateMutability: 'view',
          inputs: [{ type: 'address', name: 'account' }],
          outputs: [{ type: 'uint256' }],
        },
      ],
      functionName: 'balanceOf',
      args: [accountAddress as Address],
    });

    const validatedAsset: TokenContract = {
      address: debouncedHexInput as Address,
      balance,
      chainId,
      decimals: 18,
      logoURL: getLogoURL(chainId, debouncedHexInput as Address, feedType),
      name: '',
      symbol: '',
    };

    debugLog.log(`✅ validateAsset → Success. Final asset:`, validatedAsset);

    return {
      nextState: InputState.UPDATE_VALIDATED_ASSET,
      validatedAsset,
      updatedBalance: balance,
    };
  } catch (err) {
    debugLog.warn(`⚠️ validateAsset → Failed balanceOf call`, err);
    return {
      nextState: InputState.VALIDATE_ASSET_ERROR,
      errorMessage: 'Contract read failure during balance check.',
    };
  }
}
