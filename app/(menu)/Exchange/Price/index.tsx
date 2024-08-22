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
import { exchangeContext, resetContextNetwork } from "@/lib/context";
import ManageSponsorships from '@/components/Dialogs/ManageSponsorships';
import { BURN_ADDRESS } from '@/lib/network/utils';
import Alert from 'antd/es/alert/Alert';

//////////// Price Code
export default function PriceView() {

  try {
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
    useEffect(() => {
      console.debug(`*****Setting SellTokenContract to ` + stringifyBigInt(sellTokenContract));
      exchangeContext.sellTokenContract = sellTokenContract;
    }, [sellTokenContract] );

    function swapBuySellTokens() {
      const tmpTokenContract: TokenContract = buyTokenContract;
      const tradeData=exchangeContext.tradeData;
      const decimalShift:number = (buyTokenContract.decimals || 0) - (sellTokenContract.decimals || 0);
      const newSellAmount = bigIntDecimalShift(tradeData.sellAmount , decimalShift);
      setSellAmount(newSellAmount);
      setSellTokenContract(tmpTokenContract);
      setBuyTokenContract(sellTokenContract);
    }

    function updateTradeTransaction(newTransactionContract: TokenContract, tradeType: TRADE_TYPE) {
      setTransactionType(transactionType)
      let msg = `>>>>>>>>>>>> updateTradeTransaction:TRANSACTION_TYPE = transactionType <<<<<<<<<<<<`;
      msg += `newTransactionContract.name =${newTransactionContract.name}`
      msg += `newTransactionContract.decimals =${newTransactionContract.decimals}`
      msg += `newTransactionContract = ${stringifyBigInt(newTransactionContract)}`
  
      switch (tradeType) {
        case TRADE_TYPE.NEW_BUY_CONTRACT:
          msg += `buyTokenContract.name =${buyTokenContract.name}`
          msg += `buyTokenContract.decimals =${buyTokenContract.decimals}`
          msg += `buyTokenContract = ${stringifyBigInt(sellTokenContract)}`
          setBuyTokenContract(newTransactionContract);
        break;
        case TRADE_TYPE.NEW_SELL_CONTRACT:
          msg += `sellTokenContract.name =${sellTokenContract.name}`
          msg += `sellTokenContract.decimals =${sellTokenContract.decimals}`
          msg += `sellTokenContract = ${stringifyBigInt(sellTokenContract)}`
          msg += `sellAmount=${sellAmount}`
          const decimalShift:number = (newTransactionContract.decimals || 0) - (sellTokenContract.decimals || 0);
          const newSellAmount = bigIntDecimalShift(sellAmount , decimalShift);
          setSellTokenContract(newTransactionContract);
          setSellAmount(newSellAmount);
          msg += `decimalShift=${decimalShift}`
          msg += `newSellAmount=${newSellAmount}`
        break;
      }
      msg += `tradeData = ${stringifyBigInt(exchangeContext.tradeData)}`
      console.debug(msg);
    }

    useEffect(() => {
      console.debug(`*****Setting BuyTokenContract to ` + stringifyBigInt(buyTokenContract));
      exchangeContext.buyTokenContract = buyTokenContract;
    }, [buyTokenContract] );

    useEffect(() => {
      const chain = ACTIVE_ACCOUNT.chain;
      if (chain != undefined && exchangeContext.network.chainId !== chain.id) {
        alert(`chain = ${stringifyBigInt(chain)}`)
      //   resetContextNetwork(chain)
      //   console.debug(`exchangeContext = ${stringifyBigInt(exchangeContext)}`)
      //   setSellTokenContract(exchangeContext.sellTokenContract);
      //   setBuyTokenContract(exchangeContext.buyTokenContract);
      //   setRecipientElement(exchangeContext.recipientAccount);
      //   setAgentElement(exchangeContext.agentAccount);
      //   setDisplayState(exchangeContext.displayState);
      //   setSlippage(exchangeContext.tradeData.slippage);
      }
    }, [ACTIVE_ACCOUNT.chain]);

    useEffect(() => {
      console.debug(`Price:sellAmount = ${sellAmount}`)
      exchangeContext.tradeData.sellAmount = sellAmount;
    }, [sellAmount]);

    useEffect(() => {
      // alert(`Price:buyAmount = ${buyAmount}`)
      exchangeContext.tradeData.buyAmount = buyAmount;
    }, [buyAmount]);

    useEffect(() => {
      // console.debug(`PRICE:useEffect:setDisplayPanels(${displayState})`);
      setDisplayPanels(displayState);
      exchangeContext.displayState = displayState;
    },[displayState]);

    useEffect(() => {
      // console.debug('PRICE:useEffect slippage changed to  ' + slippage);
      exchangeContext.tradeData.slippage = slippage;
    }, [slippage]);

    useEffect(() => {
      // console.debug("PRICE:useEffect:sellTokenContract.symbol changed to " + sellTokenContract.name);
      exchangeContext.sellTokenContract = sellTokenContract;
    }, [sellTokenContract]);

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

    exchangeContext.connectedAccountAddr = ACTIVE_ACCOUNT.address || BURN_ADDRESS;
    const connectedAccountAddr = exchangeContext.connectedAccountAddr

    const getPriceApiTransaction = (data:any) => {
      let priceTransaction = `${apiCall}`
      priceTransaction += `sellToken=${sellTokenContract.address}`
      priceTransaction += `&buyToken=${buyTokenContract.address}`
      priceTransaction += `&sellAmount=${sellAmount?.toString()}\n`
      priceTransaction += `&connectedAccountAddr=${connectedAccountAddr}`
      priceTransaction += JSON.stringify(data, null, 2)
      return priceTransaction;
    }

    const apiCall = "http://localhost:3000/api/" + exchangeContext.network.name.toLowerCase() + "/0X/price";

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
          // expectedSlippage: slippage,
          connectedAccountAddr
        },
      ],
      fetcher,
      {
        onSuccess: (data) => {
          if (!data.code) {
            // let dataMsg = `SUCCESS: apiCall => ${getPriceApiTransaction(data)}`
            // console.log(dataMsg)

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
          <SellTokenSelectDialog connectedAccountAddr={connectedAccountAddr} buyTokenContract={buyTokenContract} callBackSetter={updateTradeTransaction} />
          <BuyTokenSelectDialog connectedAccountAddr={connectedAccountAddr} sellTokenContract={sellTokenContract} callBackSetter={updateTradeTransaction} />
          <ManageSponsorships connectedAccountAddr={connectedAccountAddr} sellTokenContract={sellTokenContract} callBackSetter={setBuyTokenContract} />
          <RecipientDialog agentAccount={agentAccount} setRecipientElement={setRecipientElement} />
          <AgentDialog recipientAccount={recipientAccount} callBackSetter={setAgentElement} />
          <ErrorDialog errMsg={errorMessage} />
          <div className={styles.tradeContainer}>
            <TradeContainerHeader slippage={slippage} setSlippageCallback={setSlippage}/>
            <SellContainer activeAccount={ACTIVE_ACCOUNT}
                           updateSellAmount={sellAmount}
                           sellTokenContract={sellTokenContract}
                           setSellAmountCallback={setSellAmount}
                           disabled={false}
                           setDisplayState={setDisplayState}/>
            <BuyContainer  activeAccount={ACTIVE_ACCOUNT}
                           buyAmount={buyAmount}
                           buyTokenContract={buyTokenContract}
                           setBuyAmount={setBuyAmount}
                           disabled={true}
                           setDisplayState={setDisplayState} />          
            <BuySellSwapArrowButton swapBuySellTokens={swapBuySellTokens} />
            <PriceButton exchangeContext={exchangeContext} tradeData={exchangeContext.tradeData} />
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
