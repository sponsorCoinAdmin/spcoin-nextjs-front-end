'use client'
import useSWR from "swr";
import {
  POLYGON_TOKENS_BY_ADDRESS,
} from "../../../resources/data/constants";
import { fetcher } from "@/app/lib/0X/fetcher";
import type { PriceResponse, QuoteResponse } from "../../../api/types";
import { formatUnits, isAddress } from "ethers";
import { useState, useEffect, SetStateAction } from "react";
import { getNetworkName } from '@/app/lib/network/utils';
import { getDefaultNetworkSettings } from '../../../lib/network/initialize/defaultNetworkSettings';

import {
  useAccount,
  useChainId,
  useSendTransaction,
  usePrepareSendTransaction,
  type Address,
} from "wagmi";
import { TokenElement, WalletElement } from "@/app/lib/structure/types";
import { getNetworkListElement } from "@/app/components/Dialogs/Resources/DataList";
import { fetchStringBalance } from "@/app/lib/wagmi/fetchBalance";
import { getTokenDetails } from "@/app/lib/spCoin/utils";

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
  connectedWalletAddr: Address | undefined;
}) {

  let chainId = useChainId();
  // console.debug("chainId = "+chainId +"\nnetworkName = " + networkName)
  // fetch price here
  const [network, setNetwork] = useState(getNetworkName(chainId).toLowerCase());
  const [sellTokenElement, setSellTokenElement] = useState<TokenElement>();
  const [buyTokenElement, setBuyTokenElement] = useState<TokenElement>();
 
  const updateNetwork = (network:string | number) => {
    // alert("Quote:network set to " + network)
    console.debug("Quote:network set to " + network);
    let networkSettings = getDefaultNetworkSettings(network);
    setSellTokenElement(networkSettings?.defaultSellToken);
    setBuyTokenElement(networkSettings?.defaultBuyToken);
    console.debug(`Quote:EXECUTING updateNetwork.updateBuyBalance(${buyTokenElement});`)
    console.debug(`Quote:EXECUTING updateNetwork.updateSellBalance(${sellTokenElement});`)
  }

  const setTokenDetails = async(tokenAddr: any, setTokenElement:any) => {
    let tokenDetails = await getTokenDetails(connectedWalletAddr, chainId, tokenAddr, setTokenElement)
    // console.debug(`setTokenDetails:tokenDetails = ${JSON.stringify(tokenDetails,null,2)}`)
    return tokenDetails
  }

  console.debug("price = " +JSON.stringify(price))

  console.debug(`Executing Quote:setTokenDetails (${price.sellTokenAddress}, ${sellTokenElement})`)
  setTokenDetails (price.sellTokenAddress, setSellTokenElement)

  // console.debug("price =\n" + JSON.stringify(price,null,2))
  const sellTokenInfo =
    POLYGON_TOKENS_BY_ADDRESS[price.sellTokenAddress.toLowerCase()];

  console.debug("sellTokenInfo =\n" + JSON.stringify(sellTokenInfo, null, 2))


  console.debug(`Executing Quote:setTokenDetails (${price.buyTokenAddress}, ${buyTokenElement})`)
  setTokenDetails (price.buyTokenAddress, setBuyTokenElement)

  const buyTokenInfo =
    POLYGON_TOKENS_BY_ADDRESS[price.buyTokenAddress.toLowerCase()];

  console.debug("buyTokenInfo =\n" + JSON.stringify(buyTokenInfo,null,2))
  // setbuyTokenElement()
  
  // fetch quote here
  const { address } = useAccount();

  const { isLoading: isLoadingPrice } = useSWR(
    [
      "/api/" + network + "/0X/quote",
      {
        sellToken: price.sellTokenAddress,
        buyToken: price.buyTokenAddress,
        sellAmount: price.sellAmount,
        // buyAmount: TODO if we want to support buys,
        connectedWalletAddr,
      },
    ],
    fetcher,
    {
      onSuccess: (data) => {
        setQuote(data);
        console.log("quote", data);
        console.log(formatUnits(data.buyAmount, buyTokenInfo.decimals), data);
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
  console.log(formatUnits(quote.sellAmount, sellTokenInfo.decimals));

  return (
    <div className="p-3 mx-auto max-w-screen-sm ">
      <form>
        <div className="bg-slate-200 dark:bg-slate-800 p-4 rounded-sm mb-3">
          <div className="text-xl mb-2 text-white">You pay</div>
          <div className="flex items-center text-lg sm:text-3xl text-white">
            <img
              alt={sellTokenInfo.symbol}
              className="h-9 w-9 mr-2 rounded-md"
              src={sellTokenInfo.logoURI}
            />
            <span>{formatUnits(quote.sellAmount, sellTokenInfo.decimals)}</span>
            <div className="ml-2">{sellTokenInfo.symbol}</div>
          </div>
        </div>

        <div className="bg-slate-200 dark:bg-slate-800 p-4 rounded-sm mb-3">
          <div className="text-xl mb-2 text-white">You receive</div>
          <div className="flex items-center text-lg sm:text-3xl text-white">
            <img
              alt={
                POLYGON_TOKENS_BY_ADDRESS[price.sellTokenAddress.toLowerCase()]
                  .symbol
              }
              className="h-9 w-9 mr-2 rounded-md"
              src={
                POLYGON_TOKENS_BY_ADDRESS[price.sellTokenAddress.toLowerCase()]
                  .logoURI
              }
            />
            <span>{formatUnits(quote.buyAmount, buyTokenInfo.decimals)}</span>
            <div className="ml-2">{buyTokenInfo.symbol}</div>
          </div>
        </div>
        <div className="bg-slate-200 dark:bg-slate-800 p-4 rounded-sm mb-3">
          <div className="text-slate-400">
            {quote && quote.grossBuyAmount
              ? "Affiliate Fee: " +
                Number(
                  formatUnits(
                    BigInt(quote.grossBuyAmount),
                    buyTokenInfo.decimals
                  )
                ) *
                  AFFILIATE_FEE +
                " " +
                buyTokenInfo.symbol
              : null}
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
