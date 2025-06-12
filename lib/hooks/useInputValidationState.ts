// file: lib/hooks/useInputValidationState.ts

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { isAddress } from 'viem';
import { useChainId } from 'wagmi';
import { createDebugLogger } from '@/lib/utils/debugLogger'

import {
  InputState,
  TokenContract,
  WalletAccount,
  CONTAINER_TYPE,
  getInputStateString,
  FEED_TYPE,
} from '@/lib/structure';

import {
  useBuyTokenAddress,
  useSellTokenAddress,
} from '@/lib/context/hooks';

import { useDebounce } from '@/lib/hooks/useDebounce';
import { useMappedTokenContract } from '@/lib/context/hooks';
import { getLogoURL } from '@/lib/network/utils';
const LOG_TIME:boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_VALIDATION_STATE === 'true';
const debugLog = createDebugLogger('useInputValidationState', DEBUG_ENABLED, LOG_TIME);

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
  debugLog.log(`${currStateImgs} STATE CHANGE: ${prevState}(${currentState}) -> ${currState}(${state})`);
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
  if (!sellAddress || !buyAddress ) return false;
  const opposite =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? buyAddress : sellAddress;
  return input.toLowerCase() === opposite.toLowerCase();
}

export const useInputValidationState = <T extends TokenContract | ValidAddressAccount>(
  selectAddress: string | undefined,
  feedType: FEED_TYPE = FEED_TYPE.TOKEN_LIST,
  containerType?: CONTAINER_TYPE
) => {
  const debouncedAddress = useDebounce(selectAddress || '', 250);
  const [inputState, setInputState] = useState<InputState>(InputState.EMPTY_INPUT);
  const [validatedAsset, setValidatedAsset] = useState<T | undefined>(undefined);

  const buyAddress = useBuyTokenAddress();
  const sellAddress = useSellTokenAddress();

  const seenBrokenLogosRef = useRef<Set<string>>(new Set());
  const previousAddressRef = useRef<string>('');
  const chainId = useChainId();

  useEffect(() => {
    const shouldReset =
      inputState === InputState.CONTRACT_NOT_FOUND_LOCALLY &&
      debouncedAddress !== previousAddressRef.current &&
      !seenBrokenLogosRef.current.has(debouncedAddress) &&
      isEmptyInput(debouncedAddress);

    if (shouldReset) {
      debugLog.log('🔁 Validation reset loop fix triggered', {
        debouncedAddress,
        prev: previousAddressRef.current,
        inputState,
        seenBroken: Array.from(seenBrokenLogosRef.current),
      });
      debugSetInputState(InputState.EMPTY_INPUT, inputState, setInputState);
    }

    previousAddressRef.current = debouncedAddress;
  }, [debouncedAddress, inputState]);

  useEffect(() => {
    seenBrokenLogosRef.current.clear();
  }, [chainId]);

  const resolvedAsset = useMappedTokenContract(
    isAddress(debouncedAddress) ? (debouncedAddress as `0x${string}`) : undefined
  );
  const isResolved = !!resolvedAsset;
  const isLoading = isAddress(debouncedAddress) && resolvedAsset === undefined;

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
        chainId: chainId,
        name: metadata.name || '',
        symbol: metadata.symbol || '',
        logoURL: getLogoURL(chainId, debouncedAddress as `0x${string}`, feedType),
        website: metadata.website || '',
        description: metadata.description || '',
        status: metadata.status || '',
        type: metadata.type || '',
      };

      setValidatedAsset(account as unknown as T);
      debugSetInputState(InputState.VALID_INPUT_PENDING, inputState, setInputState);
    } catch (e) {
      console.warn(`wallet.json not found for ${debouncedAddress}`);
      setValidatedAsset(undefined);
      debugSetInputState(InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN, inputState, setInputState);
    }
  }, [debouncedAddress, chainId, inputState, feedType]);

  useEffect(() => {
    if (isEmptyInput(debouncedAddress)) {
      setValidatedAsset(undefined);
      debugSetInputState(InputState.EMPTY_INPUT, inputState, setInputState);
      return;
    }

    if (isInvalidAddress(debouncedAddress)) {
      setValidatedAsset(undefined);
      debugSetInputState(InputState.INVALID_ADDRESS_INPUT, inputState, setInputState);
      return;
    }

    if (
      feedType === FEED_TYPE.TOKEN_LIST &&
      containerType !== undefined &&
      isDuplicateInput(containerType, debouncedAddress, sellAddress, buyAddress)
    ) {
      setValidatedAsset(undefined);
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

    if (isLoading) {
      setValidatedAsset(undefined);
      return;
    }

    if (!isResolved || !resolvedAsset) {
      if (seenBrokenLogosRef.current.has(debouncedAddress)) {
        setValidatedAsset(undefined);
        debugSetInputState(InputState.CONTRACT_NOT_FOUND_LOCALLY, inputState, setInputState);
      } else {
        setValidatedAsset(undefined);
        debugSetInputState(InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN, inputState, setInputState);
      }
      return;
    }

    const validatedAddress = (validatedAsset as TokenContract | undefined)?.address;
    if (
      inputState !== InputState.VALID_INPUT_PENDING &&
      validatedAddress !== resolvedAsset.address
    ) {
      const cleanedToken = {
        ...(resolvedAsset as TokenContract),
        chainId: chainId!,
        logoURL: getLogoURL(chainId, resolvedAsset.address, feedType),
      };

      delete (cleanedToken as Partial<TokenContract>).balance;

      setValidatedAsset(cleanedToken as unknown as T);
      debugSetInputState(InputState.VALID_INPUT_PENDING, inputState, setInputState);
    }
  }, [
    debouncedAddress,
    resolvedAsset,
    isResolved,
    isLoading,
    sellAddress,
    buyAddress,
    containerType,
    inputState,
    fetchAccountMetadata,
    feedType,
  ]);

  const reportMissingLogoURL = useCallback(() => {
    if (!debouncedAddress) return;
    if (!seenBrokenLogosRef.current.has(debouncedAddress)) {
      seenBrokenLogosRef.current.add(debouncedAddress);
      console.warn(`🛑 Missing logoURL image for ${debouncedAddress}`);
      debugSetInputState(InputState.CONTRACT_NOT_FOUND_LOCALLY, inputState, setInputState);
    }
  }, [debouncedAddress, inputState]);

  const hasBrokenLogoURL = useCallback(() => {
    return seenBrokenLogosRef.current.has(debouncedAddress);
  }, [debouncedAddress]);

  return {
    inputState,
    validatedAsset,
    isLoading,
    chainId,
    reportMissingLogoURL,
    hasBrokenLogoURL,
  };
};
