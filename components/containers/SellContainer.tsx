import styles from '@/styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { TradeData, TokenContract } from '@/lib/structure/types';
import { setValidPriceInput } from '@/lib/spCoin/utils';
import { getERC20WagmiClientBalanceOf } from '@/lib/wagmi/erc20WagmiClientRead';
import { isSpCoin } from '@/lib/spCoin/utils';
import ManageSponsorsButton from '../Buttons/ManageSponsorsButton';
import { DISPLAY_STATE } from '@/lib/structure copy/types';

type Props = {
  tradeData:TradeData,
  activeAccount:any,
  sellAmount: string,
  sellTokenContract: TokenContract, 
  setSellAmount: any,
  setDisplayState:(displayState:DISPLAY_STATE) => void,
  disabled: boolean
}

/* Sell Token Selection Module */
const SellContainer = ({tradeData, activeAccount, sellAmount, sellTokenContract, setSellAmount, setDisplayState, disabled} : Props) => {
  try {
    let IsSpCoin = isSpCoin(sellTokenContract);
    // console.debug("SellContainer.isSpCoin = " + IsSpCoin)
    const balanceOf = (getERC20WagmiClientBalanceOf(activeAccount.address, sellTokenContract.address || "") || "0");
    console.debug(`SellContainer:balanceOf(${activeAccount.address}, ${sellTokenContract.address}) = ${balanceOf}`)
    tradeData.sellBalanceOf = balanceOf;

    return (
      <div className={styles.inputs}>
        <input id="sell-amount-id" className={styles.priceInput} placeholder="0" disabled={disabled} value={sellAmount}
          onChange={(e) => { setValidPriceInput(e.target.value, sellTokenContract.decimals, setSellAmount); }} />
        <AssetSelect TokenContract={sellTokenContract} id={"sellTokenDialog"} disabled={disabled}></AssetSelect>
        {/* <div className={styles["assetSelect"]}>
            <img alt={sellTokenContract.name} className="h-9 w-9 mr-2 rounded-md cursor-pointer" src={sellTokenContract.img} onClick={() => alert("sellTokenContract " + JSON.stringify(sellTokenContract,null,2))}/>
            {sellTokenContract.symbol}
            <DownOutlined id="downOutlinedSell2" onClick={() => openDialog("#sellTokenDialog")}/>
        </div> */}
        <div className={styles["buySell"]}>
          You Pay
        </div>
        <div className={styles["assetBalance"]}>
          Balance: {balanceOf}
        </div>
        {IsSpCoin ?
          <>
            <ManageSponsorsButton activeAccount={activeAccount} buyTokenContract={sellTokenContract} setDisplayState={setDisplayState} />
            {/* <div id="sponsoredBalance" className={styles["sponsoredBalance"]}>
              Sponsored Balance: {"{ToDo}"}
              {getERC20WagmiClientBalanceOf('0x858BDEe77B06F29A3113755F14Be4B23EE6D6e59', `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` || "")}
            </div> */}
          </> : null}
      </div>
    );
  } catch (err:any) {
    console.debug (`Sell Container Error:\n ${err.message}`)
  }
}

export default SellContainer;
