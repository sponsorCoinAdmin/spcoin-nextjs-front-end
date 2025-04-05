import { isAddress, parseUnits } from "ethers";
import { getWagmiBalanceOfRec } from "@/lib/wagmi/getWagmiBalanceOfRec";
import { ExchangeContext, SWAP_TYPE, TokenContract } from "@/lib/structure/types";
import { toggleElement } from "./guiControl";
import { Address, formatUnits, getAddress } from "viem";
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils'
import { BURN_ADDRESS } from "../network/utils";

const dumpSwapState = (swapType: SWAP_TYPE) => {
  alert(SWAP_TYPE[swapType] || "UNDEFINED");
};

function getQueryVariable(_urlParams: string, _searchParam: string) {
  const vars = _urlParams.split("&");
  for (const param of vars) {
    const pair = param.split("=");
    if (pair[0] === _searchParam) return pair[1];
  }
  console.error("*** ERROR *** Search Param Not Found:", _searchParam);
  return "";
}

const getValidBigIntToFormattedValue = (value: bigint | undefined, decimals: number | undefined) => {
  decimals = decimals || 0;
  let stringValue: string = formatUnits(value || 0n, decimals);
  return parseValidFormattedAmount(stringValue, decimals);
};

const parseValidFormattedAmount = (value: string | bigint, decimals: number | undefined) => {
  decimals = decimals || 0;
  const price: string = typeof value === "string" ? value : formatUnits(value || 0n, decimals);
  const re = /^-?\d+(?:[.,]\d*?)?$/;
  if (price === '' || re.test(price)) {
    let splitText = price.split(".");
    let formattedValue: string = splitText[0].replace(/^0+/, "") || "0";
    if (splitText[1] !== undefined) {
      formattedValue += "." + splitText[1].substring(0, decimals);
    }
    return formattedValue;
  }
  return "0";
};

const setValidPriceInput = (txt: string, decimals: number, setSellAmount: (amount: bigint) => void) => {
  txt = parseValidFormattedAmount(txt, decimals);
  if (!isNaN(Number(txt))) setSellAmount(parseUnits(txt, decimals));
  return txt;
};

const getTokenDetails = async (chainId: any, tokenAddr: any, setTokenCallback: any) => {
  let tokenContract: any = await fetchTokenDetails(chainId, tokenAddr);
  if (tokenContract) setTokenCallback(tokenContract);
  return tokenContract;
};

const fetchTokenDetails = async (chainId: any, tokenAddr: Address) => {
  const tokenIconPath = `assets/blockchains/${tokenAddr}.png`;
  let tokenContract: TokenContract | undefined;
  try {
    if (isAddress(tokenAddr)) {
      let retResponse: any = await getWagmiBalanceOfRec(tokenAddr); // ✅ Fix: Removed `.then()`
      tokenContract = {
        chainId: 1,
        address: tokenAddr,
        name: retResponse.name,
        symbol: retResponse.symbol,
        amount: 0n,
        decimals: retResponse.decimals,
        balance: 0n,
        totalSupply: undefined,
        img: tokenIconPath
      };
    }
  } catch (e: any) {
    console.error("SELL_ERROR: fetchTokenDetails:", e.message);
  }
  return tokenContract;
};

const updateBalance = async (connectedAccountAddr: Address | undefined | null, tokenContract: TokenContract, setBalance: any) => {
  let success = false;
  let balance: string = "N/A";
  let errMsg = "N/A";

  if (connectedAccountAddr) {
    try {
      let retResponse: any = await getWagmiBalanceOfRec(tokenContract.address);
      balance = retResponse.formatted;
      setBalance(balance);
      success = true;
    } catch (error) {
      console.error("Error fetching balance:", error);
      errMsg = "Error fetching balance";
    }
  } else {
    errMsg = "Wallet Connection Required for Balance";
  }

  return { success, errMsg, balance };
};

const isSpCoin = (tokenContract: TokenContract | undefined) => tokenContract?.symbol === "SpCoin";

const exchangeContextDump = (exchangeContext: ExchangeContext) => {
  const exchangeData = stringifyBigInt(exchangeContext);
  alert(exchangeData);
  toggleElement("AddSponsorshipButton_ID");
  console.log(exchangeData);
};

function decimalAdjustTokenAmount(amount: bigint, newTokenContract: TokenContract | undefined, prevTokenContract: TokenContract | undefined) {
  const decimalShift: number = (newTokenContract?.decimals || 0) - (prevTokenContract?.decimals || 0);
  return bigIntDecimalShift(amount, decimalShift);
}

const bigIntDecimalShift = (value:bigint, decimalShift:number) => {
  // alert(`bigIntDecimalShift = value=${value.toString()}\n decimalShift = ${decimalShift}`)
  return  decimalShift === 0 ? BigInt(value) :
          decimalShift >= 0 ? BigInt(value) * BigInt(10**(Math.abs(decimalShift))) :
          BigInt(value) / BigInt(10**(Math.abs(decimalShift)));
}


const getValidAddress = (addrType: any, chainId?: number) => {
  try {
    return getAddress(addrType.trim(), chainId);
  } catch (err: any) {
    if (process.env.NEXT_PUBLIC_DEBUG === "true") {
      console.error(`ERROR: getAddress(${addrType}, ${chainId})`, err.message);
    }
    return undefined;
  }
};

const invalidTokenContract = (textInputField: string | undefined, chainId: number):TokenContract|undefined => {
  return textInputField
    ? {
      chainId,
      address: BURN_ADDRESS,
      name: "Invalid Network/Token Address",
      symbol: "Please Enter Valid Token Address",
      decimals: undefined,
      balance: 0n,
      totalSupply: undefined,
      img: undefined,
      amount: 0n
    }
    : undefined;
};

const logAlert = (obj: any, name: string = "", logAlert: boolean = false, logConsole: boolean = true): string => {
  const objStr = name ? `${name}: ${stringifyBigInt(obj)}` : stringifyBigInt(obj);
  if (logConsole) console.debug(objStr);
  if (logAlert) alert(objStr);
  return objStr;
};

const getPublicFileUrl = (fileName: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_BASE_URL is not defined in environment variables.");
  return `${baseUrl}/${fileName}`;
};

export {
  decimalAdjustTokenAmount,
  bigIntDecimalShift,
  dumpSwapState,
  exchangeContextDump,
  fetchTokenDetails,
  getPublicFileUrl,
  getValidAddress,
  getValidBigIntToFormattedValue,
  parseValidFormattedAmount,
  getQueryVariable,
  getTokenDetails,
  invalidTokenContract,
  isSpCoin,
  logAlert,
  setValidPriceInput,
  updateBalance
};
