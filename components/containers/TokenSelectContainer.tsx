"use client";

import React, { useEffect, useState, useRef } from "react";
import { parseUnits } from "ethers";
import { useAccount } from "wagmi";
import { Address, formatUnits } from "viem";

// Wagmi & Custom Hooks
import { useDebounce } from "@/lib/hooks/useDebounce";
import styles from "@/styles/Exchange.module.css";

// Context & Styles
import {
  useBuyAmount,
  useExchangeContext,
  useSellAmount,
  useSlippageBps,
  useTradeData,
  useTradeDirection,
  useSellTokenContract,
  useBuyTokenContract
} from "@/lib/context/contextHooks";

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
  parseValidFormattedAmount,
  isSpCoin,
  logAlert,
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
  const [transactionType, setTradeDirection] = useTradeDirection();
  const [slippageBps] = useSlippageBps();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();

  const [formattedAmount, setFormattedAmount] = useState<string | undefined>();
  const [formattedBalance, setFormattedBalance] = useState<string>();
  const [tokenContract, setTokenContract] = useState<TokenContract | undefined>(
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? sellTokenContract || undefined
      : buyTokenContract || undefined
  );

  // bigIntInputAmount useState variable for debouncedAmount update only.
  const [bigIntInputAmount, setBigIntInputAmount] = useState<bigint>(0n);
  const debouncedAmount = useDebounce(bigIntInputAmount, 600);

  const ACTIVE_ACCOUNT = useAccount();
  const ACTIVE_ACCOUNT_ADDRESS: Address = ACTIVE_ACCOUNT.address || BURN_ADDRESS;
  const TOKEN_CONTRACT_ADDRESS: Address = tokenContract?.address || BURN_ADDRESS;

  // Set amount on tokenContract change
  useEffect(() => {
    //   setBigIntInputAmount(tokenContract.amount);
    if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) { 
      setSellTokenContract(tokenContract);}
    else { 
      setBuyTokenContract(tokenContract); }
  }, [tokenContract]);

  const setDecimalAdjustedContract = ( newTokenContract: TokenContract | undefined ) => {
    alert(`Setting Token Contract ${newTokenContract?.symbol}`)
    if (newTokenContract) {
      const adjusted = decimalAdjustTokenAmount(bigIntInputAmount, newTokenContract, tokenContract);
      newTokenContract.amount = adjusted;
      setTokenContract(newTokenContract);
    }
  };

  useEffect(() => {
    if (tokenContract) {
      const decimals:number = tokenContract.decimals || 0;
      const formatted:string = formatUnits(bigIntInputAmount, decimals);
      setFormattedAmount(formatted);
    }
  }, [bigIntInputAmount]);

  useEffect(() => {
    // if (sellTokenContract?.amount !== sellAmount)
    logAlert(`sellTokenContract?.amount = ${sellTokenContract?.amount}`,`useEffect([sellAmount])`)
    logAlert(`sellAmount                = ${sellAmount}`,`useEffect([sellAmount])`)
  }, [sellAmount]);

  useEffect(() => {
    logAlert(`------------------------------------------------------------------------`)
    if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER)
      logAlert(`SELL_SELECT_CONTAINER`)
    else
      logAlert(`BUY_SELECT_CONTAINER`)

    if (buyTokenContract) {
      const decimals:number = buyTokenContract?.decimals || 0;
      const formatted:string = formatUnits(buyAmount, decimals);
      setFormattedAmount(formatted);
    }
    else {
      logAlert(`buyTokenContract = ${buyTokenContract}`)
    }

    logAlert(`buyTokenContract?.amount = ${buyTokenContract?.amount}`)
    logAlert(`buyAmount                = ${buyAmount}`,`useEffect([buyAmount])`)
    logAlert(`=======================================================================`)

  }, [buyAmount]);

  const setTextInputValue = (stringValue: string) => {
    if (tokenContract) {
      const decimals:number = tokenContract.decimals || 0;
      const formatted:string = parseValidFormattedAmount(stringValue, decimals);
      const bigIntInputAmount:bigint = parseUnits(formatted, decimals);
      setBigIntInputAmount(bigIntInputAmount); // ✅ always update bigIntInputAmount

      setTradeDirection(CONTAINER_TYPE.SELL_SELECT_CONTAINER
        ? TRADE_DIRECTION.SELL_EXACT_OUT
        : TRADE_DIRECTION.BUY_EXACT_IN);
    }
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
          ? 'SELL_SELECT_CONTAINER' : 'BUY_SELECT_CONTAINER'}\n`;

      msg += `TRADE_DIRECTION = ${
        tradeData.transactionType === TRADE_DIRECTION.BUY_EXACT_IN
          ? 'BUY_EXACT_IN' : 'SELL_EXACT_OUT'}\n`;

      msg += `sellAmount                  = ${sellAmount}\n`;
      msg += `buyAmount                   = ${buyAmount}\n`;
      msg += `formattedAmount             = ${formattedAmount}\n`;

      logAlert(msg,"dumpParms");
    }
  };

    // useEffect for debouncedAmount
    // const prevRef = useRef<bigint | undefined>();
  useEffect(() => {
  //   if (debouncedAmount === prevRef.current) return;
  //   prevRef.current = debouncedAmount;

    const decimals = tokenContract?.decimals || 0;
    // const formatted = getValidBigIntToFormattedValue(debouncedAmount, decimals);
    // setFormattedAmount(formatted);

    if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
      if (sellTokenContract) {
        sellTokenContract.amount = debouncedAmount
      }
      setSellAmount(debouncedAmount);
    } else {
      setBuyAmount(debouncedAmount);
      if (buyTokenContract) {
        buyTokenContract.amount = debouncedAmount
      }
    }
    setBuyAmount(debouncedAmount);

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
