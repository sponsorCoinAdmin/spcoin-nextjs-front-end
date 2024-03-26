'use client'
import styles from '@/app/styles/Exchange.module.css';
import useSWR from "swr";
import { fetcher } from "@/app/lib/0X/fetcher";
import { formatUnits } from "ethers";
import { useState, useEffect } from "react";
import { getNetworkName } from '@/app/lib/network/utils';

import {
  useAccount,
  useChainId,
  useSendTransaction,
  usePrepareSendTransaction,
  type Address,
} from "wagmi";
import { getTokenDetails, fetchTokenDetails } from "@/app/lib/spCoin/utils";
import TradeContainerHeader from '@/app/components/Popover/TradeContainerHeader';
import SellContainer from '@/app/components/containers/SellContainer';
import BuyContainer from '@/app/components/containers/BuyContainer';
import FeeDisclosure from '@/app/components/containers/FeeDisclosure';
import AffiliateFee from '@/app/components/containers/AffiliateFee';
import QuoteButton from '@/app/components/Buttons/QuoteButton';
import { showElement, hideElement, setDisplayPanels } from '@/app/lib/spCoin/guiControl';
import ErrorDialog from '@/app/components/Dialogs/ErrorDialog';
import { RecipientDialog, openDialog } from '@/app/components/Dialogs/Dialogs';
import SponsorRateConfig from '@/app/components/containers/SponsorRateConfig';
import RecipientContainer from '@/app/components/containers/RecipientContainer';
import IsLoading from '@/app/components/containers/IsLoading';
import { DISPLAY_STATE, TokenElement, WalletElement } from '@/app/lib/structure/types';
import { PriceResponse, QuoteResponse } from '@/app/api/types';
import { exchangeContext } from '@/app/lib/context';

const AFFILIATE_FEE:any = process.env.NEXT_PUBLIC_AFFILIATE_FEE === undefined ? "0" : process.env.NEXT_PUBLIC_AFFILIATE_FEE
console.debug("QUOTE AFFILIATE_FEE = " + AFFILIATE_FEE)

