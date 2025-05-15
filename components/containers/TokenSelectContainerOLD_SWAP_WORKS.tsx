"use client";

import React, { useEffect, useState } from "react";
import { parseUnits, formatUnits } from "viem";
import { useBalance, useAccount } from "wagmi";
import { useApiProvider, useBuyBalance, useSellBalance, useTradeData } from '@/lib/context/contextHooks';

// Context & Hooks
import {
  useBuyAmount,
  useExchangeContext,
  useSellAmount,
  useSlippageBps,
  useTradeDirection,
  useSellTokenContract,
  useBuyTokenContract,
} from "@/lib/context/contextHooks";

// Components
import AddSponsorButton from "../Buttons/AddSponsorButton";
import TokenSelectDropDown from "./TokenSelectDropDown";
import ManageSponsorsButton from "../Buttons/ManageSponsorsButton";

// Utilities
import { parseValidFormattedAmount, isSpCoin } from "@/lib/spCoin/coreUtils";
import { useDebounce } from "@/lib/hooks/useDebounce";

// Types & Constants
import {
  CONTAINER_TYPE,
  TRADE_DIRECTION,
  API_TRADING_PROVIDER,
} from "@/lib/structure/types";
import styles from "@/styles/Exchange.module.css";
import { stringifyBigInt } from "@sponsorcoin/spcoin-lib/utils";
import { spCoinStringDisplay } from "@/lib/spCoin/guiControl_OLD_BROKE_SWAP";

const TokenSelectContainer = ({ containerType }: { containerType: CONTAINER_TYPE }) => {
  const { exchangeContext } = useExchangeContext();
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

  const [localContainerType, setLocalContainerType] = useState<CONTAINER_TYPE>(containerType);

  const tokenContract =
    localContainerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? sellTokenContract
      : buyTokenContract;

  const { data: wagmiBalance } = useBalance({
    address: account.address,
    chainId: tokenContract?.chainId,
    token: tokenContract?.symbol === 'ETH' ? undefined : tokenContract?.address,
  });

  // useEffect(() => {
  //   console.log(`[DEBUG:tokenSelectContainer] tokenContract after dialog close: ${stringifyBigInt(tokenContract)}`);
  // }, [tokenContract]);

  // useEffect(() => {
  //   console.log('[TokenSelectContainer] SellToken:', stringifyBigInt(sellTokenContract));
  //   console.log('[TokenSelectContainer] BuyToken:', stringifyBigInt(buyTokenContract));
  // }, [sellTokenContract, buyTokenContract]);

  const [inputValue, setInputValue] = useState<string>("0");
  const debouncedSellAmount = useDebounce(sellAmount, 600);
  const debouncedBuyAmount = useDebounce(buyAmount, 600);

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
    if (!account.chainId || account.chainId === exchangeContext?.tradeData?.chainId) return;
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

  const handleInputChange = (value: string) => {
    const isValid = /^\d*\.?\d*$/.test(value);
    if (!isValid) return;
  
    // ✅ Remove leading zeros unless followed by a dot (e.g., 00123 -> 123, 0.123 stays)
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
      // Parsing failed
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
    <div className={`${styles.inputs} ${styles.tokenSelectContainer}`}>
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
              const normalized = parsed.toString(); // removes trailing . and zeros
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
      {isSpCoin(tokenContract) &&
        (localContainerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? (
          <ManageSponsorsButton tokenContract={tokenContract} />
        ) : (
          <AddSponsorButton />
        ))}
        {/* <span>{spCoinStringDisplay(spCoinDisplay)}</span> */}
    </div>
  );
};

export default TokenSelectContainer;