import { isAddress, parseUnits } from "ethers";
import { getWagmiBalanceOfRec, readContractBalanceOf } from "@/lib/wagmi/getWagmiBalanceOfRec";
import { TokenContract } from "@/lib/structure/types";
import { toggleElement } from "./guiControl";
import { Address, formatUnits } from "viem";
import { exchangeContext } from "../context";

function getQueryVariable(_urlParams:string, _searchParam:string)
{
  console.debug("Searching " + _searchParam + " in _urlParams " + _urlParams)
   var vars = _urlParams.split("&");
   for (var i=0; i<vars.length; i++) {
           var pair = vars[i].split("=");
           if(pair[0] == _searchParam){
            console.debug("FOUND Search Param " + _searchParam + ": " + pair[1])
            return pair[1];
          }
   }
   console.debug("*** ERROR *** Search Param " + _searchParam + " Not Found")
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
  console.debug(`$$$$$$$$$$$ 2. setValidPriceInput txt value = ${txt}`)
  txt = getValidFormattedPrice(txt, decimals);
  if (txt !== "")
    setSellAmount(parseUnits(txt,decimals));
  return txt;
};

const getTokenDetails = async(connectedAccountAddr:any, chainId:any, tokenAddr: any, setTokenContract:any) => {
  let td:any = fetchTokenDetails(connectedAccountAddr, chainId, tokenAddr)
  if (td !== false)
    setTokenContract(td);
  return td
}

const fetchTokenDetails = async(connectedAccountAddr:any, chainId:any, tokenAddr: any) => {
  try {
    if (isAddress(tokenAddr)) {
      let retResponse:any = await getWagmiBalanceOfRec (tokenAddr)
      // console.debug("retResponse = " + JSON.stringify(retResponse))
      // alert(JSON.stringify(retResponse,null,2))
      let td:TokenContract = {
        chainId: chainId,
        address: tokenAddr,
        symbol: retResponse.symbol,
        img: '/resources/images/miscellaneous/QuestionWhiteOnRed.png',
        name: retResponse.symbol,
        decimals: retResponse.decimals,
        totalSupply: undefined
      }
      return td
    }
 // return ELEMENT_DETAILS
  } catch (e:any) {
      console.debug("SELL_ERROR:setTokenDetails e.message" + e.message)
  }
  return false
}

const updateBalance = async (connectedAccountAddr: Address|undefined|null, TokenContract: TokenContract, setBalance:any) => {
  let success = true;
  let balance:string = "N/A";
  let errMsg = "N/A";
  let tokenAddr = TokenContract.address;
  console.debug("updateBalance(wallet Address = " + connectedAccountAddr + " TokenContract = " + JSON.stringify(TokenContract,null,2) + ")");
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

const isSpCoin = (TokenContract:TokenContract) => {
  // alert(`isSpCoin = ${JSON.stringify(TokenContract,null,2)}`)
  return TokenContract.symbol === "SpCoin" ? true:false
}

const stringifyBigInt = (obj:any) => {
  return JSON.stringify(obj, (_, v) => typeof v === 'bigint' ? v.toString() : v,2)
}

const exchangeContextDump = () => {
  const exchangeData = stringifyBigInt(exchangeContext);
  alert(exchangeData);
  toggleElement("addSponsorshipDiv_ID");
  console.debug(exchangeData);
}

function decimalAdjustTokenAmount(amount:bigint, newTokenContract: TokenContract, prevTokenContract: TokenContract) {
  let msg = `>>>>>>>>>>>> decimalAdjustTokenAmount:TRANSACTION_TYPE = transactionType <<<<<<<<<<<<`;
  msg += `newTokenContract = ${stringifyBigInt(newTokenContract)}\n`
  msg += `prevTokenContract = ${stringifyBigInt(prevTokenContract)}\n`
  msg += `amount=${amount}\n`
  const decimalShift:number = (newTokenContract.decimals || 0) - (prevTokenContract.decimals || 0);
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

export {
  decimalAdjustTokenAmount,
  bigIntDecimalShift,
  exchangeContextDump,
  fetchTokenDetails,
  getValidBigIntToFormattedPrice,
  getValidFormattedPrice,
  getQueryVariable,
  getTokenDetails,
  isSpCoin,
  setValidPriceInput,
  stringifyBigInt,
  updateBalance
}
