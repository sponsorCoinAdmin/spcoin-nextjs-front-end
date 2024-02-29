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
import { watchAccount, watchNetwork } from "@wagmi/core";
import { TokenElement } from "@/app/lib/structure/types";

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
  let networkName = getNetworkName(chainId);
  // console.debug("chainId = "+chainId +"\nnetworkName = " + networkName)
  // fetch price here
  const [network, setNetwork] = useState(networkName?.toLowerCase());
  const [sellAmount, setSellAmount] = useState("0");
  const [buyAmount, setBuyAmount] = useState("0");
  const [sellTokenElement, setSellTokenElement] = useState<TokenElement>();
  const [buyTokenElement, setBuyTokenElement] = useState<TokenElement>();
  const unwatch = watchNetwork((network) => processNetworkChange(network));
  const unwatchAccount = watchAccount((account) => processAccountChange(account));

  useEffect(() => {
    alert("Quote:network set to " + network)
    console.debug("Quote:network set to " + network);
    let networkSettings = getDefaultNetworkSettings(network?.chain?.name);
    setSellTokenElement(networkSettings?.defaultSellToken);
    setBuyTokenElement(networkSettings?.defaultBuyToken);
  }, [network]);

  const processAccountChange = (account: any) => {
    // console.debug("APP ACCOUNT = " + JSON.stringify(account.address, null, 2))
  };

  const processNetworkChange = (network: any) => {
    console.debug("Price:NETWORK NAME      = " + JSON.stringify(network?.chain?.name, null, 2));
    setNetwork(network?.chain?.name.toLowerCase());
  };

  console.debug("price =\n" + JSON.stringify(price,null,2))
  const sellTokenInfo =
    POLYGON_TOKENS_BY_ADDRESS[price.sellTokenAddress.toLowerCase()];

  // setSellTokenElement();
  console.debug("sellTokenInfo =\n" + JSON.stringify(sellTokenInfo, null, 2))

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

  console.log("quote", quote);
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
