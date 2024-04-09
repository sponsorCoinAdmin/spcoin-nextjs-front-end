import { isAddress } from "ethers";
import { fetchStringBalance } from "../wagmi/fetchBalance";
import { TokenElement } from "../structure/types";
import { exchangeContext } from "../context";
import { toggleElement } from "./guiControl";
import { Address } from "viem";

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

const setValidPriceInput = (txt: string, decimals: number, setSellAmount: (txt:string) => void ) => {
  txt = validatePrice(txt, decimals);
  if (txt !== "")
    setSellAmount(txt);
  return txt;
};

const  validatePrice = (price:string, decimals:number) => {
  // Allow only numbers and '.'
  const re = /^-?\d+(?:[.,]\d*?)?$/;
  if (price === '' || re.test(price)) {
     let splitText = price.split(".");
     // Remove leading zeros
     let formattedPrice = splitText[0].replace(/^0+/, "");
     if (formattedPrice === "" )
       formattedPrice = "0";
     if(splitText[1] != undefined) {
       // Validate Max allowed decimal size
       formattedPrice += '.' + splitText[1]?.substring(0, decimals);
     }
     return formattedPrice
  } 
  return "";
 }

const getTokenDetails = async(connectedWalletAddr:any, chainId:any, tokenAddr: any, setTokenElement:any) => {
        let td:any = fetchTokenDetails(connectedWalletAddr, chainId, tokenAddr)
        if (td !== false)
          setTokenElement(td);
        return td
}

const fetchTokenDetails = async(connectedWalletAddr:any, chainId:any, tokenAddr: any) => {
  try {
      if (isAddress(tokenAddr)) {
          let retResponse:any = await fetchStringBalance (connectedWalletAddr, tokenAddr, chainId)
          // console.debug("retResponse = " + JSON.stringify(retResponse))
          // alert(JSON.stringify(retResponse,null,2))
          let td:TokenElement = {
              chainId: chainId,
              address: tokenAddr,
              symbol: retResponse.symbol,
              img: '/resources/images/miscellaneous/QuestionWhiteOnRed.png',
              name:  retResponse.symbol,
              decimals: retResponse.decimals
          }
          return td
      }
 // return ELEMENT_DETAILS
  } catch (e:any) {
      console.debug("SELL_ERROR:setTokenDetails e.message" + e.message)
  }
  return false
}

const updateBalance = async (connectedWalletAddr: Address|undefined|null, tokenElement: TokenElement, setBalance:any) => {
  let success = true;
  let balance:string = "N/A";
  let errMsg = "N/A";
  let tokenAddr = tokenElement.address;
  let chainId = tokenElement.chainId;
  console.debug("updateBalance(wallet Address = " + connectedWalletAddr + " TokenElement = " + JSON.stringify(tokenElement,null,2) + ")");
  if (connectedWalletAddr != null && connectedWalletAddr !== undefined)
  {
    let retResponse: any = await fetchStringBalance(connectedWalletAddr, tokenAddr, chainId);
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

const isSpCoin = (tokenElement:TokenElement) => {
  // alert(`isSpCoin = ${JSON.stringify(tokenElement,null,2)}`)
  return tokenElement.symbol === "SpCoin" ? true:false
}

const exchangeDataDump = () => {
  const exchangeData = JSON.stringify(exchangeContext,null,2);
  alert(exchangeData);
  toggleElement("addSponsorshipDiv")
  console.debug(exchangeData);
}

export { 
  fetchTokenDetails,
  exchangeDataDump,
  getQueryVariable,
  getTokenDetails,
  isSpCoin,
  setValidPriceInput,
  validatePrice,
  updateBalance
}
