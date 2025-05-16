// File: components\containers\TokenSelectContainerNEW_SWAP_BROKE.tsx

'use client';

import React, { useEffect, useState, useRef } from "react";
import { parseUnits, formatUnits } from "viem";
import { useBalance, useAccount } from "wagmi";
import {
  useApiProvider,
  useBuyBalance,
  useSellBalance,
  useTradeData,
  useSpCoinDisplay
} from '@/lib/context/contextHooks';
import {
  useBuyAmount,
  useSellAmount,
  useSlippageBps,
  useTradeDirection,
  useSellTokenContract,
  useBuyTokenContract,
} from "@/lib/context/contextHooks";

import AddSponsorButton from "../Buttons/AddSponsorButton";
import TokenSelectDropDown from "./TokenSelectDropDown";
import ManageSponsorsButton from "../Buttons/ManageSponsorsButton";

import { parseValidFormattedAmount, isSpCoin } from "@/lib/spCoin/coreUtils";
import { useDebounce } from "@/lib/hooks/useDebounce";

import {
  CONTAINER_TYPE,
  TRADE_DIRECTION,
  API_TRADING_PROVIDER,
  SP_COIN_DISPLAY,
} from "@/lib/structure/types";

import styles from "@/styles/Exchange.module.css";
import { spCoinStringDisplay } from "@/lib/spCoin/guiControl";

