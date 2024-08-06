import { useEffect, useState } from 'react';
import styles from '@/styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { TradeData, TokenContract } from '@/lib/structure/types';
import { setValidPriceInput } from '@/lib/spCoin/utils';
import { useERC20WagmiClientBalanceOfStr, useERC20WagmiClientDecimals, useFormattedClientBalanceOf } from '@/lib/wagmi/erc20WagmiClientRead';
import { isSpCoin } from '@/lib/spCoin/utils';
import ManageSponsorsButton from '../Buttons/ManageSponsorsButton';
import { DISPLAY_STATE } from '@/lib/structure copy/types';
import { formatUnits } from 'ethers';

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
const SellContainer = ({tradeData, 
                        activeAccount,
                        sellAmount,
                        sellTokenContract,
                        setSellAmount,
                        setDisplayState,
                        disabled} : Props) => {
  // console.debug("tradeData.sellBalanceOf = " + tradeData.sellBalanceOf)
  // tradeData.sellBalanceOf = formatUnits(tradeData.sellBalanceOf, tradeData.sellDecimals);
  // console.debug(`useFormattedClientBalanceOf(${activeAccount.address}, ${sellTokenContract.address}) = ${balanceOf}`)
  // const [formattedBalanceOf, setFormattedBalanceOf] = useState<string>(useFormattedClientBalanceOf(activeAccount.address, sellTokenContract.address || "0"));

  try {
    tradeData.sellFormattedBalance = useFormattedClientBalanceOf(activeAccount.address, sellTokenContract.address || "0")
    let IsSpCoin = isSpCoin(sellTokenContract);
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
          Balance: {tradeData.sellFormattedBalance}
        </div>
        {IsSpCoin ?
          <>
            <ManageSponsorsButton activeAccount={activeAccount} tokenContract={sellTokenContract} setDisplayState={setDisplayState} />
            {/* <div id="sponsoredBalance" className={styles["sponsoredBalance"]}>
              Sponsored Balance: {"{ToDo}"}
              {useERC20WagmiClientBalanceOfStr('0x858BDEe77B06F29A3113755F14Be4B23EE6D6e59', `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` || "")}
            </div> */}
          </> : null}
      </div>
    );
  } catch (err:any) {
    console.debug (`Sell Container Error:\n ${err.message}\n${JSON.stringify(tradeData,null,2)}`)
    // alert(`Sell Container Error:\n ${err.message}\n${JSON.stringify(tradeData,null,2)}`)
  }
}

export default SellContainer;
