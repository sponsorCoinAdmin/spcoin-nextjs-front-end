import React, { useEffect, useState } from "react";

// External Libraries
import { ethers } from "ethers";
import { parseUnits } from "ethers";
import { useAccount } from "wagmi";
import { Address } from "viem";

// Wagmi & Custom Hooks
import { useDebounce } from "@/lib/hooks/useDebounce";

// Context & Styles
import { exchangeContext } from "@/lib/context";
import styles from "@/styles/Exchange.module.css";

// Components
import AddSponsorButton from "../Buttons/AddSponsorButton";
import AssetSelect from "./AssetSelect";
import ManageSponsorsButton from "../Buttons/ManageSponsorsButton";

// Utilities
import { BURN_ADDRESS, delay, isActiveAccountAddress, isWrappingTransaction } from "@/lib/network/utils";
import { decimalAdjustTokenAmount, getValidBigIntToFormattedPrice, getValidFormattedPrice, isSpCoin } from "@/lib/spCoin/utils";
import { formatDecimals, useWagmiERC20TokenBalanceOf } from "@/lib/wagmi/wagmiERC20ClientRead";
import { stringifyBigInt } from '../../../node_modules-dev/spcoin-common/spcoin-lib-es6/utils';

// Types & Constants
import { CONTAINER_TYPE, TokenContract, TradeData, TRANSACTION_TYPE } from "@/lib/structure/types";

import { erc20ABI } from '@/resources/data/ABIs/erc20ABI'

type Props = {
  activeContract: TokenContract | undefined;
  priceInputContainType: CONTAINER_TYPE;
  setCallbackAmount: (amount: bigint) => void;
  setTokenContractCallback: (tokenContract: TokenContract | undefined) => void;
  setTransactionType: (transactionType: TRANSACTION_TYPE) => void;
  slippage: number;
  updateAmount: bigint;
};

