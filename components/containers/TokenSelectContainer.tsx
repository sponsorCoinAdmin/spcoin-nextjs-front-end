"use client";

import React, { useEffect, useState } from "react";
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
  delay,
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

type Props = {
  containerType: CONTAINER_TYPE;
};

const TokenSelectContainer = ({ containerType }: Props) => {
  const { exchangeContext } = useExchangeContext();
  const tradeData: TradeData = useTradeData();
  const signer = tradeData.signer;
  const provider = signer?.provider;
  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [transactionType, setTransDirection] = useTransactionType();
  const [slippageBps] = useSlippageBps();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();

  const [formattedAmount, setFormattedAmount] = useState<string | undefined>();
  const [formattedBalance, setFormattedBalance] = useState<string>();
  const [balanceInWei, setBalanceInWei] = useState<bigint>();
  const [didEdit, setDidEdit] = useState(false); // ✅ Track manual edits

  const [tokenContract, setTokenContract] = useState<TokenContract | undefined>(
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? sellTokenContract || undefined
      : buyTokenContract || undefined
  );

  const [amount, setAmount] = useState<bigint>(
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? sellAmount || 0n
      : buyAmount || 0n
  );

  const ACTIVE_ACCOUNT = useAccount();
  const ACTIVE_ACCOUNT_ADDRESS: Address = ACTIVE_ACCOUNT.address || BURN_ADDRESS;
  const TOKEN_CONTRACT_ADDRESS: Address = tokenContract?.address || BURN_ADDRESS;

  const debouncedAmount = useDebounce(amount, 500);

  useEffect(() => {
    if (tokenContract && !didEdit) {
      setAmount(tokenContract.amount || 0n);
    }
  }, [tokenContract]);

  useEffect(() => {
    console.log("[TokenSelectContainer] amount changed:", amount);
  }, [amount]);

  useEffect(() => {
    console.log("[TokenSelectContainer] debouncedAmount changed:", debouncedAmount);
  }, [debouncedAmount]);

  useEffect(() => {
    if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
      setSellTokenContract(tokenContract);
    } else {
      setBuyTokenContract(tokenContract);
    }
  }, [tokenContract]);

  useEffect(() => {
    if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
      setSellAmount(debouncedAmount);
    } else {
      setBuyAmount(debouncedAmount);
    }
  }, [debouncedAmount]);

  useEffect(() => {
    const updateAmount =
      containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
        ? sellAmount
        : buyAmount;

    const decimals: number = tokenContract?.decimals || 0;
    const formatted = getValidBigIntToFormattedValue(updateAmount, decimals);

    if (formatted !== "") {
      setFormattedAmount(formatted);
    }

    setAmount(updateAmount);
  }, [sellAmount, buyAmount]);

  useEffect(() => {
    if (tokenContract) {
      tokenContract.balance = balanceInWei || 0n;
      const decimals: number = tokenContract.decimals || 18;
      const formatted = ethers.formatUnits(balanceInWei || 0n, decimals);
      setFormattedBalance(formatted);
    } else {
      setFormattedBalance("Undefined");
    }
  }, [balanceInWei, tokenContract?.balance]);

  useEffect(() => {
    setBalanceInWei(9999999n);
  }, [ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS, amount]);

  const setDecimalAdjustedContract = (newTokenContract: TokenContract | undefined) => {
    const adjusted = decimalAdjustTokenAmount(amount, newTokenContract, tokenContract);
    setAmount(adjusted);
    setTokenContract(newTokenContract);
  };

  const setTextInputValue = (stringValue: string) => {
    setStringToBigIntStateValue(stringValue);
    const tradeDirection = containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? TRADE_DIRECTION.SELL_EXACT_OUT
      : TRADE_DIRECTION.BUY_EXACT_IN;

    setTransDirection(tradeDirection);
  };

  const setStringToBigIntStateValue = (stringValue: string) => {
    const decimals = tokenContract?.decimals ?? 18;

    stringValue = getValidFormattedPrice(stringValue, decimals);
    setFormattedAmount(stringValue);

    // ✅ Guard against invalid input
    if (!stringValue || isNaN(Number(stringValue))) {
      console.warn("[setStringToBigIntStateValue] Skipping invalid input:", stringValue);
      return;
    }

    try {
      const bigIntValue = parseUnits(stringValue, decimals);
      setAmount(prev => (prev === bigIntValue ? prev : bigIntValue)); // ✅ Avoid duplicate state
      setDidEdit(true);
    } catch (e) {
      console.warn("[setStringToBigIntStateValue] parseUnits failed:", stringValue);
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

  const dumpParms = (cType?: CONTAINER_TYPE) => {
    if (cType === undefined || containerType === cType) {
      let msg = `tokenSelectContainer ${buySellText}\n`;

      msg += `TransSelectContainer Type = ${containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
        ? 'SELL_SELECT_CONTAINER' : 'BUY_SELECT_CONTAINER'}\n`;

      msg += `TRADE_DIRECTION           = ${tradeData.transactionType === TRADE_DIRECTION.BUY_EXACT_IN
        ? 'BUY_EXACT_IN' : 'SELL_EXACT_OUT'}\n`;

      msg += `sellAmount                = ${sellAmount}\n`;
      msg += `buyAmount                 = ${buyAmount}\n`;
      msg += `formattedAmount           = ${formattedAmount}\n`;

      alert(msg);
    }
  };

  useEffect(() => {
    dumpParms(CONTAINER_TYPE.SELL_SELECT_CONTAINER);
    dumpParms(CONTAINER_TYPE.BUY_SELECT_CONTAINER);
  }, [sellAmount, buyAmount]);

  return (
    <div className={`${styles.inputs} ${styles.tokenSelectContainer}`}>
      <input
        className={styles.priceInput}
        placeholder="0"
        disabled={!tokenContract}
        value={formattedAmount || ""}
        onChange={(e) => setTextInputValue(e.target.value)}
        onBlur={(e) => {
          setFormattedAmount(parseFloat(e.target.value).toString());
          setDidEdit(false); // ✅ Reset edit flag to allow tokenContract to update amount again
        }}
      />
      <TokenSelect
        exchangeContext={exchangeContext}
        containerType={containerType}
        tokenContract={tokenContract}
        setDecimalAdjustedContract={setDecimalAdjustedContract}
      />
      <div className={styles.buySell}>{buySellText}</div>
      <div className={styles.assetBalance}>Balance: {formattedBalance || "0.0"}</div>
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
