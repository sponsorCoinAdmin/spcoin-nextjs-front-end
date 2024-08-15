import React from 'react';
import styles from '@/styles/Exchange.module.css';
import { ArrowDownOutlined } from "@ant-design/icons";
import { TokenContract } from '@/lib/structure/types';
import { exchangeContext } from '@/lib/context';
import { bigIntDecimalShift, stringifyBigInt } from '@/lib/spCoin/utils';

function swapTokens(sellTokenContract:TokenContract,
  buyTokenContract:TokenContract,
  setSellTokenContract:(sellTokenContract:TokenContract) => void,
  setBuyTokenContract:(sellTokenContract:TokenContract) => void,
  setAmount:(sellAmount:bigint) => void) {
    const tradeData=exchangeContext.tradeData;
    
    const decimalShift:number = (buyTokenContract.decimals || 0) - (sellTokenContract.decimals || 0)
    let newSellAmount = bigIntDecimalShift(tradeData.sellAmount , decimalShift)

    const tmpTokenContract: TokenContract = buyTokenContract;
    setBuyTokenContract(sellTokenContract);
    setSellTokenContract(tmpTokenContract);
    
    // console.debug(`tradeData.sellAmount=${tradeData.sellAmount}\n
    //   sellTokenContract.decimals=${sellTokenContract.decimals}\n
    //   buyTokenContract.decimals=${buyTokenContract.decimals}\n
    //   decimalShift=${decimalShift}\n
    //   newSellAmount=${newSellAmount}`)

    // setAmount(newSellAmount);
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
