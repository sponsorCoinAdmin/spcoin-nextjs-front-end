'use client';
import styles from '../../../styles/Exchange.module.css';
import Image from 'next/image';
import spCoin_png from '../../../../public/resources/images/spCoin.png';
import info_png from '../../../../public/resources/images/info1.png';
import {
  openDialog,
  AgentDialog,
  RecipientDialog,
  SellTokenDialog,
  BuyTokenDialog,
  ErrorDialog
} from '../../../components/Dialogs/Dialogs';
import { Input, Popover, Radio } from "antd";
import ApproveOrReviewButton from '../../../components/Buttons/ApproveOrReviewButton';
import CustomConnectButton from '../../../components/Buttons/CustomConnectButton';
import useSWR from "swr";
import { useState, useEffect, SetStateAction } from "react";
import { formatUnits, parseUnits } from "ethers";
import { useBalance, useChainId, type Address } from "wagmi";
import { watchAccount, watchNetwork } from "@wagmi/core";
import { ArrowDownOutlined, DownOutlined, SettingOutlined } from "@ant-design/icons";
import { getDefaultNetworkSettings, defaultNetworkSettings } from '../../../lib/network/initialize/defaultNetworkSettings';
import { fetchStringBalance } from '../../../lib/wagmi/api/fetchBalance';
import { TokenElement } from '../../../lib/structure/types';
import { getNetworkName } from '@/app/lib/network/utils';
import {
  fetcher,
  BUY_AMOUNT_UNDEFINED,
  BUY_AMOUNT_ZERO,
  ERROR_0X_RESPONSE,
  SELL_AMOUNT_UNDEFINED,
  SELL_AMOUNT_ZERO
} from '@/app/lib/0X/fetcher';
import { validatePrice } from '@/app/lib/utils';
import { AFFILIATE_FEE } from '.';



