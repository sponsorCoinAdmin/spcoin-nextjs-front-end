import React, { useEffect } from 'react';
import styles from '@/styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { DISPLAY_STATE, TokenContract, TradeData } from '@/lib/structure/types';
import { useFormattedClientBalanceOf, useERC20WagmiClientBalanceOf, useERC20WagmiClientDecimals } from '@/lib/wagmi/erc20WagmiClientRead';
import AddSponsorButton from '../Buttons/AddSponsorButton';
import { isSpCoin } from '@/lib/spCoin/utils';
import { formatUnits } from "ethers";


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
    // tradeData.buyDecimals = (useERC20WagmiClientDecimals(buyTokenContract.address) || 0)

    try {
    // console.debug("BuyContainer.isSpCoin = " + IsSpCoin)
    const formattedBalanceOf:string = useFormattedClientBalanceOf(activeAccount.address, buyTokenContract.address || "")
    let IsSpCoin = isSpCoin(buyTokenContract);
      return (
        <div className={styles.inputs}>
        <input id="buy-amount-id" className={styles.priceInput} placeholder="0" disabled={disabled} value={parseFloat(buyAmount).toFixed(6)}
                onChange={(e) => { console.log(`BuyContainer.input:buyAmount =${buyAmount}`) }} />
        <AssetSelect TokenContract={buyTokenContract} id={"buyTokenDialog"} disabled={disabled}></AssetSelect>
        <div className={styles["buySell"]}>You receive</div>
        <div className={styles["assetBalance"]}>
          Balance: {formattedBalanceOf}
        </div>
        {IsSpCoin ?
          <AddSponsorButton activeAccount={activeAccount} buyTokenContract={buyTokenContract} setDisplayState={setDisplayState} />
          : null}
        </div>
      );
  } catch (err:any) {
    alert(`Buy Container Error:\n ${err.message}\n${JSON.stringify(tradeData,null,2)}`)
  }
}

export default BuyContainer;
