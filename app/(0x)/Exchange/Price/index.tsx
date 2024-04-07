'use client';
import styles from '@/app/styles/Exchange.module.css';
import {
  openDialog,
  AgentDialog,
  RecipientDialog,
  SellTokenDialog,
  BuyTokenDialog,
  ErrorDialog
} from '@/app/components/Dialogs/Dialogs';
import useSWR from "swr";
import { useState, useEffect } from "react";
import { formatUnits, parseUnits } from "ethers";
// import { useBalance } from "wagmi";
import { useReadContracts } from 'wagmi' 
import { erc20Abi } from 'viem' 
import { watchAccount } from "@wagmi/core";
import { WalletElement, TokenElement, EXCHANGE_STATE, ExchangeContext, DISPLAY_STATE } from '@/app/lib/structure/types';
import { getNetworkName } from '@/app/lib/network/utils';
import { fetcher, processError } from '@/app/lib/0X/fetcher';
import { isSpCoin, setValidPriceInput, updateBalance } from '@/app/lib/spCoin/utils';
import type { PriceResponse } from "@/app/api/types";
import {setDisplayPanels,} from '@/app/lib/spCoin/guiControl';
import TradeContainerHeader from '@/app/components/Popover/TradeContainerHeader';
import BuySellSwapButton from '@/app/components/Buttons/BuySellSwapButton';
import SellContainer from '@/app/components/containers/SellContainer';
import BuyContainer from '@/app/components/containers/BuyContainer';
import RecipientContainer from '@/app/components/containers/RecipientContainer';
import SponsorRateConfig from '@/app/components/containers/SponsorRateConfig';
import AffiliateFee from '@/app/components/containers/AffiliateFee';
import PriceButton from '@/app/components/Buttons/PriceButton';
import FeeDisclosure from '@/app/components/containers/FeeDisclosure';
import IsLoading from '@/app/components/containers/IsLoading';
import { exchangeContext, resetContextNetwork } from "@/app/lib/context";
import QuoteButton from '@/app/components/Buttons/QuoteButton';
import { setExchangeState } from '@/app/(0x)/Exchange';
import { Address } from 'viem';
import { wagmiConfig } from '@/app/lib/wagmi/wagmiConfig';

