import { Address, isAddress } from 'viem';
import {
  InputState,
  CONTAINER_TYPE,
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
  containerType: CONTAINER_TYPE;
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

export async function validateFSMCore(
  input: ValidateFSMInput
): Promise<ValidateFSMOutput> {
  const {
    inputState,
    debouncedHexInput,
    containerType,
    sellAddress,
    buyAddress,
    chainId,
    publicClient,
    accountAddress,
    seenBrokenLogos,
    feedType,
    balanceData,
    validatedAsset,
  } = input;

  debugLog.log(`🛠 ENTRY → inputState: ${InputState[inputState]}, debouncedHexInput: "${debouncedHexInput}"`);

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
    case InputState.CLOSE_SELECT_SCROLL_PANEL:
      result = { nextState: inputState };
      break;

    case InputState.VALIDATE_ADDRESS:
      if (isEmptyInput(debouncedHexInput)) {
        result = { nextState: InputState.EMPTY_INPUT };
      } else if (!isAddress(debouncedHexInput)) {
        result = { nextState: InputState.INCOMPLETE_ADDRESS }; // treat all invalid as incomplete
      } else {
        result = { nextState: InputState.TEST_DUPLICATE_INPUT };
      }
      break;

    case InputState.TEST_DUPLICATE_INPUT:
      if (isDuplicateInput(containerType, debouncedHexInput, sellAddress, buyAddress)) {
        result = {
          nextState: InputState.DUPLICATE_INPUT_ERROR,
          errorMessage: 'Duplicate address detected',
        };
      } else {
        result = { nextState: InputState.VALIDATE_EXISTS_ON_CHAIN };
      }
      break;

    case InputState.VALIDATE_EXISTS_ON_CHAIN: {
      if (!publicClient) {
        result = {
          nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,
          errorMessage: 'Public client missing',
        };
        break;
      }

      const resolved = await resolveTokenContract(
        debouncedHexInput as Address,
        chainId,
        feedType,
        publicClient,
        accountAddress as Address
      );

      if (!resolved) {
        result = { nextState: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN };
        break;
      }

      result = {
        nextState: InputState.VALIDATE_PREVIEW,
        validatedAsset: resolved,
      };
      break;
    }

    case InputState.VALIDATE_PREVIEW:
      result = { nextState: InputState.PREVIEW_ASSET };
      break;

    case InputState.PREVIEW_ASSET:
      if (seenBrokenLogos.has(debouncedHexInput)) {
        result = { nextState: InputState.PREVIEW_CONTRACT_NOT_FOUND_LOCALLY };
      } else {
        result = { nextState: InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY };
      }
      break;

    case InputState.PREVIEW_CONTRACT_EXISTS_LOCALLY:
      result = { nextState: InputState.VALIDATE_BALANCE };
      break;

    case InputState.VALIDATE_BALANCE:
      if (
        !balanceData ||
        !validatedAsset ||
        !('address' in validatedAsset) ||
        !isAddress(validatedAsset.address)
      ) {
        result = { nextState: InputState.VALIDATE_BALANCE_ERROR };
        break;
      }

      const safeAddress = validatedAsset.address as `0x${string}`;

      const updatedToken: TokenContract = {
        ...validatedAsset,
        balance: balanceData,
        chainId,
        logoURL: getLogoURL(chainId, safeAddress, feedType),
      };

      result = {
        nextState: InputState.CLOSE_SELECT_SCROLL_PANEL,
        validatedAsset: updatedToken,
        updatedBalance: balanceData,
      };
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
