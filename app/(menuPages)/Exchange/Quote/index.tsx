'use client'
import styles from '../../../styles/Exchange.module.css';
import useSWR from "swr";
import { fetcher } from "@/app/lib/0X/fetcher";
import type { PriceResponse, QuoteResponse } from "../../../api/types";
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
import { ExchangeTokens } from "..";
import TradeContainerHeader from '@/app/components/Popover/TradeContainerHeader';

const AFFILIATE_FEE:any = process.env.NEXT_PUBLIC_AFFILIATE_FEE === undefined ? "0" : process.env.NEXT_PUBLIC_AFFILIATE_FEE
console.debug("QUOTE AFFILIATE_FEE = " + AFFILIATE_FEE)

//////////// Quote Code
export default function QuoteView({
  price,
  quote,
  setQuote,
  connectedWalletAddr,
  exchangeTokens,
}: {
  price: PriceResponse;
  quote: QuoteResponse | undefined;
  setQuote: (price: any) => void;
  connectedWalletAddr: Address | undefined;
  exchangeTokens: ExchangeTokens | undefined;
}) {

  console.debug("########################### QUOTE RERENDERED #####################################")

  let chainId = useChainId();
  // console.debug("chainId = "+chainId +"\nnetworkName = " + networkName)
  // fetch price here
  const [network, setNetwork] = useState(getNetworkName(chainId).toLowerCase());
  const [slippage, setSlippage] = useState<string | undefined | null>(exchangeTokens?.slippage);

  useEffect(() => {
    console.debug("exchangeTokens =\n" + JSON.stringify(exchangeTokens,null,2))
    console.debug("price =\n" + JSON.stringify(price,null,2))
  },[]);

  useEffect(() => {
    alert('Quote slippage changed to  ' + slippage);
  }, [slippage]);

  const sellTokenElement = exchangeTokens?.sellToken;
  const buyTokenElement = exchangeTokens?.buyToken;

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

  // let beforeDetails = JSON.stringify(sellTokenElement,null,2)

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
        console.log(formatUnits(data.buyAmount, buyTokenElement?.decimals), data);
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
  console.log(formatUnits(quote.sellAmount, sellTokenElement?.decimals));

  return (
    <div className="p-3 mx-auto max-w-screen-sm ">
      <form>
      <div className={styles.tradeContainer}>
      <TradeContainerHeader slippage={slippage} setSlippageCallback={setSlippage}/>
          {/* Sell Token Selection Module */}
          <div className={styles.inputs}>
            <input id="sell-amount-id" className={styles.priceInput} placeholder="0" disabled={false} value={quote.sellAmount}
              // onChange={(e) => { setValidPriceInput(e.target.value, sellTokenElement?.decimals); }}
               />
            <div className={styles["assetSelect"]}>
              <img alt={sellTokenElement?.name} className="h-9 w-9 mr-2 rounded-md cursor-pointer" src={sellTokenElement?.img} onClick={() => alert("sellTokenElement " + JSON.stringify(sellTokenElement,null,2))}/>
              {sellTokenElement?.symbol}
            </div>
            <div className={styles["buySell"]}>
              You Pay
            </div>
            <div className={styles["assetBalance"]}>
              Balance: {"ToDo: sellBalance"}
            </div>
            <div id="sponsoredBalance" className={styles["sponsoredBalance"]}>
              Sponsored Balance: {"{ToDo}"}
            </div>
          </div>

          <div className="bg-slate-200 dark:bg-slate-800 p-4 rounded-sm mb-3">
            <div className="text-xl mb-2 text-slate-600">You pay</div>
            <div className="flex items-center text-lg sm:text-3xl text-slate-600">
              <img
                alt={sellTokenElement?.symbol}
                className="h-9 w-9 mr-2 rounded-md"
                src={sellTokenElement?.img}
              />
              <span>{formatUnits(quote.sellAmount, sellTokenElement?.decimals)}</span>
              <div className="ml-2">{sellTokenElement?.symbol}</div>
            </div>
          </div>

          <div className="bg-slate-200 dark:bg-slate-800 p-4 rounded-sm mb-3">
            <div className="text-xl mb-2 text-slate-600">You receive</div>
            <div className="flex items-center text-lg sm:text-3xl text-slate-600">
              <img
                alt={buyTokenElement?.symbol}
                className="h-9 w-9 mr-2 rounded-md"
                src={buyTokenElement?.img}
              />
              <span>{formatUnits(quote.buyAmount, buyTokenElement?.decimals)}</span>
              <div className="ml-2">{buyTokenElement?.symbol}</div>
            </div>
          </div>
          <div className="bg-slate-200 dark:bg-slate-800 p-4 rounded-sm mb-3">
            <div className="text-slate-600">
              {quote && quote.grossBuyAmount
                ? "Affiliate Fee: " +
                  Number(
                    formatUnits(
                      BigInt(quote.grossBuyAmount),
                      buyTokenElement?.decimals
                    )
                  ) *
                    AFFILIATE_FEE +
                  " " +
                  buyTokenElement?.symbol
                : null}
            </div>
          </div>
        </div>
      </form>

      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
        onClick={() => {
          console.log("submitting quote to blockchain");
          sendTransaction && sendTransaction();
        }}
      >
        Place Order
      </button>
    </div>
  );
}
