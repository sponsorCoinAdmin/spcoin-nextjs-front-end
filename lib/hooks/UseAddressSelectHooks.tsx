import { CONTAINER_TYPE } from '@/lib/structure/types';
import { useSellTokenContract, useBuyTokenContract, useContainerType } from '@/lib/context/contextHooks';
import { isAddress } from 'viem';
import { useMemo } from 'react';
import { useChainId } from 'wagmi';
import { TokenContract } from '@/lib/structure/types';
import { useMappedTokenContract } from './wagmiERC20hooks';
import { useCallback } from 'react';
import { InputState } from '@/components/Dialogs/TokenSelectDialog';

export function useIsDuplicateToken(tokenAddress?: string): boolean {
  const [sellTokenContract] = useSellTokenContract();
  const [buyTokenContract] = useBuyTokenContract();
  const [containerType] = useContainerType();

  if (!tokenAddress || !isAddress(tokenAddress)) return false;

  const oppositeTokenAddress =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? buyTokenContract?.address
      : sellTokenContract?.address;

  return tokenAddress === oppositeTokenAddress;
}

export function useIsAddressInput(input?: string): boolean {
  return useMemo(() => {
    return !!input && isAddress(input);
  }, [input]);
}

export function useIsEmptyInput(input?: string): boolean {
  return useMemo(() => {
    return input == null || input.trim() === '';
  }, [input]);
}

/**
 * Returns:
 * 1. tokenContract: resolved TokenContract or undefined
 * 2. isTokenContractResolved: true if found
 * 3. tokenContractMessage: formatted JSX message (success or bold red NOT found)
 */

export function useResolvedTokenContractInfo(
  tokenAddress?: string
): [TokenContract | undefined, boolean, string, boolean] {
  const chainId = useChainId();

  const validAddress = useMemo(() => {
    return isAddress(tokenAddress ?? '') ? (tokenAddress as `0x${string}`) : undefined;
  }, [tokenAddress]);

  const tokenContract: TokenContract | undefined = useMappedTokenContract(validAddress);
  const isTokenContractResolved = !!tokenContract;
  const isLoading = !!validAddress && tokenContract === undefined;

  const tokenContractMessage: string = useMemo(() => {
    if (isTokenContractResolved) {
      return `TokenContract ${tokenContract!.name} found on blockchain ${chainId}`;
    }

    return `TokenContract at address ${tokenAddress} NOT found on blockchain ${chainId}`;
  }, [isTokenContractResolved, tokenContract?.name, tokenAddress, chainId]);

  return [tokenContract, isTokenContractResolved, tokenContractMessage, isLoading];
}

/**
 * Hook to select a token (buy or sell based on containerType) and close the input dialog.
 * @param setInputState - Function to update the input validation state
 * @returns A callback that sets the selected token and triggers CLOSE_INPUT state
 */
export const useSelectTokenAndClose = (
  inputState: InputState,
  setInputState: (state: InputState) => void
): ((tokenContract: TokenContract) => void) => {
  const [containerType] = useContainerType();
  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();

  return useCallback(
    (tokenContract: TokenContract) => {
      console.log(`🖱 Clicked Element Data: ${tokenContract.symbol} @ ${tokenContract.address}`);

      if (inputState !== InputState.VALID_INPUT) {
        console.warn(`[selectTokenAndClose] Aborting: inputState is not valid (${InputState[inputState]})`);
        return;
      }

      if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
        setSellTokenContract(tokenContract);
      } else {
        setBuyTokenContract(tokenContract);
      }

      setInputState(InputState.CLOSE_INPUT);
    },
    [containerType, setSellTokenContract, setBuyTokenContract, setInputState, inputState]
  );
};
