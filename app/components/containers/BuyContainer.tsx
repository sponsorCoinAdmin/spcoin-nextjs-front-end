import React from 'react';
import styles from '../../styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { TokenElement } from '@/app/lib/structure/types';
import { showSponsorRecipientConfig } from '@/app/lib/spCoin/guiControl';

type Props = {
  buyAmount: string,
  buyBalance: string,
  buyTokenElement: TokenElement, 
  setBuyAmount: any,
  disabled:boolean
}

const BuyContainer = ({buyAmount, buyBalance, buyTokenElement, setBuyAmount, disabled} : Props) => {
  return (
    <div className={styles.inputs}>
    <input id="buy-amount-id" className={styles.priceInput} placeholder="0" disabled={true} value={parseFloat(buyAmount).toFixed(6)} />
    <AssetSelect tokenElement={buyTokenElement} id={"buyTokenDialog"} disabled={disabled}></AssetSelect>
    <div className={styles["buySell"]}>You receive </div>
    <div className={styles["assetBalance"]}>Balance: {buyBalance}</div>
    <div id="addSponsorshipDiv" className={styles["addSponsorshipDiv"]} onClick={() => showSponsorRecipientConfig()}>
      <div className={styles["centerContainer"]} >Add Sponsorship</div>
    </div>
  </div>
);
}

export default BuyContainer;
