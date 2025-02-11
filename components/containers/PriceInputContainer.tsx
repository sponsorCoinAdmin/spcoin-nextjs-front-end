import React, { useEffect, useState } from "react";

// External Libraries
import { parseUnits } from "ethers";
import { useAccount, useBalance } from "wagmi";
import { Address } from "viem";

// Wagmi & Custom Hooks
import useWagmiERC20Balances from "@/components/ERC20/useWagmiERC20Balances";
import { useDebounce } from "@/lib/hooks/useDebounce";

// Context & Styles
import { exchangeContext } from "@/lib/context";
import styles from "@/styles/Exchange.module.css";

// Components
import AddSponsorButton from "../Buttons/AddSponsorButton";
import AssetSelect from "./AssetSelect";
import ManageSponsorsButton from "../Buttons/ManageSponsorsButton";

// Utilities
import { isWrappingTransaction } from "@/lib/network/utils";
import { decimalAdjustTokenAmount, getValidBigIntToFormattedPrice, getValidFormattedPrice, isSpCoin } from "@/lib/spCoin/utils";
import { formatDecimals } from "@/lib/wagmi/wagmiERC20ClientRead";
import { stringifyBigInt } from '../../../node_modules-dev/spcoin-common/spcoin-lib-es6/utils';

// Types & Constants
import { CONTAINER_TYPE, TokenContract, TradeData, TRANSACTION_TYPE } from "@/lib/structure/types";

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
  const ACTIVE_ACCOUNT = useAccount();
  const tradeData: TradeData = exchangeContext?.tradeData;
  
  // Determine initial state based on price input type
  const initialAmount: bigint | undefined =
    priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE
      ? tradeData?.sellAmount
      : tradeData?.buyAmount;

  const [amount, setAmount] = useState<bigint>(initialAmount);
  const [formattedAmount, setFormattedAmount] = useState<string | undefined>();
  const [tokenBalance, setTokenBalance] = useState<string>();
  const [tokenContract, setTokenContract] = useState<TokenContract | undefined>(
    priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE
      ? tradeData?.sellTokenContract
      : tradeData?.buyTokenContract
  );

  const debouncedAmount = useDebounce(amount);

  // Token balance and decimals
  // let { formattedBalance, decimals } = useWagmiERC20Balances(
  //   "***priceInputContainer",
  //   tokenContract?.address
  // );

  // Fetch balance using Wagmi `useBalance`
  const balObj = useBalance({ address: tokenContract?.address });

  useEffect(() => {
    if (balObj?.data) {
      console.debug(
        `Address: ${tokenContract?.address}
         BAL.data: ${stringifyBigInt(balObj?.data)}`
      );
    }
  }, [balObj]);

  useEffect(() =>  {
    const formattedAmount = getValidFormattedPrice(amount, tokenContract?.decimals);
    setFormattedAmount(formattedAmount)
  }, []);

  // useEffect(() => {
  //   setTokenBalance(formattedBalance)
  // }, [formattedBalance])

  useEffect(() =>  {
    // alert (`useEffect(() => tokenContract(${stringifyBigInt(tokenContract)})`)
    // alert (` balance = ${balance}\formattedNetworkBalance = ${stringifyBigInt(balance)}`)
    console.debug(`***priceInputContainer.useEffect([tokenContract]):tokenContract = ${tokenContract?.name}`)
    priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE ?
      exchangeContext.tradeData.sellTokenContract = tokenContract :
      exchangeContext.tradeData.buyTokenContract = tokenContract;
    console.debug(`***priceInputContainer.useEffect([tokenContract]):tokenContract = ${stringifyBigInt(exchangeContext)}`)
    setTokenContractCallback(tokenContract);
  }, [tokenContract?.address]);

  useEffect(() =>  {
    priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE ?
      console.debug(`SellContainer.useEffect([sellTokenContract]):sellTokenContract = ${activeContract?.name}`) :
      console.debug(`BuyContainer.useEffect([buyTokenContract]):buyTokenContract = ${activeContract?.name}`)
    setDecimalAdjustedContract(activeContract)
  }, [activeContract]);

  useEffect (() => {
    console.debug(`%%%% BuyContainer.useEffect[sellAmount = ${debouncedAmount}])`);
    priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE ? 
    exchangeContext.tradeData.sellAmount = debouncedAmount :
    exchangeContext.tradeData.buyAmount = debouncedAmount ;
    setCallbackAmount(debouncedAmount)
  }, [debouncedAmount])

  useEffect(() =>  {
    // console.debug(`updateAmount = ${updateAmount}\nformattedBalance = ${formattedBalance}`)
    const decimals:number = activeContract?.decimals || 0;
    const stringValue:string = getValidBigIntToFormattedPrice(updateAmount, decimals)
    if (stringValue !== "") {
      setFormattedAmount(stringValue);
    }
    setAmount(updateAmount);
  }, [updateAmount]);

  //////////////////////////////////////////////////////////////////////////////////////////////////////////
  const TOKEN_CONTRACT_ADDRESS: Address = tokenContract?.address
  // const decimals:number|undefined = useWagmiERC20TokenDecimals(TOKEN_CONTRACT_ADDRESS);
  const provider = exchangeContext.tradeData.signer?.provider
  let balanceInWei:any = 0n;
  // let formattedBalance:string|undefined

  const getBalanceInWei = async (address: any) => {
    balanceInWei = await provider?.getBalance(TOKEN_CONTRACT_ADDRESS);
    return balanceInWei
  }

  useEffect(() => {
    if (TOKEN_CONTRACT_ADDRESS) {
      balanceInWei = getBalanceInWei(TOKEN_CONTRACT_ADDRESS)
      const decimals:number = tokenContract?.decimals || 0;
      balanceInWei.then(() => {
        if (balanceInWei) {
          const formattedBalance = formatDecimals(balanceInWei, decimals);
          console.log(`Address: ${TOKEN_CONTRACT_ADDRESS} => balanceInWei: ${stringifyBigInt(balanceInWei)}\n
                Address: ${TOKEN_CONTRACT_ADDRESS} => decimals        : ${decimals}\n
                Address: ${TOKEN_CONTRACT_ADDRESS} => formattedBalance: ${formattedBalance}`)
                setTokenBalance(formattedBalance);
        }
      })
    }
  }, [TOKEN_CONTRACT_ADDRESS, amount]);
  //////////////////////////////////////////////////////////////////////////////////////////////////////////  

  const  setDecimalAdjustedContract = (newTokenContract: TokenContract|undefined) => {
    // console.debug(`priceInputContainer.setDecimalAdjustedContract(priceInputContainer:${stringifyBigInt(newTokenContract)})`)
    // console.debug(`setDecimalAdjustedContract(priceInputContainer:${newTokenContract?.name})`)
    const decimalAdjustedAmount:bigint = decimalAdjustTokenAmount(amount, newTokenContract, tokenContract);
    // console.debug(`setDecimalAdjustedContract(priceInputContainer:${decimalAdjustedAmount})`)
    setAmount(decimalAdjustedAmount);
    setTokenContract(newTokenContract)
  }

  const setTextInputValue = (stringValue:string) => {
    setStringToBigIntStateValue(stringValue)
    setTransactionType(priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE ? 
                                                 TRANSACTION_TYPE.SELL_EXACT_OUT :
                                                 TRANSACTION_TYPE.BUY_EXACT_IN)
    priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE ?
      exchangeContext.tradeData.transactionType = TRANSACTION_TYPE.SELL_EXACT_OUT:
      exchangeContext.tradeData.transactionType = TRANSACTION_TYPE.BUY_EXACT_IN;
  }

  const setStringToBigIntStateValue = (stringValue:string) => {
    const decimals = tokenContract?.decimals;
    stringValue = getValidFormattedPrice(stringValue, decimals);
    const bigIntValue = parseUnits(stringValue, decimals);
    console.debug(`priceInputContainer.setStringToBigIntStateValue setAmount(${bigIntValue})`);
    setFormattedAmount(stringValue);
    setAmount(bigIntValue);
  }

  const buySellText = isWrappingTransaction(exchangeContext.tradeData.sellTokenContract?.address,
    exchangeContext.tradeData.buyTokenContract?.address) ?
    priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE ? "You Exactly Pay" : "You Exactly Receive" :
    exchangeContext.tradeData.transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT ?
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
      <div className={styles["assetBalance"]}> Balance: {tokenBalance || "0.0"}</div>
      {isSpCoin(tokenContract) ? priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE ?
        <ManageSponsorsButton activeAccount={ACTIVE_ACCOUNT} tokenContract={tokenContract} /> :
        <AddSponsorButton activeAccount={ACTIVE_ACCOUNT} tokenContract={activeContract} /> : null}
      {/* BAL: {bal} */}
    </div>
  )
}

export default priceInputContainer;