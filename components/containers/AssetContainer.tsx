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
import { useExchangeContext } from "@/lib/context/ExchangeContext";  // ✅ Use Hook
import styles from "@/styles/Exchange.module.css";

// Components
import AddSponsorButton from "../Buttons/AddSponsorButton";
import TokenSelect from "./AssetSelect";
import ManageSponsorsButton from "../Buttons/ManageSponsorsButton";

// Utilities
import { BURN_ADDRESS, delay, useIsActiveAccountAddress, isWrappingTransaction } from "@/lib/network/utils";
import { decimalAdjustTokenAmount, getValidBigIntToFormattedPrice, getValidFormattedPrice, isSpCoin } from "@/lib/spCoin/utils";
import { formatDecimals, useWagmiERC20TokenBalanceOf } from "@/lib/wagmi/wagmiERC20ClientRead";
import { stringifyBigInt } from '../../../node_modules-dev/spcoin-common/spcoin-lib-es6/utils';

// Types & Constants
import { CONTAINER_TYPE, TokenContract, TradeData, TRANSACTION_TYPE } from "@/lib/structure/types";

import { erc20ABI } from '@/resources/data/ABIs/erc20ABI'

type Props = {
  activeContract: TokenContract | undefined;
  priceInputContainerType: CONTAINER_TYPE;
  setCallbackAmount: (amount: bigint) => void;
  setTokenContractCallback: (tokenContract: TokenContract | undefined) => void;
  setTransactionType: (transactionType: TRANSACTION_TYPE) => void;
  slippageBps: number;
  updateAmount: bigint;
};

