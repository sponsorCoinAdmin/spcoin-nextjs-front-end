import React from 'react';
import styles from '@/styles/Exchange.module.css';
import { ArrowDownOutlined } from "@ant-design/icons";
import { TokenContract } from '@/lib/structure/types';
import { exchangeContext } from '@/lib/context';
import { stringifyBigInt } from '@/lib/spCoin/utils';

function swapTokens(sellTokenContract:TokenContract, 
  buyTokenContract:TokenContract,
  setSellTokenContract:any,
  setBuyTokenContract:any) {
  console.debug(`BEFORE swapTokens:exchangeContext.tradeData = ${stringifyBigInt(exchangeContext.sellTokenContract)}\n`)
  console.debug(`BEFORE swapTokens:exchangeContext.tradeData = ${stringifyBigInt(exchangeContext.buyTokenContract)}\n`)
  console.debug(`BEFORE swapTokens:exchangeContext.tradeData = ${stringifyBigInt(exchangeContext.tradeData)}\n`)
  exchangeContext.sellTokenContract = buyTokenContract;
  exchangeContext.buyTokenContract = sellTokenContract;
  let tmpElement: TokenContract = buyTokenContract;
  setBuyTokenContract(sellTokenContract);
  setSellTokenContract(tmpElement);
  console.debug(`AFTER swapTokens:exchangeContext.tradeData = ${stringifyBigInt(exchangeContext.sellTokenContract)}\n`)
  console.debug(`AFTER swapTokens:exchangeContext.tradeData = ${stringifyBigInt(exchangeContext.buyTokenContract)}\n`)
  console.debug(`AFTER swapTokens:exchangeContext.tradeData = ${stringifyBigInt(exchangeContext.tradeData)}\n`)
}

type Props = {
  sellTokenContract:TokenContract, 
  buyTokenContract:TokenContract, 
  setSellTokenContract: (TokenContract: TokenContract) => void,
  setBuyTokenContract:  (TokenContract: TokenContract) => void
}

const BuySellSwapButton = ({
  sellTokenContract, 
  buyTokenContract, 
  setSellTokenContract, 
  setBuyTokenContract} : Props) => {
  return (
    <div className={styles.switchButton}>
      <ArrowDownOutlined className={styles.switchArrow} onClick={() => swapTokens(
        sellTokenContract, buyTokenContract, setSellTokenContract, setBuyTokenContract)}/>
    </div>
  );
}

export default BuySellSwapButton;
