import { useEffect, useState } from 'react';

import { exchangeContext } from "@/lib/context";

import styles from '@/styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { TokenContract } from '@/lib/structure/types';
import { setValidPriceInput, stringifyBigInt, getValidFormattedPrice } from '@/lib/spCoin/utils';
import { formatDecimals, getERC20WagmiClientBalanceOf, getERC20WagmiClientDecimals, getFormattedClientBalanceOf } from '@/lib/wagmi/erc20WagmiClientRead';
import { isSpCoin } from '@/lib/spCoin/utils';
import ManageSponsorsButton from '../Buttons/ManageSponsorsButton';
import { DISPLAY_STATE } from '@/lib/structure/types';
import { formatUnits, parseUnits } from "ethers";

type Props = {
  activeAccount:any,
  sellAmount: bigint,
  sellTokenContract: TokenContract, 
  setSellAmount: any,
  setDisplayState:(displayState:DISPLAY_STATE) => void,
  disabled: boolean
}

// const exchangeContext:ExchangeContext = exchangeContext;

    // useEffect(() => {
    //   // alert(`Price:sellAmount = ${sellAmount`)
    //   exchangeContext.tradeData.sellAmount = sellAmount;
    //   // alert(`exchangeContext.tradeData.sellAmount:useEffect(() => exchangeContext = ${JSON.stringify(exchangeContext, null, 2)}`);
    // }, [sellAmount]);

/* Sell Token Selection Module */
const SellContainer = ({activeAccount,
                        sellAmount,
                        sellTokenContract,
                        setSellAmount,
                        setDisplayState,
                        disabled} : Props) => {

  try {
    const [formattedSellAmount, setFormattedSellAmount] = useState<string>("8");

    exchangeContext.sellTokenContract.decimals = getERC20WagmiClientDecimals(sellTokenContract.address) || 0;
    exchangeContext.tradeData.sellBalanceOf = getERC20WagmiClientBalanceOf(activeAccount.address, sellTokenContract.address) || 0n;
    exchangeContext.tradeData.sellFormattedBalance = formatDecimals(exchangeContext.tradeData.sellBalanceOf, exchangeContext.sellTokenContract.decimals);
 
    // console.debug(`SellContainer.exchangeContext = \n${stringifyBigInt(exchangeContext)}`);
    const IsSpCoin = isSpCoin(sellTokenContract);

    const setStringToBigIntStateValue = (stringValue:string, decimals:number|undefined, setSellAmount: (txt:bigint) => void) => {
      decimals = decimals || 0;
      stringValue = getValidFormattedPrice(stringValue, decimals);
      if (stringValue !== "")
      {
        setFormattedSellAmount(stringValue);
        const bigIntValue = parseUnits(stringValue, decimals)
        setSellAmount(bigIntValue);
      }
    }
    
    return (
      <div className={styles.inputs}>
        <input id="sell-amount-id" className={styles.priceInput} placeholder="0" disabled={disabled} value={formattedSellAmount}
          onChange={(e) => { setStringToBigIntStateValue(e.target.value, sellTokenContract.decimals, setSellAmount); }}
          onBlur={(e) => { setFormattedSellAmount(parseFloat(e.target.value).toString()); }}
          />
        <AssetSelect TokenContract={sellTokenContract} id={"sellTokenDialog"} disabled={false}></AssetSelect>
        {/* <div className={styles["assetSelect"]}>
            <img alt={sellTokenContract.name} className="h-9 w-9 mr-2 rounded-md cursor-pointer" src={sellTokenContract.img} onClick={() => alert("sellTokenContract " + JSON.stringify(sellTokenContract,null,2))}/>
            {sellTokenContract.symbol}
            <DownOutlined id="downOutlinedSell2" onClick={() => openDialog("#sellTokenDialog")}/>
        </div> */}
        <div className={styles["buySell"]}>
          You Pay
        </div>
        <div className={styles["assetBalance"]}>
          Balance: {exchangeContext.tradeData.sellFormattedBalance}
        </div>
        {IsSpCoin ?
          <>
            <ManageSponsorsButton activeAccount={activeAccount} tokenContract={sellTokenContract} setDisplayState={setDisplayState} />
            {/* <div id="sponsoredBalance" className={styles["sponsoredBalance"]}>
              Sponsored Balance: {"{ToDo}"}
              {getERC20WagmiClientBalanceOfStr('0x858BDEe77B06F29A3113755F14Be4B23EE6D6e59', `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` || "")}
            </div> */}
          </> : null}
      </div>
    );
  } catch (err:any) {
    console.debug (`Sell Container Error:\n ${err.message}\n${stringifyBigInt(exchangeContext)}`)
    // alert(`Sell Container Error:\n ${err.message}\n${JSON.stringify(exchangeContext,null,2)}`)
  }
}

export default SellContainer;
