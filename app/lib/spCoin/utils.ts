import { isAddress } from "ethers";
import { fetchStringBalance } from "../wagmi/fetchBalance";
import { TokenElement } from "../structure/types";

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

const getTokenDetails = async(connectedWalletAddr:any, chainId:any, tokenAddr: any, setTokenElement:any) => {
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
              name: '',
              decimals: retResponse.decimals
          }
          setTokenElement(td);
          return td
      }
 // return ELEMENT_DETAILS
  } catch (e:any) {
      console.debug("SELL_ERROR:setTokenDetails e.message" + e.message)
  }
  return false
}


export { 
  getQueryVariable,
  validatePrice,
  setRateRatios,
  setSponsorRatio,
  setRecipientRatio,
  getTokenDetails
 }
