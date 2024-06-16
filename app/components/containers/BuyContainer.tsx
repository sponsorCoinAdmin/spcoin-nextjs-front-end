import React, { useEffect } from 'react';
import styles from '@/app/styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { DISPLAY_STATE, TokenContract } from '@/app/lib/structure/types';
import { getERC20WagmiClientBalanceOf } from '@/lib/wagmi/erc20WagmiClientRead';
// import { isSpCoin } from '@/app/lib/spCoin/utils';

type Props = {
  buyAmount: string,
  balanceOf: string,
  buyTokenContract: TokenContract, 
  setBuyAmount: any,
  setDisplayState:(displayState:DISPLAY_STATE) => void,
  disabled:boolean
}

const BuyContainer = ({buyAmount, balanceOf, buyTokenContract, setBuyAmount, setDisplayState, disabled} : Props) => {
// alert(`BuyContainer isSpCoin = ${isSpCoin}`)
  useEffect(() => {
    // isSpCoin(buyTokenContract) ? setDisplayState(DISPLAY_STATE.SPONSOR) : setDisplayState(DISPLAY_STATE.OFF)
  },[buyTokenContract])

  return (
    <div className={styles.inputs}>
      <input id="buy-amount-id" className={styles.priceInput} placeholder="0" disabled={disabled} value={parseFloat(buyAmount).toFixed(6)}
              onChange={(e) => { console.log(`BuyContainer.input:buyAmount =${buyAmount}`) }} />
      <AssetSelect TokenContract={buyTokenContract} id={"buyTokenDialog"} disabled={disabled}></AssetSelect>
      <div className={styles["buySell"]}>You receive</div>
      <div className={styles["assetBalance"]}>Balance: {balanceOf}</div>
      <div id="addSponsorshipDiv" className={styles[`addSponsorshipDiv`]} onClick={() => setDisplayState(DISPLAY_STATE.RECIPIENT)}>
        <div className={styles["centerContainer"]} >Add Sponsorship</div>
      </div>
    </div>
  );
}

export default BuyContainer;