//////////// Quote Code
export default function QuoteView({
  price,
  quote,
  setQuote,
  connectedWalletAddr,
}: {
  price: PriceResponse;
  quote: QuoteResponse | undefined;
  setQuote: (price: any) => void;
  connectedWalletAddr: Address;
}) {

  console.debug("########################### QUOTE RERENDERED #####################################")

  let chainId = useChainId();
  // console.debug("chainId = "+chainId +"\nnetworkName = " + networkName)
  // fetch price here
  const [network, setNetwork] = useState(getNetworkName(chainId).toLowerCase());
  const [slippage, setSlippage] = useState<string | undefined | null>(exchangeContext.slippage);
  const [sellTokenElement, setSellTokenElement] = useState<TokenElement>(exchangeContext.sellToken);
  const [buyTokenElement, setBuyTokenElement] = useState<TokenElement>(exchangeContext.buyToken);
  const [recipientWallet, setRecipientElement] = useState<WalletElement>(exchangeContext.recipientWallet);
  const [agentWallet, setAgentElement] = useState<WalletElement>(exchangeContext.agentWallet);
  const [displayState, setDisplayState] = useState<DISPLAY_STATE>(exchangeContext.displayState);
  const [errorMessage, setErrorMessage] = useState<Error>({ name: "", message: "" });

  useEffect(() => {
    console.debug("QUOTE:exchangeContext =\n" + JSON.stringify(exchangeContext,null,2))
    // console.debug("price =\n" + JSON.stringify(price,null,2))
    setDisplayPanels(displayState);
  },[]);

  useEffect(() => {
    setDisplayPanels(displayState);
  },[displayState]);

  useEffect(() => {
  }, [slippage, displayState, buyTokenElement, sellTokenElement, recipientWallet]);

  useEffect(() => { 
      initBuyTokenComponents(buyTokenElement)
   }, [buyTokenElement]);

  useEffect(() => {
      initSellTokenComponents(sellTokenElement)
    }, [sellTokenElement]);

  const initBuyTokenComponents = (buyTokenElement:TokenElement) => {
    // alert(`initBuyTokenComponents:buyTokenElement.symbol === ${buyTokenElement.symbol}`)
    if (buyTokenElement.symbol === "SpCoin") {
      // alert("HERE 1")
      showElement("addSponsorshipDiv")
    }
    else {
      // alert("HERE 2")
      hideElement("addSponsorshipDiv")
      hideElement("recipientSelectDiv")
      hideElement("recipientConfigDiv")
      hideElement("agent");
    }
  }

  const initSellTokenComponents = (sellTokenElement:TokenElement) => {
    // alert(`initSellTokenComponents:sellTokenElement.symbol === ${sellTokenElement.symbol}`)
    if (sellTokenElement.symbol === "SpCoin") {
      // alert("HERE 3")
      showElement("sponsoredBalance")
    }
    else {
      // alert("HERE 4")
      hideElement("sponsoredBalance")
    }      
  }
  
  useEffect(() => {
    if (errorMessage.name !== "" && errorMessage.message !== "") {
      openDialog("#errorDialog");
    }
  }, [errorMessage]);

  const setTokenDetails = async(tokenAddr: any, setTokenElement:any) => {
    let tokenDetails = await getTokenDetails(connectedWalletAddr, chainId, tokenAddr, setTokenElement)
    setTokenElement(tokenDetails)
    return tokenDetails
  }

  const fetchTokenDetails2 = async(tokenAddr: any) => {
    let tokenDetails = await fetchTokenDetails(connectedWalletAddr, chainId, tokenAddr)
    console.debug(`********* fetchTokenDetails:tokenDetails:\n ${JSON.stringify(tokenDetails,null,2)}`)
    return tokenDetails
  }

  console.debug(`********* price.sellTokenAddress: ${price.sellTokenAddress}`)
  console.debug(`********* price.buyTokenAddress: ${price.buyTokenAddress}`)

  console.debug(`Executing Quote:setTokenDetails (${price.sellTokenAddress}, ${sellTokenElement})`)
  // setTokenDetails (price.sellTokenAddress, setSellTokenElement)

  // console.debug("price =\n" + JSON.stringify(price,null,2))
  // const sellTokenInfo =
  //   POLYGON_TOKENS_BY_ADDRESS[price.sellTokenAddress.toLowerCase()];

  // console.debug("sellTokenInfo =\n" + JSON.stringify(sellTokenInfo, null, 2))

  console.debug(`Executing Quote:setTokenDetails (${price.buyTokenAddress}, ${buyTokenElement})`)
  
  // setTokenDetails (price.buyTokenAddress, setBuyTokenElement)

  // const buyTokenInfo =
  //   POLYGON_TOKENS_BY_ADDRESS[price.buyTokenAddress.toLowerCase()];

  // console.debug("buyTokenInfo = \n" + JSON.stringify(buyTokenInfo,null,2))
  // setBuyTokenElement()
  
  // fetch quote here
  const { address } = useAccount();

  const { isLoading: isLoadingPrice } = useSWR(
    [
      "/api/" + network + "/0X/quote",
      {
        sellToken: price.sellTokenAddress,
        buyToken: price.buyTokenAddress,
        sellAmount: price.sellAmount,
        slippagePercentage: slippage,
        // The Slippage does not seam to pass check the api parameters with a JMeter Test then implement here
        // slippagePercentage: slippage,
        // expectedSlippage: slippage,
        connectedWalletAddr,
      },
    ],
    fetcher,
    {
      onSuccess: (data) => {
        setQuote(data);
        console.log("quote", data);
        console.log(formatUnits(data.buyAmount, buyTokenElement.decimals), data);
      },
    }
  );

  const { config } = usePrepareSendTransaction({
    to: quote?.to, // The address of the contract to send call data to, in this case 0x Exchange Proxy
    data: quote?.data, // The call data required to be sent to the to contract address.
  });

  const { sendTransaction } = useSendTransaction(config);

  if (!quote) {
    return <div>Getting best quote...</div>;
  }

  console.log("quote" + JSON.stringify(quote,null,2));
  console.log(formatUnits(quote.sellAmount, sellTokenElement.decimals));

  return (
    <div className="p-3 mx-auto max-w-screen-sm ">
      <form autoComplete="off">
      <RecipientDialog agentWallet={agentWallet} setRecipientElement={setRecipientElement} />
        <ErrorDialog errMsg={errorMessage} />
        <div className={styles.tradeContainer}>
          <TradeContainerHeader slippage={slippage} setSlippageCallback={setSlippage}/>
          <SellContainer sellAmount={formatUnits(quote.sellAmount, sellTokenElement.decimals)} sellBalance={"ToDo: sellBalance"} sellTokenElement={sellTokenElement} setSellAmount={undefined} disabled={true}/>
          <BuyContainer buyAmount={formatUnits(quote.buyAmount, buyTokenElement.decimals)} buyBalance={"ToDo: sellBalance"} buyTokenElement={buyTokenElement} setBuyAmount={undefined} disabled={true} setDisplayState={setDisplayState}/>          
          <QuoteButton sendTransaction={sendTransaction}/>
          <RecipientContainer recipientWallet={recipientWallet} setDisplayState={setDisplayState}/>
          <SponsorRateConfig setDisplayState={setDisplayState}/>
          <AffiliateFee price={price} sellTokenElement={sellTokenElement} buyTokenElement= {buyTokenElement} />
        </div>
        <FeeDisclosure/>
        <IsLoading isLoadingPrice={isLoadingPrice} />
      </form>
    </div>
  );
}
