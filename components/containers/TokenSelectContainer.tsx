'use client';

import React, { useEffect, useState } from "react";

// External Libraries
import { ethers } from "ethers";
import { parseUnits } from "ethers";
import { useAccount } from "wagmi";
import { Address } from "viem";

// Wagmi & Custom Hooks
import { useDebounce } from "@/lib/hooks/useDebounce";

// Context & Styles
import { useBuyAmount, useExchangeContext, useSellAmount, useTradeData } from "@/lib/context/ExchangeContext";  // ✅ Use Hook
import styles from "@/styles/Exchange.module.css";

// Components
import AddSponsorButton from "../Buttons/AddSponsorButton";
import TokenSelect from "./TokenSelectDropDown";
import ManageSponsorsButton from "../Buttons/ManageSponsorsButton";

// Utilities
import { BURN_ADDRESS, delay, isWrappingTransaction } from "@/lib/network/utils";
import { decimalAdjustTokenAmount, getValidBigIntToFormattedValue, getValidFormattedPrice, isSpCoin } from "@/lib/spCoin/utils";
import { formatDecimals, useWagmiERC20TokenBalanceOf } from "@/lib/wagmi/wagmiERC20ClientRead";
import { stringifyBigInt } from '../../../node_modules-dev/spcoin-common/spcoin-lib-es6/utils';

// Types & Constants
import { CONTAINER_TYPE, TokenContract, TradeData, TRANS_DIRECTION } from "@/lib/structure/types";

import { erc20ABI } from '@/resources/data/ABIs/erc20ABI'
import { useBalanceInWei } from "@/lib/hooks/useBalanceInWei";

type Props = {
  containerType: CONTAINER_TYPE;
  setTransactionType: (transactionType: TRANS_DIRECTION) => void;
  setTokenContractCallback: (tokenContract: TokenContract | undefined) => void;
  slippageBps: number;
};

