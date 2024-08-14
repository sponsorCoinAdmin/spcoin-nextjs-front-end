'use client';
import styles from '@/styles/Exchange.module.css';
import {
  openDialog,
  AgentDialog,
  RecipientDialog,
  SellTokenDialog,
  BuyTokenDialog,
  ErrorDialog
} from '@/components/Dialogs/Dialogs';
import useSWR from "swr";
import { useState, useEffect } from "react";
import { useReadContracts, useAccount } from 'wagmi' 
import { AccountRecord, TokenContract,  DISPLAY_STATE,  } from '@/lib/structure/types';
import { ERROR_0X_RESPONSE, fetcher, processError } from '@/lib/0X/fetcher';
import { isSpCoin, setValidPriceInput, stringifyBigInt } from '@/lib/spCoin/utils';
import type { PriceResponse } from "@/app/api/types";
import {setDisplayPanels,} from '@/lib/spCoin/guiControl';
import TradeContainerHeader from '@/components/Popover/TradeContainerHeader';
import BuySellSwapButton from '@/components/Buttons/BuySellSwapButton';
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

//////////// Price Code
export default function PriceView() {

  try {
    const [price, setPrice] = useState<PriceResponse | undefined>();
    const [sellAmount, setSellAmount2] = useState<bigint>(exchangeContext.tradeData.sellAmount);
    const [buyAmount, setBuyAmount2] = useState<bigint>(exchangeContext.tradeData.buyAmount);
    const [tradeDirection, setTradeDirection] = useState(exchangeContext.tradeData.tradeDirection);
    const [slippage, setSlippage] = useState<string>(exchangeContext.tradeData.slippage);
    const [displayState, setDisplayState] = useState<DISPLAY_STATE>(exchangeContext.displayState);
    const [sellTokenContract, setSellTokenContract2] = useState<TokenContract>(exchangeContext.sellTokenContract);
    const [buyTokenContract, setBuyTokenContract2] = useState<TokenContract>(exchangeContext.buyTokenContract);
    const [recipientAccount, setRecipientElement] = useState<AccountRecord>(exchangeContext.recipientAccount);
    const [agentAccount, setAgentElement] = useState(exchangeContext.agentAccount);
    const [errorMessage, setErrorMessage] = useState<Error>({ name: "", message: "" });
    const ACTIVE_ACCOUNT = useAccount()


    
    const setSellTokenContract = (sellTokenContract:any) => {
      console.debug(`*****Setting SellTokenContract to ` + sellTokenContract);
      setSellTokenContract2(sellTokenContract);
    }

    const setBuyTokenContract = (buyTokenContract:any) => {
      console.debug(`*****Setting BuyTokenContract to ` + buyTokenContract);
      setBuyTokenContract2(sellTokenContract);
    }

    const setSellAmount = (sellAmount:any) => {
      console.debug(`*****Setting Sell Amount to ` + sellAmount);
      setSellAmount2(sellAmount);
    }

    const setBuyAmount = (buyAmount:any) => {
      console.debug(`*****Setting Buy Amount to ` + buyAmount);
      setBuyAmount2(sellAmount);
    }



    exchangeContext.connectedAccountAddr = ACTIVE_ACCOUNT.address || BURN_ADDRESS;
    const connectedAccountAddr = exchangeContext.connectedAccountAddr

    useEffect(() => {
      const chain = ACTIVE_ACCOUNT.chain;
      if (chain != undefined && exchangeContext.network.chainId !== chain.id) {
        resetContextNetwork(chain)
        console.debug(`exchangeContext = ${stringifyBigInt(exchangeContext)}`)
        setSellTokenContract(exchangeContext.sellTokenContract);
        setBuyTokenContract(exchangeContext.buyTokenContract);
        setRecipientElement(exchangeContext.recipientAccount);
        setAgentElement(exchangeContext.agentAccount);
        setDisplayState(exchangeContext.displayState);
        setSlippage(exchangeContext.tradeData.slippage);
      }
    }, [ACTIVE_ACCOUNT.chain]);

// exchangeContext.sellTokenContract.decimals = sellDecimals

  // useEffect(() => {
  //   alert(`SellContainer:exchangeContext = ${JSON.stringify(exchangeContext, null, 2)}`)
  // }, []);

    useEffect(() => {
      // alert(`Price:sellAmount = ${sellAmount}`)
      exchangeContext.tradeData.sellAmount = sellAmount;
    }, [sellAmount]);

    useEffect(() => {
      // alert(`Price:buyAmount = ${buyAmount}`)
      exchangeContext.tradeData.buyAmount = buyAmount;
    }, [buyAmount]);

    useEffect(() => {
      console.debug(`PRICE:useEffect:setDisplayPanels(${displayState})`);
      setDisplayPanels(displayState);
      exchangeContext.displayState = displayState;
    },[displayState]);

    useEffect(() => {
      console.debug('PRICE:useEffect slippage changed to  ' + slippage);
      exchangeContext.tradeData.slippage = slippage;
    }, [slippage]);

    useEffect(() => {
      console.debug("PRICE:useEffect:sellTokenContract.symbol changed to " + sellTokenContract.name);
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
      console.debug("PRICE:useEffect:recipientAccount changed to " + recipientAccount.name);
      exchangeContext.recipientAccount = recipientAccount;
    }, [recipientAccount]);

    useEffect(() => {
      if (errorMessage.name !== "" && errorMessage.message !== "") {
        openDialog("#errorDialog");
      }
    }, [errorMessage]);

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
          sellAmount: (tradeDirection === "sell") ? sellAmount.toString() : undefined,
          buyAmount: (tradeDirection === "buy") ? buyAmount.toString() : undefined,
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
          <SellTokenDialog connectedAccountAddr={connectedAccountAddr} buyTokenContract={buyTokenContract} callBackSetter={setSellTokenContract} />
          <BuyTokenDialog connectedAccountAddr={connectedAccountAddr} sellTokenContract={sellTokenContract} callBackSetter={setBuyTokenContract} />
          <ManageSponsorships connectedAccountAddr={connectedAccountAddr} sellTokenContract={sellTokenContract} callBackSetter={setBuyTokenContract} />
          <RecipientDialog agentAccount={agentAccount} setRecipientElement={setRecipientElement} />
          <AgentDialog recipientAccount={recipientAccount} callBackSetter={setAgentElement} />
          <ErrorDialog errMsg={errorMessage} />
          <div className={styles.tradeContainer}>
            <TradeContainerHeader slippage={slippage} setSlippageCallback={setSlippage}/>
            <SellContainer activeAccount={ACTIVE_ACCOUNT}
                           sellAmount={sellAmount}
                           sellTokenContract={sellTokenContract}
                           setSellAmount={setSellAmount}
                           disabled={!(tradeDirection === "sell")}
                           setDisplayState={setDisplayState}/>
            <BuyContainer  activeAccount={ACTIVE_ACCOUNT}
                           buyAmount={buyAmount}
                           buyTokenContract={buyTokenContract}
                           setBuyAmount={setBuyAmount}
                           disabled={!(tradeDirection === "buy")}
                           setDisplayState={setDisplayState} />          
            <BuySellSwapButton sellTokenContract={sellTokenContract}
                               buyTokenContract={buyTokenContract} 
                               setSellTokenContract={setSellTokenContract} 
                               setBuyTokenContract={setBuyTokenContract} />
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