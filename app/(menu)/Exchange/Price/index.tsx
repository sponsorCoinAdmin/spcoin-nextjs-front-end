'use client';
import styles from '@/styles/Exchange.module.css';
import {
  openDialog,
  AgentDialog,
  RecipientDialog,
  SellTokenSelectDialog,
  BuyTokenSelectDialog,
  ErrorDialog
} from '@/components/Dialogs/Dialogs';
import useSWR from "swr";
import { useState, useEffect } from "react";
import { useReadContracts, useAccount } from 'wagmi' 
import { AccountRecord, TokenContract,  DISPLAY_STATE, TRANSACTION_TYPE, TRADE_TYPE } from '@/lib/structure/types';
import { ERROR_0X_RESPONSE, fetcher, processError } from '@/lib/0X/fetcher';
import { bigIntDecimalShift, isSpCoin, setValidPriceInput, stringifyBigInt } from '@/lib/spCoin/utils';
import type { PriceResponse } from "@/app/api/types";
import {setDisplayPanels,} from '@/lib/spCoin/guiControl';
import TradeContainerHeader from '@/components/Popover/TradeContainerHeader';
import BuySellSwapArrowButton from '@/components/Buttons/BuySellSwapArrowButton';
import SellContainer from '@/components/containers/SellContainer';
import BuyContainer from '@/components/containers/BuyContainer';
import RecipientContainer from '@/components/containers/RecipientContainer';
import SponsorRateConfig from '@/components/containers/SponsorRateConfig';
import AffiliateFee from '@/components/containers/AffiliateFee';
import PriceButton from '@/components/Buttons/PriceButton';
import FeeDisclosure from '@/components/containers/FeeDisclosure';
import IsLoadingPrice from '@/components/containers/IsLoadingPrice';
import { exchangeContext, resetNetworkContext } from "@/lib/context";
import ManageSponsorships from '@/components/Dialogs/ManageSponsorships';

