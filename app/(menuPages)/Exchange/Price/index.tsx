'use client'
import styles from '../../../styles/Exchange.module.css'
import Image from 'next/image'
import spCoin_png from '../../../../public/resources/images/spCoin.png'

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
import { useBalance, useChainId, type Address, } from "wagmi";
import { watchAccount, watchNetwork, } from "@wagmi/core";
import { ArrowDownOutlined, DownOutlined, SettingOutlined, } from "@ant-design/icons";

import {
  getDefaultNetworkSettings,  
  defaultNetworkSettings
} from '../../../lib/network/initialize/defaultNetworkSettings'

import { fetchStringBalance } from '../../../lib/wagmi/api/fetchBalance'
import { TokenElement, PriceRequestParams } from '../../../lib/structure/types'
import { getNetworkName } from '@/app/lib/network/utils';

const AFFILIATE_FEE:any = process.env.NEXT_PUBLIC_AFFILIATE_FEE === undefined ? "0" : process.env.NEXT_PUBLIC_AFFILIATE_FEE
// console.debug("PRICE AFFILIATE_FEE =" + AFFILIATE_FEE)
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
    console.debug("fetcher([endpoint = " + endpoint + ",params = " + JSON.stringify(params,null,2) + "]")
    const query = qs.stringify(params);
    console.debug(`${endpoint}?${query}`);
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
  ///////////////////////////////////////////////////////////

  let chainId = useChainId();
  let networkName = getNetworkName(chainId)

  console.debug("chainId = "+chainId +"\nnetworkName = " + networkName)
  // fetch price here
  const [network, setNetwork] = useState(networkName?.toLowerCase());
  const [sellAmount, setSellAmount] = useState("0");
  const [buyAmount, setBuyAmount] = useState("0");
  const [sellBalance, setSellBalance] = useState("0");
  const [buyBalance, setBuyBalance] = useState("0");
  const [tradeDirection, setTradeDirection] = useState("sell");

  const defaultEthereumSettings = defaultNetworkSettings.ethereum
  const [sellTokenElement, setSellTokenElement] = useState<TokenElement>(defaultEthereumSettings?.defaultSellToken);
  const [buyTokenElement, setBuyTokenElement] = useState<TokenElement>(defaultEthereumSettings?.defaultBuyToken);
  const [recipientElement, setRecipientElement] = useState(defaultEthereumSettings?.defaultRecipient);
  const [agentElement, setAgentElement] = useState(defaultEthereumSettings?.defaultAgent);

  useEffect(() => {
    console.debug("sellTokenElement.symbol changed to " + sellTokenElement.name)
    updateSellBalance(sellTokenElement)
  },[sellTokenElement])

  useEffect(() => {
    // setBuyBalance(buyTokenElement.name)
    console.debug("buyTokenElement.symbol changed to " + buyTokenElement.name)
    updateBuyBalance(buyTokenElement)
  },[buyTokenElement])

  useEffect(() => {
    // setBuyBalance(buyTokenElement.name)
    let defaultNetworkSettings = getDefaultNetworkSettings(network)
    console.debug("network changed to " + network)
    updateBuyBalance(buyTokenElement)
    updateSellBalance(sellTokenElement)
  },[network])

  const unwatch = watchNetwork((network) => processNetworkChange(network))
  const unwatchAccount = watchAccount((account) => processAccountChange(account))

  const processAccountChange = ( account:any ) => {
    console.debug("APP ACCOUNT = " + JSON.stringify(account.address, null, 2))
  }

  const processNetworkChange = ( network:any ) => {
    // console.debug("APP NETWORK   = " + JSON.stringify(network, null, 2))
    // console.debug("NETWORK CHAIN = " + JSON.stringify(network?.chain, null, 2))
    // console.debug("NETWORK ID    = " + JSON.stringify(network?.chain?.id, null, 2))
    console.debug("NETWORK NAME      = " + JSON.stringify(network?.chain?.name, null, 2))
    setNetwork(network?.chain?.name.toLowerCase());
    let defaultNetworkSettings = getDefaultNetworkSettings(network?.chain?.name)
    setSellTokenElement(defaultNetworkSettings?.defaultSellToken)
    setBuyTokenElement(defaultNetworkSettings?.defaultBuyToken)
    setRecipientElement(defaultNetworkSettings?.defaultRecipient)
    setAgentElement(defaultNetworkSettings?.defaultAgent)
  }

  const updateSellBalance = async (sellTokenElement:TokenElement) => {
    let tokenAddr = sellTokenElement.address;
    let chainId = sellTokenElement.chainId
    // console.debug("updateSellBalance(wallet Address = " + connectedWalletAddr + " Token Address = "+tokenAddr+ ", chainId = " + chainId +")");
    let retResponse:any = await fetchStringBalance (connectedWalletAddr, tokenAddr, chainId)
    // console.debug("retResponse = " + JSON.stringify(retResponse))
    let sellResponse = validatePrice(retResponse.formatted, retResponse.decimals)
    setSellBalance(sellResponse)
    return {sellBalance}
  }

  const updateBuyBalance = async (buyTokenElement:TokenElement) => {
    let tokenAddr = buyTokenElement.address;
    let chainId = buyTokenElement.chainId
    // console.debug("updateBuyBalance(wallet Address = " + connectedWalletAddr + " Token Address = "+tokenAddr+ ", chainId = " + chainId +")");
    let retResponse:any = await fetchStringBalance (connectedWalletAddr, tokenAddr, chainId)
    // console.debug("retResponse = " + JSON.stringify(retResponse))
    setBuyBalance(retResponse.formatted)
    return {buyBalance}
  }

  // This code currently only works for sell buy will default to undefined
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
      "/api/"+network+"/0X/price",
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
          console.debug(formatUnits(data.buyAmount, buyTokenElement.decimals), data);
          setBuyAmount(formatUnits(data.buyAmount, buyTokenElement.decimals));
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

  const SET_BUY_TOKEN = true;
  const SET_SELL_TOKEN = false;
  let BUY_SELL_ACTION = SET_SELL_TOKEN;

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

// --------------------------- END NEW MODAL/DIALOG CODE -----------------------------------------------------
  function openFeedModal(feedType:string) {
    let dialog:any = document.querySelector(feedType)
    dialog.showModal();
  }

  return (
    <form autoComplete="off">
      <SellTokenDialog buyTokenElement={buyTokenElement} callBackSetter={setSellTokenElement} />
      <BuyTokenDialog sellTokenElement={sellTokenElement} callBackSetter={setBuyTokenElement} />
      <RecipientDialog agentElement={agentElement} callBackSetter={setRecipientElement} />
      <AgentDialog recipientElement={recipientElement} callBackSetter={setAgentElement} />

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
            ( <ApproveOrReviewButton  token={sellTokenElement} 
                                      connectedWalletAddr={connectedWalletAddr}
                                      sellBalance={sellBalance}
                                      onClick={() => { setFinalize(true); }} 
                                      disabled={disabled} /> ) : 
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