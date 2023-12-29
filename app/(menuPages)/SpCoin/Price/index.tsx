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
  symbol: string;
  img: string;
  name: string;
  address: any;
  decimals: number;
}  

const defaultSellToken: ListElement = { 
  chainId: 137,
  symbol: "WBTC",
  img: "https://cdn.moralis.io/eth/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png",
  name: "Wrapped Bitcoin",
  address: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
  decimals: 8
 };

 const defaultSellToken2: ListElement = { 
  chainId: 137,
  symbol: "WETH",
  img: "https://cdn.moralis.io/eth/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png",
  name: "Wrapped Ethereum",
  address: "0xAe740d42E4ff0C5086b2b5b5d149eB2F9e1A754F",
  decimals: 18
 };

 const defaultBuyToken: ListElement = { 
  chainId: 137,
  symbol: "USDT",
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
const SELL_AMOUNT_UNDEFINED = 100;
const BUY_AMOUNT_UNDEFINED = 200;
const SELL_AMOUNT_ZERO = 300;
const BUY_AMOUNT_ZERO = 400;
const ERROR_0X_RESPONSE = 500;

export const fetcher = ([endpoint, params]: [string, PriceRequestParams]) => {
  console.log("fetcher params = + " + JSON.stringify(params, null, 2))
  const { sellAmount, buyAmount } = params;

  if (!sellAmount && !buyAmount) return;
  if (!buyAmount && (sellAmount === undefined || sellAmount === "0")) {
    throw {errCode: SELL_AMOUNT_ZERO, errMsg: 'Fetcher not executing remote price call: Sell Amount is 0'};
  }
  if (!sellAmount && buyAmount === "0") {
    throw {errCode: BUY_AMOUNT_ZERO, errMsg: 'Fetcher not executing remote price call: Buy Amount is 0'}
  }

  // if (!sellAmount || sellAmount == null || sellAmount == undefined) {
  //   throw {errCode: SELL_AMOUNT_UNDEFINED, errMsg: 'Sell Amount Field is Empty'}
  // }

  // if (!buyAmount || buyAmount == null || buyAmount == undefined) {
  //   throw {errCode: BUY_AMOUNT_UNDEFINED, errMsg: 'Buy Amount Field is Empty'}
  // }
 

  // alert("fetcher([endpoint = " + endpoint + ",\nparams = " + JSON.stringify(params,null,2) + "]")
  try {
    console.log("fetcher([endpoint = " + endpoint + ",\nparams = " + JSON.stringify(params,null,2) + "]")
    const query = qs.stringify(params);
    return fetch(`${endpoint}?${query}`).then((res) => res.json());
  }
  catch (e) {
    throw {errCode: ERROR_0X_RESPONSE, errMsg: JSON.stringify(e, null, 2)}
  }

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

  // console.log("EXECUTING Price({")
  // console.log("  connectedWalletAddr: " + connectedWalletAddr)
  // console.log("  price: " + JSON.stringify(price))
  // console.log("  setPrice: " + JSON.stringify(setPrice))
  // console.log("  setFinalize: " + JSON.stringify(setFinalize))
  // console.log("})")
  
  // fetch price here
  const [sellAmount, setSellAmount] = useState("0");
  const [buyAmount, setBuyAmount] = useState("0");
  const [tradeDirection, setTradeDirection] = useState("sell");

  const [sellListElement, setSellListElement] = useState<ListElement>(defaultSellToken);
  const [buyListElement, setBuyListElement] = useState<ListElement>(defaultBuyToken);
  // console.log("sellListElement.symbol = " + sellListElement.symbol);
  // console.log("buyListElement.symbol  = " + buyListElement.symbol);

  const parsedSellAmount =
    sellAmount && tradeDirection === "sell"
      ? parseUnits(sellAmount, sellListElement.decimals).toString()
      : undefined;

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
          setNumSellAmount(formatUnits(data.sellAmount, sellListElement.decimals));
        }
      },
      onError: ( error ) => {
        // alert("*** ERROR = " + error + "\n" + JSON.stringify(error, null, 2));
        let errCode: number = error.errCode;
        let errMsg: string = error.errMsg;
        if (errCode != undefined) {
           switch (errCode) {
            case SELL_AMOUNT_ZERO: setBuyAmount("0");
              // alert('Sell Amount is 0');
            break;
            case BUY_AMOUNT_ZERO: setNumSellAmount("0");
            // alert('Buy Amount is 0');
            break;
            case ERROR_0X_RESPONSE:
              console.log("ERROR: OX Response errCode = " + errCode + "\nerrMsg = " + errMsg);
              alert("errCode = " + errCode + "\n errMsg  = " + errMsg);
            break;
            case SELL_AMOUNT_UNDEFINED:
              console.log("ERROR: errCode = " + errCode + "\nerrMsg = " + errMsg);
              alert("errCode = " + errCode + "\n errMsg  = " + errMsg);
              setNumSellAmount("0");
            break;
            case BUY_AMOUNT_UNDEFINED:
              console.log("ERROR: errCode = " + errCode + "\nerrMsg = " + errMsg);
              alert("errCode = " + errCode + "\n errMsg  = " + errMsg);
              setBuyAmount("0");
            break;
            default: {
              console.log("ERROR: errCode = " + errCode + "\nerrMsg = " + errMsg);
              alert("errCode = " + errCode + "\n errMsg  = " + errMsg);
            }
          }
        }
        else {
          if (error === null || error === undefined) {
            alert ("error = undefined");
            alert("useSWR fetcher ERROR error = " + error + "\n" + JSON.stringify(error, null, 2));
            console.log("useSWR fetcher ERROR error = " + JSON.stringify(error, null, 2))
          }
          else {
            // alert("*** ERROR = " + error + "\n" + JSON.stringify(error, null, 2));
            console.log("*** ERROR = " + error + "\n" + JSON.stringify(error, null, 2));
          }
        }
      },
    }
  );

  // function setBalanceState({ address, cacheTime, chainId: chainId_, enabled, formatUnits, scopeKey, staleTime, suspense, token, watch, onError, onSettled, onSuccess, }?: UseBalanceArgs & UseBalanceConfig): UseQueryResult<FetchBalanceResult, Error>;

  const  { data, isError, isLoading } = useBalance({
    address: connectedWalletAddr,
    token: sellListElement.address,
  });

  // function isDisabled() {
  //   return data && sellAmount
  //     ? parseUnits(sellAmount, sellListElement.decimals) > data.value
  //     : true;
  // }

  const disabled =
    data && sellAmount
      ? parseUnits(sellAmount, sellListElement.decimals) > data.value
      : true;
  
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
    console.log("index.tsx:: Modifying Token Object " + JSON.stringify(_listElement,null,2));
    return BUY_SELL_ACTION === SET_SELL_TOKEN ? setValidSellListElement(_listElement) : setValidBuyListElement(_listElement);
  }

  function setValidSellListElement(_listElement: ListElement) {
    /*
    let msg = "setValidSellListElement "+_listElement.symbol;
    console.log(msg);
    alert(msg);
    */
    if (_listElement.address === buyListElement.address) {
      alert("Sell Token cannot be the same as Buy Token("+buyListElement.symbol+")")
      console.log("Sell Token cannot be the same as Buy Token("+buyListElement.symbol+")");
      return false;
    }
    else {
      setSellListElement(_listElement)
      return true;
    }
  }

  function setValidBuyListElement(_listElement: ListElement) {
    /*
    let msg = "setValidBuyListElement "+_listElement.symbol;
    console.log(msg);
    alert(msg);
    */
    if (_listElement.address === sellListElement.address) {
      alert("Buy Token cannot be the same as Sell Token("+sellListElement.symbol+")")
      console.log("Buy Token cannot be the same as Sell Token("+sellListElement.symbol+")");
      return false;
    }
    else {
      setBuyListElement(_listElement)
      return true;
    }
  }

  function switchTokens() {
    let tmpElement: ListElement = sellListElement;
    setSellListElement(buyListElement);
    setBuyListElement(tmpElement);
  }

  function setNumSellAmount(txt: string){
    const re = /^-?\d+(?:[.,]\d*?)?$/;
    if (txt === '' || re.test(txt)) {
      txt = validateDecimals(txt, sellListElement.decimals);
      setSellAmount(txt)
    }
  }

  function validateDecimals(txt:string, decimals:number) {
    let splitText = txt.split(".");
    if(splitText[1] != undefined) {
      txt = splitText[0] + "." + splitText[1]?.substring(0, decimals);
    }
    return txt;
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
          <Popover content={settings} title="Settings" trigger="click" placement="bottomLeft">
            <SettingOutlined className={styles.cog} />
          </Popover>
        </div>

        <div className={styles.inputs}>
          <Input id="sell-amount-id" className={styles.priceInput} placeholder="0" disabled={false} value={sellAmount}
            onChange={(e) => { setNumSellAmount(e.target.value); }} />
          <div className={styles.assetOne} onClick={() => openTokenModal(SET_SELL_TOKEN)}>
            <img alt={sellListElement.name} className="h-9 w-9 mr-2 rounded-md" src={sellListElement.img} />
            {sellListElement.symbol}
            <DownOutlined />
          </div>
        </div>

        <div className={styles.inputs}>
          <Input id="buy-amount-id" className={styles.priceInput} placeholder="0" disabled={true} value={parseFloat(buyAmount).toFixed(6)} />
          <div className={styles.assetTwo} onClick={() => openTokenModal(SET_BUY_TOKEN)}>
            <img alt={buyListElement.name} className="h-9 w-9 mr-2 rounded-md" src={buyListElement.img} />
            {buyListElement.symbol}
            <DownOutlined />
          </div>
        </div>

        {connectedWalletAddr ? (
          <ApproveOrReviewButton tokenToSellAddr={sellListElement.address} connectedWalletAddr={connectedWalletAddr}
            onClick={() => { setFinalize(true); }} disabled={disabled} />
          ) : (
          <CustomConnectButton />)}

        <div className={styles.inputs}>
          <Input id="recipient-id" className={styles.priceInput} placeholder="Recipient" disabled={false}
            onChange={(e) => { setNumSellAmount(e.target.value); }} />
          <div className={styles.recipientBtn} onClick={() => openTokenModal(SET_SELL_TOKEN)}>
            <img alt={sellListElement.name} className="h-9 w-9 mr-2 rounded-md" src={sellListElement.img} />
            {sellListElement.symbol}
            <DownOutlined />
          </div>
        </div>

        <div className={styles.inputs}>
          <Input id="agent-id" className={styles.priceInput} placeholder="Agent" disabled={false}
            onChange={(e) => { setNumSellAmount(e.target.value); }} />
          <div className={styles.agentBtn} onClick={() => openTokenModal(SET_SELL_TOKEN)}>
            <img alt={sellListElement.name} className="h-9 w-9 mr-2 rounded-md" src={sellListElement.img} />
            {sellListElement.symbol}
            <DownOutlined />
          </div>
        </div>
        
        <div className={styles.switchButton} onClick={switchTokens}>
            <ArrowDownOutlined className={styles.switchArrow} />
        </div>

        <div className="text-slate-400">
          {price && price.grossBuyAmount
            ? "Affiliate Fee: " +
                Number( formatUnits( BigInt(price.grossBuyAmount), buyListElement.decimals )) *
                AFFILIATE_FEE + " " + buyListElement.symbol
            : null}
        </div>
      </div>

      {isLoadingPrice && (
        <div className="text-center mt-2">Fetching the best price...</div>
      )}
    </form>
  );
}