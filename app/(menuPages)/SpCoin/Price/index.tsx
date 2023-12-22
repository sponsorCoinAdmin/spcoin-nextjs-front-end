'use client'
import styles from '../styles/SpCoin.module.css'
import '../styles/SpCoin.module.css'
import Image from 'next/image'
import spCoin_png from '../components/images/spCoin.png'
import Dialog from '../../../components/Dialogs/Dialog';

import { Input, Popover, Radio, Modal, message } from "antd";
import {
  ArrowDownOutlined,
  DownOutlined,
  SettingOutlined,
} from "@ant-design/icons";

type ListElement = {
  chainId: number;
  ticker: string;
  img: string;
  name: string;
  address: any;
  decimals: number;
}  

const defaultSellToken: ListElement = { 
  chainId: 137,
  ticker: "WBTC",
  img: "https://cdn.moralis.io/eth/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png",
  name: "Wrapped Bitcoin",
  address: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
  decimals: 8
 };

 const defaultBuyToken: ListElement = { 
  chainId: 137,
  ticker: "USDT",
  img: "https://cdn.moralis.io/eth/0xdac17f958d2ee523a2206206994597c13d831ec7.png",
  name: "Tether USD",
  address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  decimals: 6
};

//-------------- Finish Moralis Requirements ----------------------------------

import ApproveOrReviewButton from '../components/Buttons/ApproveOrReviewButton';
import CustomConnectButton from '../components/Buttons/CustomConnectButton';

import qs from "qs";
import useSWR from "swr";
import { useState, ChangeEvent, SetStateAction } from "react";
import { formatUnits, parseUnits } from "ethers";
import {
  useBalance,
  type Address,
} from "wagmi";

interface PriceRequestParams {
  sellToken: string;
  buyToken: string;
  buyAmount?: string;
  sellAmount?: string;
  connectedWalletAddr?: string;
}


const selectElement ='Search agent name or paste address';

const AFFILIATE_FEE = 0.01; // Percentage of the buyAmount that should be attributed to feeRecipient as affiliate fees
const FEE_RECIPIENT = "0x75A94931B81d81C7a62b76DC0FcFAC77FbE1e917"; // The ETH address that should receive affiliate fees


export const fetcher = ([endpoint, params]: [string, PriceRequestParams]) => {
  console.log("fetcher params = + " + JSON.stringify(params, null, 2))
  const { sellAmount, buyAmount } = params;
  if (!sellAmount && !buyAmount) return;
  const query = qs.stringify(params);

  // alert("fetcher([endpoint = " + endpoint + ",\nparams = " + JSON.stringify(params,null,2) + "]")
  console.log("fetcher([endpoint = " + endpoint + ",\nparams = " + JSON.stringify(params,null,2) + "]")

  return fetch(`${endpoint}?${query}`).then((res) => res.json());
};

