"use client";

import React, { useEffect, useState } from "react";

// External Libraries
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
  const [slippageBps, setSlippageBps] = useSlippageBps();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();

  const activeContract =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? sellTokenContract || undefined
      : buyTokenContract  || undefined;

  const setCallbackAmount =
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? setSellAmount
      : setBuyAmount;

  const [amount, setAmount] = useState<bigint>(activeContract?.amount || 0n);
  const [formattedAmount, setFormattedAmount] = useState<string | undefined>();
  const [formattedBalance, setFormattedBalance] = useState<string>();
  const [balanceInWei, setBalanceInWei] = useState<bigint>();
  const [tokenContract, setTokenContract] = useState<TokenContract | undefined>(activeContract);

  const ACTIVE_ACCOUNT = useAccount();
  const ACTIVE_ACCOUNT_ADDRESS: Address = ACTIVE_ACCOUNT.address || BURN_ADDRESS;
  const TOKEN_CONTRACT_ADDRESS: Address =
    activeContract?.address || (BURN_ADDRESS as Address);
  const debouncedAmount = useDebounce(amount);

   useEffect(() => {
    console.debug(
      `***tokenSelectContainer.useEffect([tokenContract]):tokenContract = ${tokenContract?.name}`
    );
    if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
      tradeData.sellTokenContract = tokenContract;
      setSellTokenContract(tokenContract)
    } else {
      tradeData.buyTokenContract = tokenContract;
      setBuyTokenContract(tokenContract)
    }
  }, [tokenContract]);

  useEffect(() => {
    console.debug(
      `%%%% BuyContainer.useEffect[sellAmount = ${debouncedAmount}])`
    );

    if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
      setSellAmount(debouncedAmount);
    } else {
      setBuyAmount(debouncedAmount);
    }
    setCallbackAmount(debouncedAmount);
  }, [debouncedAmount]);

  useEffect(() => {
    const updateAmount =
      containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
        ? sellAmount
        : buyAmount;

    const decimals: number = activeContract?.decimals || 0;
    const formattedAmount: string = getValidBigIntToFormattedValue(updateAmount, decimals);

    if (formattedAmount !== "") {
      setFormattedAmount(formattedAmount);
    }

    console.debug(`
      tokenSelectContainer:updateAmount = ${updateAmount}
      tokenSelectContainer:formattedAmount = ${formattedAmount}
    `);

    setAmount(updateAmount);
  }, [sellAmount, buyAmount]);

  useEffect(() => {
    if (activeContract) {
      activeContract.balance = balanceInWei || 0n;
    }
  }, [balanceInWei]);

  useEffect(() => {
    setBalanceInWei(9999999n); // Placeholder for actual balance fetching logic
  }, [ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS, amount]);

  useEffect(() => {
    if (tokenContract) {
      const decimals: number = tokenContract.decimals || 0;
      tokenContract.balance = balanceInWei || 0n;
      setFormattedBalance(ethers.formatUnits(balanceInWei || 0n, decimals));
    } else {
      setFormattedBalance("Undefined");
    }
  }, [balanceInWei, activeContract?.balance]);

  const setDecimalAdjustedContract = (
    newTokenContract: TokenContract | undefined
  ) => {
    setAmount(decimalAdjustTokenAmount(amount, newTokenContract, tokenContract));
    setTokenContract(newTokenContract);
  };

  const setTextInputValue = (stringValue: string) => {
    setStringToBigIntStateValue(stringValue);
    setTransDirection(
      containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
        ? TRADE_DIRECTION.SELL_EXACT_OUT
        : TRADE_DIRECTION.BUY_EXACT_IN
    );
  };

  const setStringToBigIntStateValue = (stringValue: string) => {
    const decimals = tokenContract?.decimals;
    stringValue = getValidFormattedPrice(stringValue, decimals);
    const bigIntValue = parseUnits(stringValue, decimals);
    setFormattedAmount(stringValue);
    setAmount(bigIntValue);
  };

  const buySellText = isWrappingTransaction(exchangeContext)
    ? containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? "You Exactly Pay"
      : "You Exactly Receive"
    : tradeData.transactionType === TRADE_DIRECTION.SELL_EXACT_OUT
    ? containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? "You Exactly Pay"
      : `You Receive +-${slippageBps * 100}%`
    : containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
    ? `You Pay +-${slippageBps * 100}%`
    : "You Exactly Receive";

  const dumpParms = (
    // tradeData: any,
    // sellAmount: bigint,
    // buyAmount: bigint,
    // formattedAmount: string,
    cType?: CONTAINER_TYPE // Optional parameter
  ) => {
    let msg = `tokenSelectContainer ${buySellText}\n`;
  
    // Ensure cType is either undefined or matches tradeData.containerType
    if (cType === undefined || containerType === cType) {
      if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
        msg += `TransSelectContainer Typ  = SELL_SELECT_CONTAINER\n`;
      } else {
        msg += `TransSelectContainer Type = BUY_SELECT_CONTAINER\n`;
      }
  
      if (tradeData.transactionType === TRADE_DIRECTION.BUY_EXACT_IN) {
        msg += `TRADE_DIRECTION           = BUY_EXACT_IN\n`;
      } else {
        msg += `TRADE_DIRECTION           = SELL_EXACT_OUT\n`;
      }
  
      msg += `sellAmount                  = ${sellAmount}\n`;
      msg += `buyAmount                   = ${buyAmount}\n`;
      msg += `formattedAmount             = ${formattedAmount}\n`;
  
      alert(msg);
    }
  };

  useEffect(() => {
    // dumpParms(CONTAINER_TYPE.SELL_SELECT_CONTAINER);
    dumpParms(CONTAINER_TYPE.BUY_SELECT_CONTAINER);
  }, [sellAmount, buyAmount]);

  const fmt = (fmt:string ):string => {
    // if (fmt !== "0" && fmt !== "")
    //   alert(`************fmt = ${fmt}`)
    return fmt
  }

  return (
    <div className={`${styles.inputs} ${styles.tokenSelectContainer}`}>
      <input
        className={styles.priceInput}
        placeholder="0"
        disabled={!activeContract}
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
