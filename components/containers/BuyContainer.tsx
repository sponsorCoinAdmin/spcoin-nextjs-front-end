import React, { useEffect } from 'react';
import styles from '@/styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { DISPLAY_STATE, TokenContract, TradeData } from '@/lib/structure/types';
import { getERC20WagmiClientBalanceOf } from '@/lib/wagmi/erc20WagmiClientRead';
import AddSponsorButton from '../Buttons/AddSponsorButton';
import { isSpCoin } from '@/lib/spCoin/utils';

type Props = {
  tradeData:TradeData,
  activeAccount: any,
  buyAmount: string,
  buyTokenContract: TokenContract, 
  setBuyAmount: any,
  setDisplayState:(displayState:DISPLAY_STATE) => void,
  disabled:boolean
}

const BuyContainer = ({tradeData, activeAccount, buyAmount, buyTokenContract, setBuyAmount, setDisplayState, disabled} : Props) => {

  try {
    let IsSpCoin = isSpCoin(buyTokenContract);
    // console.debug("BuyContainer.isSpCoin = " + IsSpCoin)
    const balanceOf = (getERC20WagmiClientBalanceOf(activeAccount.address, buyTokenContract.address || "") || "0");
    tradeData.buyBalanceOf = balanceOf;
  
    return (
      <div className={styles.inputs}>
        <input id="buy-amount-id" className={styles.priceInput} placeholder="0" disabled={disabled} value={parseFloat(buyAmount).toFixed(6)}
                onChange={(e) => { console.log(`BuyContainer.input:buyAmount =${buyAmount}`) }} />
        <AssetSelect TokenContract={buyTokenContract} id={"buyTokenDialog"} disabled={disabled}></AssetSelect>
        <div className={styles["buySell"]}>You receive</div>
        <div className={styles["assetBalance"]}>Balance: {balanceOf}</div>
        {IsSpCoin ?
          <AddSponsorButton activeAccount={activeAccount} buyTokenContract={buyTokenContract} setDisplayState={setDisplayState} />
          : null}
      </div>
    );
  } catch (err:any) {
    console.debug (`Buy Container Error:\n ${err.message}`)
  }
}

export default BuyContainer;