export default function PriceView({
  connectedWalletAddr,
  price,
  setPrice,
  setFinalize,
}: {
  connectedWalletAddr: Address | undefined;
  price: any;
  setPrice: (price: any) => void;
  setFinalize: (finalize: boolean) => void;
}) {

  console.log("EXECUTING Price({")
  console.log("  connectedWalletAddr: " + connectedWalletAddr)
  console.log("  price: " + JSON.stringify(price))
  console.log("  setPrice: " + JSON.stringify(setPrice))
  console.log("  setFinalize: " + JSON.stringify(setFinalize))
  console.log("})")

  // fetch price here
  const [sellAmount, setSellAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const [tradeDirection, setTradeDirection] = useState("sell");

  const [sellListElement, setSellListElement] = useState<ListElement>(defaultSellToken);
  const [buyListElement, setBuyListElement] = useState<ListElement>(defaultBuyToken);

  const parsedSellAmount =
    sellAmount && tradeDirection === "sell"
      ? parseUnits(sellAmount, sellListElement.decimals).toString()
      : undefined;

  console.log("sellAmount = " + sellAmount)

  const parsedBuyAmount =
    buyAmount && tradeDirection === "buy"
      ? parseUnits(buyAmount, buyListElement.decimals).toString()
      : undefined;

  const { isLoading: isLoadingPrice } = useSWR(
    [
      "/api/price",
      {
        sellToken: sellListElement.address,
        buyToken: buyListElement.address,
        sellAmount: parsedSellAmount,
        buyAmount: parsedBuyAmount,
        connectedWalletAddr,
        feeRecipient: FEE_RECIPIENT,
        buyTokenPercentageFee: AFFILIATE_FEE,
      },
    ],
    fetcher,
    {
      onSuccess: (data) => {
        setPrice(data);
        if (tradeDirection === "sell") {
          console.log(formatUnits(data.buyAmount, buyListElement.decimals), data);
          setBuyAmount(formatUnits(data.buyAmount, buyListElement.decimals));
        } else {
          setSellAmount(formatUnits(data.sellAmount, sellListElement.decimals));
        }
      },
      onError: ( error ) => {
        console.log("useSWR fetcher ERROR error = " + error)
      },
    }
  );

  // function setBalanceState({ address, cacheTime, chainId: chainId_, enabled, formatUnits, scopeKey, staleTime, suspense, token, watch, onError, onSettled, onSuccess, }?: UseBalanceArgs & UseBalanceConfig): UseQueryResult<FetchBalanceResult, Error>;


  const  { data, isError, isLoading } = useBalance({
    address: connectedWalletAddr,
    token: sellListElement.address,
  });

  function isDisabled() {
    return data && sellAmount
      ? parseUnits(sellAmount, sellListElement.decimals) > data.value
      : true;
  }
  
   // console.log("data = " + JSON.stringify(data, null, 2), "\nisError = " + isError, "isLoading = " + isLoading);

  // ------------------------------ START MORALIS SCRIPT CODE

  let [slippage, setSlippage] = useState(2.5);
  function handleSlippageChange(e: { target: { value: SetStateAction<number>; }; }) {
    setSlippage(e.target.value);
  }

  const settings = (
    <div>
      <div >Slippage Tolerance</div>
      <div >
        <Radio.Group value={slippage} onChange={handleSlippageChange}>
          <Radio.Button value={0.5}>0.5%</Radio.Button>
          <Radio.Button value={2.5}>2.5%</Radio.Button>
          <Radio.Button value={5}>5.0%</Radio.Button>
        </Radio.Group>
      </div>
    </div>
  );

  // ------------------------------ END MORALIS SCRIPT CODE ------------------------------------------------------

  // --------------------------- START NEW MODAL/DIALOG CODE -----------------------------------------------------
  
  const SET_BUY_TOKEN = true;
  const SET_SELL_TOKEN = false;
  let BUY_SELL_ACTION = SET_SELL_TOKEN; 

  function openTokenModal(_action: boolean) {
    BUY_SELL_ACTION = _action;
    const dialog = document.querySelector("#dialogList")

    dialog?.showModal();
  }

  const getDlgLstElement = (_listElement: ListElement) => {
    BUY_SELL_ACTION === SET_SELL_TOKEN ? setSellListElement(_listElement) : setBuyListElement(_listElement);
    console.log("index.tsx:: Modifying Token Object " + JSON.stringify(_listElement,null,2));
  }

  function switchTokens() {
    let tmpElement: ListElement = sellListElement;
    setSellListElement(buyListElement);
    setBuyListElement(tmpElement);
  }
// --------------------------- END NEW MODAL/DIALOG CODE -----------------------------------------------------

  return (
    <form>
      <Dialog selectElement={selectElement} getDlgLstElement={getDlgLstElement}/>

      {/* <SpCoinExchange /> */}

      <div className={styles.tradeBox}>
        <div className={styles.tradeBoxHeader}>
          <Image src={spCoin_png} width={30} height={30} alt="Moralis Logo" />
          <h4 className={styles.center}>Sponsor Coin Exchange</h4>
          <Popover
            content={settings}
            title="Settings"
            trigger="click"
            placement="bottomLeft"
          >
          <SettingOutlined className={styles.cog} />
          </Popover>
        </div>
        <div className={styles.inputs}>
          <Input id="sell-amount-id" className={styles.priceInput} placeholder="0" disabled={false} 
            onChange={(e) => {
                // setTradeDirection("sell");
                setSellAmount(e.target.value);
            }}
          />
          <Input id="buy-amount-id" className={styles.priceInput} placeholder="0" disabled={true} value={parseFloat(buyAmount).toFixed(6)} />
          {connectedWalletAddr ? (
            <ApproveOrReviewButton
              tokenToSellAddr={sellListElement.address}
              connectedWalletAddr={connectedWalletAddr}
              onClick={() => {
                setFinalize(true);
              }}
              disabled={isDisabled()}
            />
            ) : (
            <CustomConnectButton />)}
         
          <div className={styles.switchButton} onClick={switchTokens}>
              <ArrowDownOutlined className={styles.switchArrow} />
          </div>
 
          <div className={styles.assetOne} onClick={() => openTokenModal(SET_SELL_TOKEN)}>
            <img
              alt={sellListElement.name}
              className="h-9 w-9 mr-2 rounded-md"
              src={sellListElement.img}
            />
            {sellListElement.ticker}
            <DownOutlined />
          </div>

          <div className={styles.assetTwo} onClick={() => openTokenModal(SET_BUY_TOKEN)}>
            <img
              alt={buyListElement.name}
              className="h-9 w-9 mr-2 rounded-md"
              src={buyListElement.img}
            />
            {buyListElement.ticker}
            <DownOutlined />
          </div>
        </div>

{/* OX Code */}

        <div className="text-slate-400">
          {price && price.grossBuyAmount
            ? "Affiliate Fee: " +
              Number(
                formatUnits(
                  BigInt(price.grossBuyAmount),
                  buyListElement.decimals
                )
              ) *
                AFFILIATE_FEE +
              " " +
              buyListElement.ticker
            : null}
        </div>
      </div>

      {isLoadingPrice && (
        <div className="text-center mt-2">Fetching the best price...</div>
      )}
    </form>
  );
}