//////////// Price Code
export default function PriceView() {

  const ACTIVE_ACCOUNT = useAccount()
  const [price, setPrice] = useState<PriceResponse | undefined>();
  const [sellAmount, setSellAmount] = useState<bigint>(exchangeContext.tradeData.sellAmount);
  const [buyAmount, setBuyAmount] = useState<bigint>(exchangeContext.tradeData.buyAmount);
  const [slippage, setSlippage] = useState<string>(exchangeContext.tradeData.slippage);
  const [displayState, setDisplayState] = useState<DISPLAY_STATE>(exchangeContext.displayState);
  const [recipientAccount, setRecipientElement] = useState<AccountRecord>(exchangeContext.recipientAccount);
  const [agentAccount, setAgentElement] = useState(exchangeContext.agentAccount);
  const [errorMessage, setErrorMessage] = useState<Error>({ name: "", message: "" });
  const [sellTokenContract, setSellTokenContract] = useState<TokenContract>(exchangeContext.sellTokenContract);
  const [buyTokenContract, setBuyTokenContract] = useState<TokenContract>(exchangeContext.buyTokenContract);
  const [transactionType, setTransactionType] = useState<TRANSACTION_TYPE>(exchangeContext.tradeData.transactionType);

  try {
    useEffect(() => {
      const chain = ACTIVE_ACCOUNT.chain;
      if (chain != undefined && exchangeContext.network.chainId !== chain.id) {
        // alert(`chain = ${stringifyBigInt(chain)}`)
        resetNetworkContext(chain, ACTIVE_ACCOUNT.address)
        console.debug(`chainId = ${chain.id}\nexchangeContext = ${stringifyBigInt(exchangeContext)}`)
        setRecipientElement(exchangeContext.recipientAccount);
        setAgentElement(exchangeContext.agentAccount);
        setDisplayState(exchangeContext.displayState);
        setSlippage(exchangeContext.tradeData.slippage);
      }
    }, [ACTIVE_ACCOUNT.chain]);

    useEffect(() => {
      exchangeContext.connectedAccountAddr = ACTIVE_ACCOUNT.address;
    }, [ACTIVE_ACCOUNT.address]);

    useEffect(() => {
      // console.debug(`PRICE:useEffect:setDisplayPanels(${displayState})`);
      setDisplayPanels(displayState);
      exchangeContext.displayState = displayState;
    },[displayState]);

    useEffect(() => {
      // alert(`Price:sellAmount = ${sellAmount}`)
    },[sellAmount]);

    useEffect(() => {
      // alert(`Price:buyAmount = ${buyAmount}`)
    },[buyAmount]);

    useEffect(() => {
      // alert (`Price:tokenContract(${stringifyBigInt(sellTokenContract)})`)

    },[sellTokenContract]);

    useEffect(() => {
      // console.debug('PRICE:useEffect slippage changed to  ' + slippage);
      exchangeContext.tradeData.slippage = slippage;
    }, [slippage]);

    useEffect(() => {
      if (displayState === DISPLAY_STATE.OFF && isSpCoin(buyTokenContract))
        setDisplayState(DISPLAY_STATE.SPONSOR_BUY) 
      else if (!isSpCoin(buyTokenContract)) 
        setDisplayState(DISPLAY_STATE.OFF)
      exchangeContext.buyTokenContract = buyTokenContract;
    }, [buyTokenContract]);

    useEffect(() => {
      // console.debug("PRICE:useEffect:recipientAccount changed to " + recipientAccount.name);
      exchangeContext.recipientAccount = recipientAccount;
    }, [recipientAccount]);

    useEffect(() => {
      if (errorMessage.name !== "" && errorMessage.message !== "") {
        openDialog("#errorDialog");
      }
    }, [errorMessage]);

    function swapBuySellTokens() {
      const tmpTokenContract: TokenContract = exchangeContext.buyTokenContract;
      setBuyTokenContract(exchangeContext.sellTokenContract);
      setSellTokenContract(tmpTokenContract);
    }

    function updateSellTransaction(newTransactionContract: TokenContract) {
      alert (`updateTradeTransaction(sellContainer:${newTransactionContract.name})`)
      setSellTokenContract(newTransactionContract);
      let msg = `>>>>>>>>>>>> updateTradeTransaction:TRANSACTION_TYPE = transactionType <<<<<<<<<<<<`;
      msg += `newTransactionContract = ${stringifyBigInt(newTransactionContract)}\n`
      msg += `sellTokenContract = ${stringifyBigInt(sellTokenContract)}\n`
      msg += `sellAmount=${sellAmount}\n`
      const decimalShift:number = (newTransactionContract.decimals || 0) - (sellTokenContract.decimals || 0);
      const newSellAmount = bigIntDecimalShift(sellAmount , decimalShift);
      msg += `decimalShift=${decimalShift}\n`
      msg += `newSellAmount=${newSellAmount}\n`
      msg += `tradeData = ${stringifyBigInt(exchangeContext.tradeData)}`
      console.debug(msg);
      setSellAmount(newSellAmount);
    }

    function updateBuyTransaction(newTransactionContract: TokenContract) {
      setBuyTokenContract(newTransactionContract);
      let msg = `>>>>>>>>>>>> updateTradeTransaction:TRANSACTION_TYPE = transactionType <<<<<<<<<<<<`;
      msg += `newTransactionContract = ${stringifyBigInt(newTransactionContract)}\n`
      msg += `buyTokenContract = ${stringifyBigInt(buyTokenContract)}\n`
      msg += `tradeData = ${stringifyBigInt(exchangeContext.tradeData)}`
      console.debug(msg);
    }

    const getPriceApiTransaction = (data:any) => {
      let priceTransaction =  process.env.NEXT_PUBLIC_API_SERVER
      priceTransaction += `${apiCall}`
      priceTransaction += `sellToken=${sellTokenContract.address}`
      priceTransaction += `&buyToken=${buyTokenContract.address}`
      priceTransaction += `&sellAmount=${sellAmount?.toString()}\n`
      priceTransaction += JSON.stringify(data, null, 2)
      return priceTransaction;
    }

    const apiCall =exchangeContext.network.name.toLowerCase() + "/0X/price";

    const { isLoading: isLoadingPrice } = useSWR(
      [
        apiCall,
        {
          sellToken: sellTokenContract.address,
          buyToken: buyTokenContract.address,
          sellAmount: (transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT) ? sellAmount.toString() : undefined,
          buyAmount: (transactionType ===  TRANSACTION_TYPE.BUY_EXACT_IN) ? buyAmount.toString() : undefined,
          // The Slippage does not seam to pass check the api parameters with a JMeter Test then implement here
          // slippagePercentage: slippage,
          // expectedSlippage: slippage
        },
      ],
      fetcher,
      {
        onSuccess: (data) => {
          if (!data.code) {
            // let dataMsg = `SUCCESS: apiCall => ${getPriceApiTransaction(data)}`
            // console.log(dataMsg)
            // console.debug(`AFTER fetcher data =  + ${JSON.stringify(data,null,2)} + ]`)
            console.debug(`AFTER fetcher data =  + ${JSON.stringify(data,null,2)} + ]`)
            setPrice(data);
            // console.debug(formatUnits(data.buyAmount, buyTokenContract.decimals), data);
            setBuyAmount(data.buyAmount);
          }
          else {
            let errMsg = `ERROR: apiCall => ${getPriceApiTransaction(data)}`
            console.log(errMsg);
          }
        },
        onError: (error) => {
          processError(
            error,
            setErrorMessage,
            buyTokenContract,
            sellTokenContract,
            setBuyAmount,
            setValidPriceInput
          );
        }
      }
    );

    try {
      return (
        <form autoComplete="off">
          {/* <SellTokenSelectDialog buyTokenContract={buyTokenContract} callBackSetter={updateSellTransaction} /> */}
          <BuyTokenSelectDialog sellTokenContract={sellTokenContract} callBackSetter={updateBuyTransaction} />
          <ManageSponsorships sellTokenContract={sellTokenContract} callBackSetter={setBuyTokenContract} />
          <RecipientDialog agentAccount={agentAccount} setRecipientElement={setRecipientElement} />
          <AgentDialog recipientAccount={recipientAccount} callBackSetter={setAgentElement} />
          <ErrorDialog errMsg={errorMessage} />
          <div className={styles.tradeContainer}>
            <TradeContainerHeader slippage={slippage} setSlippageCallback={setSlippage}/>
            <SellContainer updateSellAmount={sellAmount}
                           sellTokenContract={sellTokenContract}
                           buyTokenContract={buyTokenContract}
                           setSellAmountCallback={setSellAmount}/>
            <BuyContainer  updateBuyAmount={buyAmount}
                           buyTokenContract={buyTokenContract}
                           setBuyAmountCallback={setBuyAmount}
                           setDisplayState={setDisplayState}/>
            <BuySellSwapArrowButton swapBuySellTokens={swapBuySellTokens}/>
            <PriceButton connectedAccountAddr={exchangeContext.connectedAccountAddr} />
            {
              // <QuoteButton sendTransaction={sendTransaction}/>
            }
            <RecipientContainer recipientAccount={recipientAccount} setDisplayState={setDisplayState}/>
            <SponsorRateConfig setDisplayState={setDisplayState}/>
            <AffiliateFee price={price} buyTokenContract={buyTokenContract} />
          </div>
          <FeeDisclosure/>
          <IsLoadingPrice isLoadingPrice={isLoadingPrice} />
        </form>
      );
    } catch (err:any) {
      console.debug (`Price Components Error:\n ${err.message}`)
    }
  } catch (err:any) {
    console.debug (`Price Methods Error:\n ${err.message}`)
  }
}
