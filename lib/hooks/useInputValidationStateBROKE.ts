'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useChainId } from 'wagmi';
import { CONTAINER_TYPE, InputState, TokenContract, getInputStateString } from '@/lib/structure/types';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { isAddress } from 'viem';
import { useSellTokenContract, useBuyTokenContract, useContainerType } from '../context/contextHooks';
import { useMappedTokenContract } from './wagmiERC20hooks';

export function useIsAddressInput(input?: string): boolean {
  return useMemo(() => !!input && isAddress(input), [input]);
}

export function useResolvedTokenContractInfo(tokenAddress?: string): [TokenContract | undefined, boolean, string, boolean] {
  const chainId = useChainId();

  const validAddress = useMemo(() => {
    return isAddress(tokenAddress ?? '') ? (tokenAddress as `0x${string}`) : undefined;
  }, [tokenAddress]);

  const resolved = useMappedTokenContract(validAddress);

  const [tokenContract, setTokenContract] = useState<TokenContract | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    setTokenContract(undefined);
    setIsLoading(true);

    if (!validAddress) {
      setIsLoading(false);
      return;
    }

    if (resolved) {
      if (mounted) {
        setTokenContract(resolved);
        setIsLoading(false);
      }
      return;
    }

    const wait = setTimeout(() => {
      if (mounted) {
        setTokenContract(resolved ?? undefined);
        setIsLoading(false);
      }
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(wait);
    };
  }, [validAddress, resolved]);

  const isTokenFound = !!tokenContract;
  const message = useMemo(() => {
    if (isTokenFound) return `✅ TokenContract ${tokenContract!.name} found on chain ${chainId}`;
    return `❌ TokenContract at ${tokenAddress} NOT found on chain ${chainId}`;
  }, [isTokenFound, tokenContract?.name, tokenAddress, chainId]);

  useEffect(() => {
    console.debug('[⚙️ useInputValidationState initialized]');
    console.debug('[🔎 useResolvedTokenContractInfo]');
    console.debug(`  tokenAddress:           ${tokenAddress}`);
    console.debug(`  validAddress:           ${validAddress}`);
    console.debug(`  tokenContract:          ${tokenContract}`);
    console.debug(`  isTokenFound:           ${isTokenFound}`);
    console.debug(`  isLoading:              ${isLoading}`);
    console.debug(`  tokenContractMessage:   ${message}`);
  }, [tokenAddress, validAddress, tokenContract, isTokenFound, isLoading, message]);

  return [tokenContract, isTokenFound, message, isLoading];
}

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

export const useInputValidationState = (selectAddress: string) => {
  const debouncedAddress = useDebounce(selectAddress, 250);
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const [validatedToken, setValidatedToken] = useState<TokenContract | undefined>(undefined);

  const chainId = useChainId();
  const seenBrokenImagesRef = useRef<Set<string>>(new Set());

  const isAddressValid = useIsAddressInput(debouncedAddress);
  const isDuplicate = useIsDuplicateToken(debouncedAddress);
  const [tokenContract, isTokenFound, resolutionMessage, isLoading] = useResolvedTokenContractInfo(debouncedAddress);

  const debugSetInputState = (state: InputState) => {
    console.log(`➡️ SETTING STATE → ${getInputStateString(state)}`);
    setInputState(state);
  };

  useEffect(() => {
    if (isLoading) {
      console.log(`⏳ Still loading tokenContract for ${debouncedAddress}, skipping validation`);
      return;
    }

    console.debug('[🔎 useResolvedTokenContractInfo]');
    console.debug(`  tokenAddress:           ${debouncedAddress}`);
    console.debug(`  tokenContract:          ${tokenContract}`);
    console.debug(`  isTokenFound:           ${isTokenFound}`);
    console.debug(`  isLoading:              ${isLoading}`);
    console.debug(`  tokenContractMessage:   ${resolutionMessage}`);
    console.debug(`  validatedToken:         ${validatedToken}`);

    if (debouncedAddress === '') {
      console.log(`🟢 TESTING: InputState.EMPTY_INPUT(${debouncedAddress})`);
      setValidatedToken(undefined);
      debugSetInputState(InputState.EMPTY_INPUT);
      return;
    }

    if (!isAddressValid) {
      console.log(`🟢 TESTING: InputState.INVALID_ADDRESS_INPUT(${debouncedAddress})`);
      setValidatedToken(undefined);
      debugSetInputState(InputState.INVALID_ADDRESS_INPUT);
      return;
    }

    if (isDuplicate) {
      console.log(`🟢 TESTING: InputState.DUPLICATE_INPUT(${debouncedAddress})`);
      setValidatedToken(undefined);
      debugSetInputState(InputState.DUPLICATE_INPUT);
      return;
    }

    if (!isTokenFound && !isLoading) {
      console.log(`🟢 TESTING: InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN(${debouncedAddress})`);
      setValidatedToken(undefined);
      debugSetInputState(InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN);
      return;
    }

    if (
      isTokenFound &&
      tokenContract &&
      debouncedAddress &&
      tokenContract.address.toLowerCase() === debouncedAddress.toLowerCase()
    ) {
      if (validatedToken?.address === tokenContract.address && inputState === InputState.VALID_INPUT) {
        console.log(`✅ Already validated ${tokenContract.address}`);
        return;
      }

      console.log(`🟢🟢🟢🟢 TESTING PASSED: VALID TOKEN CONTRACT`);
      setValidatedToken(tokenContract);
      debugSetInputState(InputState.VALID_INPUT_PENDING);
      return;
    }
  }, [debouncedAddress, isAddressValid, isDuplicate, tokenContract, isTokenFound, isLoading]);

  // ✅ NEW: Prevent avatar refetches if state changes
  useEffect(() => {
    if (inputState !== InputState.VALID_INPUT_PENDING || !validatedToken) return;

    let cancelled = false;
    const address = validatedToken.address.toLowerCase();
    const testImageUrl = `/assets/blockchains/${chainId}/contracts/${address}/avatar.png`;

    if (seenBrokenImagesRef.current.has(address)) {
      console.log(`⚠️ Avatar already failed for ${address}, skipping image check.`);
      debugSetInputState(InputState.CONTRACT_NOT_FOUND_LOCALLY);
      return;
    }

    const img = new Image();
    img.onload = () => {
      if (!cancelled) {
        debugSetInputState(InputState.VALID_INPUT);
      }
    };
    img.onerror = () => {
      if (!cancelled && !seenBrokenImagesRef.current.has(address)) {
        seenBrokenImagesRef.current.add(address);
        debugSetInputState(InputState.CONTRACT_NOT_FOUND_LOCALLY);
      }
    };

    img.src = testImageUrl;

    return () => {
      cancelled = true;
    };
  }, [inputState, validatedToken, chainId]);

  return {
    inputState,
    validatedToken,
    isLoading,
    chainId,
  };
};