const TokenSelectContainer = ({ containerType }: { containerType: CONTAINER_TYPE }) => {
  const [spCoinDisplay, setSpCoinDisplay] = useSpCoinDisplay();
  const tradeData = useTradeData();
  const apiProvider = useApiProvider();
  const account = useAccount();

  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [tradeDirection, setTradeDirection] = useTradeDirection();
  const [slippageBps] = useSlippageBps();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();
  const [sellBalance, setSellBalance] = useSellBalance();
  const [buyBalance, setBuyBalance] = useBuyBalance();

  const [localContainerType] = useState<CONTAINER_TYPE>(containerType);

  const tokenContract =
    localContainerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? sellTokenContract
      : buyTokenContract;

  const { data: wagmiBalance } = useBalance({
    address: account.address,
    chainId: tokenContract?.chainId,
    token: tokenContract?.symbol === 'ETH' ? undefined : tokenContract?.address,
  });

  const [inputValue, setInputValue] = useState<string>("0");
  const debouncedSellAmount = useDebounce(sellAmount, 600);
  const debouncedBuyAmount = useDebounce(buyAmount, 600);

  const tokenContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tokenContract) return;

    const isSp = isSpCoin(tokenContract);
    const isSell = localContainerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER;
    const desired = isSp
      ? (isSell ? SP_COIN_DISPLAY.MANAGE_RECIPIENT_BUTTON : SP_COIN_DISPLAY.SELECT_RECIPIENT_BUTTON)
      : SP_COIN_DISPLAY.OFF;

    if (spCoinDisplay !== desired) {
      setSpCoinDisplay(desired);
    }
  }, [tokenContract]);

  useEffect(() => {
    if (!tokenContract) return;

    const amountToUse =
      localContainerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
        ? sellAmount
        : buyAmount;

    const decimals = tokenContract.decimals || 18;
    const formatted = formatUnits(amountToUse, decimals);

    const numericInput = Number(inputValue);
    const numericFormatted = Number(formatted);

    const isNumericallyEqual =
      !isNaN(numericInput) && !isNaN(numericFormatted) &&
      numericInput === numericFormatted;

    if (!isNumericallyEqual && inputValue !== formatted) {
      setInputValue(formatted);
    }
  }, [sellAmount, buyAmount, localContainerType, tokenContract]);

  useEffect(() => {
    if (
      localContainerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER &&
      tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT
    ) {
      setSellAmount(debouncedSellAmount);
    }

    if (
      localContainerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER &&
      tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN
    ) {
      setBuyAmount(debouncedBuyAmount);
    }
  }, [debouncedSellAmount, debouncedBuyAmount]);

  useEffect(() => {
    if (!account.chainId || account.chainId === tradeData?.chainId) return;
    tradeData.chainId = account.chainId;
    setSellAmount(0n);
    setSellTokenContract(undefined);
    setBuyAmount(0n);
    setBuyTokenContract(undefined);
  }, [account.chainId]);

  useEffect(() => {
    if (!wagmiBalance || !wagmiBalance.value) return;

    if (localContainerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
      setSellBalance(wagmiBalance.value);
    } else {
      setBuyBalance(wagmiBalance.value);
    }
  }, [wagmiBalance, localContainerType]);

  useEffect(() => {
    const tokenBox = tokenContainerRef.current;
    if (!tokenBox) return;

    const isAddPanelVisible = spCoinDisplay === SP_COIN_DISPLAY.SHOW_RECIPIENT_CONTAINER;

    tokenBox.style.borderBottomLeftRadius = isAddPanelVisible ? '0px' : '12px';
    tokenBox.style.borderBottomRightRadius = isAddPanelVisible ? '0px' : '12px';
  }, [spCoinDisplay]);

  const handleInputChange = (value: string) => {
    const isValid = /^\d*\.?\d*$/.test(value);
    if (!isValid) return;

    const normalized = value.replace(/^0+(?!\.)/, '') || '0';
    setInputValue(normalized);

    if (!tokenContract) return;

    const decimals = tokenContract.decimals || 18;
    const formatted = parseValidFormattedAmount(normalized, decimals);
    const isCompleteNumber = /^\d+(\.\d+)?$/.test(formatted);

    if (!isCompleteNumber) return;

    try {
      const bigIntValue = parseUnits(formatted, decimals);

      if (localContainerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
        setTradeDirection(TRADE_DIRECTION.SELL_EXACT_OUT);
        setSellAmount(bigIntValue);
      } else {
        setTradeDirection(TRADE_DIRECTION.BUY_EXACT_IN);
        setBuyAmount(bigIntValue);
      }
    } catch {
      // Ignore parse errors
    }
  };

  const buySellText = localContainerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
    ? (tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN
        ? `You Pay ± ${slippageBps / 100}%`
        : `You Exactly Pay:`)
    : (tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT
        ? `You Receive ± ${slippageBps / 100}%`
        : `You Exactly Receive:`);

  const formattedBalance = tokenContract && tokenContract.balance !== undefined
    ? formatUnits(tokenContract.balance, tokenContract.decimals || 18)
    : "0.0";

  const isInputDisabled =
    !tokenContract ||
    (apiProvider === API_TRADING_PROVIDER.API_0X &&
      localContainerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER);

  return (
    <div
      ref={tokenContainerRef}
      className={`${styles.inputs} ${styles.tokenSelectContainer}`}
    >
      <input
        className={styles.priceInput}
        placeholder="0"
        disabled={isInputDisabled}
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onBlur={() => {
          try {
            const parsed = parseFloat(inputValue);
            if (isNaN(parsed)) {
              setInputValue('0');
            } else {
              const normalized = parsed.toString();
              setInputValue(normalized);
            }
          } catch {
            setInputValue('0');
          }
        }}
      />
      <TokenSelectDropDown
        containerType={localContainerType}
        tokenContract={tokenContract}
        setDecimalAdjustedContract={
          localContainerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
            ? setSellTokenContract
            : setBuyTokenContract
        }
      />
      <div className={styles.buySell}>{buySellText}</div>
      <div className={styles.assetBalance}>Balance: {formattedBalance}</div>
      {isSpCoin(tokenContract) && (
        <>
          <ManageSponsorsButton tokenContract={tokenContract} />
          <AddSponsorButton />
        </>
      )}
      <span>{spCoinStringDisplay(spCoinDisplay)}</span>
    </div>
  );
};

export default TokenSelectContainer;
