import React from 'react';
import styles from '@/styles/Exchange.module.css';
import { ArrowDownOutlined } from "@ant-design/icons";
import { TokenContract } from '@/lib/structure/types';
import { exchangeContext } from '@/lib/context';
import { stringifyBigInt } from '@/lib/spCoin/utils';

const binIntDecimalShift = (value:bigint, decimalShift:number) => {

}


function swapTokens(sellTokenContract:TokenContract,
  buyTokenContract:TokenContract,
  setSellTokenContract:(sellTokenContract:TokenContract) => void,
  setBuyTokenContract:(sellTokenContract:TokenContract) => void,
  setAmount:(sellAmount:bigint) => void) {
    const tradeData=exchangeContext.tradeData;
    
    let newSellAmount:bigint = tradeData.sellAmount;
    const decimalShift:number = (buyTokenContract.decimals || 0) - (sellTokenContract.decimals || 0)
    const shiftOperator = BigInt(10**(Math.abs(decimalShift)))
    if (decimalShift > 0)
      newSellAmount = tradeData.sellAmount * shiftOperator;
    else
      if (decimalShift < 0)
        newSellAmount = tradeData.sellAmount / shiftOperator;

    // const newSellAmount = Math.round(1234.9725)

    console.debug(`BEFORE sellTokenContract = ${stringifyBigInt(sellTokenContract)}\n`)
    console.debug(`BEFORE buyTokenContract = ${stringifyBigInt(buyTokenContract)}\n`)
    console.debug(`BEFORE swapTokens:tradeData = ${stringifyBigInt(tradeData)}\n`)
    const tmpTokenContract: TokenContract = buyTokenContract;
    setBuyTokenContract(sellTokenContract);
    setSellTokenContract(tmpTokenContract);
    
    console.debug(`tradeData.sellAmount=${tradeData.sellAmount}\n
      sellTokenContract.decimals=${sellTokenContract.decimals}\n
      buyTokenContract.decimals=${buyTokenContract.decimals}\n
      decimalShift=${decimalShift}\n
      newSellAmount=${newSellAmount}`)

    setAmount(newSellAmount);
    console.debug(`AFTER swapTokens:sellTokenContract = ${stringifyBigInt(sellTokenContract)}\n`)
    console.debug(`AFTER swapTokens:buyTokenContract = ${stringifyBigInt(buyTokenContract)}\n`)
    console.debug(`AFTER swapTokens:tradeData = ${stringifyBigInt(tradeData)}\n`)
  }

type Props = {
  sellTokenContract:TokenContract, 
  buyTokenContract:TokenContract, 
  setSellTokenContract: (TokenContract: TokenContract) => void,
  setBuyTokenContract:  (TokenContract: TokenContract) => void,
  setAmount:(sellAmount:bigint) => void
}

const BuySellSwapButton = ({
  sellTokenContract, 
  buyTokenContract, 
  setSellTokenContract, 
  setBuyTokenContract,
  setAmount} : Props) => {
  return (
    <div className={styles.switchButton}>
      <ArrowDownOutlined className={styles.switchArrow} onClick={() => swapTokens(
        sellTokenContract, 
        buyTokenContract, 
        setSellTokenContract, 
        setBuyTokenContract,
        setAmount
        )}/>
    </div>
  );
}

export default BuySellSwapButton;
