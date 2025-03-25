"use client";

import React, { useEffect, useState } from "react";
import { parseUnits } from "ethers";
import { useAccount } from "wagmi";
import { Address, formatUnits } from "viem";

// Wagmi & Custom Hooks
import { useDebounce } from "@/lib/hooks/useDebounce";
import styles from "@/styles/Exchange.module.css";

// Context & Hooks
import {
  useBuyAmount,
  useExchangeContext,
  useSellAmount,
  useSlippageBps,
  useTradeData,
  useTradeDirection,
  useSellTokenContract,
  useBuyTokenContract,
} from "@/lib/context/contextHooks";

// Components
import AddSponsorButton from "../Buttons/AddSponsorButton";
import TokenSelect from "./TokenSelectDropDown";
import ManageSponsorsButton from "../Buttons/ManageSponsorsButton";

// Utilities
import { BURN_ADDRESS, isWrappingTransaction } from "@/lib/network/utils";
import {
  decimalAdjustTokenAmount,
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

const TokenSelectContainer = ({ containerType }: { containerType: CONTAINER_TYPE }) => {
  // console.log("🚀 TokenSelectContainer rendered");

  const context = useExchangeContext();
  const { exchangeContext } = context;
  // console.log("✅ exchangeContext from hook:", exchangeContext);

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
      ? sellTokenContract
      : buyTokenContract
  );

  const [bigIntInputAmount, setBigIntInputAmount] = useState<bigint>(0n);
  const debouncedAmount = useDebounce(bigIntInputAmount, 600);

  const ACTIVE_ACCOUNT = useAccount();
  const ACTIVE_ACCOUNT_ADDRESS: Address = ACTIVE_ACCOUNT.address || BURN_ADDRESS;

  useEffect(() => {
    console.log("🎯 tokenContract changed to:", tokenContract);
    if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
      setSellTokenContract(tokenContract);
    } else {
      setBuyTokenContract(tokenContract);
    }
  }, [tokenContract]);

  const setDecimalAdjustedContract = (newTokenContract: TokenContract | undefined) => {
    if (newTokenContract) {
      const adjusted = decimalAdjustTokenAmount(bigIntInputAmount, newTokenContract, tokenContract);
      setTokenContract({ ...newTokenContract, amount: adjusted });
    }
  };

  useEffect(() => {
    if (tokenContract) {
      const decimals = tokenContract.decimals || 0;
      const formatted = formatUnits(bigIntInputAmount, decimals);
      setFormattedAmount(formatted);
    }
  }, [bigIntInputAmount]);

  useEffect(() => {
    if (buyTokenContract && containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
      setBigIntInputAmount(sellAmount);
      logAlert(`sellTokenContract?.amount = ${sellTokenContract?.amount}`, "useEffect([sellAmount])");
      logAlert(`sellAmount                = ${sellAmount}`, "useEffect([sellAmount])");
    }
  }, [sellAmount]);

  useEffect(() => {
    if (sellTokenContract && containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER) {
      setBigIntInputAmount(buyAmount);
      logAlert(`buyTokenContract?.amount = ${buyTokenContract?.amount}`, "useEffect([buyAmount])");
      logAlert(`buyAmount                 = ${buyAmount}`, "useEffect([buyAmount])");
    }
  }, [buyAmount]);

  const setTextInputValue = (stringValue: string) => {
    if (tokenContract) {
      setTradeDirection(
        containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
          ? TRADE_DIRECTION.SELL_EXACT_OUT
          : TRADE_DIRECTION.BUY_EXACT_IN
      );
      const decimals = tokenContract.decimals || 0;
      const formatted = parseValidFormattedAmount(stringValue, decimals);
      const bigInt = parseUnits(formatted, decimals);
      setBigIntInputAmount(bigInt);
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

  useEffect(() => {
    // console.log("💡 debouncedAmount effect fired");
    // console.log("🧪 debouncedAmount =", debouncedAmount);
    // console.log("📦 buyTokenContract:", buyTokenContract);
    // console.log("📦 sellTokenContract:", sellTokenContract);
    // console.log("📦 exchangeContext:", exchangeContext);

    if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
      if (sellTokenContract) {
        // setBuyAmount(debouncedAmount);
      } else {
        console.warn("🚫 Cannot set sellAmount — sellTokenContract is undefined");
      }
    } else {
      if (buyTokenContract) {
        // setSellAmount(debouncedAmount);
      } else {
        console.warn("🚫 Cannot set buyAmount — buyTokenContract is undefined");
      }
    }
  }, [debouncedAmount]);

  return (
    <div className={`${styles.inputs} ${styles.tokenSelectContainer}`}>
      <input
        className={styles.priceInput}
        placeholder="0"
        disabled={!tokenContract}
        value={formattedAmount || ""}
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
