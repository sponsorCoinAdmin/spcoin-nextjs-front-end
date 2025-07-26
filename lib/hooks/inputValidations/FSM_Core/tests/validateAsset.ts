// File: lib/hooks/inputValidations/tests/validateAsset.ts

import { Address } from 'viem';
import { getLogoURL } from '@/lib/network/utils';
import { InputState, TokenContract, FEED_TYPE } from '@/lib/structure';
import { ValidateFSMInput, ValidateFSMOutput } from '../types/validateFSMTypes';

export async function validateAsset({
  debouncedHexInput,
  publicClient,
  accountAddress,
  feedType,
  chainId,
}: ValidateFSMInput): Promise<ValidateFSMOutput> {
alert(`Running validateAsset(${debouncedHexInput})`);
  if (feedType !== FEED_TYPE.TOKEN_LIST) {
    return { nextState: InputState.UPDATE_VALIDATED_ASSET };
  }

  if (!debouncedHexInput || typeof debouncedHexInput !== 'string') {
    return {
      nextState: InputState.VALIDATE_ASSET_ERROR,
      errorMessage: 'Invalid or missing token address.',
    };
  }

  if (!accountAddress) {
    return {
      nextState: InputState.MISSING_ACCOUNT_ADDRESS,
      errorMessage: 'Missing account address.',
    };
  }

  if (!publicClient) {
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

    return {
      nextState: InputState.UPDATE_VALIDATED_ASSET,
      validatedAsset,
      updatedBalance: balance,
    };
  } catch (err) {
    return {
      nextState: InputState.VALIDATE_ASSET_ERROR,
      errorMessage: 'Contract read failure during balance check.',
    };
  }
}
