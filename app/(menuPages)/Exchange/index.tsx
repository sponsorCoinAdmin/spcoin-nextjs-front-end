import { useState } from "react";
import PriceView from "./Price";
import QuoteView from "./Quote";
import type { PriceResponse } from "@/app/api/types";
import { useAccount } from "wagmi";
import { WalletElement, TokenElement } from "@/app/lib/structure/types";
import { getDefaultNetworkSettings } from "@/app/lib/network/initialize/defaultNetworkSettings";

enum  EXCHANGE_STATE {
  PRICE, QUOTE, PENDING
}

type ExchangeTokens = {
  state: EXCHANGE_STATE;
  slippage: string|undefined|null;
  sellToken: TokenElement;
  buyToken: TokenElement;
  recipientWallet: WalletElement;
  agentWallet: WalletElement;
}

const initialExchangeTokens = (network:string|number) => {
  const defaultNetworkSettings = getDefaultNetworkSettings(network)
  let exchangeTokens:ExchangeTokens = {
    state: EXCHANGE_STATE.PRICE,
    slippage:"0.02",
    sellToken: defaultNetworkSettings?.defaultSellToken,
    buyToken: defaultNetworkSettings?.defaultBuyToken,
    recipientWallet: defaultNetworkSettings?.defaultRecipient,      
    agentWallet: defaultNetworkSettings?.defaultAgent        
  }
  return exchangeTokens;
}

export default function Home() {
  const [exchangeTokens, setExchangeTokens] = useState<ExchangeTokens>(initialExchangeTokens('ethereum'));
  const [price, setPrice] = useState<PriceResponse | undefined>();
  const [quote, setQuote] = useState();
  const { address } = useAccount();
 
  return (
    <main className={`flex min-h-screen flex-col items-center justify-between p-24`} >
      {exchangeTokens?.state === EXCHANGE_STATE.QUOTE && price && address  && exchangeTokens ? 
      (
        <QuoteView
          connectedWalletAddr={address}
          price={price}
          quote={quote}
          setQuote={setQuote}
          exchangeTokens={exchangeTokens}
        />
      ) : (
        <PriceView
          connectedWalletAddr={address}
          price={price}
          setPrice={setPrice}
          exchangeTokens={exchangeTokens}
          setExchangeTokens={setExchangeTokens}
        />
      )}
    </main>
  );
}

export {
  type ExchangeTokens,
  EXCHANGE_STATE
}