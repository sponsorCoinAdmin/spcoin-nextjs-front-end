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

export function useResolvedTokenContractInfo(
  tokenAddress?: string
): [TokenContract | undefined, boolean, string, boolean] {
  const chainId = useChainId();

  const validAddress = useMemo(() => {
    return isAddress(tokenAddress ?? '') ? (tokenAddress as `0x${string}`) : undefined;
  }, [tokenAddress]);

  const tokenContract: TokenContract | undefined = useMappedTokenContract(validAddress);
  const isTokenContractResolved = !!tokenContract;
  const isTokenLoading = !!validAddress && tokenContract === undefined;

  const tokenContractMessage: string = useMemo(() => {
    if (isTokenContractResolved) {
      return `TokenContract ${tokenContract!.name} found on blockchain ${chainId}`;
    }

    return `TokenContract at address ${tokenAddress} NOT found on blockchain ${chainId}`;
  }, [isTokenContractResolved, tokenContract?.name, tokenAddress, chainId]);

  return [tokenContract, isTokenContractResolved, tokenContractMessage, isTokenLoading];
}

export function validateTokenSelection(
  token: TokenContract,
  containerType: CONTAINER_TYPE,
  sellTokenContract?: TokenContract,
  buyTokenContract?: TokenContract
): InputState {
  if (!token?.address || !isAddress(token.address)) {
    return InputState.INVALID_ADDRESS_INPUT;
  }

  const oppositeAddress =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? buyTokenContract?.address
      : sellTokenContract?.address;

  if (token.address === oppositeAddress) {
    return InputState.DUPLICATE_INPUT;
  }

  return InputState.VALID_INPUT;
}

export function useValidateTokenAddress(
  tokenAddress: string | undefined,
  setInputState: (state: InputState) => void
): [TokenContract | undefined, boolean, string, boolean] {
  const isAddressInput = useIsAddressInput(tokenAddress);
  const isDuplicate = useIsDuplicateToken(tokenAddress);
  const [tokenContract, isTokenContractResolved, tokenContractMessage, isLoading] =
    useResolvedTokenContractInfo(tokenAddress);

  return [tokenContract, isAddressInput, tokenContractMessage, isLoading];
}

export const useValidatedTokenSelect = (
  isTokenContractResolved: boolean,
  setInputState: (state: InputState) => void
): ((token: TokenContract | undefined) => void) => {
  const [containerType = CONTAINER_TYPE.SELL_SELECT_CONTAINER] = useContainerType();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();

  return useCallback(
    (token: TokenContract | undefined) => {
      if (!token || !isTokenContractResolved) {
        console.warn(`⚠️ Token not resolved on chain`);
        setInputState(InputState.CONTRACT_NOT_FOUND_INPUT);
        return;
      }

      const resultState = validateTokenSelection(
        token,
        containerType,
        sellTokenContract,
        buyTokenContract
      );

      if (resultState !== InputState.VALID_INPUT) {
        console.warn(`❌ Token validation failed: ${InputState[resultState]}`);
        setInputState(resultState);
        return;
      }

      if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
        setSellTokenContract(token);
      } else {
        setBuyTokenContract(token);
      }

      setInputState(InputState.CLOSE_INPUT);
    },
    [
      containerType,
      isTokenContractResolved,
      sellTokenContract?.address,
      buyTokenContract?.address,
      setSellTokenContract,
      setBuyTokenContract,
      setInputState,
    ]
  );
};
