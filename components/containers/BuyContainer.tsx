import { useEffect, useState } from 'react';
import { exchangeContext } from "@/lib/context";

import styles from '@/styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { TokenContract, DISPLAY_STATE, ExchangeContext, TRANSACTION_TYPE } from '@/lib/structure/types';
import AddSponsorButton from '../Buttons/AddSponsorButton';
import { adjustTokenPriceAmount, getValidBigIntToFormattedPrice, getValidFormattedPrice, isSpCoin, stringifyBigInt } from '@/lib/spCoin/utils';
import { formatUnits, parseUnits } from "ethers";
import { useAccount } from 'wagmi';
import useWagmiEcr20BalanceOf from '../ecr20/useWagmiEcr20BalanceOf';
import { Address } from 'viem';
import { BURN_ADDRESS } from '@/lib/network/utils';
import BuyTokenSelectDialog from '../Dialogs/BuyTokenSelectDialog';

type Props = {
  updateBuyAmount: bigint,
  sellTokenContract: TokenContract,
  buyTokenContract: TokenContract, 
  setBuyAmountCallback: (buyAmount:bigint) => void,
  setTokenContractCallback: (tokenContract:TokenContract) => void,
  setDisplayState:(displayState:DISPLAY_STATE) => void
}

const BuyContainer = ({ updateBuyAmount, 
                        sellTokenContract, 
                        buyTokenContract,
                        setBuyAmountCallback,
                        setTokenContractCallback,
                        setDisplayState} : Props) => {
  const ACTIVE_ACCOUNT = useAccount();
  const [ACTIVE_ACCOUNT_ADDRESS, setActiveAccountAddress ] = useState<Address>(BURN_ADDRESS)
  const [buyAmount, setBuyAmount] = useState<bigint>(exchangeContext.tradeData.buyAmount);
  const [formattedBuyAmount, setFormattedBuyAmount] = useState<string>(exchangeContext.tradeData.formattedBuyAmount);
  const [tokenContract, setTokenContract] = useState<TokenContract>(exchangeContext.buyTokenContract);
  const {balanceOf, decimals, formattedBalanceOf} = useWagmiEcr20BalanceOf( ACTIVE_ACCOUNT_ADDRESS, tokenContract.address);
  // const [displayState, setDisplayState] = useState<DISPLAY_STATE>(exchangeContext.displayState);

  useEffect(() =>  {
    const formattedBuyAmount = getValidFormattedPrice(buyAmount, buyTokenContract.decimals);
    setFormattedBuyAmount(formattedBuyAmount)
  }, []);

  useEffect(() =>  {
    // alert (`useEffect(() => tokenContract(${stringifyBigInt(tokenContract)})`)
    console.debug(`BuyContainer.useEffect([tokenContract]):tokenContract = ${tokenContract.name}`)
    exchangeContext.buyTokenContract = tokenContract;
    setTokenContractCallback(tokenContract);
  }, [tokenContract]);

  useEffect(() =>  {
    // alert (`setTokenContract(${buyTokenContract})`)
    setTokenContract(buyTokenContract)
    exchangeContext.buyTokenContract = tokenContract;
  }, [buyTokenContract]);

  useEffect(() =>  {
    exchangeContext.tradeData.formattedBuyAmount = formattedBuyAmount;
  },[formattedBuyAmount]);

  useEffect (() => {
    console.debug(`BuyContainer:buyAmount = ${buyAmount}`)
    // setBuyAmountCallback(buyAmount);
    exchangeContext.tradeData.buyAmount = buyAmount;
  }, [buyAmount])

  useEffect(() => {
    // alert(`BuyContainer.useEffect():balanceOf = ${balanceOf}`);
    exchangeContext.tradeData.buyBalanceOf = balanceOf;
  }, [balanceOf]);

  useEffect(() => {
    exchangeContext.tradeData.formattedBuyAmount = formattedBalanceOf;
  }, [formattedBalanceOf]);

  useEffect(() =>  {
    const decimals:number = buyTokenContract.decimals || 0;
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

  let disabled = true;

  const setStringToBigIntStateValue = (stringValue:string) => {
    exchangeContext.tradeData.transactionType = TRANSACTION_TYPE.BUY_EXACT_IN;
    const decimals = buyTokenContract.decimals;
    stringValue === getValidFormattedPrice(stringValue, decimals);
    const bigIntValue = parseUnits(stringValue, decimals);
    setBuyAmount(bigIntValue);
    setFormattedBuyAmount(stringValue);
  }

  function reloadNewTokenContract(newTokenContract: TokenContract) {
    console.debug(`reloadNewTokenContract(buyContainer:${newTokenContract.name})`)
    console.debug(`!!!!!!!!!!!!!!!! BEFORE ADJUST buyAmount = ${buyAmount})`)
    const adjustedBuyAmount:bigint = adjustTokenPriceAmount(buyAmount, newTokenContract, tokenContract);
    console.debug(`$$$$$$$$$$ reloadNewTokenContract(buyContainer:${adjustedBuyAmount})`)
    setBuyAmount(adjustedBuyAmount);
    setBuyAmountCallback(adjustedBuyAmount)
    setTokenContract(newTokenContract)
  }

  try {
    let IsSpCoin = isSpCoin(buyTokenContract);
    return (
      <>
        <BuyTokenSelectDialog sellTokenContract={sellTokenContract} callBackSetter={reloadNewTokenContract} />
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
      </>
    );
  } catch (err:any) {
    console.log(`Buy Container Error:\n ${err.message}\n${stringifyBigInt(exchangeContext)}`)
    alert(`Buy Container Error:\n ${err.message}\n${stringifyBigInt(exchangeContext)}`)
  }
}

export default BuyContainer;
