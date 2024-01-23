'use client'
import styles from '../../../styles/Exchange.module.css'
import Image from 'next/image'
import spCoin_png from '../../../resources/images/spCoin.png'
import {
  AgentDialog,
  RecipientDialog,
  SellTokenDialog,
  BuyTokenDialog,
  ErrorDialog
} from '../../../components/Dialogs/Dialogs';
import { Input, Popover, Radio, Modal, message } from "antd";
import ApproveOrReviewButton from '../../../components/Buttons/ApproveOrReviewButton';
import CustomConnectButton from '../../../components/Buttons/CustomConnectButton';
import FEED  from '../../../resources/data/feeds/feedTypes';
import qs from "qs";
import useSWR from "swr";
import { useState, useEffect, ChangeEvent, SetStateAction } from "react";
import { formatUnits, parseUnits } from "ethers";
import {
  useBalance,
  useAccount,
  type Address,
} from "wagmi";
import {
  watchAccount,
} from "@wagmi/core";
import {
  ArrowDownOutlined,
  DownOutlined,
  SettingOutlined,
} from "@ant-design/icons";

import {
  TokenElement, 
  PriceRequestParams, 
  defaultSellToken, 
  defaultBuyToken, 
  defaultAgent,
  defaultRecipient } from '../../../lib/defaultSettings'

import { fetchStringBalance } from '../../../lib/wagmi/api/fetchBalance'
// const unwatch = watchNetwork((network) => console.log(network))

const AFFILIATE_FEE:any = process.env.NEXT_PUBLIC_AFFILIATE_FEE === undefined ? "0" : process.env.NEXT_PUBLIC_AFFILIATE_FEE
// console.debug("PRICE AFFILIATE_FEE =" + AFFILIATE_FEE)
const FEE_RECIPIENT = "0x75A94931B81d81C7a62b76DC0FcFAC77FbE1e917"; // The ETH address that should receive affiliate fees
const SELL_AMOUNT_UNDEFINED = 100;
const BUY_AMOUNT_UNDEFINED = 200;
const SELL_AMOUNT_ZERO = 300;
const BUY_AMOUNT_ZERO = 400;
const ERROR_0X_RESPONSE = 500;

