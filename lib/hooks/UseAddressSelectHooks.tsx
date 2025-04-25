import { CONTAINER_TYPE } from '@/lib/structure/types';
import { useSellTokenContract, useBuyTokenContract, useContainerType } from '@/lib/context/contextHooks';
import { isAddress } from 'viem';
import { useEffect, useMemo } from 'react';
import { useChainId } from 'wagmi';
import { TokenContract } from '@/lib/structure/types';
import { useMappedTokenContract } from './wagmiERC20hooks';
import { useCallback } from 'react';
import { InputState } from '@/components/Dialogs/TokenSelectDialog';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';

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

  const tokenContract: TokenContract | undefined | null = useMappedTokenContract(validAddress);
  const isTokenContractResolved = !!tokenContract && tokenContract !== null;
  const isTokenLoading = !!validAddress && tokenContract === undefined;

  const tokenContractMessage = useMemo(() => {
    if (isTokenContractResolved) {
      return `TokenContract ${tokenContract!.name} found on blockchain ${chainId}`;
    }

    return `TokenContract at address ${tokenAddress} NOT found on blockchain ${chainId}`;
  }, [isTokenContractResolved, tokenContract?.name, tokenAddress, chainId]);

  // ✅ Debugging output
  // useEffect(() => {
  //   console.log(`[🔍 useResolvedTokenContractInfo DEBUG]`);
  //   console.log(`  tokenAddress:         ${tokenAddress}`);
  //   console.log(`  validAddress:         ${validAddress}`);
  //   console.log(`  tokenContract:        ${stringifyBigInt(tokenContract)}`);
  //   console.log(`  isTokenResolved:      ${isTokenContractResolved}`);
  //   console.log(`  isTokenLoading:       ${isTokenLoading}`);
  //   console.log(`  tokenContractMessage: ${tokenContractMessage}`);
  // }, [
  //   tokenAddress,
  //   validAddress,
  //   tokenContract,
  //   isTokenContractResolved,
  //   isTokenLoading,
  //   tokenContractMessage
  // ]);
  return [tokenContract ?? undefined, isTokenContractResolved, tokenContractMessage, isTokenLoading];
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
): [TokenContract | undefined, boolean, string] {
  const isAddressInput = useIsAddressInput(tokenAddress);
  const isDuplicate = useIsDuplicateToken(tokenAddress);
  const [tokenContract, isTokenContractResolved, tokenContractMessage, isLoading] =
    useResolvedTokenContractInfo(tokenAddress);
  const isEmptyInput = useIsEmptyInput(tokenAddress);

  useEffect(() => {
    if (isEmptyInput) {
      setInputState(InputState.EMPTY_INPUT);
      return;
    }

    if (!isAddressInput) {
      setInputState(InputState.INVALID_ADDRESS_INPUT);
      return;
    }

    if (isDuplicate) {
      setInputState(InputState.DUPLICATE_INPUT);
      return;
    }

    if (isLoading) {
      setInputState(InputState.IS_LOADING);
      return;
    }

    if (!isTokenContractResolved || !tokenContract) {
      setInputState(InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN);
      return;
    }

    setInputState(InputState.VALID_INPUT);
  }, [
    tokenAddress,
    isAddressInput,
    isDuplicate,
    isLoading,
    tokenContract,
    isEmptyInput,
    isTokenContractResolved,
    setInputState,
  ]);

  return [tokenContract, isLoading, tokenContractMessage];
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
        setInputState(InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN);
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
