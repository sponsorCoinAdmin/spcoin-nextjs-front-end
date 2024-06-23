import React, { useEffect } from 'react';
import styles from '@/app/styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { DISPLAY_STATE, TokenContract } from '@/lib/structure/types';
import { getERC20WagmiClientBalanceOf } from '@/lib/wagmi/erc20WagmiClientRead';
// import { isSpCoin } from '@/lib/spCoin/utils';

type Props = {
  activeAccount: any,
  buyAmount: string,
  buyTokenContract: TokenContract, 
  setBuyAmount: any,
  setDisplayState:(displayState:DISPLAY_STATE) => void,
  disabled:boolean
}

const BuyContainer = ({activeAccount, buyAmount, buyTokenContract, setBuyAmount, setDisplayState, disabled} : Props) => {

  const balanceOf = (getERC20WagmiClientBalanceOf(activeAccount.address, buyTokenContract.address || "") || "0");
  
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
