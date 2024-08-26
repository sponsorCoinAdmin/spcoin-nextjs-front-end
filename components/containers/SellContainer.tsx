import { useEffect, useState } from 'react';
import { exchangeContext } from "@/lib/context";

import styles from '@/styles/Exchange.module.css';
import AssetSelect from './AssetSelect';
import { TokenContract, TRANSACTION_TYPE } from '@/lib/structure/types';
import { setValidPriceInput, stringifyBigInt, getValidFormattedPrice } from '@/lib/spCoin/utils';
import { formatDecimals, getERC20WagmiClientBalanceOf, getERC20WagmiClientDecimals, getFormattedClientBalanceOf } from '@/lib/wagmi/erc20WagmiClientRead';
import { isSpCoin } from '@/lib/spCoin/utils';
import ManageSponsorsButton from '../Buttons/ManageSponsorsButton';
import { DISPLAY_STATE } from '@/lib/structure/types';
import { formatUnits, parseUnits } from "ethers";
import { useAccount } from 'wagmi';

import ReadWagmiEcr20BalanceOf from '@/components/ecr20/ReadWagmiEcr20BalanceOf'
import useWagmiEcr20BalanceOf from '@/components/ecr20/useWagmiEcr20BalanceOf'
import { Address } from 'viem';
import { BURN_ADDRESS } from '@/lib/network/utils';


type Props = {
  updateSellAmount: bigint,
  sellTokenContract: TokenContract, 
  setSellAmountCallback: (sellAmount:bigint) => void,
  setDisplayState:(displayState:DISPLAY_STATE) => void
}

/* Sell Token Selection Module */
const SellContainer = ({updateSellAmount,
                        sellTokenContract,
                        setSellAmountCallback,
                        setDisplayState} : Props) => {
  const ACTIVE_ACCOUNT = useAccount();
  const [ ACTIVE_ACCOUNT_ADDRESS, setActiveAccountAddress ] = useState<Address>(BURN_ADDRESS)
  const [formattedSellAmount, setFormattedSellAmount] = useState<string>("0");
  const [sellAmount, setSellAmount] = useState<bigint>(exchangeContext.tradeData.sellAmount);
  const [tokenContract, setTokenContract] = useState<TokenContract>(exchangeContext.sellTokenContract);
  // const [balanceOf, setBalanceOf] = useState<bigint>(exchangeContext.tradeData.sellBalanceOf);
  let disabled = false;

  useEffect(() =>  {
    console.debug(`SellContainer.useEffect([]):tokenContract = ${tokenContract.name}`)
    if (updateSellAmount) 
      setSellAmount(updateSellAmount);
  }, []);

  useEffect(() =>  {
    // const balanceOf = getERC20WagmiClientBalanceOf(ACTIVE_ACCOUNT.address, tokenContract.address) || 0n;
    console.debug(`SellContainer.useEffect([tokenContract]):tokenContract = ${tokenContract.name}`)
    exchangeContext.sellTokenContract = tokenContract;
    // setBalanceOf(balanceOf);
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

  // useEffect(() => {
  //   // alert(`SellContainer.useEffect():balanceOf = ${balanceOf}`);
  //   exchangeContext.tradeData.sellBalanceOf = balanceOf;
  // }, [balanceOf]);

  useEffect(() => {
    console.debug(`SellContainer.useEffect():ACTIVE_ACCOUNT.address ${ACTIVE_ACCOUNT.address} changed`);
    // setBalanceOf(getERC20WagmiClientBalanceOf(ACTIVE_ACCOUNT.address, tokenContract.address) || 0n);
    if (ACTIVE_ACCOUNT.address != undefined && ACTIVE_ACCOUNT_ADDRESS !== ACTIVE_ACCOUNT.address)
      setActiveAccountAddress(ACTIVE_ACCOUNT.address)
  }, [ACTIVE_ACCOUNT.address]);

  

  try {  
    exchangeContext.sellTokenContract.decimals = getERC20WagmiClientDecimals(tokenContract.address) || 0;
    exchangeContext.tradeData.sellFormattedBalance = formatDecimals(exchangeContext.tradeData.sellBalanceOf, exchangeContext.sellTokenContract.decimals);

    // console.debug(`SellContainer.exchangeContext = \n${stringifyBigInt(exchangeContext)}`);
    const IsSpCoin = isSpCoin(tokenContract);

    const setStringToBigIntStateValue = (stringValue:string) => {
      exchangeContext.tradeData.transactionType = TRANSACTION_TYPE.SELL_EXACT_OUT;
      const decimals = tokenContract.decimals;
      stringValue === getValidFormattedPrice(stringValue, decimals);
      const bigIntValue = parseUnits(stringValue, decimals);
      setSellAmount(bigIntValue);
      setFormattedSellAmount(stringValue);
    }
    const TON_ETHEREUM_CONTRACT:Address = '0x582d872A1B094FC48F5DE31D3B73F2D9bE47def1';
    const TOKEN_CONTRACT_ADDRESS:Address = TON_ETHEREUM_CONTRACT;

    const {balanceOf, decimals, formattedBalanceOf} = useWagmiEcr20BalanceOf( ACTIVE_ACCOUNT_ADDRESS, tokenContract.address);
    // alert (stringifyBigInt({balanceOf, decimals, formattedBalanceOf}))

    return (
      <div className={styles.inputs}>
        <input id="sell-amount-id" className={styles.priceInput} placeholder="0" disabled={disabled} value={formattedSellAmount}
          onChange={(e) => { setStringToBigIntStateValue(e.target.value); }}
          onBlur={(e) => { setFormattedSellAmount(parseFloat(e.target.value).toString()); }}
          />
        <AssetSelect TokenContract={tokenContract} id={"SellTokenSelectDialog"} disabled={false}></AssetSelect>
        <div className={styles["buySell"]}>
          You Pay
        </div>
        {/* <ReadWagmiEcr20BalanceOf  ACTIVE_ACCOUNT_ADDRESS={ACTIVE_ACCOUNT.address} TOKEN_CONTRACT_ADDRESS={tokenContract.address} /> */}
        <ReadWagmiEcr20BalanceOf  ACTIVE_ACCOUNT_ADDRESS={ACTIVE_ACCOUNT_ADDRESS} TOKEN_CONTRACT_ADDRESS={tokenContract.address} />
        <div className={styles["assetBalance"]}>
          Balance: {balanceOf}
        </div>
        {IsSpCoin ?
          <>
            <ManageSponsorsButton activeAccount={ACTIVE_ACCOUNT} tokenContract={tokenContract} setDisplayState={setDisplayState} />
          </> : null}
      </div>
    );
  } catch (err:any) {
    console.debug (`Sell Container Error:\n ${err.message}\n${stringifyBigInt(exchangeContext)}`)
    // alert(`Sell Container Error:\n ${err.message}\n${JSON.stringify(exchangeContext,null,2)}`)
  }
}

export default SellContainer;
