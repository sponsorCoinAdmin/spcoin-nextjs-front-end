import { Address } from "viem"

type TokenContract = {
  chainId : number | undefined,
  address : any,
  name :string | undefined,
  symbol :string | undefined,
  decimals : any,
  totalSupply : any
  img: string | undefined;
}

/*
type TokenContract = {
  chainId : number | undefined,
  address : Address | undefined,
  name :string | undefined,
  symbol :string | undefined,
  decimals : any,
  totalSupply : any
  img: string | undefined;
}
*/

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