// updateNetworkState({chainId:"1", name:"ZZZZ"});

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
    console.log(`${endpoint}?${query}`);
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
  const [sellBalance, setSellBalance] = useState("0");
  const [buyBalance, setBuyBalance] = useState("0");
  const [tradeDirection, setTradeDirection] = useState("sell");

  const [sellTokenElement, setSellTokenElement] = useState<TokenElement>(defaultSellToken);
  const [buyTokenElement, setBuyTokenElement] = useState<TokenElement>(defaultBuyToken);
  const [recipientElement, setRecipientElement] = useState(defaultRecipient);
  const [agentElement, setAgentElement] = useState(defaultAgent);

  const unwatchAccount = watchAccount((unwatchAccount) => processAccountChange(unwatchAccount))

  const processAccountChange = ( account:any ) => {
    console.debug("APP ACCOUNT = " + JSON.stringify(account.address, null, 2))
  }
  
  useEffect(() => {
    // setSellBalance(sellTokenElement.name)
    console.debug("sellTokenElement.symbol changed to " + sellTokenElement.name)
    updateSellBalance(sellTokenElement)
  },[sellTokenElement])

  useEffect(() => {
    // setBuyBalance(buyTokenElement.name)
    console.debug("buyTokenElement.symbol changed to " + buyTokenElement.name)
    updateBuyBalance(buyTokenElement)
  },[buyTokenElement])

  const updateSellBalance = async (sellTokenElement:TokenElement) => {
    const { address: walletAddr } = useAccount()
    let tokenAddr = sellTokenElement.address;
    let chainId = sellTokenElement.chainId
    console.debug("updateSellBalance(wallet Address = " + walletAddr + " Token Address = "+tokenAddr+ ", chainId = " + chainId +")");
    let retResponse:any = await fetchStringBalance (walletAddr, tokenAddr, chainId)
    console.debug("retResponse = " + JSON.stringify(retResponse))
    setSellBalance(retResponse.value)
    return {sellBalance}
  }

  const updateBuyBalance = async (buyTokenElement:TokenElement) => {
    const { address: walletAddr } = useAccount()
    let tokenAddr = buyTokenElement.address;
    let chainId = buyTokenElement.chainId
    console.debug("updateBuyBalance(wallet Address = " + walletAddr + " Token Address = "+tokenAddr+ ", chainId = " + chainId +")");
    let retResponse:any = await fetchStringBalance (walletAddr, tokenAddr, chainId)
    console.debug("retResponse = " + JSON.stringify(retResponse))
    setBuyBalance(retResponse.value)
    return {buyBalance}
  }

  // console.log("sellTokenElement.symbol = " + sellTokenElement.symbol);
  // console.log("buyTokenElement.symbol  = " + buyTokenElement.symbol);

  const parsedSellAmount =
    sellAmount && tradeDirection === "sell"
      ? parseUnits(sellAmount, sellTokenElement.decimals).toString()
      : undefined;

  const parsedBuyAmount =
    buyAmount && tradeDirection === "buy"
      ? parseUnits(buyAmount, buyTokenElement.decimals).toString()
      : undefined;

  const { isLoading: isLoadingPrice } = useSWR(
    [
      "/api/price",
      {
        sellToken: sellTokenElement.address,
        buyToken: buyTokenElement.address,
        sellAmount: parsedSellAmount,
        buyAmount: parsedBuyAmount,
        connectedWalletAddr,
       },
    ],
    fetcher,
    {
      onSuccess: (data) => {
        setPrice(data);
        if (tradeDirection === "sell") {
          console.log(formatUnits(data.buyAmount, buyTokenElement.decimals), data);
          setBuyAmount(formatUnits(data.buyAmount, buyTokenElement.decimals));
        } else {
          validateNumericEntry(formatUnits(data.sellAmount, sellTokenElement.decimals));
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
            case BUY_AMOUNT_ZERO: validateNumericEntry("0");
            // alert('Buy Amount is 0');
            break;
            case ERROR_0X_RESPONSE:
              console.log("ERROR: OX Response errCode = " + errCode + "\nerrMsg = " + errMsg);
              alert("errCode = " + errCode + "\n errMsg  = " + errMsg);
            break;
            case SELL_AMOUNT_UNDEFINED:
              console.log("ERROR: errCode = " + errCode + "\nerrMsg = " + errMsg);
              alert("errCode = " + errCode + "\n errMsg  = " + errMsg);
              validateNumericEntry("0");
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
    token: sellTokenElement.address,
  });

  // function isDisabled() {
  //   return data && sellAmount
  //     ? parseUnits(sellAmount, sellTokenElement.decimals) > data.value
  //     : true;
  // }

  const disabled =
    data && sellAmount
      ? parseUnits(sellAmount, sellTokenElement.decimals) > data.value
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

  const setDlgLstElement = (_tokenElement: TokenElement) => {
    console.log("index.tsx:: Modifying Token Object " + JSON.stringify(_tokenElement,null,2));
    return BUY_SELL_ACTION === SET_SELL_TOKEN ? setValidSellTokenElement(_tokenElement) : setValidBuyTokenElement(_tokenElement);
  }

  function setValidSellTokenElement(_tokenElement: TokenElement) {
    /*
    let msg = "setValidSellTokenElement "+_tokenElement.symbol;
    console.log(msg);
    alert(msg);
    /**/
    if (_tokenElement.address === buyTokenElement.address) {
      alert("Sell Token cannot be the same as Buy Token("+buyTokenElement.symbol+")")
      console.log("Sell Token cannot be the same as Buy Token("+buyTokenElement.symbol+")");
      return false;
    }
    else {
      setSellTokenElement(_tokenElement)
      return true;
    }
  }

  function setValidBuyTokenElement(_recipientElement: TokenElement) {
    /**
    let msg = "setValidBuyTokenElement "+_recipientElement.symbol;
    console.log(msg);
    alert(msg);
    /**/
    if (_recipientElement.address === sellTokenElement.address) {
      alert("Buy Token cannot be the same as Sell Token("+sellTokenElement.symbol+")")
      console.log("Buy Token cannot be the same as Sell Token("+sellTokenElement.symbol+")");
      return false;
    }
    else {
      setBuyTokenElement(_recipientElement)
      return true;
    }
  }

  function setValidRecipientElement(_tokenElement: TokenElement) {
    /**
    let msg = "setValidBuyTokenElement "+_tokenElement.symbol;
    console.log(msg);
    alert(msg);
    /**/
    if (_tokenElement.address === agentElement.address) {
      alert("Recipient cannot be the same as Agent("+agentElement.symbol+")")
      console.log("Recipient cannot be the same as Agent("+agentElement.symbol+")");
      return false;
    }
    else {
      setRecipientElement(_tokenElement)
      return true;
    }
  }

  function setValidAgentElement(_agentElement: TokenElement) {
    /*
    let msg = "setValidSellTokenElement "+_agentElement.symbol;
    console.log(msg);
    alert(msg);
    /**/
    if (_agentElement.address === recipientElement.address) {
      alert("Agent cannot be the same as Recipient("+recipientElement.symbol+")")
      console.log("Agent cannot be the same as Recipient("+recipientElement.symbol+")");
      return false;
    }
    else {
      setAgentElement(_agentElement)
      return true;
    }
  }

  function switchTokens() {
    let tmpElement: TokenElement = sellTokenElement;
    setSellTokenElement(buyTokenElement);
    setBuyTokenElement(tmpElement);
  }

  function validateNumericEntry(txt: string){
    // Allow only numbers and '.'
    const re = /^-?\d+(?:[.,]\d*?)?$/;
    if (txt === '' || re.test(txt)) {
      txt = validatePrice(txt, sellTokenElement.decimals);
      setSellAmount(txt)
    }
  }

  function validatePrice(txt:string, decimals:number) {
    let splitText = txt.split(".");
    // Remove leading zeros
    txt = splitText[0].replace(/^0+/, "");
    if (txt === "" )
      txt = "0";
    if(splitText[1] != undefined) {
      // Validate Max allowed decimal size
      txt += '.' + splitText[1]?.substring(0, decimals);
    }
    return txt;
  }

  // updateSellBalance()
  // updateBuyBalance()

  const getAgentDialogElements = () => {
    const methods:any = {};
    methods.titleName = "Select an agent";
    methods.placeHolder = 'Agent name or paste address';;
    methods.setDlgLstElement = setValidAgentElement;
    methods.dataFeedType = FEED.AGENT_WALLETS;
    return methods;
  }

  const getBuyTokenDialogElements = () => {
    const methods:any = {};
    methods.titleName = "Select a token to buy";
    methods.placeHolder = 'Buy token name or paste address';
    methods.setDlgLstElement = setValidBuyTokenElement;
    methods.dataFeedType = FEED.TOKEN_LIST;
    return methods;
  }

  const getSellTokenDialogElements = () => {
    const methods:any = {};
    methods.titleName = "Select a token to sell";
    methods.placeHolder = 'Sell token name or paste address';
    methods.setDlgLstElement = setValidSellTokenElement;
    methods.dataFeedType = FEED.TOKEN_LIST;
    return methods;
  }

  const getRecipientDialogElements = () => {
    const methods:any = {};
    methods.titleName = "Select a recipient";
    methods.placeHolder = 'Recipient name or paste address';;
    methods.setDlgLstElement = setValidRecipientElement;
    methods.dataFeedType = FEED.RECIPIENT_WALLETS;
    return methods;
  }

// --------------------------- END NEW MODAL/DIALOG CODE -----------------------------------------------------
  function openFeedModal(feedType:string) {
    let dialog:any = document.querySelector(feedType)
    dialog.showModal();
  }

  return (
    <form>
      <SellTokenDialog dialogMethods={getSellTokenDialogElements()}/>
      <BuyTokenDialog dialogMethods={getBuyTokenDialogElements()}/>
      <RecipientDialog dialogMethods={getRecipientDialogElements()}/>
      <AgentDialog dialogMethods={getAgentDialogElements()}/>

      <div className={styles.tradeContainer}>
        <div className={styles.tradeContainerHeader}>
          <Image src={spCoin_png} className={styles.avatarImg}width={30} height={30} alt="Moralis Logo" />
          <h4 className={styles.center}>Sponsor Coin Exchange</h4>
          <Popover content={settings} title="Settings" trigger="click" placement="bottomLeft">
            <SettingOutlined className={styles.cog} />
          </Popover>
        </div>

        <div className={styles.inputs}>
          <Input id="sell-amount-id" className={styles.priceInput} placeholder="0" disabled={false} value={sellAmount}
            onChange={(e) => { validateNumericEntry(e.target.value); }} />
          <div className={styles["assetSelect"]} onClick={() => openFeedModal("#sellTokenDialog")}>
            <img alt={sellTokenElement.name} className="h-9 w-9 mr-2 rounded-md" src={sellTokenElement.img} />
            {sellTokenElement.symbol}
            <DownOutlined />
          </div>
          <div className={styles["assetBalance"]}>
            Balance: {sellBalance}
          </div>
        </div>

        <div className={styles.inputs}>
          <Input id="buy-amount-id" className={styles.priceInput} placeholder="0" disabled={true} value={parseFloat(buyAmount).toFixed(6)} />
          <div className={styles["assetSelect"]} onClick={() => openFeedModal("#buyTokenDialog")}>
            <img alt={buyTokenElement.name} className="h-9 w-9 mr-2 rounded-md" src={buyTokenElement.img} />
            {buyTokenElement.symbol}
            <DownOutlined />
          </div>
          <div className={styles["assetBalance"]}>
            Balance: {buyBalance}
          </div>
        </div>

        { connectedWalletAddr ? 
            ( <ApproveOrReviewButton token={sellTokenElement} connectedWalletAddr={connectedWalletAddr}
              onClick={() => { setFinalize(true); }} disabled={disabled} /> ) : 
            ( <CustomConnectButton /> )
        }

        <div className={styles.inputs}>
          <Input id="recipient-id" className={styles.priceInput} placeholder="Recipient" disabled={true} value={recipientElement.name}
            onChange={(e) => { validateNumericEntry(e.target.value); }} />
          <div className={styles["recipientSelect"] + " " + styles["assetSelect"]} onClick={() => openFeedModal("#recipientDialog")}>
            <img alt={recipientElement.name} className="h-9 w-9 mr-2 rounded-md" src={recipientElement.img} />
            {recipientElement.symbol}
            <DownOutlined />
          </div>
        </div>
        <div className={styles.inputs}>
          <Input id="agent-id" className={styles.priceInput} placeholder="Agent" disabled={true} value={agentElement.name}
            onChange={(e) => { validateNumericEntry(e.target.value); }} />
          <div className={styles["agentSelect"] + " " + styles["assetSelect"]} onClick={() => openFeedModal("#agentDialog")}>
            <img alt={agentElement.name} className="h-9 w-9 mr-2 rounded-md" src={agentElement.img} />
            {agentElement.symbol}
            <DownOutlined />
          </div>
        </div>

        <div className={styles.switchButton} onClick={switchTokens}>
            <ArrowDownOutlined className={styles.switchArrow} />
        </div>

        <div className="text-slate-400">
          {price && price.grossBuyAmount
            ? "Affiliate Fee: " +
                Number( formatUnits( BigInt(price.grossBuyAmount), buyTokenElement.decimals )) *
                AFFILIATE_FEE + " " + buyTokenElement.symbol
            : null}
        </div>
      </div>

      {isLoadingPrice && (
        <div className="text-center mt-2">Fetching the best price...</div>
      )}
    </form>
  );
}