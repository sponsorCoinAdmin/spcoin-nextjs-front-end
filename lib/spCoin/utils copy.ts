import { useEffect } from "react";
import { isAddress, parseUnits } from "ethers";
import { getWagmiBalanceOfRec, readContractBalanceOf } from "@/lib/wagmi/getWagmiBalanceOfRec";
import { SWAP_TYPE, TokenContract } from "@/lib/structure/types";
import { toggleElement } from "./guiControl";
import { Address, formatUnits, getAddress } from "viem";
import { useExchangeContext } from "../context/ExchangeContext";
import { stringifyBigInt } from "../../../node_modules-dev/spcoin-common/spcoin-lib-es6/utils";
import { BURN_ADDRESS } from "../network/utils";

const dumpSwapState = (swapType: SWAP_TYPE) => {
  switch (swapType) {
    case SWAP_TYPE.SWAP:
      alert(`SWAP`);
      break;
    case SWAP_TYPE.SWAP_UNWRAP:
      alert(`SWAP_UNWRAP`);
      break;
    case SWAP_TYPE.UNWRAP:
      alert(`UNWRAP`);
      break;
    case SWAP_TYPE.WRAP_SWAP:
      alert(`WRAP_SWAP`);
      break;
    case SWAP_TYPE.WRAP:
      alert(`WRAP`);
      break;
    case SWAP_TYPE.UNDEFINED:
      alert(`UNDEFINED`);
      break;
  }
};

function getQueryVariable(_urlParams: string, _searchParam: string) {
  // console.debug("Searching " + _searchParam + " in _urlParams " + _urlParams)
  var vars = _urlParams.split("&");
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if (pair[0] == _searchParam) {
      // console.debug("FOUND Search Param " + _searchParam + ": " + pair[1])
      return pair[1];
    }
  }
  console.error("*** ERROR *** Search Param " + _searchParam + " Not Found");
  return "";
}

const getValidBigIntToFormattedPrice = (value: bigint | undefined, decimals: number | undefined) => {
  decimals = decimals || 0;
  let stringValue: string = formatUnits(value || 0n, decimals);
  stringValue = getValidFormattedPrice(stringValue, decimals);
  return stringValue;
};

const getValidFormattedPrice = (value: string | bigint, decimals: number | undefined) => {
  decimals = decimals || 0;
  const price: string =
    typeof value === "string" ? value : typeof value === "bigint" ? formatUnits(value || 0n, decimals) : "0";

  // Allow only numbers and '.'
  const re = /^-?\d+(?:[.,]\d*?)?$/;
  // alert(`2. price = ${price}`)
  if (price === "" || re.test(price)) {
    let splitText = price.split(".");
    // Remove leading zeros
    let formattedPrice: string = splitText[0].replace(/^0+/, "");
    if (formattedPrice === "") formattedPrice = "0";
    if (splitText[1] != undefined) {
      // Validate Max allowed decimal size
      formattedPrice += "." + splitText[1].substring(0, decimals || 0);
    }
    // alert(`3. formattedPrice = ${formattedPrice}`)
    return formattedPrice;
  }
  return "0";
};

const setValidPriceInput = (txt: string, decimals: number, setSellAmount: (txt: bigint) => void) => {
  // console.debug(`$$$$$$$$$$$ 2. setValidPriceInput txt value = ${txt}`)
  txt = getValidFormattedPrice(txt, decimals);
  if (txt !== "") setSellAmount(parseUnits(txt, decimals));
  return txt;
};

const getTokenDetails = async (chainId: any, tokenAddr: any, setTokenCallback: any) => {
  let tokenContract: any = fetchTokenDetails(chainId, tokenAddr);
  if (tokenContract) setTokenCallback(tokenContract);
  return tokenContract;
};

const fetchTokenDetails = async (chainId: any, tokenAddr: Address) => {
  const tokenIconPath = `assets/blockchains/${tokenAddr}.png`;
  let tokenContract: TokenContract | undefined;
  try {
    if (isAddress(tokenAddr)) {
      let retResponse: any = await getWagmiBalanceOfRec(tokenAddr).then();
      // console.debug("retResponse = " + JSON.stringify(retResponse))
      // alert(JSON.stringify(retResponse,null,2))
      tokenContract = {
        chainId: chainId,
        address: tokenAddr,
        name: retResponse.name,
        symbol: retResponse.symbol,
        decimals: retResponse.decimals,
        balance: 0n,
        totalSupply: undefined,
        img: tokenIconPath,
      };
    }
  } catch (e: any) {
    console.error("SELL_ERROR:setTokenDetails e.message" + e.message);
  }
  return tokenContract;
};

const exchangeContextDump = () => {
  const { exchangeContext } = useExchangeContext();
  const exchangeData = stringifyBigInt(exchangeContext);
  alert(exchangeData);
  toggleElement("AddSponsorshipButton_ID");
  console.log(exchangeData);
};

function decimalAdjustTokenAmount(amount: bigint, newTokenContract: TokenContract | undefined, prevTokenContract: TokenContract | undefined) {
  const { exchangeContext } = useExchangeContext();
  let msg = `>>>>>>>>>>>> decimalAdjustTokenAmount:TRANSACTION_TYPE = transactionType <<<<<<<<<<<<`;
  msg += `newTokenContract = ${stringifyBigInt(newTokenContract)}\n`;
  msg += `prevTokenContract = ${stringifyBigInt(prevTokenContract)}\n`;
  msg += `amount=${amount}\n`;
  const decimalShift: number = (newTokenContract?.decimals || 0) - (prevTokenContract?.decimals || 0);
  const adjustedAmount: bigint = bigIntDecimalShift(amount, decimalShift);
  msg += `decimalShift=${decimalShift}\n`;
  msg += `adjustedAmount=${adjustedAmount}\n`;
  msg += `tradeData = ${stringifyBigInt(exchangeContext.tradeData)}`;
  return adjustedAmount;
}

const bigIntDecimalShift = (value: bigint, decimalShift: number) => {
  return decimalShift === 0
    ? BigInt(value)
    : decimalShift >= 0
    ? BigInt(value) * BigInt(10 ** Math.abs(decimalShift))
    : BigInt(value) / BigInt(10 ** Math.abs(decimalShift));
};

const getValidAddress = (addrType: any, chainId?: number) => {
  try {
    return getAddress(addrType.trim(), chainId);
  } catch (err: any) {
    console.log(`ERROR: getAddress(${addrType})`);
    console.log(err.message);
    return undefined;
  }
};

const dumpContext = (isAlert: boolean = false, isConsoleDebug: boolean = true) => {
  const { exchangeContext } = useExchangeContext();
  if (isAlert) alert(`ExchangeButton:dumpContext exchangeContext = ${stringifyBigInt(exchangeContext)}`);
  if (isConsoleDebug) console.log(`ExchangeButton:dumpContext exchangeContext = ${stringifyBigInt(exchangeContext)}`);
};

export {
  decimalAdjustTokenAmount,
  bigIntDecimalShift,
  dumpContext,
  dumpSwapState,
  exchangeContextDump,
  fetchTokenDetails,
  getValidAddress,
  getValidBigIntToFormattedPrice,
  getValidFormattedPrice,
  getQueryVariable,
  getTokenDetails,
  isSpCoin,
  setValidPriceInput,
  stringifyBigInt,
};