const tokenSelectContainer = ({
  containerType,
  setTransactionType,
  setTokenContractCallback,
  slippageBps,
}: Props) => {

  const { exchangeContext } = useExchangeContext();
  const tradeData: TradeData = useTradeData();
  const signer = tradeData.signer;
  const provider = signer?.provider;
  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();

  let updateAmount;
  let activeContract;
  let setCallbackAmount: (amount: bigint) => void;
  if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER) {
    activeContract = tradeData.sellTokenContract;
    setCallbackAmount = setSellAmount;
  }
  else {
    activeContract = tradeData.buyTokenContract;
    setCallbackAmount = setBuyAmount;
  }
  // if (!activeContract)
  //   return

  const [amount, setAmount] = useState<bigint>(activeContract?.amount || 0n);
  const [formattedAmount, setFormattedAmount] = useState<string | undefined>();
  const [formattedBalance, setFormattedBalance] = useState<string>();
  const [balanceInWei, setBalanceInWei] = useState<bigint>();
  const [tokenContract, setTokenContract] = useState<TokenContract | undefined>(activeContract);

  const ACTIVE_ACCOUNT = useAccount();
  const ACTIVE_ACCOUNT_ADDRESS: Address = ACTIVE_ACCOUNT.address || BURN_ADDRESS;
  const TOKEN_CONTRACT_ADDRESS: Address = activeContract?.address || BURN_ADDRESS as Address;
  const debouncedAmount = useDebounce(amount);

  useEffect(() => {
    const formattedAmount = getValidFormattedPrice(amount, activeContract?.decimals || 0);
    setFormattedAmount(formattedAmount);
  }, []);

  // useEffect(() => {
  //   if (tradeData.transactionType === TRANS_DIRECTION.BUY_EXACT_IN)
  //     alert(`TRANS_DIRECTION.BUY_EXACT_IN -> AssetContainer:sellAmount = ${sellAmount}`)
  //   else
  //     alert(`TRANS_DIRECTION.BUY_EXACT_OUT -> AssetContainer:buyAmount  = ${buyAmount}`)
  // }, [sellAmount, buyAmount]);

  useEffect(() => {
    console.debug(`***tokenSelectContainer.useEffect([tokenContract]):tokenContract = ${tokenContract?.name}`)
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ?
      tradeData.sellTokenContract = tokenContract :
      tradeData.buyTokenContract = tokenContract;
    setTokenContractCallback(tokenContract);
  }, [tokenContract?.address]);

  useEffect(() => {
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ?
      console.debug(`SellContainer.useEffect([sellTokenContract]):sellTokenContract = ${activeContract?.name}`) :
      console.debug(`BuyContainer.useEffect([buyTokenContract]):buyTokenContract = ${activeContract?.name}`)
    setDecimalAdjustedContract(activeContract)
  }, [activeContract]);

  useEffect(() => {
    console.debug(`%%%% BuyContainer.useEffect[sellAmount = ${debouncedAmount}])`);

    // activeContract.amount = debouncedAmount;
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ?
    setSellAmount(debouncedAmount) :
    setBuyAmount(debouncedAmount);
    setCallbackAmount(debouncedAmount)
  }, [debouncedAmount])

  useEffect(() => {
    // if (tradeData.transactionType === TRANS_DIRECTION.BUY_EXACT_IN)
    // else

    let updateAmount;
    if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER)
      updateAmount = sellAmount
    else
      updateAmount = buyAmount

    const decimals: number = activeContract?.decimals || 0;
    const formattedAmount: string = getValidBigIntToFormattedValue(buyAmount, decimals)
    if (formattedAmount !== "") {
      setFormattedAmount(formattedAmount);
    }

    let msg = "";

    if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER)
      msg += `TransSelectContainer Type               = SELL_SELECT_CONTAINER\n`
    else
      msg += `TransSelectContainer Type               = BUY_SELECT_CONTAINER\n`
    if (tradeData.transactionType === TRANS_DIRECTION.BUY_EXACT_IN)
      msg += `TRANS_DIRECTION                         = BUY_EXACT_IN\n`
    else
      msg += `TRANS_DIRECTION                       = SELL_EXACT_OUT\n`
    msg   += `tokenSelectContainer:sellAmount       = ${sellAmount}\n`
    msg   += `tokenSelectContainer:buyAmount        = ${buyAmount}\n`
    msg   += `tokenSelectContainer:updateAmount     = ${updateAmount}\n`
    msg   += `tokenSelectContainer:formattedAmount  = ${formattedAmount}\n`
    alert(msg);

    // if (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER)
    //   if (tradeData.transactionType === TRANS_DIRECTION.SELL_EXACT_OUT)

    setAmount(updateAmount);
  }, [sellAmount,buyAmount]);

  useEffect(() => {
    if (activeContract) {
      activeContract.balance = balanceInWei || 0n;
    }
  }, [balanceInWei]);

  useEffect(() => {
    if (activeContract) {
      // activeContract.balance = useBalanceInWei || 0n;
      alert(`useBalanceInWei = ${stringifyBigInt()}`)
    }
  }, [useBalanceInWei]);

  useEffect(() => {
    // const balanceInWei = useBalanceInWei(TOKEN_CONTRACT_ADDRESS, provider, signer)
    // setBalanceInWei(balanceInWei);
    setBalanceInWei(9999999n);
    // getBalanceInWei();
  }, [ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS, amount]);

  useEffect(() => {
    if (tokenContract) {
      const decimals: number = tokenContract.decimals || 0;
      tokenContract.balance = balanceInWei || 0n;
      const formattedBalance = ethers.formatUnits(balanceInWei || 0n, decimals);
      setFormattedBalance(formattedBalance);
    } else {
      setFormattedBalance("Undefined");
    }
  }, [balanceInWei, activeContract?.balance]);

  const setDecimalAdjustedContract = (newTokenContract: TokenContract | undefined) => {
    const decimalAdjustedAmount: bigint = decimalAdjustTokenAmount(amount, newTokenContract, tokenContract);
    setAmount(decimalAdjustedAmount);
    setTokenContract(newTokenContract);
  };

  const setTextInputValue = (stringValue: string) => {
    setStringToBigIntStateValue(stringValue);
    setTransactionType(containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ?
      TRANS_DIRECTION.SELL_EXACT_OUT :
      TRANS_DIRECTION.BUY_EXACT_IN);
  };

  const setStringToBigIntStateValue = (stringValue: string) => {
    const decimals = tokenContract?.decimals;
    stringValue = getValidFormattedPrice(stringValue, decimals);
    const bigIntValue = parseUnits(stringValue, decimals);
    setFormattedAmount(stringValue);
    setAmount(bigIntValue);
  };

  const buySellText = isWrappingTransaction(exchangeContext) ?
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? "You Exactly Pay" : "You Exactly Receive" :
    tradeData.transactionType === TRANS_DIRECTION.SELL_EXACT_OUT ?
      containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? "You Exactly Pay" : `You Receive +-${slippageBps * 100}%` :
      containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? `You Pay +-${slippageBps * 100}%` : "You Exactly Receive";

  return (
    <div className={styles["inputs"] + " " + styles["tokenSelectContainer"]}>
      <input className={styles.priceInput} placeholder="0" disabled={!activeContract} value={formattedAmount || ""}
        onChange={(e) => { setTextInputValue(e.target.value) }}
        onBlur={(e) => { setFormattedAmount(parseFloat(e.target.value).toString()) }}
      />
      <TokenSelect exchangeContext={exchangeContext} containerType={containerType} tokenContract={tokenContract} setDecimalAdjustedContract={setDecimalAdjustedContract} />
      <div className={styles["buySell"]}>{buySellText}</div>
      <div className={styles["assetBalance"]}> Balance: {formattedBalance || "0.0"}</div>
      {isSpCoin(tokenContract) ? (containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER ? <ManageSponsorsButton tokenContract={tokenContract} /> : <AddSponsorButton />) : null}
    </div>
  );

  // const bigIntBalanceOf: bigint | undefined = useWagmiERC20TokenBalanceOf(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS);
  // useEffect(() => {
  //   if (bigIntBalanceOf) {
  //     alert(`bigIntBalanceOf: ${bigIntBalanceOf}`)
  //   }
  // }, [bigIntBalanceOf]);
  
  // const getBalanceInWei = async () => {
  //   if (isActiveNetworkAddress(exchangeContext, TOKEN_CONTRACT_ADDRESS)) {
  //     await delay(400);
  //     const newBal = await provider?.getBalance(TOKEN_CONTRACT_ADDRESS);
  //     setBalanceInWei(newBal);
  //   } else {
  //     if (TOKEN_CONTRACT_ADDRESS && TOKEN_CONTRACT_ADDRESS !== BURN_ADDRESS && signer) {
  //       const tokenContract = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, erc20ABI, signer);
  //       const newBal: bigint = await tokenContract.balanceOf(ACTIVE_ACCOUNT_ADDRESS);
  //       setBalanceInWei(newBal);
  //     } else {
  //       setBalanceInWei(undefined);
  //     }
  //   }
  // };

};

export default tokenSelectContainer;
