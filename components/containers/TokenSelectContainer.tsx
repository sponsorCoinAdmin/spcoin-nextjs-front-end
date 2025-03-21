"use client";

import React, { useEffect, useState, useRef } from "react";
import { ethers } from "ethers";
import { parseUnits } from "ethers";
import { useAccount } from "wagmi";
import { Address } from "viem";

// Wagmi & Custom Hooks
import { useDebounce } from "@/lib/hooks/useDebounce";

// Context & Styles
import {
  useBuyAmount,
  useExchangeContext,
  useSellAmount,
  useSlippageBps,
  useTradeData,
  useTransactionType,
  useSellTokenContract,
  useBuyTokenContract
} from "@/lib/context/contextHooks";
import styles from "@/styles/Exchange.module.css";

// Components
import AddSponsorButton from "../Buttons/AddSponsorButton";
import TokenSelect from "./TokenSelectDropDown";
import ManageSponsorsButton from "../Buttons/ManageSponsorsButton";

// Utilities
import {
  BURN_ADDRESS,
  isWrappingTransaction,
} from "@/lib/network/utils";
import {
  decimalAdjustTokenAmount,
  getValidBigIntToFormattedValue,
  getValidFormattedPrice,
  isSpCoin,
} from "@/lib/spCoin/utils";

// Types & Constants
import {
  CONTAINER_TYPE,
  TokenContract,
  TradeData,
  TRADE_DIRECTION,
} from "@/lib/structure/types";
import { usePriceAPI } from "@/lib/0X/fetcher";

type Props = {
  containerType: CONTAINER_TYPE;
};

const TokenSelectContainer = ({ containerType }: Props) => {
  const { exchangeContext } = useExchangeContext();
  const tradeData: TradeData = useTradeData();
  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [transactionType, setTransDirection] = useTransactionType();
  const [slippageBps] = useSlippageBps();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();

  const [formattedAmount, setFormattedAmount] = useState<string | undefined>();
  const [formattedBalance, setFormattedBalance] = useState<string>();
  const [balanceInWei, setBalanceInWei] = useState<bigint>();
  const [tokenContract, setTokenContract] = useState<TokenContract | undefined>(
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? sellTokenContract || undefined
      : buyTokenContract || undefined
  );

  const [amount, setAmount] = useState<bigint>(0n);
  const debouncedAmount = useDebounce(amount, 600);

  const ACTIVE_ACCOUNT = useAccount();
  const ACTIVE_ACCOUNT_ADDRESS: Address = ACTIVE_ACCOUNT.address || BURN_ADDRESS;
  const TOKEN_CONTRACT_ADDRESS: Address = tokenContract?.address || BURN_ADDRESS;

  // Set amount on tokenContract change
  useEffect(() => {
    if (tokenContract?.amount && amount === 0n) {
      setAmount(tokenContract.amount);
    }
  }, [tokenContract]);

  // Sync tokenContract to context
  useEffect(() => {
    if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
      setSellTokenContract(tokenContract);
    } else {
      setBuyTokenContract(tokenContract);
    }
  }, [tokenContract]);


  const setDecimalAdjustedContract = (
    newTokenContract: TokenContract | undefined
  ) => {
    const adjusted = decimalAdjustTokenAmount(amount, newTokenContract, tokenContract);
    setAmount(adjusted);
    setTokenContract(newTokenContract);
  };

  const setTextInputValue = (stringValue: string) => {
    const decimals = tokenContract?.decimals;
    const formatted = getValidFormattedPrice(stringValue, decimals);
    const bigIntValue = parseUnits(formatted, decimals);

    setFormattedAmount(formatted);
    setAmount(bigIntValue); // ✅ always update amount

    const tradeDirection = containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? TRADE_DIRECTION.SELL_EXACT_OUT
      : TRADE_DIRECTION.BUY_EXACT_IN;

    setTransDirection(tradeDirection);

    const contType = `setTextInputValue:TransSelectContainer Type = ${
      containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
        ? 'SELL_SELECT_CONTAINER'
        : 'BUY_SELECT_CONTAINER'
    }\n`;

    const direction = `setTextInputValue:TRADE_DIRECTION  = ${
      tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN
        ? 'BUY_EXACT_IN'
        : 'SELL_EXACT_OUT'
    }\n`;

    // alert(`setTextInputValue:\ncontainerType = ${contType}${direction}`);
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

  const dumpParms = (cType?: CONTAINER_TYPE) => {
    if (cType === undefined || containerType === cType) {
      let msg = `tokenSelectContainer ${buySellText}\n`;

      msg += `TransSelectContainer Type = ${
        containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
          ? 'SELL_SELECT_CONTAINER'
          : 'BUY_SELECT_CONTAINER'}\n`;

      msg += `TRADE_DIRECTION           = ${
        tradeData.transactionType === TRADE_DIRECTION.BUY_EXACT_IN
          ? 'BUY_EXACT_IN'
          : 'SELL_EXACT_OUT'}\n`;

      msg += `sellAmount                  = ${sellAmount}\n`;
      msg += `buyAmount                   = ${buyAmount}\n`;
      msg += `formattedAmount             = ${formattedAmount}\n`;

      alert(msg);
    }
  };

    // useEffect for debouncedAmount
    // const prevRef = useRef<bigint | undefined>();
    useEffect(() => {
    //   if (debouncedAmount === prevRef.current) return;
    //   prevRef.current = debouncedAmount;
  
    //   const decimals = tokenContract?.decimals || 0;
    //   const formatted = getValidBigIntToFormattedValue(debouncedAmount, decimals);
    //   setFormattedAmount(formatted);
  
    //   if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
    //     setSellAmount(debouncedAmount);
    //   } else {
    //     setBuyAmount(debouncedAmount);
    //   }
  
    //   alert(`🔥 Debounced Amount Updated:\n${debouncedAmount.toString()}`);
  
      dumpParms(CONTAINER_TYPE.SELL_SELECT_CONTAINER);
      dumpParms(CONTAINER_TYPE.BUY_SELECT_CONTAINER);
    }, [debouncedAmount]);

  const fmt = (fmt: string): string => fmt;

  return (
    <div className={`${styles.inputs} ${styles.tokenSelectContainer}`}>
      <input
        className={styles.priceInput}
        placeholder="0"
        disabled={!tokenContract}
        value={fmt(formattedAmount || "")}
        onChange={(e) => setTextInputValue(e.target.value)}
        onBlur={(e) => setFormattedAmount(parseFloat(e.target.value).toString())}
      />
      <TokenSelect
        exchangeContext={exchangeContext}
        containerType={containerType}
        tokenContract={tokenContract}
        setDecimalAdjustedContract={setDecimalAdjustedContract}
      />
      <div className={styles.buySell}>{buySellText}</div>
      <div className={styles.assetBalance}>
        Balance: {formattedBalance || "0.0"}
      </div>
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
