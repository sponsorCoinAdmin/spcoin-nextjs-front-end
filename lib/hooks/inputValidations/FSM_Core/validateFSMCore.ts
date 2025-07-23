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
import { resolveTokenContract } from '../validations/resolveTokenContract';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_FSM_CORE === 'true';
const debugLog = createDebugLogger('validateFSMCore', DEBUG_ENABLED);

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
  balanceData?: bigint;
  validatedAsset?: TokenContract | WalletAccount;
}

export interface ValidateFSMOutput {
  nextState: InputState;
  validatedAsset?: TokenContract | WalletAccount;
  updatedBalance?: bigint;
  errorMessage?: string;
}

export async function validateFSMCore(input: ValidateFSMInput): Promise<ValidateFSMOutput> {
  const { inputState } = input;

  debugLog.log(`🛠 ENTRY → inputState: ${InputState[inputState]}, debouncedHexInput: "${input.debouncedHexInput}"`);

  let result: ValidateFSMOutput;

  switch (inputState) {
    case InputState.EMPTY_INPUT:
    case InputState.INCOMPLETE_ADDRESS:
    case InputState.INVALID_HEX_INPUT:
    case InputState.INVALID_ADDRESS_INPUT:
    case InputState.DUPLICATE_INPUT_ERROR:
    case InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN:
    case InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY:
    case InputState.VALIDATE_BALANCE_ERROR:
    case InputState.CLOSE_SELECT_PANEL:
      result = { nextState: inputState };
      break;

    case InputState.VALIDATE_ADDRESS:
      result = validateAddress(input);
      break;

    case InputState.TEST_DUPLICATE_INPUT:
      result = testDuplicateInput(input);
      break;

    case InputState.VALIDATE_EXISTS_ON_CHAIN:
      result = await validateExistsOnChain(input);
      break;

    case InputState.VALIDATE_PREVIEW:
      result = { nextState: InputState.PREVIEW_ASSET };
      break;

    case InputState.PREVIEW_ASSET:
      result = previewAsset(input);
      break;

    case InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY:
      result = { nextState: InputState.VALIDATE_BALANCE };
      break;

    case InputState.VALIDATE_BALANCE:
      result = validateBalance(input);
      break;

    default:
      result = {
        nextState: inputState,
        errorMessage: 'Unhandled input state',
      };
      break;
  }

  debugLog.log(`✅ EXIT → nextState: ${InputState[result.nextState]}, validatedAsset: ${result.validatedAsset ? result.validatedAsset.address : 'none'}, error: ${result.errorMessage || 'none'}`);
  return result;
}

function validateAddress({ debouncedHexInput }: ValidateFSMInput): ValidateFSMOutput {
  if (isEmptyInput(debouncedHexInput)) {
    return { nextState: InputState.EMPTY_INPUT };
  } else if (!isAddress(debouncedHexInput)) {
    return { nextState: InputState.INCOMPLETE_ADDRESS };
  } else {
    return { nextState: InputState.TEST_DUPLICATE_INPUT };
  }
}

function testDuplicateInput({
  debouncedHexInput,
  containerType,
  sellAddress,
  buyAddress,
}: ValidateFSMInput): ValidateFSMOutput {
  if (isDuplicateInput(containerType, debouncedHexInput, sellAddress, buyAddress)) {
    return {
      nextState: InputState.DUPLICATE_INPUT_ERROR,
      errorMessage: 'Duplicate address detected',
    };
  }
  return { nextState: InputState.VALIDATE_EXISTS_ON_CHAIN };
}

async function validateExistsOnChain({
  debouncedHexInput,
  chainId,
  feedType,
  publicClient,
  accountAddress,
}: ValidateFSMInput): Promise<ValidateFSMOutput> {
  if (!publicClient) {
    return {
      nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
      errorMessage: 'Public client missing',
    };
  }

  const resolved = await resolveTokenContract(
    debouncedHexInput as Address,
    chainId,
    feedType,
    publicClient,
    accountAddress as Address
  );

  if (!resolved) {
    return { nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN };
  }

  return {
    nextState: InputState.VALIDATE_PREVIEW,
    validatedAsset: resolved,
  };
}

function previewAsset({ debouncedHexInput, seenBrokenLogos }: ValidateFSMInput): ValidateFSMOutput {
  if (seenBrokenLogos.has(debouncedHexInput)) {
    return { nextState: InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY };
  } else {
    return { nextState: InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY };
  }
}

function validateBalance({
  balanceData,
  validatedAsset,
  chainId,
  feedType,
}: ValidateFSMInput): ValidateFSMOutput {
  if (
    !balanceData ||
    !validatedAsset ||
    !('address' in validatedAsset) ||
    !isAddress(validatedAsset.address)
  ) {
    return { nextState: InputState.VALIDATE_BALANCE_ERROR };
  }

  const safeAddress = validatedAsset.address as `0x${string}`;

  const updatedToken: TokenContract = {
    ...validatedAsset,
    balance: balanceData,
    chainId,
    logoURL: getLogoURL(chainId, safeAddress, feedType),
  };

  return {
    nextState: InputState.CLOSE_SELECT_PANEL,
    validatedAsset: updatedToken,
    updatedBalance: balanceData,
  };
}
