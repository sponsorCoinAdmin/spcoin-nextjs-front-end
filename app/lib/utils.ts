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

export { 
  getQueryVariable,
  validatePrice }
