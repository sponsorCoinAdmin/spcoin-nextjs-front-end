import React, { useEffect } from 'react';

import { tradeData } from "@/lib/context";


import styles from '@/styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { DISPLAY_STATE, TokenContract, ExchangeContext } from '@/lib/structure/types';
import { getERC20WagmiClientDecimals, getERC20WagmiClientBalanceOf, formatDecimals } from '@/lib/wagmi/erc20WagmiClientRead';
import AddSponsorButton from '../Buttons/AddSponsorButton';
import { isSpCoin, stringifyBigInt } from '@/lib/spCoin/utils';

type Props = {
  activeAccount: any,
  buyAmount: string,
  buyTokenContract: TokenContract, 
  setBuyAmount: any,
  setDisplayState:(displayState:DISPLAY_STATE) => void,
  disabled:boolean
}

const BuyContainer = ({activeAccount, buyAmount, buyTokenContract, setBuyAmount, setDisplayState, disabled} : Props) => {
  try {
    console.debug(`BuyContainer:tradeData = \n${stringifyBigInt(tradeData)}`);
    tradeData.buyTokenContract.decimals = getERC20WagmiClientDecimals(buyTokenContract.address) || 0;
    tradeData.buyBalanceOf = getERC20WagmiClientBalanceOf(activeAccount.address, buyTokenContract.address) || 0n;
    tradeData.buyFormattedBalance = formatDecimals(tradeData.buyBalanceOf, tradeData.buyTokenContract.decimals);
    let IsSpCoin = isSpCoin(buyTokenContract);
    return (
      <div className={styles.inputs}>
      <input id="buy-amount-id" className={styles.priceInput} placeholder="0" disabled={disabled} value={parseFloat(buyAmount).toFixed(6)}
              onChange={(e) => { console.debug(`BuyContainer.input:buyAmount =${buyAmount}`) }} />
      <AssetSelect TokenContract={buyTokenContract} id={"buyTokenDialog"} disabled={disabled}></AssetSelect>
      <div className={styles["buySell"]}>You receive</div>
      <div className={styles["assetBalance"]}>
        Balance: {tradeData.buyFormattedBalance}
      </div>
      {IsSpCoin ?
        <AddSponsorButton activeAccount={activeAccount} buyTokenContract={buyTokenContract} setDisplayState={setDisplayState} />
        : null}
      </div>
    );
  } catch (err:any) {
    console.log(`Buy Container Error:\n ${err.message}\n${JSON.stringify(tradeData,null,2)}`)
    // alert(`Buy Container Error:\n ${err.message}\n${JSON.stringify(tradeData,null,2)}`)
  }
}

export default BuyContainer;
