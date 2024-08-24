import React, { useEffect, useState } from 'react';

import { exchangeContext } from "@/lib/context";

import styles from '@/styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { DISPLAY_STATE, TokenContract, ExchangeContext, TRANSACTION_TYPE } from '@/lib/structure/types';
import { getERC20WagmiClientDecimals, getERC20WagmiClientBalanceOf, formatDecimals } from '@/lib/wagmi/erc20WagmiClientRead';
import AddSponsorButton from '../Buttons/AddSponsorButton';
import { getValidBigIntToFormattedPrice, getValidFormattedPrice, isSpCoin, stringifyBigInt } from '@/lib/spCoin/utils';
import { formatUnits, parseUnits } from "ethers";

type Props = {
  activeAccount: any,
  updateBuyAmount: bigint,
  buyTokenContract: TokenContract, 
  setBuyAmountCallback: any,
  setDisplayState:(displayState:DISPLAY_STATE) => void,
  disabled:boolean
}

const BuyContainer = ({activeAccount, updateBuyAmount, buyTokenContract, setBuyAmountCallback, setDisplayState, disabled} : Props) => {
  const [buyAmount, setBuyAmount] = useState<bigint>(exchangeContext.tradeData.buyAmount);
  const [formattedBuyAmount, setFormattedBuyAmount] = useState<string>("0");

  useEffect (() => {
    console.debug(`BuyContainer:sellAmount = ${buyAmount}`)
    setBuyAmountCallback(buyAmount);
    exchangeContext.tradeData.buyAmount = buyAmount;
  }, [buyAmount])




  useEffect(() =>  {
    const decimals = buyTokenContract.decimals;
    const stringValue = getValidBigIntToFormattedPrice(updateBuyAmount, decimals)
    if (stringValue !== "") {
      setFormattedBuyAmount(stringValue);
    }
    if (updateBuyAmount) 
      setBuyAmount(updateBuyAmount);
  }, [updateBuyAmount]);




  const setStringToBigIntStateValue = (stringValue:string) => {
    exchangeContext.tradeData.transactionType = TRANSACTION_TYPE.BUY_EXACT_IN;
    const decimals = buyTokenContract.decimals;
    stringValue === getValidFormattedPrice(stringValue, decimals);
    const bigIntValue = parseUnits(stringValue, decimals);
    setBuyAmount(bigIntValue);
    setFormattedBuyAmount(stringValue);
  }

  try {
    exchangeContext.buyTokenContract.decimals = getERC20WagmiClientDecimals(buyTokenContract.address) || 0;
    exchangeContext.tradeData.buyBalanceOf = getERC20WagmiClientBalanceOf(activeAccount.address, buyTokenContract.address) || 0n;
    exchangeContext.tradeData.buyFormattedBalance = formatDecimals(exchangeContext.tradeData.buyBalanceOf, exchangeContext.buyTokenContract.decimals);

    let IsSpCoin = isSpCoin(buyTokenContract);
    return (
      <div className={styles.inputs}>
       <input id="buy-amount-id" className={styles.priceInput} placeholder="0" disabled={disabled} value={formattedBuyAmount}
          // onChange={(e) => { setStringToBigIntStateValue(e.target.value); }}
          onBlur={(e) => { setFormattedBuyAmount(parseFloat(e.target.value).toString()); }}
          />
        <AssetSelect TokenContract={buyTokenContract} id={"BuyTokenSelectDialog"} disabled={false}></AssetSelect>
      <div className={styles["buySell"]}>You receive</div>
      <div className={styles["assetBalance"]}>
        Balance: {exchangeContext.tradeData.buyFormattedBalance}
      </div>
      {IsSpCoin ?
        <AddSponsorButton activeAccount={activeAccount} buyTokenContract={buyTokenContract} setDisplayState={setDisplayState} />
        : null}
      </div>
    );
  } catch (err:any) {
    console.log(`Buy Container Error:\n ${err.message}\n${stringifyBigInt(exchangeContext)}`)
    alert(`Buy Container Error:\n ${err.message}\n${stringifyBigInt(exchangeContext)}`)
  }
}

export default BuyContainer;