const priceInputContainer = ({
  activeContract,
  priceInputContainerType,
  setCallbackAmount,
  setTokenContractCallback,
  setTransactionType,
  slippageBps,
  updateAmount,
}: Props) => {

  // ✅ Use `useExchangeContext()` Hook
  const { exchangeContext } = useExchangeContext();
  const tradeData: TradeData = exchangeContext.tradeData;

  // Determine initial state based on price input type
  const initialAmount: bigint | undefined =
    priceInputContainerType === CONTAINER_TYPE.INPUT_SELL_PRICE
      ? tradeData?.sellAmount : tradeData?.buyAmount;

  const [amount, setAmount] = useState<bigint>(initialAmount);
  const [formattedAmount, setFormattedAmount] = useState<string | undefined>();
  const [formattedBalance, setFormattedBalance] = useState<string>();
  const [balanceInWei, setBalanceInWei] = useState<bigint>();
  const [tokenContract, setTokenContract] = useState<TokenContract | undefined>(
    priceInputContainerType === CONTAINER_TYPE.INPUT_SELL_PRICE
      ? tradeData?.sellTokenContract : tradeData?.buyTokenContract
  );

  const ACTIVE_ACCOUNT = useAccount();
  const ACTIVE_ACCOUNT_ADDRESS: Address = ACTIVE_ACCOUNT.address || BURN_ADDRESS;
  const TOKEN_CONTRACT_ADDRESS: Address = tokenContract?.address || BURN_ADDRESS as Address;
  const debouncedAmount = useDebounce(amount);

  useEffect(() => {
    const formattedAmount = getValidFormattedPrice(amount, tokenContract?.decimals);
    setFormattedAmount(formattedAmount);
  }, []);

  useEffect(() => {
    console.debug(`***priceInputContainer.useEffect([tokenContract]):tokenContract = ${tokenContract?.name}`)
    priceInputContainerType === CONTAINER_TYPE.INPUT_SELL_PRICE ?
      tradeData.sellTokenContract = tokenContract :
      tradeData.buyTokenContract = tokenContract;
    setTokenContractCallback(tokenContract);
  }, [tokenContract?.address]);

  useEffect(() => {
    priceInputContainerType === CONTAINER_TYPE.INPUT_SELL_PRICE ?
      console.debug(`SellContainer.useEffect([sellTokenContract]):sellTokenContract = ${activeContract?.name}`) :
      console.debug(`BuyContainer.useEffect([buyTokenContract]):buyTokenContract = ${activeContract?.name}`)
    setDecimalAdjustedContract(activeContract)
  }, [activeContract]);

  useEffect(() => {
    console.debug(`%%%% BuyContainer.useEffect[sellAmount = ${debouncedAmount}])`);
    priceInputContainerType === CONTAINER_TYPE.INPUT_SELL_PRICE ?
      tradeData.sellAmount = debouncedAmount :
      tradeData.buyAmount = debouncedAmount;
    setCallbackAmount(debouncedAmount)
  }, [debouncedAmount])

  useEffect(() => {
    const decimals: number = activeContract?.decimals || 0;
    const stringValue: string = getValidBigIntToFormattedPrice(updateAmount, decimals)
    if (stringValue !== "") {
      setFormattedAmount(stringValue);
    }
    setAmount(updateAmount);
  }, [updateAmount]);

  const signer = tradeData.signer;
  const provider = signer?.provider;

  const bigIntBalanceOf: bigint | undefined = useWagmiERC20TokenBalanceOf(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS);
  useEffect(() => {
    if (bigIntBalanceOf) {
      alert(`bigIntBalanceOf: ${bigIntBalanceOf}`)
    }
  }, [bigIntBalanceOf]);

  const getBalanceInWei = async () => {
    if (useIsActiveAccountAddress(TOKEN_CONTRACT_ADDRESS)) {
      await delay(400);
      const newBal = await provider?.getBalance(TOKEN_CONTRACT_ADDRESS);
      setBalanceInWei(newBal);
    } else {
      if (TOKEN_CONTRACT_ADDRESS && TOKEN_CONTRACT_ADDRESS !== BURN_ADDRESS && signer) {
        const tokenContract = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, erc20ABI, signer);
        const newBal: bigint = await tokenContract.balanceOf(ACTIVE_ACCOUNT_ADDRESS);
        setBalanceInWei(newBal);
      } else {
        setBalanceInWei(undefined);
      }
    }
  };

  useEffect(() => {
    if (activeContract) {
      activeContract.balance = balanceInWei || 0n;
    }
  }, [balanceInWei]);

  useEffect(() => {
    getBalanceInWei();
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
    setTransactionType(priceInputContainerType === CONTAINER_TYPE.INPUT_SELL_PRICE ?
      TRANSACTION_TYPE.SELL_EXACT_OUT :
      TRANSACTION_TYPE.BUY_EXACT_IN);
  };

  const setStringToBigIntStateValue = (stringValue: string) => {
    const decimals = tokenContract?.decimals;
    stringValue = getValidFormattedPrice(stringValue, decimals);
    const bigIntValue = parseUnits(stringValue, decimals);
    setFormattedAmount(stringValue);
    setAmount(bigIntValue);
  };

  const buySellText = isWrappingTransaction(tradeData.sellTokenContract?.address, tradeData.buyTokenContract?.address) ?
    priceInputContainerType === CONTAINER_TYPE.INPUT_SELL_PRICE ? "You Exactly Pay" : "You Exactly Receive" :
    tradeData.transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT ?
      priceInputContainerType === CONTAINER_TYPE.INPUT_SELL_PRICE ? "You Exactly Pay" : `You Receive +-${slippageBps * 100}%` :
      priceInputContainerType === CONTAINER_TYPE.INPUT_SELL_PRICE ? `You Pay +-${slippageBps * 100}%` : "You Exactly Receive";

  return (
    <div className={styles["inputs"] + " " + styles["priceInputContainer"]}>
      <input className={styles.priceInput} placeholder="0" disabled={!activeContract} value={formattedAmount || ""}
        onChange={(e) => { setTextInputValue(e.target.value) }}
        onBlur={(e) => { setFormattedAmount(parseFloat(e.target.value).toString()) }}
      />
      <TokenSelect priceInputContainerType={priceInputContainerType} tokenContract={tokenContract} setDecimalAdjustedContract={setDecimalAdjustedContract} />
      <div className={styles["buySell"]}>{buySellText}</div>
      <div className={styles["assetBalance"]}> Balance: {formattedBalance || "0.0"}</div>
      {isSpCoin(tokenContract) ? (priceInputContainerType === CONTAINER_TYPE.INPUT_SELL_PRICE ? <ManageSponsorsButton tokenContract={tokenContract} /> : <AddSponsorButton />) : null}
    </div>
  );
};

export default priceInputContainer;
