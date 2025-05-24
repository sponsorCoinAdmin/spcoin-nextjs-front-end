'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { isAddress } from 'viem';
import { useChainId } from 'wagmi';

import {
  InputState,
  TokenContract,
  WalletAccount,
  CONTAINER_TYPE,
  getInputStateString,
  FEED_TYPE,
} from '@/lib/structure/types';

import {
  useBuyTokenAddress,
  useSellTokenAddress,
  useContainerType,
} from '@/lib/context/contextHooks';

import { useDebounce } from '@/lib/hooks/useDebounce';
import { useMappedTokenContract } from './wagmiERC20hooks';
import { getLogoURL } from '@/lib/network/utils';

// Treat AgentAccount and SponsorAccount as WalletAccount (if type not available)
type AgentAccount = WalletAccount;
type SponsorAccount = WalletAccount;
type ValidAddressAccount = WalletAccount | SponsorAccount | AgentAccount;

function debugSetInputState(
  state: InputState,
  currentState: InputState,
  setState: (s: InputState) => void
): void {
  if (state === currentState) return;
  const prevState = getInputStateString(currentState);
  const currState = getInputStateString(state);
  const currStateImgs = '⚠️'.repeat(state);
  console.log(`${currStateImgs} STATE CHANGE: ${prevState}(${currentState}) -> ${currState}(${state})`);
  setState(state);
}

function isEmptyInput(input: string | undefined): boolean {
  return !input?.trim();
}

function isInvalidAddress(input: string): boolean {
  return !isAddress(input);
}

function isDuplicateInput(
  containerType: CONTAINER_TYPE,
  input: string,
  sellAddress?: string,
  buyAddress?: string
): boolean {
  if (!sellAddress || !buyAddress || containerType === CONTAINER_TYPE.UNDEFINED) return false;
  const opposite =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? buyAddress : sellAddress;
  return input.toLowerCase() === opposite.toLowerCase();
}

export const useInputValidationState = <T extends TokenContract | ValidAddressAccount>(
  selectAddress: string | undefined,
  feedType: FEED_TYPE = FEED_TYPE.TOKEN_LIST
) => {
  const debouncedAddress = useDebounce(selectAddress || '', 250);
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const [validatedToken, setValidatedToken] = useState<T | undefined>(undefined);

  const [containerType] = useContainerType();
  const buyAddress = useBuyTokenAddress();
  const sellAddress = useSellTokenAddress();

  const seenBrokenImagesRef = useRef<Set<string>>(new Set());
  const previousAddressRef = useRef<string>('');
  const chainId = useChainId();

  useEffect(() => {
    if (
      inputState === InputState.CONTRACT_NOT_FOUND_LOCALLY &&
      debouncedAddress !== previousAddressRef.current &&
      !seenBrokenImagesRef.current.has(debouncedAddress)
    ) {
      debugSetInputState(InputState.EMPTY_INPUT, inputState, setInputState);
    }
    previousAddressRef.current = debouncedAddress;
  }, [debouncedAddress, inputState]);

  useEffect(() => {
    seenBrokenImagesRef.current.clear();
  }, [chainId]);

  const resolvedToken = useMappedTokenContract(
    isAddress(debouncedAddress) ? (debouncedAddress as `0x${string}`) : undefined
  );
  const isResolved = !!resolvedToken;
  const isLoading = isAddress(debouncedAddress) && resolvedToken === undefined;

  const fetchAccountMetadata = useCallback(async () => {
    if (!isAddress(debouncedAddress)) return;

    try {
      const basePath = {
        [FEED_TYPE.RECIPIENT_ACCOUNTS]: 'accounts',
        [FEED_TYPE.AGENT_ACCOUNTS]: 'accounts',
      }[feedType as FEED_TYPE.RECIPIENT_ACCOUNTS | FEED_TYPE.AGENT_ACCOUNTS] || 'unknown';

      const metaURL = `/assets/${basePath}/${debouncedAddress}/wallet.json`;
      const metaResponse = await fetch(metaURL);
      if (!metaResponse.ok) throw new Error('Not found');

      const metadata = await metaResponse.json();

      const account = {
        address: debouncedAddress,
        name: metadata.name || '',
        symbol: metadata.symbol || '',
        avatar: getLogoURL(chainId, debouncedAddress as `0x${string}`, feedType),
        website: metadata.website || '',
        description: metadata.description || '',
        status: metadata.status || '',
        type: metadata.type || '',
      } as T;

      setValidatedToken(account);
      debugSetInputState(InputState.VALID_INPUT_PENDING, inputState, setInputState);
    } catch (e) {
      console.warn(`wallet.json not found for ${debouncedAddress}`);
      setValidatedToken(undefined);
      debugSetInputState(InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN, inputState, setInputState);
    }
  }, [debouncedAddress, chainId, inputState, feedType]);

  useEffect(() => {
    if (isEmptyInput(debouncedAddress)) {
      setValidatedToken(undefined);
      debugSetInputState(InputState.EMPTY_INPUT, inputState, setInputState);
      return;
    }

    if (isInvalidAddress(debouncedAddress)) {
      setValidatedToken(undefined);
      debugSetInputState(InputState.INVALID_ADDRESS_INPUT, inputState, setInputState);
      return;
    }

    if (
      feedType === FEED_TYPE.TOKEN_LIST &&
      isDuplicateInput(containerType, debouncedAddress, sellAddress, buyAddress)
    ) {
      setValidatedToken(undefined);
      debugSetInputState(InputState.DUPLICATE_INPUT, inputState, setInputState);
      return;
    }

    if (
      feedType === FEED_TYPE.RECIPIENT_ACCOUNTS ||
      feedType === FEED_TYPE.AGENT_ACCOUNTS
    ) {
      fetchAccountMetadata();
      return;
    }

    // Token validation path
    if (isLoading) {
      setValidatedToken(undefined);
      return;
    }

    if (!isResolved || !resolvedToken) {
      if (seenBrokenImagesRef.current.has(debouncedAddress)) {
        setValidatedToken(undefined);
        debugSetInputState(InputState.CONTRACT_NOT_FOUND_LOCALLY, inputState, setInputState);
      } else {
        setValidatedToken(undefined);
        debugSetInputState(InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN, inputState, setInputState);
      }
      return;
    }

    if (
      inputState !== InputState.VALID_INPUT_PENDING ||
      (validatedToken as TokenContract)?.address !== resolvedToken.address
    ) {
      setValidatedToken(resolvedToken as T);
      debugSetInputState(InputState.VALID_INPUT_PENDING, inputState, setInputState);
    }
  }, [
    debouncedAddress,
    resolvedToken,
    isResolved,
    isLoading,
    sellAddress,
    buyAddress,
    containerType,
    inputState,
    fetchAccountMetadata,
    feedType,
  ]);

  const reportMissingAvatar = useCallback(() => {
    if (!seenBrokenImagesRef.current.has(debouncedAddress)) {
      seenBrokenImagesRef.current.add(debouncedAddress);
      debugSetInputState(InputState.CONTRACT_NOT_FOUND_LOCALLY, inputState, setInputState);
    }
  }, [debouncedAddress, inputState]);

  return {
    inputState,
    validatedToken,
    isLoading,
    chainId,
    reportMissingAvatar,
  };
};
