import { useEffect, useState } from 'react';
import { exchangeContext } from "@/lib/context";

import styles from '@/styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { TokenContract, TRADE_TYPE, TRANSACTION_TYPE } from '@/lib/structure/types';
import { setValidPriceInput, stringifyBigInt, getValidFormattedPrice, bigIntDecimalShift } from '@/lib/spCoin/utils';
import { formatDecimals, getERC20WagmiClientDecimals } from '@/lib/wagmi/erc20WagmiClientRead';
import { isSpCoin } from '@/lib/spCoin/utils';
import ManageSponsorsButton from '../Buttons/ManageSponsorsButton';
import { DISPLAY_STATE } from '@/lib/structure/types';
import { formatUnits, parseUnits } from "ethers";
import { useAccount } from 'wagmi';

import useWagmiEcr20BalanceOf from '@/components/ecr20/useWagmiEcr20BalanceOf'
import { Address } from 'viem';
import { BURN_ADDRESS } from '@/lib/network/utils';
import SellTokenSelectDialog from '../Dialogs/SellTokenSelectDialog';

type Props = {
  updateSellAmount: bigint,
  sellTokenContract: TokenContract, 
  buyTokenContract: TokenContract, 
  setSellAmountCallback: (sellAmount:bigint) => void,
  setDisplayState:(displayState:DISPLAY_STATE) => void
}


/* Sell Token Selection Module */
const SellContainer = ({updateSellAmount,
                        sellTokenContract,
                        buyTokenContract,
                        setSellAmountCallback,
                        setDisplayState} : Props) => {
  const ACTIVE_ACCOUNT = useAccount();
  const [ ACTIVE_ACCOUNT_ADDRESS, setActiveAccountAddress ] = useState<Address>(BURN_ADDRESS)
  const [formattedSellAmount, setFormattedSellAmount] = useState<string>("0");
  const [sellAmount, setSellAmount] = useState<bigint>(exchangeContext.tradeData.sellAmount);
  const [tokenContract, setTokenContract] = useState<TokenContract>(exchangeContext.sellTokenContract);
  const {balanceOf, decimals, formattedBalanceOf} = useWagmiEcr20BalanceOf( ACTIVE_ACCOUNT_ADDRESS, tokenContract.address);

  useEffect(() =>  {
    console.debug(`SellContainer.useEffect([]):tokenContract = ${tokenContract.name}`)
    if (updateSellAmount) 
      setSellAmount(updateSellAmount);
  }, []);

  useEffect(() =>  {
    console.debug(`SellContainer.useEffect([tokenContract]):tokenContract = ${tokenContract.name}`)
    exchangeContext.sellTokenContract = tokenContract;
  }, [tokenContract]);

  useEffect(() =>  {
    // alert (`setTokenContract(${sellTokenContract})`)
    setTokenContract(sellTokenContract)
  }, [sellTokenContract]);

  useEffect (() => {
    // alert(`SellContainer.useEffect():sellAmount = ${sellAmount}`)
    setSellAmountCallback(sellAmount);
    exchangeContext.tradeData.sellAmount = sellAmount;
  }, [sellAmount])

  useEffect(() => {
    // alert(`SellContainer.useEffect():balanceOf = ${balanceOf}`);
    exchangeContext.tradeData.sellBalanceOf = balanceOf;
  }, [balanceOf]);

  useEffect(() => {
    // alert(`ACTIVE_ACCOUNT.address = ${ACTIVE_ACCOUNT.address}`);
    if (ACTIVE_ACCOUNT.address)
      setActiveAccountAddress(ACTIVE_ACCOUNT.address)
  }, [ACTIVE_ACCOUNT.address]);

  let disabled = false;

  function updateTradeTransaction(newTransactionContract: TokenContract) {
    alert (`updateTradeTransaction(sellContainer:${newTransactionContract.name})`)
    setTokenContract(newTransactionContract)
    let msg = `>>>>>>>>>>>> updateTradeTransaction:TRANSACTION_TYPE = transactionType <<<<<<<<<<<<`;
    msg += `newTransactionContract = ${stringifyBigInt(newTransactionContract)}\n`
    msg += `sellTokenContract = ${stringifyBigInt(sellTokenContract)}\n`
    msg += `sellAmount=${sellAmount}\n`
    const decimalShift:number = (newTransactionContract.decimals || 0) - (sellTokenContract.decimals || 0);
    const newSellAmount = bigIntDecimalShift(sellAmount , decimalShift);
    msg += `decimalShift=${decimalShift}\n`
    msg += `newSellAmount=${newSellAmount}\n`
    msg += `tradeData = ${stringifyBigInt(exchangeContext.tradeData)}`
    setSellAmount(newSellAmount);
  }
  
  try {  
    exchangeContext.sellTokenContract.decimals = decimals ||0;;
    exchangeContext.tradeData.sellFormattedBalance = formattedBalanceOf;

    const IsSpCoin = isSpCoin(tokenContract);

    const setStringToBigIntStateValue = (stringValue:string) => {
      exchangeContext.tradeData.transactionType = TRANSACTION_TYPE.SELL_EXACT_OUT;
      const decimals = tokenContract.decimals;
      stringValue = getValidFormattedPrice(stringValue, decimals);
      if (stringValue === "") {
        alert('SellContainer: StringContainer is ""')
      }
      const bigIntValue = parseUnits(stringValue, decimals);
      setSellAmount(bigIntValue);
      setFormattedSellAmount(stringValue);
    }

    return (
      <>
        {/* <SellTokenSelectDialog buyTokenContract={buyTokenContract} callBackSetter={updateTradeTransaction} /> */}
        <div className={styles.inputs}>
          <input id="sell-amount-id" className={styles.priceInput} placeholder="0" disabled={disabled} value={formattedSellAmount}
            onChange={(e) => { setStringToBigIntStateValue(e.target.value); }}
            onBlur={(e) => { setFormattedSellAmount(parseFloat(e.target.value).toString()); }}
            />
          <AssetSelect TokenContract={tokenContract} id={"SellTokenSelectDialog"} disabled={false}></AssetSelect>
          <div className={styles["buySell"]}>
            You Pay
          </div>
          <div className={styles["assetBalance"]}>
            Balance: {formattedBalanceOf}
          </div>
          {IsSpCoin ?
            <>
              <ManageSponsorsButton activeAccount={ACTIVE_ACCOUNT} tokenContract={tokenContract} setDisplayState={setDisplayState} />
            </> : null}
        </div>
      </>
    )
  } catch (err:any) {
    console.debug (`Sell Container Error:\n ${err.message}\n${stringifyBigInt(exchangeContext)}`)
    // alert(`Sell Container Error:\n ${err.message}\n${JSON.stringify(exchangeContext,null,2)}`)
  }
}

export default SellContainer;
