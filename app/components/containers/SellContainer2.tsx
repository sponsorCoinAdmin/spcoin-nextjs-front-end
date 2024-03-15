import React, { useEffect } from 'react';
import styles from '@/app/styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { TokenElement } from '@/app/lib/structure/types';
import { setValidPriceInput } from '@/app/lib/spCoin/utils';
import { openDialog } from '../Dialogs/Dialogs';
import { DownOutlined } from "@ant-design/icons";
import { showElement, hideElement } from '@/app/lib/spCoin/guiControl';

type Props = {
    sellAmount: string,
    sellBalance: string,
    sellTokenElement: TokenElement, 
    setSellAmount: any,
    disabled: boolean
    // setSellAmount: (txt: string) => void|undefined,
  }
  
/* Sell Token Selection Module */
const SellContainer2 = ({sellAmount, sellBalance, sellTokenElement, setSellAmount, disabled} : Props) => {
    // if (disabled) {
    //   console.debug(`hideElement("downOutlinedSell2")`)
    //   hideElement("downOutlinedSell2")
    // } else {
    //   console.debug(`showElement("downOutlinedSell2")`)
    //   showElement("downOutlinedSell2")
    // }
  return (
    <div className={styles.inputs}>
      <input id="sell-amount-id" className={styles.priceInput} placeholder="0" disabled={disabled} value={sellAmount}
        onChange={(e) => { setValidPriceInput(e.target.value, sellTokenElement.decimals, setSellAmount); }} />
      <AssetSelect tokenElement={sellTokenElement} id={"sellTokenDialog"} disabled={disabled}></AssetSelect>
      {/* <div className={styles["assetSelect"]}>
          <img alt={sellTokenElement.name} className="h-9 w-9 mr-2 rounded-md cursor-pointer" src={sellTokenElement.img} onClick={() => alert("sellTokenElement " + JSON.stringify(sellTokenElement,null,2))}/>
          {sellTokenElement.symbol}
          <DownOutlined id="downOutlinedSell2" onClick={() => openDialog("#sellTokenDialog")}/>
      </div> */}
      <div className={styles["buySell"]}>
        You Pay
      </div>
      <div className={styles["assetBalance"]}>
        Balance: {sellBalance}
      </div>
      <div id="sponsoredBalance" className={styles["sponsoredBalance"]}>
        Sponsored Balance: {"{ToDo}"}
      </div>
    </div>
  );
}

export default SellContainer2;