//////////// Price Code
export default function PriceView({connectedWalletAddr, price, setPrice}: {
    connectedWalletAddr: Address | undefined;
    price: PriceResponse | undefined;
    setPrice: (price: PriceResponse | undefined) => void;
}) {
  try {
// console.debug("########################### PRICE RERENDERED #####################################")
  // From New Not Working
    const [chainId, setChainId] = useState(exchangeContext.data.chainId);
    const [network, setNetwork] = useState(exchangeContext.data.networkName);
    const [sellAmount, setSellAmount] = useState<string>(exchangeContext.data.sellAmount);
    const [buyAmount, setBuyAmount] = useState<string>(exchangeContext.data.buyAmount);
    const [sellBalance, setSellBalance] = useState<string>("0");
    const [buyBalance, setBuyBalance] = useState<string>("0");
    const [tradeDirection, setTradeDirection] = useState(exchangeContext.data.tradeDirection);
    const [state, setState] = useState<EXCHANGE_STATE>(exchangeContext.data.state);
    const [slippage, setSlippage] = useState<string>(exchangeContext.data.slippage);
    const [displayState, setDisplayState] = useState<DISPLAY_STATE>(exchangeContext.data.displayState);

    const [sellTokenElement, setSellTokenElement] = useState<TokenElement>(exchangeContext.sellTokenElement);
    const [buyTokenElement, setBuyTokenElement] = useState<TokenElement>(exchangeContext.buyTokenElement);
    const [recipientWallet, setRecipientElement] = useState<WalletElement>(exchangeContext.recipientWallet);
    const [agentWallet, setAgentElement] = useState(exchangeContext.agentWallet);

    const [errorMessage, setErrorMessage] = useState<Error>({ name: "", message: "" });

    alert("HERE 1")
    useEffect(() => {
      console.debug("PRICE:exchangeContext =\n" + JSON.stringify(exchangeContext,null,2))
      // ToDo Fix this makeshift, "Do TimeOut to Ensure Dom is loaded.""
      // For up to 15 seconds in half second increments set dom settings
      for(let i = 1; i <= 30; i++) {
        setTimeout(() => setDisplayPanels(displayState),i*500)
      }
    },[]);
    
    useEffect(() => {
      console.debug(`PRICE:useEffect:chainId = ${chainId}`)
      exchangeContext.data.chainId = chainId;
    },[chainId]);

    useEffect(() => {
      console.debug(`PRICE:setDisplayPanels(${displayState})`);
      setDisplayPanels(displayState);
      exchangeContext.data.displayState = displayState;
    },[displayState]);

    useEffect(() => {
      console.debug('Price slippage changed to  ' + slippage);
      exchangeContext.data.slippage = slippage;
    }, [slippage]);

    useEffect(() => {
      console.debug('Price state changed to  ' + state.toString);
      exchangeContext.data.state = state;
    }, [state]);

    useEffect(() => {
      // console.debug(`useEffect[connectedWalletAddr]:EXECUTING updateBuyBalance(${buyTokenElement.name});`)
      updateBuyBalance(buyTokenElement);
      updateSellBalance(sellTokenElement);
    }, [connectedWalletAddr]);

    useEffect(() => {
      console.debug("sellTokenElement.symbol changed to " + sellTokenElement.name);
      exchangeContext.sellTokenElement = sellTokenElement;
      updateSellBalance(sellTokenElement);
    }, [sellTokenElement]);

    useEffect(() => {
      // alert(`useEffect[buyTokenElement]:EXECUTING updateBuyBalance(${buyTokenElement.name});`)
      if (displayState === DISPLAY_STATE.OFF && isSpCoin(buyTokenElement))
        setDisplayState(DISPLAY_STATE.SPONSOR_BUY) 
      else if (!isSpCoin(buyTokenElement)) 
        setDisplayState(DISPLAY_STATE.OFF)
      updateBuyBalance(buyTokenElement);
      exchangeContext.buyTokenElement = buyTokenElement;
    }, [buyTokenElement]);

    useEffect(() => {
      console.debug("recipientWallet changed to " + recipientWallet.name);
      exchangeContext.recipientWallet = recipientWallet;
    }, [recipientWallet]);

    useEffect(() => {
      if (errorMessage.name !== "" && errorMessage.message !== "") {
        openDialog("#errorDialog");
      }
    }, [errorMessage]);

    const unwatch = watchAccount(wagmiConfig, { 
      onChange(data) {
        alert(`watchAccount:\ndata =  ${JSON.stringify(data,null,2)}`)
        const chains = wagmiConfig.chains 
        const chain = chains.find(chain => chain.id === data.chainId)
        processNetworkChange(chain)
      },
    }) 
    const processAccountChange = (account: any) => {
      // console.debug("APP ACCOUNT = " + JSON.stringify(account.address, null, 2))
    };

    const processNetworkChange = (chainId: any) => {
      console.debug("======================================================================");
      console.debug(`BBB processNetworkChange:chainId = ${chainId}`)
      setChainId(chainId)
      console.debug(`DDD chainId = ${chainId}`)
      let newNetworkName = getNetworkName(chainId);

      // const newNetworkName:string = network?.chain?.name.toLowerCase()
      console.debug("newNetworkName = " + newNetworkName);
      console.debug("exchangeContext.networkName = " + exchangeContext.data.networkName);

      // console.debug(`exchangeContext = ${JSON.stringify(exchangeContext, null, 2)}`)
      if (exchangeContext.data.networkName !== newNetworkName) {
        resetContextNetwork(exchangeContext, newNetworkName)
        console.debug("UPDATED exchangeContext.networkName = " + exchangeContext.data.networkName);
        console.debug(`exchangeContext = ${JSON.stringify(exchangeContext, null, 2)}`)
        setNetwork(newNetworkName);
        console.debug("------------------------ BEFORE SELL TOKEN --------------------------");
        console.debug(`BEFORE exchangeContext.sellToken = ${JSON.stringify(exchangeContext.sellTokenElement, null, 2)}`)
        console.debug(`BEFORE sellTokenElement = ${JSON.stringify(sellTokenElement, null, 2)}`)
        setSellTokenElement(exchangeContext.sellTokenElement);
        console.debug(`AFTER  sellTokenElement = ${JSON.stringify(sellTokenElement, null, 2)}`)
        console.debug("------------------------ AFTER SELL TOKEN ---------------------------");
        setBuyTokenElement(exchangeContext.buyTokenElement);
        setRecipientElement(exchangeContext.recipientWallet);
        setAgentElement(exchangeContext.agentWallet);
        setDisplayState(exchangeContext.data.displayState);
        setState(exchangeContext.data.state);
        setSlippage(exchangeContext.data.slippage);
        setExchangeState(exchangeContext.data.state);
        console.debug(`sellTokenElement = ${JSON.stringify(sellTokenElement, null, 2)}`)

        console.debug("======================================================================");
      }
    };

    const updateSellBalance = async (sellTokenElement: TokenElement) => {
      console.debug(`Price.updateSellBalance(${sellTokenElement.name});`)
      let {success, errMsg, balance} = await updateBalance(connectedWalletAddr, sellTokenElement, setSellBalance)
      // alert(`updateSellBalance:{status=${success}, errMsg=${errMsg}, sellBalance=${balance}}`);

      try {
        setSellBalance(balance);

        if (!success) {
          setErrorMessage({ name: "updateSellBalance: ", message: errMsg });
        }
      } catch (e: any) {
        setErrorMessage({ name: "updateSellBalance: ", message: JSON.stringify(e, null, 2) });
      }
      return { balance };
    };

    const updateBuyBalance = async (buyTokenElement: TokenElement) => {
      let {success, errMsg, balance} = await updateBalance(connectedWalletAddr, buyTokenElement, setBuyBalance)
      // alert(`updateBuyBalance:{status=${success}, errMsg=${errMsg}, buyBalance=${balance}}`);

      try {
        setBuyBalance(balance);

        if (!success) {  
          setErrorMessage({ name: "updateBuyBalance: ", message: errMsg });
        }
      } catch (e: any) {
        setErrorMessage({ name: "updateBuyBalance: ", message: JSON.stringify(e, null, 2) });
      }
      return { balance };
    };

  // This code currently only works for sell buy will default to undefined
    const parsedSellAmount = sellAmount && tradeDirection === "sell"
      ? parseUnits(sellAmount, sellTokenElement.decimals).toString()
      : undefined;

    const parsedBuyAmount = buyAmount && tradeDirection === "buy"
      ? parseUnits(buyAmount, buyTokenElement.decimals).toString()
      : undefined;

    const { isLoading: isLoadingPrice } = useSWR(
      [
        "/api/" + network + "/0X/price",
        {
          sellToken: sellTokenElement.address,
          buyToken: buyTokenElement.address,
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
          setPrice(data);
          console.debug(formatUnits(data.buyAmount, buyTokenElement.decimals), data);
          setBuyAmount(formatUnits(data.buyAmount, buyTokenElement.decimals));
        },
        onError: (error) => {
          processError(
            error,
            setErrorMessage,
            buyTokenElement,
            sellTokenElement,
            setBuyAmount,
            setValidPriceInput
          );
        },
      }
    );

    // const { data, isError, isLoading } = useBalance({
    //   address: connectedWalletAddr,
    //   token: sellTokenElement.address,
    // });
    
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

    const disabled = result && sellAmount
      ? parseUnits(sellAmount, sellTokenElement.decimals) > 0 // ToDo FIX This result.value
      : true;
  
    // console.debug("Price:connectedWalletAddr = " + connectedWalletAddr)
    return (
      <form autoComplete="off">
        <SellTokenDialog connectedWalletAddr={connectedWalletAddr} buyTokenElement={buyTokenElement} callBackSetter={setSellTokenElement} />
        <BuyTokenDialog connectedWalletAddr={connectedWalletAddr} sellTokenElement={sellTokenElement} callBackSetter={setBuyTokenElement} />
        <RecipientDialog agentWallet={agentWallet} setRecipientElement={setRecipientElement} />
        <AgentDialog recipientWallet={recipientWallet} callBackSetter={setAgentElement} />
        <ErrorDialog errMsg={errorMessage} />
        <div className={styles.tradeContainer}>
          <TradeContainerHeader slippage={slippage} setSlippageCallback={setSlippage}/>
          <SellContainer sellAmount={sellAmount} sellBalance={sellBalance} sellTokenElement={sellTokenElement} setSellAmount={setSellAmount} disabled={false} />
          <BuyContainer buyAmount={buyAmount} buyBalance={buyBalance} buyTokenElement={buyTokenElement} setBuyAmount={setBuyAmount} disabled={false} setDisplayState={setDisplayState} />          
          <BuySellSwapButton  sellTokenElement={sellTokenElement} buyTokenElement={buyTokenElement} setSellTokenElement={setSellTokenElement} setBuyTokenElement={setBuyTokenElement} />
          <PriceButton connectedWalletAddr={connectedWalletAddr} sellTokenElement={sellTokenElement} buyTokenElement={buyTokenElement} sellBalance={sellBalance} disabled={disabled} slippage={slippage} />
          {/* <QuoteButton sendTransaction={sendTransaction}/> */}
          <RecipientContainer recipientWallet={recipientWallet} setDisplayState={setDisplayState}/>
          <SponsorRateConfig setDisplayState={setDisplayState}/>
          <AffiliateFee price={price} sellTokenElement={sellTokenElement} buyTokenElement= {buyTokenElement} />
        </div>
        <FeeDisclosure/>
        <IsLoading isLoadingPrice={isLoadingPrice} />
      </form>
    );
  } catch (err:any) {
    console.debug (`Price Error:\n ${err.message}`)
  }
}