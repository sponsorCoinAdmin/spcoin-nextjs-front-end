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

  const [inputValue, setInputValue] = useState<string>("0");
  const debouncedSellAmount = useDebounce(sellAmount, 600);
  const debouncedBuyAmount = useDebounce(buyAmount, 600);

  useEffect(() => {
    if (!tokenContract) return;

    const amountToUse =
      localContainerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
        ? sellAmount
        : buyAmount;

    setInputValue(formatUnits(amountToUse, tokenContract.decimals || 18));
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
    setInputValue(value);

    if (!tokenContract) return;

    const decimals = tokenContract.decimals || 18;
    const formatted = parseValidFormattedAmount(value, decimals);
    const bigIntValue = parseUnits(formatted, decimals);

    if (localContainerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
      setTradeDirection(TRADE_DIRECTION.SELL_EXACT_OUT);
      setSellAmount(bigIntValue);
    } else {
      setTradeDirection(TRADE_DIRECTION.BUY_EXACT_IN);
      setBuyAmount(bigIntValue);
    }
  };

  useEffect(() => {
    if (localContainerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER && tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT) {
      console.log("Debounced Sell Amount:", debouncedSellAmount.toString());
    } else if (localContainerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER && tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN) {
      console.log("Debounced Buy Amount:", debouncedBuyAmount.toString());
    }
  }, [debouncedSellAmount, debouncedBuyAmount, localContainerType, tradeDirection]);

  console.log(`slippageBps = ${slippageBps}`)

  const buySellText = localContainerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
  ? (tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN 
      ? `You Pay ± ${slippageBps/100}%` 
      : `You Exactly Pay:`)
  : (tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT 
      ? `You Receive ± ${slippageBps/100}%` 
      : `You Exactly Receive:`);

  const formattedBalance = tokenContract && tokenContract.balance !== undefined
    ? formatUnits(tokenContract.balance, tokenContract.decimals || 18)
    : "0.0";

  const isInputDisabled =
    !tokenContract ||
    (apiProvider === API_TRADING_PROVIDER.API_0X && localContainerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER);

  return (
    <div className={`${styles.inputs} ${styles.tokenSelectContainer}`}>
      <input
        className={styles.priceInput}
        placeholder="0"
        disabled={isInputDisabled}
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onBlur={() => setInputValue(inputValue ? parseFloat(inputValue).toString() : "0")}
      />
      <TokenSelect
        exchangeContext={exchangeContext}
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
    </div>
  );
};

export default TokenSelectContainer;
