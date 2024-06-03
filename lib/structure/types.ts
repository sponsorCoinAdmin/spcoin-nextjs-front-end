import { Address } from "viem"

type TokenContract = {
    chainId : number | undefined,
    address : Address | undefined,
    name :string | undefined,
    symbol :string | undefined,
    totalSupply : any
    decimals : any,
    img: string | undefined;
  }
  
  type ContractRecs = {
    nameRec:any,
    symbolRec:any,
    decimalRec:any,
    totalSupplyRec:any
  }

  export type{
    TokenContract,
    ContractRecs
  }