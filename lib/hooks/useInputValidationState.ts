'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { isAddress } from 'viem';
import { useChainId, useAccount, usePublicClient, useBalance } from 'wagmi';
import { createDebugLogger } from '@/lib/utils/debugLogger';

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
  useBuyTokenContract,
  useSellTokenContract,
} from '@/lib/context/hooks';

import { useDebounce } from '@/lib/hooks/useDebounce';
import { useMappedTokenContract } from '@/lib/context/hooks';
import { getLogoURL } from '@/lib/network/utils';

const LOG_TIME: boolean = false;
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_LOG_VALIDATION_STATE === 'true';
const debugLog = createDebugLogger('useInputValidationState', DEBUG_ENABLED, LOG_TIME);

const seenBrokenLogos = new Set<string>();

type AgentAccount = WalletAccount;
type SponsorAccount = WalletAccount;
type ValidAddressAccount = WalletAccount | SponsorAccount | AgentAccount;

type BalanceData = {
  formatted: string;
  value: bigint;
  decimals: number;
  symbol: string;
};

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
  if (!sellAddress || !buyAddress) return false;
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

  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();

  const seenBrokenLogosRef = useRef<Set<string>>(new Set());
  const previousAddressRef = useRef<string>('');
  const lastTokenAddressRef = useRef<string>('');

  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { address: accountAddress } = useAccount();

  const resolvedAsset = useMappedTokenContract(
    isAddress(debouncedAddress) ? (debouncedAddress as `0x${string}`) : undefined
  );

  const isResolved = !!resolvedAsset;
  const isLoading = isAddress(debouncedAddress) && resolvedAsset === undefined;

  const { data: balanceData } = useBalance({
    address: accountAddress,
    token: isAddress(debouncedAddress) ? (debouncedAddress as `0x${string}`) : undefined,
    chainId,
    query: {
      enabled: Boolean(accountAddress && isResolved),
    },
  });

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

  useEffect(() => {
    if (!resolvedAsset || !balanceData) return;

    if (lastTokenAddressRef.current === resolvedAsset.address) return;
    lastTokenAddressRef.current = resolvedAsset.address;

    const tokenWithBalance: TokenContract = {
      ...resolvedAsset,
      balance: balanceData.value,
      chainId: chainId!,
      logoURL: getLogoURL(chainId!, resolvedAsset.address, feedType),
    };

    setValidatedAsset(tokenWithBalance as unknown as T);

    if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
      debugLog.log(`📦 [Context] Setting SELL token in context`, tokenWithBalance);
      setSellTokenContract(tokenWithBalance);
    } else if (containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER) {
      debugLog.log(`📦 [Context] Setting BUY token in context`, tokenWithBalance);
      setBuyTokenContract(tokenWithBalance);
    }

    debugSetInputState(InputState.VALID_INPUT_PENDING, inputState, setInputState);
  }, [balanceData, resolvedAsset]);

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
