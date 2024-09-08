import { useEffect, useState } from 'react';
import { exchangeContext } from "@/lib/context";

import styles from '@/styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { TokenContract, TRANSACTION_TYPE } from '@/lib/structure/types';
import { decimalAdjustTokenAmount, getValidBigIntToFormattedPrice, getValidFormattedPrice, isSpCoin , stringifyBigInt  } from '@/lib/spCoin/utils';
import { formatUnits, parseUnits } from "ethers";
import { useAccount } from 'wagmi';

import useWagmiEcr20BalanceOf from '@/components/ecr20/useWagmiEcr20BalanceOf'
import { Address } from 'viem';
import { BURN_ADDRESS } from '@/lib/network/utils';
import ManageSponsorsButton from '../Buttons/ManageSponsorsButton';

type Props = {
  updateSellAmount: bigint,
  sellTokenContract: TokenContract, 
  buyTokenContract: TokenContract, 
  setSellAmountCallback: (sellAmount:bigint) => void,
  setTokenContractCallback: (tokenContract:TokenContract) => void,
}

/* Sell Token Selection Module */
const SellContainer = ({updateSellAmount,
                        sellTokenContract,
                        buyTokenContract,
                        setSellAmountCallback,
                        setTokenContractCallback} : Props) => {
  const ACTIVE_ACCOUNT = useAccount();
  const [ACTIVE_ACCOUNT_ADDRESS, setActiveAccountAddress ] = useState<Address>(BURN_ADDRESS)
  const [sellAmount, setSellAmount] = useState<bigint>(exchangeContext.tradeData.sellAmount);
  const [formattedSellAmount, setFormattedSellAmount] = useState<string>("0");
  const [tokenContract, setTokenContract] = useState<TokenContract>(sellTokenContract);
  const {balanceOf, decimals, formattedBalanceOf} = useWagmiEcr20BalanceOf( ACTIVE_ACCOUNT_ADDRESS, tokenContract.address);

  useEffect(() =>  {
    const formattedSellAmount = getValidFormattedPrice(sellAmount, tokenContract.decimals);
    setFormattedSellAmount(formattedSellAmount)
  }, []);

  useEffect(() =>  {
    // alert (`useEffect(() => tokenContract(${stringifyBigInt(tokenContract)})`)
    console.debug(`SellContainer.useEffect([tokenContract]):tokenContract = ${tokenContract.name}`)
    exchangeContext.sellTokenContract = tokenContract;
    setTokenContractCallback(tokenContract);
  }, [tokenContract]);

  useEffect(() =>  {
    // alert (`useEffect(() => sellTokenContract(${stringifyBigInt(sellTokenContract)})`)
    console.debug(`SellContainer.useEffect([sellTokenContract]):sellTokenContract = ${sellTokenContract.name}`)
    setDecimalAdjustedContract(sellTokenContract)
  }, [sellTokenContract]);

  useEffect(() =>  {
    exchangeContext.tradeData.formattedSellAmount = formattedSellAmount;
  },[formattedSellAmount]);

  useEffect (() => {
    console.debug(`%%%% SellContainer.useEffect[sellAmount = ${sellAmount}])`);
    exchangeContext.tradeData.sellAmount = sellAmount;
    setSellAmountCallback(sellAmount);
  }, [sellAmount])

  useEffect(() => {
    // alert(`SellContainer.useEffect():balanceOf = ${balanceOf}`);
    exchangeContext.tradeData.sellBalanceOf = balanceOf;
  }, [balanceOf]);

  useEffect(() => {
    // alert(`SellContainer.useEffect():balanceOf = ${balanceOf}`);
    exchangeContext.tradeData.formattedSellAmount = formattedBalanceOf;
  }, [formattedBalanceOf]);

  useEffect(() => {
    // alert(`ACTIVE_ACCOUNT.address = ${ACTIVE_ACCOUNT.address}`);
    if (ACTIVE_ACCOUNT.address)
      setActiveAccountAddress(ACTIVE_ACCOUNT.address)
  }, [ACTIVE_ACCOUNT.address]);

  useEffect(() =>  {
    console.debug(`PRICE.useEffect[updateSellAmount = ${updateSellAmount}])`);
    if (updateSellAmount) 
      setSellAmount(updateSellAmount);
  }, [updateSellAmount]);

  const  setDecimalAdjustedContract = (newTokenContract: TokenContract) => {
    // alert(`SellContainer.setDecimalAdjustedContract(buyContainer:${newTokenContract.name})`)
    console.debug(`setDecimalAdjustedContract(sellContainer:${newTokenContract.name})`)
    console.debug(`!!!!!!!!!!!!!!!! BEFORE ADJUST sellAmount = ${sellAmount})`)
    const decimalAdjustedAmount:bigint = decimalAdjustTokenAmount(sellAmount, newTokenContract, tokenContract);
    console.debug(`setDecimalAdjustedContract(sellContainer:${decimalAdjustedAmount})`)
    setSellAmount(decimalAdjustedAmount);
    setTokenContract(newTokenContract);
  }

  const setStringToBigIntStateValue = (stringValue:string) => {
    exchangeContext.tradeData.transactionType = TRANSACTION_TYPE.SELL_EXACT_OUT;
    const decimals = tokenContract.decimals;
    stringValue = getValidFormattedPrice(stringValue, decimals);
    const bigIntValue = parseUnits(stringValue, decimals);
    console.debug(`SellContainer.setStringToBigIntStateValue setSellAmount(${bigIntValue})`);
    setSellAmount(bigIntValue);
    setFormattedSellAmount(stringValue);
  }

  let disabled = false;
  try {
    const IsSpCoin = isSpCoin(tokenContract);
    return (
      <>
        <div className={styles.inputs}>
          <input id="sell-amount-id" className={styles.priceInput} placeholder="0" disabled={disabled} value={formattedSellAmount}
            onChange={(e) => { setStringToBigIntStateValue(e.target.value); }}
            onBlur={(e) => { setFormattedSellAmount(parseFloat(e.target.value).toString()); }}
          />
          <AssetSelect tokenContract={tokenContract} 
                       altTokenContract={buyTokenContract} 
                       setDecimalAdjustedContract={setDecimalAdjustedContract}>
          </AssetSelect>
          <div className={styles["buySell"]}>
            You Pay
          </div>
          <div className={styles["assetBalance"]}>
            Balance: {formattedBalanceOf}
          </div>
          {IsSpCoin ? <ManageSponsorsButton activeAccount={ACTIVE_ACCOUNT} tokenContract={tokenContract} /> : null}
        </div>
      </>
    )
  } catch (err:any) {
    console.debug (`Sell Container Error:\n ${err.message}\n${stringifyBigInt(exchangeContext)}`)
    // alert(`Sell Container Error:\n ${err.message}\n${JSON.stringify(exchangeContext,null,2)}`)
  }
}

export default SellContainer;
