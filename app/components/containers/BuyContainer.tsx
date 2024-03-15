import React, { useEffect } from 'react';
import styles from '@/app/styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { DISPLAY_STATE, TokenElement } from '@/app/lib/structure/types';
import { setDisplayPanels } from '@/app/lib/spCoin/guiControl';
import { isSpCoin } from '@/app/lib/spCoin/utils';

type Props = {
  buyAmount: string,
  buyBalance: string,
  buyTokenElement: TokenElement, 
  setBuyAmount: any,
  disabled:boolean
}

const BuyContainer = ({buyAmount, buyBalance, buyTokenElement, setBuyAmount, disabled} : Props) => {
  
  useEffect(() => {
    isSpCoin(buyTokenElement) ? setDisplayPanels(DISPLAY_STATE.SPONSOR) : setDisplayPanels(DISPLAY_STATE.OFF)
  },[buyTokenElement])

  return (
    <div className={styles.inputs}>
      <input id="buy-amount-id" className={styles.priceInput} placeholder="0" disabled={disabled} value={parseFloat(buyAmount).toFixed(6)} />
      <AssetSelect tokenElement={buyTokenElement} id={"buyTokenDialog"} disabled={disabled}></AssetSelect>
      <div className={styles["buySell"]}>You receive </div>
      <div className={styles["assetBalance"]}>Balance: {buyBalance}</div>
      <div id="addSponsorshipDiv" className={styles[`addSponsorshipDiv`]} onClick={() => setDisplayPanels(DISPLAY_STATE.RECIPIENT)}>
        <div className={styles["centerContainer"]} >Add Sponsorship</div>
      </div>
    </div>
  );
}

export default BuyContainer;
