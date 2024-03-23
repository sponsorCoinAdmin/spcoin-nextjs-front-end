import React from 'react';
import styles from '@/app/styles/Exchange.module.css';
import { ArrowDownOutlined } from "@ant-design/icons";
import { TokenElement } from '@/app/lib/structure/types';

function swapTokens(sellTokenElement:TokenElement, 
  buyTokenElement:TokenElement,
  setSellTokenElement:any,
  setBuyTokenElement:any) {
let tmpElement: TokenElement = sellTokenElement;
setSellTokenElement(buyTokenElement);
setBuyTokenElement(tmpElement);
// setSellAmount(buyAmount)
}

type Props = {
  sellTokenElement:TokenElement, 
  buyTokenElement:TokenElement, 
  setSellTokenElement: (tokenElement: TokenElement) => void,
  setBuyTokenElement:  (tokenElement: TokenElement) => void
}

const BuySellSwapButton = (
  {sellTokenElement, 
  buyTokenElement, 
  setSellTokenElement, 
  setBuyTokenElement} : Props) => {
  return (
    <div className={styles.switchButton}>
      <ArrowDownOutlined className={styles.switchArrow} onClick={() => swapTokens(
        sellTokenElement, buyTokenElement, setSellTokenElement, setBuyTokenElement)}/>
      </div>
  );
}

export default BuySellSwapButton;
