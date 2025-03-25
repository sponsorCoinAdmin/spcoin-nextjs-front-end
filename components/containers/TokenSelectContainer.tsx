"use client";

import React, { useEffect, useState } from "react";
import { parseUnits, formatUnits } from "viem";
import { useAccount } from "wagmi";

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
import { isWrappingTransaction, BURN_ADDRESS } from "@/lib/network/utils";
import { parseValidFormattedAmount, isSpCoin } from "@/lib/spCoin/utils";

// Types & Constants
import {
  CONTAINER_TYPE,
  TRADE_DIRECTION,
} from "@/lib/structure/types";
import styles from "@/styles/Exchange.module.css";

const TokenSelectContainer = ({ containerType }: { containerType: CONTAINER_TYPE }) => {
  const { exchangeContext } = useExchangeContext();

  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [transactionType, setTradeDirection] = useTradeDirection();
  const [slippageBps] = useSlippageBps();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();

  const tokenContract =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? sellTokenContract
      : buyTokenContract;

  const tokenAmount =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? sellAmount : buyAmount;

  const [inputValue, setInputValue] = useState<string>("0");

  useEffect(() => {
    setInputValue(tokenContract && tokenAmount ? formatUnits(tokenAmount, tokenContract.decimals || 18) : "0");
  }, [tokenAmount, tokenContract]);

  const handleInputChange = (value: string) => {
    setInputValue(value);

    if (!tokenContract) return;

    const decimals = tokenContract.decimals || 18;
    const formatted = parseValidFormattedAmount(value, decimals);
    const bigIntValue = parseUnits(formatted, decimals);

    if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
      setTradeDirection(TRADE_DIRECTION.SELL_EXACT_OUT);
      setSellAmount(bigIntValue);
    } else {
      setTradeDirection(TRADE_DIRECTION.BUY_EXACT_IN);
      setBuyAmount(bigIntValue);
    }
  };

  const buySellText = isWrappingTransaction(exchangeContext)
    ? containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? "You Exactly Pay"
      : "You Exactly Receive"
    : transactionType === TRADE_DIRECTION.SELL_EXACT_OUT
      ? containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
        ? "You Exactly Pay"
        : `You Receive +-${slippageBps * 100}%`
      : containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
        ? `You Pay +-${slippageBps * 100}%`
        : "You Exactly Receive";

  const formattedBalance = tokenContract && tokenContract.balance !== undefined
    ? formatUnits(tokenContract.balance, tokenContract.decimals || 18)
    : "0.0";

  return (
    <div className={`${styles.inputs} ${styles.tokenSelectContainer}`}>
      <input
        className={styles.priceInput}
        placeholder="0"
        disabled={!tokenContract}
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onBlur={() => setInputValue(inputValue ? parseFloat(inputValue).toString() : "0")}
      />
      <TokenSelect
        exchangeContext={exchangeContext}
        containerType={containerType}
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