export default function PriceView({
  connectedWalletAddr, price, setPrice, setFinalize,
}: {
  connectedWalletAddr: Address | undefined;
  price: any;
  setPrice: (price: any) => void;
  setFinalize: (finalize: boolean) => void;
}) {

  let chainId = useChainId();
  let networkName = getNetworkName(chainId);

  // console.debug("chainId = "+chainId +"\nnetworkName = " + networkName)
  // fetch price here
  const [network, setNetwork] = useState(networkName?.toLowerCase());
  const [sellAmount, setSellAmount] = useState("0");
  const [buyAmount, setBuyAmount] = useState("0");
  const [sellBalance, setSellBalance] = useState("0");
  const [buyBalance, setBuyBalance] = useState("0");
  const [tradeDirection, setTradeDirection] = useState("sell");

  const defaultEthereumSettings = defaultNetworkSettings.ethereum;
  const [sellTokenElement, setSellTokenElement] = useState<TokenElement>(defaultEthereumSettings?.defaultSellToken);
  const [buyTokenElement, setBuyTokenElement] = useState<TokenElement>(defaultEthereumSettings?.defaultBuyToken);
  const [recipientElement, setRecipientElement] = useState(defaultEthereumSettings?.defaultRecipient);
  const [agentElement, setAgentElement] = useState(defaultEthereumSettings?.defaultAgent);
  const [errorMessage, setErrorMessage] = useState<Error>({ name: "", message: "" });

  useEffect(() => {
    updateBuyBalance(buyTokenElement);
    updateSellBalance(sellTokenElement);
  }, [connectedWalletAddr]);

  useEffect(() => {
    console.debug("sellTokenElement.symbol changed to " + sellTokenElement.name);
    updateSellBalance(sellTokenElement);
  }, [sellTokenElement]);

  useEffect(() => {
    console.debug("buyTokenElement.symbol changed to " + buyTokenElement.name);
    updateBuyBalance(buyTokenElement);
  }, [buyTokenElement]);

  useEffect(() => {
    // alert("network changed to " + network)
    console.debug("network changed to " + network);
    let networkSettings = getDefaultNetworkSettings(network?.chain?.name);
    setSellTokenElement(networkSettings?.defaultSellToken);
    setBuyTokenElement(networkSettings?.defaultBuyToken);
    setRecipientElement(networkSettings?.defaultRecipient);
    setAgentElement(networkSettings?.defaultAgent);
    updateBuyBalance(buyTokenElement);
    updateSellBalance(sellTokenElement);
  }, [network]);

  useEffect(() => {
    // alert("Opening up errorMessage Dialog errorMessage = "+JSON.stringify(errorMessage,null,2))
    if (errorMessage.name !== "" && errorMessage.message !== "") {
      // alert("useEffect(() => errorMessage.name = " + errorMessage.name + "\nuseEffect(() => errorMessage.message = " + errorMessage.message)
      // alert('openDialog("#errorDialog")')
      openDialog("#errorDialog");
    }
  }, [errorMessage]);

  const unwatch = watchNetwork((network) => processNetworkChange(network));
  const unwatchAccount = watchAccount((account) => processAccountChange(account));

  const processAccountChange = (account: any) => {
    // console.debug("APP ACCOUNT = " + JSON.stringify(account.address, null, 2))
  };

  const processNetworkChange = (network: any) => {
    console.debug("NETWORK NAME      = " + JSON.stringify(network?.chain?.name, null, 2));
    setNetwork(network?.chain?.name.toLowerCase());
  };

  const updateSellBalance = async (sellTokenElement: TokenElement) => {
    try {
      let tokenAddr = sellTokenElement.address;
      let chainId = sellTokenElement.chainId;
      // console.debug("updateSellBalance(wallet Address = " + connectedWalletAddr + " Token Address = "+tokenAddr+ ", chainId = " + chainId +")");
      let retResponse: any = await fetchStringBalance(connectedWalletAddr, tokenAddr, chainId);
      // console.debug("retResponse = " + JSON.stringify(retResponse))
      let sellResponse = validatePrice(retResponse.formatted, retResponse.decimals);
      setSellBalance(sellResponse);
    } catch (e: any) {
      setErrorMessage({ name: "updateSellBalance: ", message: JSON.stringify(e, null, 2) });
    }
    return { sellBalance };
  };

  const updateBuyBalance = async (buyTokenElement: TokenElement) => {
    try {
      let tokenAddr = buyTokenElement.address;
      let chainId = buyTokenElement.chainId;
      // console.debug("updateBuyBalance(wallet Address = " + connectedWalletAddr + " Token Address = "+tokenAddr+ ", chainId = " + chainId +")");
      let retResponse: any = await fetchStringBalance(connectedWalletAddr, tokenAddr, chainId);
      // console.debug("retResponse = " + JSON.stringify(retResponse))
      setBuyBalance(retResponse.formatted);
    } catch (e: any) {
      setErrorMessage({ name: "updateBuyBalance: ", message: JSON.stringify(e, null, 2) });
    }
    return { buyBalance };
  };

  // This code currently only works for sell buy will default to undefined
  const parsedSellAmount = sellAmount && tradeDirection === "sell"
    ? parseUnits(sellAmount, sellTokenElement.decimals).toString()
    : undefined;

  const parsedBuyAmount = buyAmount && tradeDirection === "buy"
    ? parseUnits(buyAmount, buyTokenElement.decimals).toString()
    : undefined;

  const { isLoading: isLoadingPrice } = useSWR(
    [
      "/api/" + network + "/0X/price",
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
      onError: (error) => {
        processError(error);
      },
    }
  );

  const processError = (error: any) => {
    // alert("*** ERROR = " + error + "\n" + JSON.stringify(error, null, 2));
    let errCode: number = error.errCode;
    let errMsg: string = error.errMsg;
    if (errCode !== undefined && error !== null) {
      switch (errCode) {
        case SELL_AMOUNT_ZERO: setBuyAmount("0");
          break;
        case BUY_AMOUNT_ZERO: setValidPriceInput("0", buyTokenElement.decimals);
          break;
        case ERROR_0X_RESPONSE:
          setErrorMessage({ name: "ERROR_0X_RESPONSE: " + errCode, message: errMsg });
          console.error("ERROR: OX Response errCode = " + errCode + "\nerrMsg = " + errMsg);
          break;
        case SELL_AMOUNT_UNDEFINED:
          setErrorMessage({ name: "SELL_AMOUNT_UNDEFINED: " + errCode, message: errMsg });
          console.error("ERROR: errCode = " + errCode + "\nerrMsg = " + errMsg);
          setValidPriceInput("0", sellTokenElement.decimals);
          break;
        case BUY_AMOUNT_UNDEFINED:
          setErrorMessage({ name: "BUY_AMOUNT_UNDEFINED: " + errCode, message: errMsg });
          console.error("ERROR: errCode = " + errCode + "\nerrMsg = " + errMsg);
          setBuyAmount("0");
          break;
        default: {
          setErrorMessage({ name: "DEFAULT ERROR CODE: " + errCode, message: errMsg });
          console.error("ERROR: errCode = " + errCode + "\nerrMsg = " + errMsg);
          break;
        }
      }
    }
  };

  const { data, isError, isLoading } = useBalance({
    address: connectedWalletAddr,
    token: sellTokenElement.address,
  });

  const disabled = data && sellAmount
    ? parseUnits(sellAmount, sellTokenElement.decimals) > data.value
    : true;

  //  console.debug("data = " + JSON.stringify(data, null, 2), "\nisError = " + isError, "isLoading = " + isLoading);
  // ------------------------------ START MORALIS SCRIPT CODE
  let [slippage, setSlippage] = useState(2.5);
  function handleSlippageChange(e: { target: { value: SetStateAction<number>; }; }) {
    setSlippage(e.target.value);
  }

  const settings = (
    <div>
      <div>Slippage Tolerance</div>
      <div>
        <Radio.Group value={slippage} onChange={handleSlippageChange}>
          <Radio.Button value={0.5}>0.5%</Radio.Button>
          <Radio.Button value={2.5}>2.5%</Radio.Button>
          <Radio.Button value={5}>5.0%</Radio.Button>
        </Radio.Group>
      </div>
    </div>
  );

  function switchTokens() {
    let tmpElement: TokenElement = sellTokenElement;
    setSellTokenElement(buyTokenElement);
    setBuyTokenElement(tmpElement);
    // setSellAmount(buyAmount)
  }

  const setValidPriceInput = (txt: string, decimals: number) => {
    txt = validatePrice(txt, decimals);
    if (txt !== "")
      setSellAmount(txt);
  };


  /// START DROPDOWN STUFF
  const hideElement = (element: any) => {
    const el = document.getElementById(element);
    // alert("hideElement(" + element +")")
    // alert("el = "+el)
    // console.debug("hideElement(" + element +")")
    if (el != null) {
      el.style.display = 'none';
    }
  };

  const showElement = (element: any) => {
    const el = document.getElementById(element);
    console.debug("showElement(" + element + ")");
    if (el != null) {
      el.style.display = 'block';
    }
  };

  function setRateRatios(newRate: string) {
    var numRate = Number(newRate)
    setRecipientRatio(numRate);
    setSponsorRatio(numRate);
  }

  function setSponsorRatio(newRate: number) {
    let sponsorRatio: any = document.getElementById("sponsorRatio");
    sponsorRatio.innerHTML = +(100-(newRate*10))+"%";
  }

  function setRecipientRatio(newRate: number) {
    let recipientRatio: any = document.getElementById("recipientRatio");
    recipientRatio.innerHTML = +(newRate*10)+"%";
  }

  /// END DROP DOWN STUFF    
  return (
    <form autoComplete="off">
      <SellTokenDialog buyTokenElement={buyTokenElement} callBackSetter={setSellTokenElement} />
      <BuyTokenDialog sellTokenElement={sellTokenElement} callBackSetter={setBuyTokenElement} />
      <RecipientDialog agentElement={agentElement} callBackSetter={setRecipientElement} />
      <AgentDialog recipientElement={recipientElement} callBackSetter={setAgentElement} />
      <ErrorDialog errMsg={errorMessage} />

      <div className={styles.tradeContainer}>
        <div className={styles.tradeContainerHeader}>
          <Image src={spCoin_png} className={styles.avatarImg} width={30} height={30} alt="Moralis Logo" />
          <h4 className={styles.center}>Sponsor Coin Exchange</h4>
          <Popover content={settings} title="Settings" trigger="click" placement="bottomLeft">
            <SettingOutlined className={styles.cog} />
          </Popover>
        </div>

        <div className={styles.inputs}>
          <Input id="sell-amount-id" className={styles.priceInput} placeholder="0" disabled={false} value={sellAmount}
            onChange={(e) => { setValidPriceInput(e.target.value, sellTokenElement.decimals); }} />
          <div className={styles["assetSelect"]} onClick={() => openDialog("#sellTokenDialog")}>
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
          <div className={styles["assetSelect"]} onClick={() => openDialog("#buyTokenDialog")}>
            <img alt={buyTokenElement.name} className="h-9 w-9 mr-2 rounded-md" src={buyTokenElement.img} />
            {buyTokenElement.symbol}
            <DownOutlined />
          </div>
          <div className={styles["assetBalance"]}>
            Balance: {buyBalance}
          </div>
        </div>

        {connectedWalletAddr ?
          (<ApproveOrReviewButton token={sellTokenElement}
            connectedWalletAddr={connectedWalletAddr}
            sellBalance={sellBalance}
            onClick={() => { setFinalize(true); }}
            disabled={disabled}
            setErrorMessage={setErrorMessage} />) :
          (<CustomConnectButton />)}

        <div id="recipient" className={styles["inputs"]}>
          <div id="recipient-id" className={styles.sponsorCoinContainer}/>
          <div className={styles["yourRecipient"]}>
            You are sponsoring:
          </div>
          <div className={styles["recipientName"]}>
            {recipientElement.name}
          </div>
          <div className={styles["recipientSelect"] + " " + styles["assetSelect"]} onClick={() => openDialog("#recipientDialog")}>
            <img alt={recipientElement.name} className="h-9 w-9 mr-2 rounded-md" src={recipientElement.img} />
            {recipientElement.symbol}
            <DownOutlined />
          </div>
        </div>

        <div id="recipient" className={styles["inputs"]}>
          <div id="recipient-id" className={styles.rateRatioContainer}/>
          <div className={styles["lineDivider"]}>
          ------------------------------------------------------
          </div>
          <div className={styles["rewardRatio"]}>
            Staking Reward Ratio:
          </div>
          <Image src={info_png} className={styles["infoImg"]} width={18} height={18} alt="Info Image" />
          <div className={styles["recipientSelect"] + " " + styles["sponsorAllocation"]}>
            Sponsor:
            <div id="sponsorRatio" className={styles.dropButton}>
              50%
            </div>
          </div>
          <div className={styles["recipientSelect"] + " " + styles["recipientAllocation"]}>
            Recipient:
            <div id="recipientRatio" className={styles.dropButton}>
              50%
            </div>
          </div>
          <input type="range" className={styles["range-slider"]} min="2" max="10" 
          onChange={(e) => setRateRatios((e.target.value))}></input>
        </div>

        <div id="agent" className={styles.inputs}>
          <Input id="agent-id" className={styles.priceInput} placeholder="Agent" disabled={true} value={agentElement.name} />
          <div className={styles["agentSelect"] + " " + styles["assetSelect"]} onClick={() => openDialog("#agentDialog")}>
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
            Number(formatUnits(BigInt(price.grossBuyAmount), buyTokenElement.decimals)) *
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
