import React, { useEffect, useState } from 'react';
import { exchangeContext } from "@/lib/context";

import styles from '@/styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { TokenContract, TRANSACTION_TYPE } from '@/lib/structure/types';
import { decimalAdjustTokenAmount, getValidFormattedPrice, getValidBigIntToFormattedPrice, isSpCoin, stringifyBigInt } from '@/lib/spCoin/utils';
import { parseUnits } from "ethers";
import { useAccount } from 'wagmi';
import { useDebounce } from '@/lib/hooks/useDebounce';
import useERC20WagmiBalances from '../ERC20/useERC20WagmiBalances';
import AddSponsorButton from '../Buttons/AddSponsorButton';

type Props = {
  updateBuyAmount: bigint,
  sellTokenContract: TokenContract|undefined,
  buyTokenContract: TokenContract | undefined, 
  setBuyAmountCallback: (buyAmount:bigint) => void,
  setTokenContractCallback: (tokenContract:TokenContract|undefined) => void,
}

/* Sell Token Selection Module */
const BuyContainer = ({ updateBuyAmount, 
                        sellTokenContract, 
                        buyTokenContract,
                        setBuyAmountCallback,
                        setTokenContractCallback} : Props) => {
  const ACTIVE_ACCOUNT = useAccount();
  const [buyAmount, setBuyAmount] = useState<bigint>(exchangeContext.tradeData.buyAmount);
  const [formattedBuyAmount, setFormattedBuyAmount] = useState<string|undefined>();
  const [tokenContract, setTokenContract] = useState<TokenContract|undefined>(exchangeContext?.buyTokenContract);
  const {formattedBalance} = useERC20WagmiBalances("BuyContainer", tokenContract?.address);
  const debouncedBuyAmount = useDebounce(buyAmount);

  useEffect(() =>  {
    const formattedBuyAmount = getValidFormattedPrice(buyAmount, buyTokenContract?.decimals);
    setFormattedBuyAmount(formattedBuyAmount)
  }, []);

  useEffect(() =>  {
    // alert (`BuyContainer.useEffect(() => tokenContract(${stringifyBigInt(tokenContract)})`)
    // console.debug(`BuyContainer.useEffect([tokenContract]):tokenContract = ${tokenContract?.name}`)
    console.debug(`***BuyContainer.useEffect([tokenContract]):tokenContract = ${tokenContract?.name}`)
    exchangeContext.buyTokenContract = tokenContract;
    console.debug(`***BuyContainer.useEffect([tokenContract]):tokenContract = ${stringifyBigInt(exchangeContext)}`)
    setTokenContractCallback(tokenContract);
  }, [tokenContract?.address]);

  useEffect(() =>  {
    console.debug(`BuyContainer.useEffect([sellTokenContract]):sellTokenContract = ${sellTokenContract?.name}`)
    setDecimalAdjustedContract(buyTokenContract)
  }, [buyTokenContract]);

  useEffect (() => {
    console.debug(`%%%% BuyContainer.useEffect[sellAmount = ${debouncedBuyAmount}])`);
    exchangeContext.tradeData.buyAmount = debouncedBuyAmount;
    setBuyAmountCallback(debouncedBuyAmount)
  }, [debouncedBuyAmount])

  useEffect(() =>  {
    const decimals:number = buyTokenContract?.decimals || 0;
    const stringValue:string = getValidBigIntToFormattedPrice(updateBuyAmount, decimals)
    if (stringValue !== "") {
      setFormattedBuyAmount(stringValue);
    }
    if (updateBuyAmount) 
      setBuyAmount(updateBuyAmount);
  }, [updateBuyAmount]);

  const  setDecimalAdjustedContract = (newTokenContract: TokenContract|undefined) => {
    console.debug(`BuyContainer.setDecimalAdjustedContract(sellContainer:${stringifyBigInt(newTokenContract)})`)
    // console.debug(`setDecimalAdjustedContract(buyContainer:${newTokenContract?.name})`)
    const decimalAdjustedAmount:bigint = decimalAdjustTokenAmount(buyAmount, newTokenContract, tokenContract);
    // console.debug(`setDecimalAdjustedContract(buyContainer:${decimalAdjustedAmount})`)
    setBuyAmount(decimalAdjustedAmount);
    setTokenContract(newTokenContract)
  }

  const setStringToBigIntStateValue = (stringValue:string) => {
    exchangeContext.tradeData.transactionType = TRANSACTION_TYPE.BUY_EXACT_IN;
    const decimals = buyTokenContract?.decimals;
    stringValue === getValidFormattedPrice(stringValue, decimals);
    const bigIntValue = parseUnits(stringValue, decimals);
    console.debug(`BuyContainer.setStringToBigIntStateValue setSellAmount(${bigIntValue})`);
    setBuyAmount(bigIntValue);
    setFormattedBuyAmount(stringValue);
  }

  let disabled = true;
  try {
    let IsSpCoin = isSpCoin(buyTokenContract);
    return (
      <div className={styles["inputs"] + " " + styles["buyContainer"]}>
        <input id="BuyAmount_ID" className={styles["priceInput"]} placeholder="0" disabled={disabled} value={formattedBuyAmount}
        // <input id="BuyAmount_ID" placeholder="0" disabled={disabled} value={formattedBuyAmount}
          onChange={(e) => { setStringToBigIntStateValue(e.target.value); }}
              onBlur={(e) => { setFormattedBuyAmount(parseFloat(e.target.value).toString()); }}
        />

        {/* ToDo */}
        {/* <InputSelect placeHolder={"0"}
              passedInputField={formattedSellAmount}
              setTokenContractCallBack={setFormattedSellAmount}/> */}

        <AssetSelect  tokenContract={tokenContract} 
                      altTokenContract={sellTokenContract} 
                      setDecimalAdjustedContract={setDecimalAdjustedContract} />
        <div className={styles["buySell"]}>You receive</div>
        <div className={styles["assetBalance"]}>
          Balance: {formattedBalance || "0.0"}
        </div>
        {IsSpCoin ?  <AddSponsorButton activeAccount={ACTIVE_ACCOUNT} buyTokenContract={buyTokenContract}/> : null}
      </div>
    )
  } catch (err:any) {
    console.log(`Buy Container Error:\n ${err.message}\n${stringifyBigInt(exchangeContext)}`)
    alert(`Buy Container Error:\n ${err.message}\n${stringifyBigInt(exchangeContext)}`)
  }
}

export default BuyContainer;
