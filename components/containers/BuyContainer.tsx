import React, { useEffect, useState } from 'react';

import { exchangeContext } from "@/lib/context";


import styles from '@/styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { DISPLAY_STATE, TokenContract, ExchangeContext } from '@/lib/structure/types';
import { getERC20WagmiClientDecimals, getERC20WagmiClientBalanceOf, formatDecimals } from '@/lib/wagmi/erc20WagmiClientRead';
import AddSponsorButton from '../Buttons/AddSponsorButton';
import { getValidFormattedPrice, isSpCoin, stringifyBigInt } from '@/lib/spCoin/utils';
import { formatUnits, parseUnits } from "ethers";

type Props = {
  activeAccount: any,
  buyAmount: bigint,
  buyTokenContract: TokenContract, 
  setBuyAmount: any,
  setDisplayState:(displayState:DISPLAY_STATE) => void,
  disabled:boolean
}

const BuyContainer = ({activeAccount, buyAmount, buyTokenContract, setBuyAmount, setDisplayState, disabled} : Props) => {

  try {
    const [formattedBuyAmount, setFormattedBuyAmount] = useState<string>("8");
    exchangeContext.buyTokenContract.decimals = getERC20WagmiClientDecimals(buyTokenContract.address) || 0;
    exchangeContext.tradeData.buyDecimals = exchangeContext.buyTokenContract.decimals;
    exchangeContext.tradeData.buyBalanceOf = getERC20WagmiClientBalanceOf(activeAccount.address, buyTokenContract.address) || 0n;
    exchangeContext.tradeData.buyFormattedBalance = formatDecimals(exchangeContext.tradeData.buyBalanceOf, exchangeContext.buyTokenContract.decimals);

    const setStringToBigIntStateValue = (stringValue:string, decimals:number|undefined, setAmount: (txt:bigint) => void) => {
      decimals = decimals || 0;
      stringValue = getValidFormattedPrice(stringValue, decimals);
      if (stringValue !== "") {
        setFormattedBuyAmount(stringValue);
        const bigIntValue = parseUnits(stringValue, decimals)
        console.debug(`setStringToBigIntStateValue:stringValue === bigIntValue = ${buyAmount === bigIntValue}\n
          stringValue = ${stringValue}\n
          decimals = ${decimals}\n
          buyAmount = ${buyAmount}\n
          bigIntValue = ${bigIntValue}`)
        setAmount(bigIntValue);
      }
    }
 
    const setBigIntStateValue = (bigIntValue:bigint | undefined, decimals:number|undefined) => {
      decimals = decimals || 0;
      let stringValue = formatUnits(bigIntValue || 0n, decimals);
      stringValue = getValidFormattedPrice(stringValue, decimals);
      stringValue = getValidFormattedPrice(stringValue, decimals);
      if (stringValue !== "") {
        setFormattedBuyAmount(stringValue);
      }
    }

    useEffect(() =>  {
      const decimals = buyTokenContract.decimals;
      setBigIntStateValue(buyAmount, decimals)
      // alert(`BuyContainer:useEffect[]:}\n
      //   buyAmount = ${buyAmount}\n
      //   decimals = ${decimals}\n
      //   formattedBuyAmount = ${formattedBuyAmount}}`)
    }, [buyAmount]);

    let IsSpCoin = isSpCoin(buyTokenContract);
    return (
      <div className={styles.inputs}>
      {/* <input id="buy-amount-id" className={styles.priceInput} placeholder="0" disabled={disabled} value={formatUnits(buyAmount, buyTokenContract.decimals)}
              onChange={(e) => { console.debug(`BuyContainer.input:buyAmount =${buyAmount}`) }} /> */}

      <input id="buy-amount-id" className={styles.priceInput} placeholder="0" disabled={false} value={formattedBuyAmount}
          // onChange={(e) => { setStringToBigIntStateValue(e.target.value, buyTokenContract.decimals, setBuyAmount); }}
          onBlur={(e) => { setFormattedBuyAmount(parseFloat(e.target.value).toString()); }}
          />

      <AssetSelect TokenContract={buyTokenContract} id={"buyTokenDialog"} disabled={disabled}></AssetSelect>
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
    // alert(`Buy Container Error:\n ${err.message}\n${JSON.stringify(exchangeContext,null,2)}`)
  }
}

export default BuyContainer;
