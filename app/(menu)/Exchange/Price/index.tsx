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
import { useReadContracts, useSwitchChain  } from 'wagmi' 
import { erc20Abi } from 'viem' 
import { watchAccount } from "@wagmi/core";
import { WalletElement, TokenContract, EXCHANGE_STATE, ExchangeContext, DISPLAY_STATE } from '@/lib/structure/types';
import { getNetworkName } from '@/lib/network/utils';
import { fetcher, processError } from '@/lib/0X/fetcher';
import { isSpCoin, setValidPriceInput, updateBalance } from '@/lib/spCoin/utils';
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
import QuoteButton from '@/components/Buttons/QuoteButton';
import { setExchangeState } from '@/app/(menu)/Exchange';
import { wagmiConfig } from '@/lib/wagmi/wagmiConfig';
import { getERC20WagmiClientBalanceOf } from '@/lib/wagmi/erc20WagmiClientRead';

//////////// Price Code
export default function PriceView({activeAccount, price, setPrice}: {
    activeAccount: any;
    price: PriceResponse | undefined;
    setPrice: (price: PriceResponse | undefined) => void;
}) {
  const connectedWalletAddr = activeAccount.address
  // alert(`EXCHANGE/PRICE HERE 1exchangeContext = \n ${exchangeContext}`)

  try {
// console.debug("########################### PRICE RERENDERED #####################################")
    const [chainId, setChainId] = useState(exchangeContext.data.chainId);
    const [network, setNetwork] = useState(exchangeContext.data.networkName);
    const [sellAmount, setSellAmount] = useState<string>(exchangeContext.data.sellAmount);
    const [buyAmount, setBuyAmount] = useState<string>(exchangeContext.data.buyAmount);
    const [tradeDirection, setTradeDirection] = useState(exchangeContext.data.tradeDirection);
    const [state, setState] = useState<EXCHANGE_STATE>(exchangeContext.data.state);
    const [slippage, setSlippage] = useState<string>(exchangeContext.data.slippage);
    const [displayState, setDisplayState] = useState<DISPLAY_STATE>(exchangeContext.data.displayState);

    const [sellTokenContract, setSellTokenContract] = useState<TokenContract>(exchangeContext.sellTokenContract);
    const [buyTokenContract, setBuyTokenContract] = useState<TokenContract>(exchangeContext.buyTokenContract);
    const [recipientWallet, setRecipientElement] = useState<WalletElement>(exchangeContext.recipientWallet);
    const [agentWallet, setAgentElement] = useState(exchangeContext.agentWallet);

    const [errorMessage, setErrorMessage] = useState<Error>({ name: "", message: "" });
    // alert("EXCHANGE/PRICE HERE 2")
    const { chains, switchChain } = useSwitchChain()

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
      console.debug("sellTokenContract.symbol changed to " + sellTokenContract.name);
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
        // console.debug(`account changed`);
        // console.debug(`watchAccount:\ndata =  ${JSON.stringify(data,null,2)}`)
        const chains = wagmiConfig.chains 
        const chain = chains.find(chain => chain.id === data.chainId)
        console.debug(`chain = ${JSON.stringify(chain,null,2)}`)
        processNetworkChange(data.chainId)
      },
    })
      
    const processAccountChange = (account: any) => {
      // console.debug("APP ACCOUNT = " + JSON.stringify(account.address, null, 2))
    };

    const processNetworkChange = (newChainId: any) => {
      console.debug(`======================================================================`);
      console.debug(`processNetworkChange:newChainId = ${JSON.stringify(newChainId,null,2)}`)
      switchChain(newChainId)
      setChainId(newChainId)
      let newNetworkName = getNetworkName(newChainId);

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
        console.debug(`BEFORE exchangeContext.sellToken = ${JSON.stringify(exchangeContext.sellTokenContract, null, 2)}`)
        console.debug(`BEFORE sellTokenContract = ${JSON.stringify(sellTokenContract, null, 2)}`)
        setSellTokenContract(exchangeContext.sellTokenContract);
        console.debug(`AFTER  sellTokenContract = ${JSON.stringify(sellTokenContract, null, 2)}`)
        console.debug("------------------------ AFTER SELL TOKEN ---------------------------");
        setBuyTokenContract(exchangeContext.buyTokenContract);
        setRecipientElement(exchangeContext.recipientWallet);
        setAgentElement(exchangeContext.agentWallet);
        setDisplayState(exchangeContext.data.displayState);
        setState(exchangeContext.data.state);
        setSlippage(exchangeContext.data.slippage);
        setExchangeState(exchangeContext.data.state);
        console.debug(`sellTokenContract = ${JSON.stringify(sellTokenContract, null, 2)}`)
        console.debug("======================================================================");
      }
    };

      // This code currently only works for sell buy will default to undefined
        console.debug (`parsedSellAmount sellAmount = \n ${sellAmount}`)
        console.debug (`parsedSellAmount sellTokenContract.decimals = \n ${sellTokenContract.decimals}`)
        const parsedSellAmount = sellAmount && tradeDirection === "sell"
        ? parseUnits(sellAmount, sellTokenContract.decimals).toString()
        : undefined;
 
        const parsedBuyAmount = buyAmount && tradeDirection === "buy"
      ? parseUnits(buyAmount, buyTokenContract.decimals).toString()
      : undefined;

    const { isLoading: isLoadingPrice } = useSWR(
      [
        "/api/" + network + "/0X/price",
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
          setPrice(data);
          console.debug(formatUnits(data.buyAmount, buyTokenContract.decimals), data);
          setBuyAmount(formatUnits(data.buyAmount, buyTokenContract.decimals));
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
        },
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

    let buyBalanceOf = (getERC20WagmiClientBalanceOf(activeAccount.address, buyTokenContract.address || "") || "0");
    let sellBalanceOf = (getERC20WagmiClientBalanceOf(activeAccount.address, sellTokenContract.address || "") || "0");

    const disabled = result && sellAmount
      ? parseUnits(sellAmount, sellTokenContract.decimals) > 0 // ToDo FIX This result.value
      : true;

    try {
        // console.debug("Price:connectedWalletAddr = " + connectedWalletAddr)
      return (
        <form autoComplete="off">
          <SellTokenDialog connectedWalletAddr={connectedWalletAddr} buyTokenContract={buyTokenContract} callBackSetter={setSellTokenContract} />
          <BuyTokenDialog connectedWalletAddr={connectedWalletAddr} sellTokenContract={sellTokenContract} callBackSetter={setBuyTokenContract} />
          <RecipientDialog agentWallet={agentWallet} setRecipientElement={setRecipientElement} />
          <AgentDialog recipientWallet={recipientWallet} callBackSetter={setAgentElement} />
          <ErrorDialog errMsg={errorMessage} />
          <div className={styles.tradeContainer}>
            <TradeContainerHeader slippage={slippage} setSlippageCallback={setSlippage}/>
            <SellContainer activeAccount={activeAccount} sellAmount={sellAmount} sellTokenContract={sellTokenContract} setSellAmount={setSellAmount} disabled={false} />
            <BuyContainer activeAccount={activeAccount} buyAmount={buyAmount} buyTokenContract={buyTokenContract} setBuyAmount={setBuyAmount} disabled={false} setDisplayState={setDisplayState} />          
            <BuySellSwapButton  sellTokenContract={sellTokenContract} buyTokenContract={buyTokenContract} setSellTokenContract={setSellTokenContract} setBuyTokenContract={setBuyTokenContract} />
            <PriceButton connectedWalletAddr={connectedWalletAddr} sellTokenContract={sellTokenContract} buyTokenContract={buyTokenContract} sellBalance={sellBalanceOf} disabled={disabled} slippage={slippage} />
            {/* <QuoteButton sendTransaction={sendTransaction}/> */}
            <RecipientContainer recipientWallet={recipientWallet} setDisplayState={setDisplayState}/>
            <SponsorRateConfig setDisplayState={setDisplayState}/>
            <AffiliateFee price={price} sellTokenContract={sellTokenContract} buyTokenContract= {buyTokenContract} />
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