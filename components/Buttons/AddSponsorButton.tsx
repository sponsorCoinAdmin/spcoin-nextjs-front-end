import React, { useEffect } from 'react';
import styles from '@/styles/Exchange.module.css';
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

  try {
  const balanceOf = (getERC20WagmiClientBalanceOf(activeAccount.address, buyTokenContract.address || "") || "0");
  
    return (
      // <div className={styles.inputs}>
      //   ZZZZZZZ
        <div id="addSponsorshipDiv" className={styles[`addSponsorshipDiv`]} onClick={() => setDisplayState(DISPLAY_STATE.RECIPIENT)}>
          {true ? <div className={styles["centerContainer"]} >Add Sponsorship</div> : null}
          <div className={styles["centerTop"]} >Add Sponsorship</div>
        </div>
      // </div>
    );
  } catch (err:any) {
    console.debug (`Buy Container Error:\n ${err.message}`)
  }
}

export default BuyContainer;
