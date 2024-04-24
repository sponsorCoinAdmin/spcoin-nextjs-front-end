import styles from '@/app/styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { TokenElement } from '@/app/lib/structure/types';
import { setValidPriceInput } from '@/app/lib/spCoin/utils';
import UseBalanceOf from '@/app/components/containers/UseBalanceOf';

type Props = {
    sellAmount: string,
    sellBalance: string,
    sellTokenElement: TokenElement, 
    setSellAmount: any,
    disabled: boolean
    // setSellAmount: (txt: string) => void|undefined,
  }
  
/* Sell Token Selection Module */
const SellContainer = ({sellAmount, sellBalance, sellTokenElement, setSellAmount, disabled} : Props) => {
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
        <UseBalanceOf accountAddress={'0x858BDEe77B06F29A3113755F14Be4B23EE6D6e59'} contractAddress={`0xc2132D05D31c914a87C6611C10748AEb04B58e8F`}/>
      </div>
    </div>
  );
}

export default SellContainer;
