import React, { useEffect, useState } from 'react';
import { exchangeContext } from "@/lib/context";

import styles from '@/styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { CONTAINER_TYPE, TokenContract, TRANSACTION_TYPE } from '@/lib/structure/types';
import { decimalAdjustTokenAmount, getValidBigIntToFormattedPrice, getValidFormattedPrice, isSpCoin , stringifyBigInt  } from '@/lib/spCoin/utils';
import { parseUnits } from "ethers";
import { useAccount } from 'wagmi';
import { useDebounce } from '@/lib/hooks/useDebounce';
import useERC20WagmiBalances from '@/components/ERC20/useERC20WagmiBalances'
import ManageSponsorsButton from '../Buttons/ManageSponsorsButton';
import AddSponsorButton from '../Buttons/AddSponsorButton';

type Props = {
  containerType: CONTAINER_TYPE,
  updateAmount: bigint,
  activeContract: TokenContract | undefined, 
  setCallbackAmount: (amount:bigint) => void,
  setTokenContractCallback: (tokenContract:TokenContract|undefined) => void,
}

const PriceInputContainer = ({containerType,
                              updateAmount,
                              activeContract,
                              setCallbackAmount,
                              setTokenContractCallback} : Props) => {
  const ACTIVE_ACCOUNT = useAccount();
  const initialAmount:bigint|undefined = containerType === CONTAINER_TYPE.SELL ? 
                                         exchangeContext?.tradeData?.sellAmount :
                                         exchangeContext?.tradeData?.buyAmount;
  const [amount, setAmount] = useState<bigint>(initialAmount);
  const [formattedAmount, setFormattedAmount] = useState<string|undefined>();
  const [tokenContract, setTokenContract] = useState<TokenContract|undefined>(activeContract);
  const {formattedBalance} = useERC20WagmiBalances("***PriceInputContainer", tokenContract?.address);
  const debouncedAmount = useDebounce(amount);

  useEffect(() =>  {
    const formattedAmount = getValidFormattedPrice(amount, tokenContract?.decimals);
    setFormattedAmount(formattedAmount)
  }, []);

  useEffect(() =>  {
    // alert (`useEffect(() => tokenContract(${stringifyBigInt(tokenContract)})`)
    // alert (` balance = ${balance}\formattedNetworkBalance = ${stringifyBigInt(balance)}`)
    console.debug(`***SellContainer.useEffect([tokenContract]):tokenContract = ${tokenContract?.name}`)
    containerType === CONTAINER_TYPE.SELL ?
      exchangeContext.sellTokenContract = tokenContract :
      exchangeContext.buyTokenContract = tokenContract;
    console.debug(`***SellContainer.useEffect([tokenContract]):tokenContract = ${stringifyBigInt(exchangeContext)}`)
    setTokenContractCallback(tokenContract);
  }, [tokenContract?.address]);

  useEffect(() =>  {
    containerType === CONTAINER_TYPE.SELL ?
      console.debug(`SellContainer.useEffect([sellTokenContract]):sellTokenContract = ${activeContract?.name}`) :
      console.debug(`BuyContainer.useEffect([buyTokenContract]):buyTokenContract = ${activeContract?.name}`)
    setDecimalAdjustedContract(activeContract)
  }, [activeContract]);

  useEffect (() => {
    console.debug(`%%%% BuyContainer.useEffect[sellAmount = ${debouncedAmount}])`);
    containerType === CONTAINER_TYPE.SELL ? 
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
    console.debug(`BuyContainer.setDecimalAdjustedContract(sellContainer:${stringifyBigInt(newTokenContract)})`)
    // console.debug(`setDecimalAdjustedContract(buyContainer:${newTokenContract?.name})`)
    const decimalAdjustedAmount:bigint = decimalAdjustTokenAmount(amount, newTokenContract, tokenContract);
    // console.debug(`setDecimalAdjustedContract(buyContainer:${decimalAdjustedAmount})`)
    setAmount(decimalAdjustedAmount);
    setTokenContract(newTokenContract)
  }

  const setStringToBigIntStateValue = (stringValue:string) => {
    exchangeContext.tradeData.transactionType = TRANSACTION_TYPE.BUY_EXACT_IN;
    const decimals = activeContract?.decimals;
    stringValue === getValidFormattedPrice(stringValue, decimals);
    const bigIntValue = parseUnits(stringValue, decimals);
    console.debug(`BuyContainer.setStringToBigIntStateValue setSellAmount(${bigIntValue})`);
    setAmount(bigIntValue);
    setFormattedAmount(stringValue);
  }

  let disabled = true;
  try {
    let IsSpCoin = isSpCoin(activeContract);
    return (
      <div className={styles["inputs"] + " " + styles["buyContainer"]}>
        <input id="BuyAmount_ID" className={styles["priceInput"]} placeholder="0" disabled={disabled} value={formattedAmount}
        // <input id="BuyAmount_ID" placeholder="0" disabled={disabled} value={formattedAmount}
          onChange={(e) => { setStringToBigIntStateValue(e.target.value); }}
              onBlur={(e) => { setFormattedAmount(parseFloat(e.target.value).toString()); }}
        />

        {/* ToDo */}
        {/* <InputSelect placeHolder={"0"}
              passedInputField={formattedSellAmount}
              setTokenContractCallBack={setFormattedSellAmount}/> */}

        <AssetSelect  containerType={containerType}
                      tokenContract={tokenContract} 
                      setDecimalAdjustedContract={setDecimalAdjustedContract} />
        <div className={styles["buySell"]}>You receive</div>
        <div className={styles["assetBalance"]}>
          Balance: {formattedBalance || "0.0"}
        </div>
        {IsSpCoin ?  <AddSponsorButton activeAccount={ACTIVE_ACCOUNT} buyTokenContract={activeContract}/> : null}
      </div>
    )
  } catch (err:any) {
    console.log(`Buy Container Error:\n ${err.message}\n${stringifyBigInt(exchangeContext)}`)
    alert(`Buy Container Error:\n ${err.message}\n${stringifyBigInt(exchangeContext)}`)
  }
}

export default PriceInputContainer;