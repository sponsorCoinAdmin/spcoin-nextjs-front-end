'use client';
import styles from '@/styles/Exchange.module.css';
import {
  openDialog
} from '@/components/Dialogs/Dialogs';
import useSWR from "swr";
import { useState, useEffect } from "react";
import { formatUnits, parseUnits } from "ethers";
import { useReadContracts, useAccount } from 'wagmi' 
import { erc20Abi } from 'viem' 
import { WalletElement, TokenContract, TradeData, DISPLAY_STATE } from '@/lib/structure/types';
import { fetcher, processError } from '@/lib/0X/fetcher';
import { isSpCoin, setValidPriceInput } from '@/lib/spCoin/utils';
import type { PriceResponse } from "@/app/api/types";
import {setDisplayPanels,} from '@/lib/spCoin/guiControl';
import RecipientContainer from '@/components/containers/RecipientContainer';
import SponsorRateConfig from '@/components/containers/SponsorRateConfig';
import AffiliateFee from '@/components/containers/AffiliateFee';
import PriceButton from '@/components/Buttons/PriceButton';
import FeeDisclosure from '@/components/containers/FeeDisclosure';
import IsLoadingPrice from '@/components/containers/IsLoadingPrice';
import { exchangeContext, resetContextNetwork } from "@/lib/context";
import ReadWagmiEcr20BalanceOf from '@/components/ecr20/ReadWagmiEcr20BalanceOf';
import { BURN_ADDRESS } from '@/lib/network/utils';

//////////// Price Code
export default function PriceView({activeAccount, price, setPrice}: {
    activeAccount: any;
    price: PriceResponse | undefined;
    setPrice: (price: PriceResponse | undefined) => void;
}) {

  try {
// console.debug("########################### PRICE RERENDERED #####################################")

    const tradeData:TradeData = exchangeContext.tradeData;
    const [sellAmount, setSellAmount] = useState<string>(exchangeContext.tradeData.sellAmount);
    const [buyAmount, setBuyAmount] = useState<string>(exchangeContext.tradeData.buyAmount);
    const [tradeDirection, setTradeDirection] = useState(exchangeContext.tradeData.tradeDirection);
    const [slippage, setSlippage] = useState<string>(exchangeContext.tradeData.slippage);
    const [displayState, setDisplayState] = useState<DISPLAY_STATE>(exchangeContext.tradeData.displayState);
    const [sellTokenContract, setSellTokenContract] = useState<TokenContract>(exchangeContext.sellTokenContract);
    const [buyTokenContract, setBuyTokenContract] = useState<TokenContract>(exchangeContext.buyTokenContract);
    const [recipientWallet, setRecipientElement] = useState<WalletElement>(exchangeContext.recipientWallet);
    const [agentWallet, setAgentElement] = useState(exchangeContext.agentWallet);
    const [errorMessage, setErrorMessage] = useState<Error>({ name: "", message: "" });

    const [sellBalanceOf, setSellBalanceOf] = useState<string>("0.0");

    // tradeData.sellDecimals = (useERC20WagmiClientDecimals(sellTokenContract.address) || 0)
    // tradeData.buyDecimals = (useERC20WagmiClientDecimals(buyTokenContract.address) || 0)

    tradeData.connectedWalletAddr = activeAccount.address || BURN_ADDRESS;
    const connectedWalletAddr = tradeData.connectedWalletAddr

   const { chain } = useAccount();


    useEffect(() => {
      if (chain != undefined && exchangeContext.tradeData.chainId !== chain.id) {
        resetContextNetwork(chain)
        console.debug(`exchangeContext = ${JSON.stringify(exchangeContext, null, 2)}`)
        setSellTokenContract(exchangeContext.sellTokenContract);
        setBuyTokenContract(exchangeContext.buyTokenContract);
        setRecipientElement(exchangeContext.recipientWallet);
        setAgentElement(exchangeContext.agentWallet);
        setDisplayState(exchangeContext.tradeData.displayState);
        setSlippage(exchangeContext.tradeData.slippage);
      }
    }, [chain]);

    useEffect(() => {
      tradeData.sellAmount = sellAmount;
    }, [sellAmount]);

    useEffect(() => {
      tradeData.sellAmount = buyAmount;
    }, [buyAmount]);

    useEffect(() => {
      console.debug(`PRICE:useEffect:setDisplayPanels(${displayState})`);
      setDisplayPanels(displayState);
      exchangeContext.tradeData.displayState = displayState;
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
      console.debug("PRICE:useEffect:recipientWallet changed to " + recipientWallet.name);
      exchangeContext.recipientWallet = recipientWallet;
    }, [recipientWallet]);

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

    console.debug(`Initializing Fetcher with "/api/" + ${chain?.name.toLowerCase()} + "/0X/price"`)

    const apiCall = "http://localhost:3000/api/" + tradeData.networkName + "/0X/price";

    const getPriceApiTransaction = (data:any) => {
      let priceTransaction = `${apiCall}`
      priceTransaction += `?sellToken=${sellTokenContract.address}`
      priceTransaction += `&buyToken=${buyTokenContract.address}`
      priceTransaction += `&sellAmount=${parsedSellAmount}\n`
      priceTransaction += `&connectedWalletAddr=${connectedWalletAddr}`
      priceTransaction += JSON.stringify(data, null, 2)
      return priceTransaction;
    }

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
            let dataMsg = `SUCCESS: apiCall => ${getPriceApiTransaction(data)}`
            console.log(dataMsg)

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
          <div className={styles.tradeContainer}>
             {/* <BuySellSwapButton sellTokenContract={sellTokenContract} buyTokenContract={buyTokenContract} setSellTokenContract={setSellTokenContract} setBuyTokenContract={setBuyTokenContract} />
            {/* <PriceButton exchangeContext={exchangeContext} connectedWalletAddr={connectedWalletAddr} sellTokenContract={sellTokenContract} buyTokenContract={buyTokenContract} sellBalance={tradeData.sellBalanceOf} disabled={disabled} slippage={slippage} /> */}
            <ReadWagmiEcr20BalanceOf  ACTIVE_ACCOUNT_ADDRESS={activeAccount.address} TOKEN_CONTRACT_ADDRESS={sellTokenContract.address} />
            <PriceButton exchangeContext={exchangeContext} />
              {
                // <QuoteButton sendTransaction={sendTransaction}/>
              }
            <RecipientContainer recipientWallet={recipientWallet} setDisplayState={setDisplayState}/>
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