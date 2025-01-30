import { isAddress, parseUnits } from "ethers";
import { getWagmiBalanceOfRec, readContractBalanceOf } from "@/lib/wagmi/getWagmiBalanceOfRec";
import { SWAP_TYPE, TokenContract } from "@/lib/structure/types";
import { toggleElement } from "./guiControl";
import { Address, formatUnits, getAddress } from "viem";
import { exchangeContext } from "../context";
import { stringifyBigInt } from '../../../node_modules-dev/spcoin-common/spcoin-lib/utils';

const defaultMissingImage = '/resources/images/miscellaneous/QuestionBlackOnRed.png';

const dumpSwapState = (swapType:SWAP_TYPE) => {
  switch (swapType) {
    case SWAP_TYPE.SWAP:
      alert(`SWAP`)
      break
    case SWAP_TYPE.SWAP_UNWRAP:
      alert(`SWAP_UNWRAP`)
      break
    case SWAP_TYPE.UNWRAP:
      alert(`UNWRAP`)
      break
    case SWAP_TYPE.WRAP_SWAP:
      alert(`WRAP_SWAP`)
      break
    case SWAP_TYPE.WRAP:
      alert(`WRAP`)
      break
    case SWAP_TYPE.UNDEFINED:
      alert(`UNDEFINED`)
      break
    }
}

function getQueryVariable(_urlParams:string, _searchParam:string)
{
  // console.debug("Searching " + _searchParam + " in _urlParams " + _urlParams)
   var vars = _urlParams.split("&");
   for (var i=0; i<vars.length; i++) {
           var pair = vars[i].split("=");
           if(pair[0] == _searchParam){
            // console.debug("FOUND Search Param " + _searchParam + ": " + pair[1])
            return pair[1];
          }
   }
   console.error("*** ERROR *** Search Param " + _searchParam + " Not Found")
   return "";
}

const getValidBigIntToFormattedPrice = (value:bigint | undefined, decimals:number|undefined) => {
  decimals = decimals || 0;
  let stringValue:string = formatUnits(value || 0n, decimals);
  stringValue = getValidFormattedPrice(stringValue, decimals);
  return stringValue;
}

const  getValidFormattedPrice = (value:string|bigint, decimals:number|undefined) => {
  decimals = decimals || 0;
  const price:string = (typeof value === "string") ? value : 
                       (typeof value === "bigint") ? formatUnits(value || 0n, decimals) : 
                       "0";
 
  // Allow only numbers and '.'
  const re = /^-?\d+(?:[.,]\d*?)?$/;
  // alert(`2. price = ${price}`)
  if (price === '' || re.test(price)) {
    let splitText = price.split(".");
    // Remove leading zeros
    let formattedPrice = splitText[0].replace(/^0+/, "");
    if (formattedPrice === "" )
      formattedPrice = "0";
    if(splitText[1] != undefined) {
      // Validate Max allowed decimal size
      formattedPrice += '.' + splitText[1].substring(0, decimals || 0);
    }
    //  alert(`3. formattedPrice = ${formattedPrice}`)
    return formattedPrice
  } 
  return "0";
}

const setValidPriceInput = (txt: string, decimals: number, setSellAmount: (txt:bigint) => void ) => {
  // console.debug(`$$$$$$$$$$$ 2. setValidPriceInput txt value = ${txt}`)
  txt = getValidFormattedPrice(txt, decimals);
  if (txt !== "")
    setSellAmount(parseUnits(txt,decimals));
  return txt;
};

const getTokenDetails = async(chainId:any, tokenAddr: any, setTokenCallback:any) => {
  let tokenContract:any = fetchTokenDetails(chainId, tokenAddr)
  if (tokenContract)
    setTokenCallback(tokenContract);
  return tokenContract
}

const fetchTokenDetails = async(chainId:any, tokenAddr: any) => {
  const tokenIconPath = `/resources/images/tokens/${tokenAddr}.png`;
  let tokenContract:TokenContract|undefined;
  try {
    if (isAddress(tokenAddr)) {
      let retResponse:any = await getWagmiBalanceOfRec (tokenAddr).then()
      // console.debug("retResponse = " + JSON.stringify(retResponse))
      // alert(JSON.stringify(retResponse,null,2))
      tokenContract = {
        chainId: chainId,
        address: tokenAddr,
        name: retResponse.name,
        symbol: retResponse.symbol,
        decimals: retResponse.decimals,
        totalSupply: undefined,
        img: tokenIconPath
      }
    }
  // return ELEMENT_DETAILS
  } catch (e:any) {
      console.error("SELL_ERROR:setTokenDetails e.message" + e.message)
  }
  return tokenContract
}

const updateBalance = async (connectedAccountAddr: Address|undefined|null, TokenContract: TokenContract, setBalance:any) => {
  let success = true;
  let balance:string = "N/A";
  let errMsg = "N/A";
  let tokenAddr = TokenContract.address;
  // console.debug("updateBalance(wallet Address = " + connectedAccountAddr + " TokenContract = " + JSON.stringify(TokenContract,null,2) + ")");
  if (connectedAccountAddr != null && connectedAccountAddr !== undefined)
  {
    let retResponse: any = await getWagmiBalanceOfRec(tokenAddr);

    // TESTING FIX UP
    // readContractBalanceOf(tokenAddr)
    // END TESTING
    // console.debug("retResponse = " + JSON.stringify(retResponse))
    balance = retResponse.formatted;
    setBalance(balance);
  }
  else {
    errMsg = "Wallet Connection Required for Balance"
    success = true
  }
  return {success, errMsg, balance} ;
};

