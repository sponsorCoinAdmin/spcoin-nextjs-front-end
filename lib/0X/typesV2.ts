import { Address } from "viem";

// https://docs.0x.org/0x-api-swap/api-references/get-swap-v1-quote#response
export interface PriceResponse_Permit2 {
  chainId: number;
  price: string;
  guaranteedPrice: string;
  estimatedPriceImpact: string;
  to: Address;
  from: string;
  data: Address;
  value: string;
  gas: string;
  estimatedGas: string;
  gasPrice: string;
  grossBuyAmount: string;
  protocolFee: string;
  minimumProtocolFee: string;
  tokenToBuyAddr: string;
  tokenToSellAddr: string;
  buyAmount: string;
  sellAmount: string;
  sources: any[];
  orders: any[];
  allowanceTarget: string;
  decodedUniqueId: string;
  sellTokenToEthRate: string;
  buyTokenToEthRate: string;
  expectedSlippage: string | string | undefined;
}


// https://docs.0x.org/0x-api-swap/api-references/get-swap-v1-price#response
export default interface QuoteResponse_Permit2
 {
  blockNumber: string;
  buyAmount: string;
  buyToken: Address;
  fees: {
      integratorFee: {
          amount: string;
          token: string;
          type: string;
      };
      zeroExFee: {
          amount: string;
          token: Address;
          type: string;
      };
      gasFee: string | undefined;
  };
  issues: {
      allowance: string | undefined;
      balance: string | undefined;
      simulationIncomplete: false
      invalidSourcesPassed: string[];
  };
  liquidityAvailable: boolean;
  minBuyAmount: string;
  permit2: string | undefined;
  route: {
      fills: [
          {
              from: Address;
              to: Address;
              source: string;
              proportionBps: string;
          }
      ];
      tokens: [
          {
              address: Address;
              symbol: string;
          },
          {
              address: Address;
              symbol: string;
          }
      ]
  };
  sellAmount: string;
  sellToken: Address;
  totalNetworkFee: string;
  transaction: {
      to: Address;
      data: string;
      gas: string;
      gasPrice: string;
      value: string;
  }
}
