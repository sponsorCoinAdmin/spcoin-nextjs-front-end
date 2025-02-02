import React, { useEffect, useState } from 'react';
import { exchangeContext } from "@/lib/context";

import styles from '@/styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { CONTAINER_TYPE, TokenContract, TRANSACTION_TYPE } from '@/lib/structure/types';
import { stringifyBigInt } from '../../../node_modules-dev/spcoin-common/spcoin-lib/utils';
import { decimalAdjustTokenAmount, getValidBigIntToFormattedPrice, getValidFormattedPrice, isSpCoin } from '@/lib/spCoin/utils';
import { parseUnits } from "ethers";
import { useAccount, useBalance, useWatchBlockNumber } from 'wagmi';
import { useDebounce } from '@/lib/hooks/useDebounce';
import useWagmiERC20Balances from '@/components/ERC20/useWagmiERC20Balances'
import ManageSponsorsButton from '../Buttons/ManageSponsorsButton';
import AddSponsorButton from '../Buttons/AddSponsorButton';
import { BURN_ADDRESS, isTransaction_A_Wrap } from '@/lib/network/utils';
import { config } from '@/lib/wagmi/wagmiConfig';
import { getBalance } from '@wagmi/core';

type Props = {
  priceInputContainType: CONTAINER_TYPE,
  updateAmount: bigint,
  activeContract: TokenContract | undefined, 
  slippage:number,
  setCallbackAmount: (amount:bigint) => void,
  setTransactionType:(transactionType:TRANSACTION_TYPE) => void,
  setTokenContractCallback: (tokenContract:TokenContract|undefined) => void,
}

const priceInputContainer = ({priceInputContainType,
                              updateAmount,
                              activeContract,
                              setCallbackAmount,
                              slippage,
                              setTransactionType,
                              setTokenContractCallback}:Props) => {
  const ACTIVE_ACCOUNT = useAccount();
  // const BALANCE_OF = useBalance({
  //   address: activeContract?.address,
  // });
  const initialAmount:bigint|undefined = priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE ? 
                                         exchangeContext?.tradeData?.sellAmount :
                                         exchangeContext?.tradeData?.buyAmount;
  const [amount, setAmount] = useState<bigint>(initialAmount);
  const [formattedAmount, setFormattedAmount] = useState<string|undefined>();
  const [tokenContract, setTokenContract] = useState<TokenContract|undefined>(activeContract);
  const [refreshComponent, setRefreshComponent] = useState<boolean>(true);
  const {formattedBalance} = useWagmiERC20Balances("***priceInputContainer", tokenContract?.address);
  const debouncedAmount = useDebounce(amount);
  const [blockNumber, setBlockNumber] = useState<bigint>(0n);
  const [tokenBalance, setTokenBalance] = useState<string>();


  useWatchBlockNumber({
    emitOnBegin: true, 
    onBlockNumber(blockNumber) {
      setBlockNumber(blockNumber);
    },
  })

  useEffect(() => {
    // setTokenBalance("ToDo Get Token Balance with wagmi getBalance.")
    setNewBalance()
    // let beforeEthBalance = await ethers.provider.getBalance(signer.address);
  }, [blockNumber])

  const setNewBalance = async() =>  {
    const balanceObj = await getBalance(config, {
      address: ACTIVE_ACCOUNT.address || BURN_ADDRESS,
    })

    setTokenBalance(balanceObj.formatted)
  }


  
  // const BALANCE_OF = useBalance(activeContract?.address);

  // useEffect(() => {
  //   alert(`ACTIVE_ACCOUNT DATA CHANGED: ${ACTIVE_ACCOUNT}`);
  //   // console.debug(stringifyBigInt(ACTIVE_ACCOUNT))
  // }, [ACTIVE_ACCOUNT])

  // useEffect(() => {
  //   // alert(`ACTIVE_ACCOUNT DATA CHANGED: ${ACTIVE_ACCOUNT}`);
  //   console.debug(`BALANCE_OF OBJECT CHANGE: {stringifyBigInt(BALANCE_OF)}`)
  //   setRefreshComponent(!refreshComponent)
  // }, [BALANCE_OF])


  useEffect(() => {
    alert(`Setting formattedBalance for Contract: ${activeContract} FormattedBalance to: ${formattedBalance}`);
  }, [formattedBalance])

  useEffect(() =>  {
    const formattedAmount = getValidFormattedPrice(amount, tokenContract?.decimals);
    setFormattedAmount(formattedAmount)
  }, []);

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
    const decimals:number = activeContract?.decimals || 0;
    const stringValue:string = getValidBigIntToFormattedPrice(updateAmount, decimals)
    if (stringValue !== "") {
      setFormattedAmount(stringValue);
    }
    if (updateAmount) 
      setAmount(updateAmount);
  }, [updateAmount]);

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

  const buySellText = isTransaction_A_Wrap() ? 
    priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE ? "You Exactly Pay" : "You Exactly Receive" :
      exchangeContext.tradeData.transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT ? 
        priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE ? "You Exactly Pay" : `You Receive +-${slippage*100}%` :
        priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE ? `You Pay +-${slippage*100}%`    : "You Exactly Receive"
  
  return (
    <div className={styles["inputs"] + " " + styles["priceInputContainer"]}>
      <input className={styles.priceInput} placeholder="0" disabled={!activeContract} value={formattedAmount || ""}
        onChange={(e) => { setTextInputValue(e.target.value) }}
        onBlur={(e) => { setFormattedAmount(parseFloat(e.target.value).toString()) }}
      />
      <AssetSelect  priceInputContainType={priceInputContainType}
                    tokenContract={tokenContract} 
                    setDecimalAdjustedContract={setDecimalAdjustedContract} />
      <div className={styles["buySell"]}>{buySellText}</div>
      <div className={styles["assetBalance"]}> Balance: {tokenBalance || "0.0"}</div>
      {isSpCoin(tokenContract) ? priceInputContainType === CONTAINER_TYPE.INPUT_SELL_PRICE ? 
        <ManageSponsorsButton activeAccount={ACTIVE_ACCOUNT} tokenContract={tokenContract} /> :
        <AddSponsorButton activeAccount={ACTIVE_ACCOUNT} tokenContract={activeContract}/> : null}
    </div>
  )
}

export default priceInputContainer;