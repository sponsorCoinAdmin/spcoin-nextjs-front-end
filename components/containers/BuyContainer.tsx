import React, { useEffect, useState } from 'react';
import { exchangeContext } from "@/lib/context";

import styles from '@/styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { TokenContract, TRANSACTION_TYPE } from '@/lib/structure/types';
import { decimalAdjustTokenAmount, getValidFormattedPrice, getValidBigIntToFormattedPrice, isSpCoin, stringifyBigInt } from '@/lib/spCoin/utils';
import { formatUnits, parseUnits } from "ethers";
import { useAccount } from 'wagmi';
import useERC20WagmiBalances from '../ERC20/useERC20WagmiBalances';
import { Address } from 'viem';
import AddSponsorButton from '../Buttons/AddSponsorButton';

type Props = {
  updateBuyAmount: bigint,
  sellTokenContract: TokenContract|undefined,
  buyTokenContract: any, 
  setBuyAmountCallback: (buyAmount:bigint) => void,
  setTokenContractCallback: (tokenContract:TokenContract|undefined) => void,
}

const BuyContainer = ({ updateBuyAmount, 
                        sellTokenContract, 
                        buyTokenContract,
                        setBuyAmountCallback,
                        setTokenContractCallback} : Props) => {
  const ACTIVE_ACCOUNT = useAccount();
  const [ACTIVE_ACCOUNT_ADDRESS, setActiveAccountAddress ] = useState<Address|undefined>(ACTIVE_ACCOUNT?.address)
  const [buyAmount, setBuyAmount] = useState<bigint>(exchangeContext.tradeData.buyAmount);
  const [formattedBuyAmount, setFormattedBuyAmount] = useState<string>(exchangeContext.tradeData.formattedBuyAmount);
  const [tokenContract, setTokenContract] = useState<TokenContract|undefined>(exchangeContext?.buyTokenContract);
  const {balanceOf, formattedBalanceOf} = useERC20WagmiBalances( ACTIVE_ACCOUNT_ADDRESS, tokenContract?.address);

  useEffect(() =>  {
    const formattedBuyAmount = getValidFormattedPrice(buyAmount, buyTokenContract?.decimals);
    setFormattedBuyAmount(formattedBuyAmount)
  }, []);

  useEffect(() =>  {
    // alert (`BuyContainer.useEffect(() => tokenContract(${stringifyBigInt(tokenContract)})`)
    console.debug(`BuyContainer.useEffect([tokenContract]):tokenContract = ${tokenContract?.name}`)
    exchangeContext.buyTokenContract = tokenContract;
    setTokenContractCallback(tokenContract);
  }, [tokenContract]);

  useEffect(() =>  {
    // alert (`setTokenContract(${buyTokenContract})`)
    setTokenContract(buyTokenContract)
    setDecimalAdjustedContract(buyTokenContract)
  }, [buyTokenContract]);

  useEffect(() =>  {
    exchangeContext.tradeData.formattedBuyAmount = formattedBuyAmount;
  },[formattedBuyAmount]);

  useEffect (() => {
    console.debug(`BuyContainer:buyAmount = ${buyAmount}`)
    // setBuyAmountCallback(buyAmount);
    exchangeContext.tradeData.buyAmount = buyAmount;
    setBuyAmountCallback(buyAmount)
  }, [buyAmount])

  useEffect(() => {
    // alert(`BuyContainer.useEffect():balanceOf = ${balanceOf}`);
    exchangeContext.tradeData.buyBalanceOf = balanceOf;
  }, [balanceOf]);

  useEffect(() => {
    exchangeContext.tradeData.formattedBuyAmount = formattedBalanceOf;
  }, [formattedBalanceOf]);

  useEffect(() =>  {
    const decimals:number = buyTokenContract?.decimals || 0;
    const stringValue:string = getValidBigIntToFormattedPrice(updateBuyAmount, decimals)
    if (stringValue !== "") {
      setFormattedBuyAmount(stringValue);
    }
    if (updateBuyAmount) 
      setBuyAmount(updateBuyAmount);
  }, [updateBuyAmount]);

  useEffect(() => {
    // alert(`ACTIVE_ACCOUNT.address = ${ACTIVE_ACCOUNT.address}`);
    if (ACTIVE_ACCOUNT.address)
      setActiveAccountAddress(ACTIVE_ACCOUNT.address)
  }, [ACTIVE_ACCOUNT.address]);

  const  setDecimalAdjustedContract = (newTokenContract: TokenContract|undefined) => {
    // alert(`BuyContainer.setDecimalAdjustedContract(buyContainer:${newTokenContract.name})`)
    console.debug(`setDecimalAdjustedContract(buyContainer:${newTokenContract?.name})`)
    console.debug(`BEFORE ADJUST buyAmount = ${buyAmount})`)
    const decimalAdjustedAmount:bigint = decimalAdjustTokenAmount(buyAmount, newTokenContract, tokenContract);
    console.debug(`setDecimalAdjustedContract(buyContainer:${decimalAdjustedAmount})`)
    setBuyAmount(decimalAdjustedAmount);
    setTokenContract(newTokenContract)
  }

  const setStringToBigIntStateValue = (stringValue:string) => {
    exchangeContext.tradeData.transactionType = TRANSACTION_TYPE.BUY_EXACT_IN;
    const decimals = buyTokenContract?.decimals;
    stringValue === getValidFormattedPrice(stringValue, decimals);
    const bigIntValue = parseUnits(stringValue, decimals);
    setBuyAmount(bigIntValue);
    setFormattedBuyAmount(stringValue);
  }

  let disabled = true;
  try {
    let IsSpCoin = isSpCoin(buyTokenContract);
    return (
      <div className={styles["inputs"] + " " + styles["buyContainer"]}>
        <input id="BuyAmount_ID" className={styles["priceInput"]} placeholder="0" disabled={disabled} value={formattedBuyAmount}
        // <input id="BuyAmount_ID" placeholder="0" disabled={disabled} value={formattedBuyAmount}
          onChange={(e) => { setStringToBigIntStateValue(e.target.value); }}
              onBlur={(e) => { setFormattedBuyAmount(parseFloat(e.target.value).toString()); }}
        />
        <AssetSelect  tokenContract={tokenContract} 
                      altTokenContract={sellTokenContract} 
                      setDecimalAdjustedContract={setDecimalAdjustedContract} />
        <div className={styles["buySell"]}>You receive</div>
        <div className={styles["assetBalance"]}>
          Balance: {formattedBalanceOf}
        </div>
        {IsSpCoin ?
          <AddSponsorButton activeAccount={ACTIVE_ACCOUNT} buyTokenContract={buyTokenContract}/>
          : null}
      </div>
    );
  } catch (err:any) {
    console.log(`Buy Container Error:\n ${err.message}\n${stringifyBigInt(exchangeContext)}`)
    alert(`Buy Container Error:\n ${err.message}\n${stringifyBigInt(exchangeContext)}`)
  }
}

export default BuyContainer;
