// File: @/lib/hooks/useInputValidationState.ts

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { isAddress } from 'viem';
import { useChainId, useAccount, usePublicClient, useBalance } from 'wagmi';
import { getLogoURL } from '@/lib/network/utils';
import { useDebounce } from '@/lib/hooks/useDebounce';
import {
  useBuyTokenAddress,
  useSellTokenAddress,
  useBuyTokenContract,
  useSellTokenContract,
} from '@/lib/context/hooks';

import { InputState, TokenContract, WalletAccount, CONTAINER_TYPE, FEED_TYPE } from '@/lib/structure';
import { debugLog } from './inputValidations/helpers/debugLogInstance';
import { debugSetInputState } from './inputValidations/helpers/debugSetInputState';
import { isEmptyInput } from './inputValidations/validations/isEmptyInput';
import { isValidAddress } from './inputValidations/validations/isValidAddress';
import { isDuplicateInput } from './inputValidations/validations/isDuplicateInput';
import { resolveTokenContract } from './inputValidations/validations/resolveTokenContract';

type AgentAccount = WalletAccount;
type SponsorAccount = WalletAccount;
type ValidAddressAccount = WalletAccount | SponsorAccount | AgentAccount;

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

  useEffect(() => {
    // Step 0: Empty input check
    if (isEmptyInput(debouncedAddress)) {
      debugSetInputState(InputState.EMPTY_INPUT, inputState, setInputState);
      return;
    }

    // Step 1: Invalid address check
    if (!isValidAddress(debouncedAddress)) {
      debugSetInputState(InputState.INVALID_ADDRESS_INPUT, inputState, setInputState);
      return;
    }

    // Step 2: Duplicate address check
    if (isDuplicateInput(containerType!, debouncedAddress, sellAddress, buyAddress)) {
      debugSetInputState(InputState.DUPLICATE_INPUT, inputState, setInputState);
      return;
    }

    // Step 3: Resolve token contract
    const resolve = async () => {
      if (!publicClient) {
        debugLog.warn('❌ publicClient is undefined – skipping token resolution');
        return;
      }

      debugSetInputState(InputState.VALID_INPUT_PENDING, inputState, setInputState);
      const resolved = await resolveTokenContract(
        debouncedAddress,
        chainId,
        feedType,
        publicClient,
        accountAddress
      );

      if (!resolved) {
        debugSetInputState(InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN, inputState, setInputState);
        return;
      }

      debugLog.log(`🎯 Successfully resolved token contract`, resolved);
      setValidatedAsset(resolved as unknown as T);

      if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
        debugLog.log(`📦 [Context] Setting SELL token in context`, resolved);
        setSellTokenContract(resolved);
      } else if (containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER) {
        debugLog.log(`📦 [Context] Setting BUY token in context`, resolved);
        setBuyTokenContract(resolved);
      }
    };

    resolve();
  }, [debouncedAddress, containerType, sellAddress, buyAddress, chainId, publicClient]);

  const { data: balanceData } = useBalance({
    address: accountAddress,
    token: isAddress(debouncedAddress) ? (debouncedAddress as `0x${string}`) : undefined,
    chainId,
    query: {
      enabled: Boolean(accountAddress),
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
    if (!balanceData || !validatedAsset) return;
    if (lastTokenAddressRef.current === validatedAsset.address) return;
    lastTokenAddressRef.current = validatedAsset.address;

    const tokenWithBalance: TokenContract = {
      ...validatedAsset,
      balance: balanceData.value,
      chainId: chainId!,
      logoURL: getLogoURL(chainId!, validatedAsset.address, feedType),
    };

    debugLog.log(`✅ Fully validated tokenWithBalance`, tokenWithBalance);
    setValidatedAsset(tokenWithBalance as unknown as T);

    if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
      debugLog.log(`📦 [Context] Setting SELL token in context`, tokenWithBalance);
      setSellTokenContract(tokenWithBalance);
    } else if (containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER) {
      debugLog.log(`📦 [Context] Setting BUY token in context`, tokenWithBalance);
      setBuyTokenContract(tokenWithBalance);
    }

    debugSetInputState(InputState.VALID_INPUT, inputState, setInputState);
  }, [balanceData, validatedAsset, chainId]);

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
    isLoading: inputState === InputState.VALID_INPUT_PENDING,
    chainId,
    reportMissingLogoURL,
    hasBrokenLogoURL,
  };
};
