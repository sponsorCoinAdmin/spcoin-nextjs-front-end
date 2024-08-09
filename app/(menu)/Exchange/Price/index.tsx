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
import { formatUnits, parseUnits } from "ethers";
import { useReadContracts, useAccount } from 'wagmi' 
import { erc20Abi } from 'viem' 
import { WalletAccount, TokenContract,  DISPLAY_STATE,  } from '@/lib/structure/types';
import { ERROR_0X_RESPONSE, fetcher, processError } from '@/lib/0X/fetcher';
import { isSpCoin, setValidPriceInput, stringifyBigInt, updateBalance } from '@/lib/spCoin/utils';
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
import { tradeData, resetContextNetwork } from "@/lib/context";
import ManageSponsorships from '@/components/Dialogs/ManageSponsorships';
import { BURN_ADDRESS } from '@/lib/network/utils';

//////////// Price Code
export default function PriceView() {

  try {
    const [price, setPrice] = useState<PriceResponse | undefined>();
    const [sellAmount, setSellAmount] = useState<string>(tradeData.sellAmount);
    const [buyAmount, setBuyAmount] = useState<string>(tradeData.buyAmount);
    const [tradeDirection, setTradeDirection] = useState(tradeData.tradeDirection);
    const [slippage, setSlippage] = useState<string>(tradeData.slippage);
    const [displayState, setDisplayState] = useState<DISPLAY_STATE>(tradeData.displayState);
    const [sellTokenContract, setSellTokenContract] = useState<TokenContract>(tradeData.sellTokenContract);
    const [buyTokenContract, setBuyTokenContract] = useState<TokenContract>(tradeData.buyTokenContract);
    const [recipientAccount, setRecipientElement] = useState<WalletAccount>(tradeData.recipientAccount);
    const [agentAccount, setAgentElement] = useState(tradeData.agentAccount);
    const [errorMessage, setErrorMessage] = useState<Error>({ name: "", message: "" });
    const ACTIVE_ACCOUNT = useAccount()

    tradeData.connectedWalletAddr = ACTIVE_ACCOUNT.address || BURN_ADDRESS;
    const connectedWalletAddr = tradeData.connectedWalletAddr

    // useEffect(() => {
    //   tradeData.sellBalanceOf = formatUnits(tradeData.sellBalanceOf, tradeData.sellTokenContract.decimals);
    //   setSellBalanceOf(tradeData.sellBalanceOf);
    //   // alert(`formatUnits(${tradeData.sellBalanceOf}, ${tradeData.sellTokenContract.decimals}) = ${tradeData.sellBalanceOf}`)
    // }, [tradeData.sellBalanceOf]);

    useEffect(() => {
      const chain = ACTIVE_ACCOUNT.chain;
      if (chain != undefined && tradeData.network.chainId !== chain.id) {
        resetContextNetwork(chain)
        console.debug(`tradeData = ${stringifyBigInt(tradeData)}`)
        setSellTokenContract(tradeData.sellTokenContract);
        setBuyTokenContract(tradeData.buyTokenContract);
        setRecipientElement(tradeData.recipientAccount);
        setAgentElement(tradeData.agentAccount);
        setDisplayState(tradeData.displayState);
        setSlippage(tradeData.slippage);
      }
    }, [ACTIVE_ACCOUNT.chain]);

// tradeData.sellTokenContract.decimals = sellDecimals

  // useEffect(() => {
  //   alert(`SellContainer:tradeData = ${JSON.stringify(tradeData, null, 2)}`)
  // }, []);

    useEffect(() => {
      // alert(`Price:sellAmount = ${sellAmount`)
      tradeData.sellAmount = sellAmount;
    }, [sellAmount]);

    useEffect(() => {
      // alert(`Price:buyAmount = ${buyAmount`)
      tradeData.buyAmount = buyAmount;
    }, [buyAmount]);

    useEffect(() => {
      console.debug(`PRICE:useEffect:setDisplayPanels(${displayState})`);
      setDisplayPanels(displayState);
      tradeData.displayState = displayState;
    },[displayState]);

    useEffect(() => {
      console.debug('PRICE:useEffect slippage changed to  ' + slippage);
      tradeData.slippage = slippage;
    }, [slippage]);

    useEffect(() => {
      console.debug("PRICE:useEffect:sellTokenContract.symbol changed to " + sellTokenContract.name);
      tradeData.sellTokenContract = sellTokenContract;
    }, [sellTokenContract]);

    useEffect(() => {
      if (displayState === DISPLAY_STATE.OFF && isSpCoin(buyTokenContract))
        setDisplayState(DISPLAY_STATE.SPONSOR_BUY) 
      else if (!isSpCoin(buyTokenContract)) 
        setDisplayState(DISPLAY_STATE.OFF)
      tradeData.buyTokenContract = buyTokenContract;
    }, [buyTokenContract]);

    useEffect(() => {
      console.debug("PRICE:useEffect:recipientAccount changed to " + recipientAccount.name);
      tradeData.recipientAccount = recipientAccount;
    }, [recipientAccount]);

    useEffect(() => {
      if (errorMessage.name !== "" && errorMessage.message !== "") {
        openDialog("#errorDialog");
      }
    }, [errorMessage]);

  // This code currently only works for sell buy will default to undefined
    const parsedSellAmount = sellAmount && tradeDirection === "sell"
      ? parseUnits(sellAmount, sellTokenContract.decimals).toString()
      : undefined;

    const parsedBuyAmount = buyAmount && tradeDirection === "buy"
      ? parseUnits(buyAmount, buyTokenContract.decimals).toString()
      : undefined;

    const getPriceApiTransaction = (data:any) => {
      let priceTransaction = `${apiCall}`
      priceTransaction += `?sellToken=${sellTokenContract.address}`
      priceTransaction += `&buyToken=${buyTokenContract.address}`
      priceTransaction += `&sellAmount=${parsedSellAmount}\n`
      // priceTransaction += `&buyAmount=${parsedBuyAmount}\n`
      priceTransaction += `&connectedWalletAddr=${connectedWalletAddr}`
      priceTransaction += JSON.stringify(data, null, 2)
      return priceTransaction;
    }

    const apiCall = "http://localhost:3000/api/" + tradeData.network.name.toLowerCase() + "/0X/price";

    const { isLoading: isLoadingPrice } = useSWR(
      [
        apiCall,
        {
          sellToken: sellTokenContract.address,
          buyToken: buyTokenContract.address,
          sellAmount: parsedSellAmount,
          buyAmount: parsedBuyAmount,
          // The Slippage does not seam to pass check the api parameters with a JMeter Test then implement here
          // slippagePercentage: slippage,
          // expectedSlippage: slippage,
          connectedWalletAddr
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
            setBuyAmount(formatUnits(data.buyAmount, buyTokenContract.decimals));
          }
          else {
            let errMsg = `ERROR: apiCall => ${getPriceApiTransaction(data)}`
            // let errMsg = `ERROR: apiCall => ${apiCall}\n`
            // errMsg += `sellToken: ${sellTokenContract.address}\n`
            // errMsg += `buyToken: ${buyTokenContract.address}\n`
            // errMsg += `buyAmount: ${parsedBuyAmount}\n`
            // errMsg += `connectedWalletAddr: ${connectedWalletAddr}\n`
            // errMsg += JSON.stringify(data, null, 2)
 
            // throw {errCode: ERROR_0X_RESPONSE, errMsg: errMsg}
            // alert(errMsg);
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

    const result = useReadContracts({ 
      allowFailure: false, 
      contracts: [ 
        { 
          address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', 
          abi: erc20Abi, 
          functionName: 'balanceOf', 
          args: ['0x4557B18E779944BFE9d78A672452331C186a9f48'], 
        }, 
        { 
          address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', 
          abi: erc20Abi, 
          functionName: 'decimals', 
        }, 
        { 
          address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', 
          abi: erc20Abi, 
          functionName: 'symbol', 
        }, 
      ] 
    }) 

    const disabled = result && sellAmount // ToDo FIX This result.value
      ? parseUnits(sellAmount, sellTokenContract.decimals) > 0
      : true;

    try {
      return (
        <form autoComplete="off">
          <SellTokenDialog connectedWalletAddr={connectedWalletAddr} buyTokenContract={buyTokenContract} callBackSetter={setSellTokenContract} />
          <BuyTokenDialog connectedWalletAddr={connectedWalletAddr} sellTokenContract={sellTokenContract} callBackSetter={setBuyTokenContract} />
          <ManageSponsorships connectedWalletAddr={connectedWalletAddr} sellTokenContract={sellTokenContract} callBackSetter={setBuyTokenContract} />
          <RecipientDialog agentAccount={agentAccount} setRecipientElement={setRecipientElement} />
          <AgentDialog recipientAccount={recipientAccount} callBackSetter={setAgentElement} />
          <ErrorDialog errMsg={errorMessage} />
          <div className={styles.tradeContainer}>
            <TradeContainerHeader slippage={slippage} setSlippageCallback={setSlippage}/>
            <SellContainer activeAccount={ACTIVE_ACCOUNT}
                           sellAmount={sellAmount}
                           sellTokenContract={sellTokenContract}
                           setSellAmount={setSellAmount}
                           disabled={false}
                           setDisplayState={setDisplayState}/>
            <BuyContainer  activeAccount={ACTIVE_ACCOUNT}
                           buyAmount={buyAmount}
                           buyTokenContract={buyTokenContract}
                           setBuyAmount={setBuyAmount}
                           disabled={false}
                           setDisplayState={setDisplayState} />          
            <BuySellSwapButton sellTokenContract={sellTokenContract} buyTokenContract={buyTokenContract} setSellTokenContract={setSellTokenContract} setBuyTokenContract={setBuyTokenContract} />
            <PriceButton tradeData={tradeData} />
              {
                // <QuoteButton sendTransaction={sendTransaction}/>
              }
            <RecipientContainer recipientAccount={recipientAccount} setDisplayState={setDisplayState}/>
            <SponsorRateConfig setDisplayState={setDisplayState}/>
            <AffiliateFee price={price} sellTokenContract={sellTokenContract} buyTokenContract={buyTokenContract} />
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