const isSpCoin = (TokenContract:TokenContract|undefined) => {
  // alert(`isSpCoin = ${JSON.stringify(TokenContract,null,2)}`)
  return TokenContract?.symbol === "SpCoin" ? true:false
}

const exchangeContextDump = () => {
  const exchangeData = stringifyBigInt(exchangeContext);
  alert(exchangeData);
  toggleElement("AddSponsorshipButton_ID");
  console.log(exchangeData);
}

function decimalAdjustTokenAmount(amount:bigint, newTokenContract: TokenContract|undefined, prevTokenContract: TokenContract|undefined) {
  let msg = `>>>>>>>>>>>> decimalAdjustTokenAmount:TRANSACTION_TYPE = transactionType <<<<<<<<<<<<`;
  msg += `newTokenContract = ${stringifyBigInt(newTokenContract)}\n`
  msg += `prevTokenContract = ${stringifyBigInt(prevTokenContract)}\n`
  msg += `amount=${amount}\n`
  const decimalShift:number = (newTokenContract?.decimals || 0) - (prevTokenContract?.decimals || 0);
  const adjustedAmount:bigint = bigIntDecimalShift(amount , decimalShift);
  msg += `decimalShift=${decimalShift}\n`
  msg += `adjustedAmount=${adjustedAmount}\n`
  msg += `tradeData = ${stringifyBigInt(exchangeContext.tradeData)}`
  // alert(msg)
  return adjustedAmount;
}

const bigIntDecimalShift = (value:bigint, decimalShift:number) => {
  // alert(`bigIntDecimalShift = value=${value.toString()}\n decimalShift = ${decimalShift}`)
  return  decimalShift === 0 ? BigInt(value) :
          decimalShift >= 0 ? BigInt(value) * BigInt(10**(Math.abs(decimalShift))) :
          BigInt(value) / BigInt(10**(Math.abs(decimalShift)));
}

const getValidAddress = (addrType:any, chainId?:number) => {
  try {
      return getAddress(addrType.trim(), chainId)
  }
  catch (err:any) {
      console.log(`ERROR: getAddress(${addrType})`)
      console.log(err.message)
      // alert(err.message)
      return undefined
  }
}

async function fetchIconResource(tokenContract:TokenContract,
  setTokenContractCallBack:(tokenContract:TokenContract) => void) {
  const tokenIconPath = `/resources/images/tokens/${tokenContract.address}.png`
  // alert(`BEFORE: TokenSelectDialog:fetchIconResource(${tokenIconPath})`)
  const res = await fetch(tokenIconPath || "")
  if (res.ok) {
    tokenContract.img = tokenIconPath;
    setTokenContractCallBack(tokenContract)
  } 
  else {
    // alert(`ERROR: fetchIconResource(${contractAddress})`)
    tokenContract.img = defaultMissingImage;
    setTokenContractCallBack(tokenContract)
  }
}

const invalidTokenContract   = (textInputField:string|undefined, chainId:any) => {
  const INVALID_TOKEN_NAME   = "Invalid Network/Token Address";
  const INVALID_TOKEN_SYMBOL = "Please Enter Valid Token Address";
  const invalidToken:TokenContract|undefined = (!textInputField) ? undefined :
                                               {
                                                 chainId: chainId,
                                                 address:textInputField,
                                                 name:INVALID_TOKEN_NAME,
                                                 symbol:INVALID_TOKEN_SYMBOL,
                                                 decimals:undefined,
                                                 totalSupply:undefined,
                                                 img:defaultMissingImage
                                               }
  return invalidToken;
}

const dumpContext = (isAlert:boolean = false, isConsoleDebug:boolean=true) => {
  if (isAlert)
    alert(`ExchangeButton:dumpContext exchangeContext = ${stringifyBigInt(exchangeContext)}`);
  if (isConsoleDebug)
    console.log(`ExchangeButton:dumpContext exchangeContext = ${stringifyBigInt(exchangeContext)}`);
}

// const useActiveAccountAddress = () => {
//   const activeAccountAddress = useAccount().address;
//   return activeAccountAddress;
// }

// const isActiveNetworkAddress = (address:Address|undefined) => {
//   const activeAccountAddress = useAccount().address;
//   return (address === activeAccountAddress);
// }

export {
  decimalAdjustTokenAmount,
  defaultMissingImage,
  bigIntDecimalShift,
  dumpContext,
  dumpSwapState,
  exchangeContextDump,
  fetchIconResource,
  fetchTokenDetails,
  // useActiveAccountAddress,
  getValidAddress,
  getValidBigIntToFormattedPrice,
  getValidFormattedPrice,
  getQueryVariable,
  getTokenDetails,
  invalidTokenContract,
  // isActiveNetworkAddress,
  isSpCoin,
  setValidPriceInput,
  updateBalance
}
