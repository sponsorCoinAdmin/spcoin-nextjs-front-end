// File: lib/hooks/inputValidations/FSM_Core/validateFSMCore.ts

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

export interface ValidateFSMInput {
  inputState: InputState;
  debouncedHexInput: string;
  containerType: CONTAINER_TYPE;
  sellAddress?: string;
  buyAddress?: string;
  chainId: number;
  publicClient: any; // wagmi PublicClient
  accountAddress?: string;
  seenBrokenLogos: Set<string>;
  feedType: FEED_TYPE;
  balanceData?: {
    decimals: number;
    formatted: string;
    symbol: string;
    value: bigint;
  }; // ✅ full wagmi balance object
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

  switch (inputState) {
    case InputState.EMPTY_INPUT:
    case InputState.INVALID_ADDRESS_INPUT:
    case InputState.INCOMPLETE_ADDRESS:
    case InputState.DUPLICATE_INPUT:
    case InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN:
    case InputState.CONTRACT_NOT_FOUND_LOCALLY:
    case InputState.VALID_INPUT:
      return { nextState: inputState };

    case InputState.VALIDATE_ADDRESS:
      if (isEmptyInput(debouncedHexInput)) {
        return { nextState: InputState.EMPTY_INPUT };
      } else if (!isAddress(debouncedHexInput)) {
        return { nextState: InputState.INVALID_ADDRESS_INPUT };
      } else {
        return { nextState: InputState.TEST_DUPLICATE_INPUT };
      }

    case InputState.TEST_DUPLICATE_INPUT:
      if (
        isDuplicateInput(
          containerType,
          debouncedHexInput,
          sellAddress,
          buyAddress
        )
      ) {
        return {
          nextState: InputState.DUPLICATE_INPUT,
          errorMessage: 'Duplicate address detected',
        };
      } else {
        return { nextState: InputState.VALIDATE_EXISTS_ON_CHAIN };
      }

    case InputState.VALIDATE_EXISTS_ON_CHAIN: {
      if (!publicClient) {
        return {
          nextState: inputState,
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
        nextState: InputState.VALIDATE_CONTRACT_EXISTS_LOCALLY,
        validatedAsset: resolved,
      };
    }

    case InputState.VALIDATE_CONTRACT_EXISTS_LOCALLY:
      if (seenBrokenLogos.has(debouncedHexInput)) {
        return { nextState: InputState.CONTRACT_NOT_FOUND_LOCALLY };
      } else {
        return { nextState: InputState.VALIDATE_BALANCE };
      }

    case InputState.VALIDATE_BALANCE:
      if (
        !balanceData ||
        !('address' in validatedAsset!) ||
        !isAddress((validatedAsset as TokenContract).address)
      ) {
        return { nextState: InputState.INVALID_ADDRESS_INPUT };
      }

      const safeAddress = (validatedAsset as TokenContract).address as `0x${string}`;

      const updatedToken: TokenContract = {
        ...(validatedAsset as TokenContract),
        balance: balanceData.value, // ✅ safely extract .value
        chainId,
        logoURL: getLogoURL(chainId, safeAddress, feedType),
      };

      return {
        nextState: InputState.VALID_INPUT,
        validatedAsset: updatedToken,
        updatedBalance: balanceData.value,
      };
  }

  // ✅ fallback to satisfy TypeScript exhaustiveness
  return {
    nextState: inputState,
    errorMessage: 'Unhandled input state',
  };
}