const priceInputContainer = ({
  activeContract,
  priceInputContainType,
  setCallbackAmount,
  setTokenContractCallback,
  setTransactionType,
  slippage,
  updateAmount,
}: Props) => {

  // Hooks
  const tradeData: TradeData = exchangeContext.tradeData;

  // Determine initial state based on price input type
  const initialAmount: bigint | undefined =
    priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE
      ? tradeData?.sellAmount : tradeData?.buyAmount;

  const [amount, setAmount] = useState<bigint>(initialAmount);
  const [formattedAmount, setFormattedAmount] = useState<string | undefined>();
  const [formattedBalance, setFormattedBalance] = useState<string>();
  const [balanceInWei, setBalanceInWei] = useState<bigint>();
  const [tokenContract, setTokenContract] = useState<TokenContract | undefined>(
    priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE
      ? tradeData?.sellTokenContract : tradeData?.buyTokenContract
  );

  const ACTIVE_ACCOUNT = useAccount();
  const ACTIVE_ACCOUNT_ADDRESS: Address = ACTIVE_ACCOUNT.address || BURN_ADDRESS
  const TOKEN_CONTRACT_ADDRESS: Address = tokenContract?.address
  const debouncedAmount = useDebounce(amount);

  useEffect(() => {
    const formattedAmount = getValidFormattedPrice(amount, tokenContract?.decimals);
    setFormattedAmount(formattedAmount)
  }, []);

  useEffect(() => {
    // alert (`useEffect(() => tokenContract(${stringifyBigInt(tokenContract)})`)
    console.debug(`***priceInputContainer.useEffect([tokenContract]):tokenContract = ${tokenContract?.name}`)
    priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE ?
      tradeData.sellTokenContract = tokenContract :
      tradeData.buyTokenContract = tokenContract;
    console.debug(`***priceInputContainer.useEffect([tokenContract]):tokenContract = ${stringifyBigInt(exchangeContext)}`)
    setTokenContractCallback(tokenContract);
  }, [tokenContract?.address]);

  useEffect(() => {
    priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE ?
      console.debug(`SellContainer.useEffect([sellTokenContract]):sellTokenContract = ${activeContract?.name}`) :
      console.debug(`BuyContainer.useEffect([buyTokenContract]):buyTokenContract = ${activeContract?.name}`)
    setDecimalAdjustedContract(activeContract)
  }, [activeContract]);

  useEffect(() => {
    console.debug(`%%%% BuyContainer.useEffect[sellAmount = ${debouncedAmount}])`);
    priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE ?
      tradeData.sellAmount = debouncedAmount :
      tradeData.buyAmount = debouncedAmount;
    setCallbackAmount(debouncedAmount)
  }, [debouncedAmount])

  useEffect(() => {
    // console.debug(`updateAmount = ${updateAmount}\nformattedBalance = ${formattedBalance}`)
    const decimals: number = activeContract?.decimals || 0;
    const stringValue: string = getValidBigIntToFormattedPrice(updateAmount, decimals)
    if (stringValue !== "") {
      setFormattedAmount(stringValue);
    }
    setAmount(updateAmount);
  }, [updateAmount]);

//////////////////////////////////////////////////////////////////////////////////////////////////////////
  // const decimals:number|undefined = useWagmiERC20TokenDecimals(TOKEN_CONTRACT_ADDRESS);
  // let formattedBalance:string|undefined
  const signer = tradeData.signer
  const provider = signer?.provider

  const bigIntBalanceOf: bigint | undefined = useWagmiERC20TokenBalanceOf(ACTIVE_ACCOUNT_ADDRESS, TOKEN_CONTRACT_ADDRESS);
  useEffect(() => {
    if (bigIntBalanceOf) {
      alert(`bigIntBalanceOf: ${bigIntBalanceOf}`)
    }
  }, [bigIntBalanceOf]);

   const getBalanceInWei = async () => {
    if (isActiveAccountAddress(TOKEN_CONTRACT_ADDRESS)) {
      // ToDo: NOTE This delay is because we are using wagmi in conjunction with ethers.
      // The fir is to just use 1 provider library either Wagmi or Ethers.
      // For now it is stable do to do later.
      await delay(100)
      const newBal = await provider?.getBalance(TOKEN_CONTRACT_ADDRESS)
      setBalanceInWei(newBal)
    } else {
      const tokenContract = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, erc20ABI, signer);
      const newBal = await tokenContract.balanceOf(ACTIVE_ACCOUNT_ADDRESS);
      setBalanceInWei(newBal)
    }
    // alert(`balanceInWei = ${stringifyBigInt(balanceInWei)}`)
  }

  useEffect(() => {
    if (activeContract)
      activeContract.balance = balanceInWei || 0n
  }, [balanceInWei]);

  useEffect(() => {
    getBalanceInWei()
  }, [TOKEN_CONTRACT_ADDRESS, amount]);

  useEffect(() => {
    // alert(`useEffect.balanceInWei = ${stringifyBigInt(balanceInWei)}`)
    if (tokenContract) {
      const decimals: number = tokenContract.decimals || 0;
      tokenContract.balance = balanceInWei || 0n;
      // alert(`balanceInWei: ${balanceInWei}`)
      const formattedBalance = ethers.formatUnits(balanceInWei || 0n, decimals);
      // const formattedBalance = formatDecimals(balanceInWei, decimals);
      setFormattedBalance(formattedBalance);
      console.log(`Address: ${TOKEN_CONTRACT_ADDRESS} => balanceInWei: ${stringifyBigInt(balanceInWei)}\n
              Address: ${TOKEN_CONTRACT_ADDRESS} => decimals        : ${decimals}\n
              Address: ${TOKEN_CONTRACT_ADDRESS} => formattedBalance: ${formattedBalance}`)
    }
  }, [balanceInWei, activeContract?.balance]);
  //////////////////////////////////////////////////////////////////////////////////////////////////////////  

  const setDecimalAdjustedContract = (newTokenContract: TokenContract | undefined) => {
    // console.debug(`priceInputContainer.setDecimalAdjustedContract(priceInputContainer:${stringifyBigInt(newTokenContract)})`)
    // console.debug(`setDecimalAdjustedContract(priceInputContainer:${newTokenContract?.name})`)
    const decimalAdjustedAmount: bigint = decimalAdjustTokenAmount(amount, newTokenContract, tokenContract);
    // console.debug(`setDecimalAdjustedContract(priceInputContainer:${decimalAdjustedAmount})`)
    setAmount(decimalAdjustedAmount);
    setTokenContract(newTokenContract)
  }

  const setTextInputValue = (stringValue: string) => {
    setStringToBigIntStateValue(stringValue)
    setTransactionType(priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE ?
      TRANSACTION_TYPE.SELL_EXACT_OUT :
      TRANSACTION_TYPE.BUY_EXACT_IN)
    priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE ?
      tradeData.transactionType = TRANSACTION_TYPE.SELL_EXACT_OUT :
      tradeData.transactionType = TRANSACTION_TYPE.BUY_EXACT_IN;
  }

  const setStringToBigIntStateValue = (stringValue: string) => {
    const decimals = tokenContract?.decimals;
    stringValue = getValidFormattedPrice(stringValue, decimals);
    const bigIntValue = parseUnits(stringValue, decimals);
    console.debug(`priceInputContainer.setStringToBigIntStateValue setAmount(${bigIntValue})`);
    setFormattedAmount(stringValue);
    setAmount(bigIntValue);
  }

  const buySellText = isWrappingTransaction(tradeData.sellTokenContract?.address,
    tradeData.buyTokenContract?.address) ?
    priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE ? "You Exactly Pay" : "You Exactly Receive" :
    tradeData.transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT ?
      priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE ? "You Exactly Pay" : `You Receive +-${slippage * 100}%` :
      priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE ? `You Pay +-${slippage * 100}%` : "You Exactly Receive"

  return (
    <div className={styles["inputs"] + " " + styles["priceInputContainer"]}>
      <input className={styles.priceInput} placeholder="0" disabled={!activeContract} value={formattedAmount || ""}
        onChange={(e) => { setTextInputValue(e.target.value) }}
        onBlur={(e) => { setFormattedAmount(parseFloat(e.target.value).toString()) }}
      />
      <AssetSelect priceInputContainType={priceInputContainType}
        tokenContract={tokenContract}
        setDecimalAdjustedContract={setDecimalAdjustedContract} />
      <div className={styles["buySell"]}>{buySellText}</div>
      <div className={styles["assetBalance"]}> Balance: {formattedBalance || "0.0"}</div>
      {isSpCoin(tokenContract) ? priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE ?
        <ManageSponsorsButton activeAccount={ACTIVE_ACCOUNT} tokenContract={tokenContract} /> :
        <AddSponsorButton activeAccount={ACTIVE_ACCOUNT} tokenContract={activeContract} /> : null}
    </div>
  )
}

export default priceInputContainer;