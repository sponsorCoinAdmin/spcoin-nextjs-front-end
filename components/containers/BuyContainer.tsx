import React, { useEffect, useState } from 'react';

import { exchangeContext } from "@/lib/context";

import styles from '@/styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { DISPLAY_STATE, TokenContract, ExchangeContext, TRANSACTION_TYPE } from '@/lib/structure/types';
import { getERC20WagmiClientDecimals, getERC20WagmiClientBalanceOf, formatDecimals } from '@/lib/wagmi/erc20WagmiClientRead';
import AddSponsorButton from '../Buttons/AddSponsorButton';
import { getValidBigIntToFormattedPrice, getValidFormattedPrice, isSpCoin, stringifyBigInt } from '@/lib/spCoin/utils';
import { formatUnits, parseUnits } from "ethers";
import { useAccount } from 'wagmi';
import useWagmiEcr20BalanceOf from '../ecr20/useWagmiEcr20BalanceOf';
import { Address } from 'viem';
import { BURN_ADDRESS } from '@/lib/network/utils';
import { setDisplayPanels } from '@/lib/spCoin/guiControl';

type Props = {
  updateBuyAmount: bigint,
  buyTokenContract: TokenContract, 
  setBuyAmountCallback: (buyAmount:bigint) => void,
  setDisplayState:(displayState:DISPLAY_STATE) => void
}

const BuyContainer = ({updateBuyAmount, buyTokenContract, setBuyAmountCallback, setDisplayState} : Props) => {
  const ACTIVE_ACCOUNT = useAccount();
  const [ ACTIVE_ACCOUNT_ADDRESS, setActiveAccountAddress ] = useState<Address>(BURN_ADDRESS)
  const [buyAmount, setBuyAmount] = useState<bigint>(exchangeContext.tradeData.buyAmount);
  const [formattedBuyAmount, setFormattedBuyAmount] = useState<string>("0");
  const [tokenContract, setTokenContract] = useState<TokenContract>(exchangeContext.buyTokenContract);
  const {balanceOf, decimals, formattedBalanceOf} = useWagmiEcr20BalanceOf( ACTIVE_ACCOUNT_ADDRESS, tokenContract.address);
  // const [displayState, setDisplayState] = useState<DISPLAY_STATE>(exchangeContext.displayState);

  useEffect(() =>  {
    // alert (`setTokenContract(${sellTokenContract})`)
    setTokenContract(buyTokenContract)
    exchangeContext.buyTokenContract = tokenContract;
  }, [buyTokenContract]);

  useEffect(() =>  {
    if (updateBuyAmount) 
      setBuyAmount(updateBuyAmount);
  }, [updateBuyAmount]);

  useEffect (() => {
    console.debug(`BuyContainer:sellAmount = ${buyAmount}`)
    setBuyAmountCallback(buyAmount);
    exchangeContext.tradeData.buyAmount = buyAmount;
  }, [buyAmount])

  useEffect(() =>  {
    console.debug(`ACTIVE_ACCOUNT.address ${ACTIVE_ACCOUNT.address} changed`);
    exchangeContext.tradeData.buyBalanceOf = getERC20WagmiClientBalanceOf(ACTIVE_ACCOUNT.address, buyTokenContract.address) || 0n;
  }, [ACTIVE_ACCOUNT.address]);

  useEffect(() => {
    // alert(`SellContainer.useEffect():balanceOf = ${balanceOf}`);
    exchangeContext.tradeData.buyBalanceOf = balanceOf;
  }, [balanceOf]);

  useEffect(() => {
    // alert(`SellContainer.useEffect():balanceOf = ${balanceOf}`);
    exchangeContext.tradeData.buyFormattedBalance = formattedBalanceOf;
  }, [formattedBalanceOf]);

  useEffect(() =>  {
    const decimals = buyTokenContract.decimals;
    const stringValue = getValidBigIntToFormattedPrice(updateBuyAmount, decimals)
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

  let disabled = true;

  const setStringToBigIntStateValue = (stringValue:string) => {
    exchangeContext.tradeData.transactionType = TRANSACTION_TYPE.BUY_EXACT_IN;
    const decimals = buyTokenContract.decimals;
    stringValue === getValidFormattedPrice(stringValue, decimals);
    const bigIntValue = parseUnits(stringValue, decimals);
    setBuyAmount(bigIntValue);
    setFormattedBuyAmount(stringValue);
  }

  try {
    // exchangeContext.sellTokenContract.decimals = decimals ||0;;
    // exchangeContext.tradeData.buyFormattedBalance = formattedBalanceOf;

    let IsSpCoin = isSpCoin(buyTokenContract);
    return (
      <div className={styles.inputs}>
       <input id="buy-amount-id" className={styles.priceInput} placeholder="0" disabled={disabled} value={formattedBuyAmount}
          // onChange={(e) => { setStringToBigIntStateValue(e.target.value); }}
          onBlur={(e) => { setFormattedBuyAmount(parseFloat(e.target.value).toString()); }}
          />
        <AssetSelect TokenContract={buyTokenContract} id={"BuyTokenSelectDialog"} disabled={false}></AssetSelect>
      <div className={styles["buySell"]}>You receive</div>
      <div className={styles["assetBalance"]}>
        Balance: {formattedBalanceOf}
      </div>
      {IsSpCoin ?
        <AddSponsorButton activeAccount={ACTIVE_ACCOUNT} buyTokenContract={buyTokenContract} setDisplayState={setDisplayState} />
        : null}
      </div>
    );
  } catch (err:any) {
    console.log(`Buy Container Error:\n ${err.message}\n${stringifyBigInt(exchangeContext)}`)
    alert(`Buy Container Error:\n ${err.message}\n${stringifyBigInt(exchangeContext)}`)
  }
}

export default BuyContainer;
