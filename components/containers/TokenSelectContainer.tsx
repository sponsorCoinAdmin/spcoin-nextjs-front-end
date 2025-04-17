"use client";

import React, { useEffect, useState } from "react";
import { parseUnits, formatUnits } from "viem";
import { useBalance, useAccount } from "wagmi";
import { useApiProvider, useBuyBalance, useContainerType, useSellBalance, useTradeData } from '@/lib/context/contextHooks';

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
import TokenSelect from "./TokenSelectDropDown";
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

interface TokenSelectContainerProps {
  containerType: CONTAINER_TYPE;
}

const TokenSelectContainer = ({ containerType:selectContainerType }: TokenSelectContainerProps) => {
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
  const [containerType, setContainerType] = useContainerType(selectContainerType);

  useEffect(() => {
    setContainerType(selectContainerType)
  }, []);

  const tokenContract =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
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

  useEffect(() => {
    if (!tokenContract) return;

    const amountToUse =
      containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
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
  }, [sellAmount, buyAmount, containerType, tokenContract]);

  useEffect(() => {
    if (
      containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER &&
      tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT
    ) {
      setSellAmount(debouncedSellAmount);
    }

    if (
      containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER &&
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

    if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
      setSellBalance(wagmiBalance.value);
    } else {
      setBuyBalance(wagmiBalance.value);
    }
  }, [wagmiBalance, containerType]);

  const handleInputChange = (value: string) => {
    const isValid = /^\d*\.?\d*$/.test(value);
    if (!isValid) return;

    setInputValue(value);

    if (!tokenContract) return;

    const decimals = tokenContract.decimals || 18;

    const formatted = parseValidFormattedAmount(value, decimals);
    const isCompleteNumber = /^\d+(\.\d+)?$/.test(formatted);

    if (!isCompleteNumber) return;

    try {
      const bigIntValue = parseUnits(formatted, decimals);

      if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
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

  const buySellText = containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
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
      containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER);

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
            setInputValue(isNaN(parsed) ? '0' : parsed.toString());
          } catch {
            setInputValue('0');
          }
        }}
      />
      <TokenSelect
        exchangeContext={exchangeContext}
        tokenContract={tokenContract}
        setDecimalAdjustedContract={
          containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
            ? setSellTokenContract
            : setBuyTokenContract
        }
      />
      <div className={styles.buySell}>{buySellText}</div>
      <div className={styles.assetBalance}>Balance: {formattedBalance}</div>
      {isSpCoin(tokenContract) &&
        (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? (
          <ManageSponsorsButton tokenContract={tokenContract} />
        ) : (
          <AddSponsorButton />
        ))}
    </div>
  );
};

export default TokenSelectContainer;