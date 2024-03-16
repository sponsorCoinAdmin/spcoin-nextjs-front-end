import React, { useEffect } from 'react';
import styles from '@/app/styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { DISPLAY_STATE, TokenElement } from '@/app/lib/structure/types';
import { isSpCoin } from '@/app/lib/spCoin/utils';

type Props = {
  buyAmount: string,
  buyBalance: string,
  buyTokenElement: TokenElement, 
  setBuyAmount: any,
  setDisplayState:(displayState:DISPLAY_STATE) => void,
  disabled:boolean
}

const BuyContainer = ({buyAmount, buyBalance, buyTokenElement, setBuyAmount, setDisplayState, disabled} : Props) => {
// alert(`BuyContainer isSpCoin = ${isSpCoin}`)
  useEffect(() => {
    // isSpCoin(buyTokenElement) ? setDisplayState(DISPLAY_STATE.SPONSOR) : setDisplayState(DISPLAY_STATE.OFF)
  },[buyTokenElement])

  return (
    <div className={styles.inputs}>
      <input id="buy-amount-id" className={styles.priceInput} placeholder="0" disabled={disabled} value={parseFloat(buyAmount).toFixed(6)} />
      <AssetSelect tokenElement={buyTokenElement} id={"buyTokenDialog"} disabled={disabled}></AssetSelect>
      <div className={styles["buySell"]}>You receive </div>
      <div className={styles["assetBalance"]}>Balance: {buyBalance}</div>
      <div id="addSponsorshipDiv" className={styles[`addSponsorshipDiv`]} onClick={() => setDisplayState(DISPLAY_STATE.RECIPIENT)}>
        <div className={styles["centerContainer"]} >Add Sponsorship</div>
      </div>
    </div>
  );
}

export default BuyContainer;
