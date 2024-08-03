'use client';
import styles from '@/styles/Exchange.module.css';
import {
  openDialog
} from '@/components/Dialogs/Dialogs';
import { useState, useEffect } from "react";
import { formatUnits, parseUnits } from "ethers";
import {  useAccount } from 'wagmi' 
import { erc20Abi } from 'viem' 
import { WalletElement, TokenContract, TradeData, DISPLAY_STATE } from '@/lib/structure/types';
import { isSpCoin, setValidPriceInput } from '@/lib/spCoin/utils';
import type { PriceResponse } from "@/app/api/types";
import {setDisplayPanels,} from '@/lib/spCoin/guiControl';
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

    try {
      return (
        <form autoComplete="off">
          <div className={styles.tradeContainer}>
            <ReadWagmiEcr20BalanceOf  ACTIVE_ACCOUNT_ADDRESS={activeAccount.address} TOKEN_CONTRACT_ADDRESS={sellTokenContract.address} />
          </div>
         </form>
      );
    } catch (err:any) {
      console.debug (`Price Components Error:\n ${err.message}`)
    }
  } catch (err:any) {
    console.debug (`Price Methods Error:\n ${err.message}`)
  }
}