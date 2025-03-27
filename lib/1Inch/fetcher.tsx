import { useEffect, useRef } from 'react';
import { TRADE_DIRECTION, HARDHAT, STATUS } from '@/lib/structure/types';
import useSWR from 'swr';
import {
  useApiErrorMessage,
  useBuyAmount,
  useErrorMessage,
  useExchangeContext,
  useSellAmount,
  useTradeData
} from '@/lib/context/contextHooks';
import { useIsActiveAccountAddress, useMapAccountAddrToWethAddr } from '../network/utils';
import { Address } from 'viem';
import { useChainId } from "wagmi";

const ONE_INCH_API_BASE = 'https://api.1inch.io/v5.0';
const WRAPPED_ETHEREUM_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

const validTokenOrNetworkCoin = (address: Address, isActiveAccount: boolean): Address => {
  return isActiveAccount ? WRAPPED_ETHEREUM_ADDRESS : address;
};

const fetcher = async ([url]: [string]) => {
  console.log(`[1inch Fetch] ${url}`);
  const response = await fetch(url);
  return response.json();
};

function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previousProps = useRef(props);

  useEffect(() => {
    const allKeys = Object.keys({ ...previousProps.current, ...props });
    const changesObj: Record<string, { from: any; to: any }> = {};

    allKeys.forEach((key) => {
      if (previousProps.current[key] !== props[key]) {
        changesObj[key] = {
          from: previousProps.current[key],
          to: props[key],
        };
      }
    });

    if (Object.keys(changesObj).length) {
      console.log(`[why-did-you-update] ${name}`, changesObj);
    }

    previousProps.current = props;
  });
}

function usePriceAPI() {
  const { exchangeContext } = useExchangeContext();
  const tradeData = useTradeData();
  const chainId = useChainId();
  const [errorMessage] = useErrorMessage();
  const [apiErrorMessage, setApiErrorMessage] = useApiErrorMessage();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [sellAmount] = useSellAmount();

  let sellTokenAddress = tradeData.sellTokenContract?.address;
  let buyTokenAddress = tradeData.buyTokenContract?.address;
  const userAddress = exchangeContext.activeAccountAddress as Address;

  const isActiveSellAccount = useIsActiveAccountAddress(sellTokenAddress as Address);
  const isActiveBuyAccount = useIsActiveAccountAddress(buyTokenAddress as Address);

  sellTokenAddress = useMapAccountAddrToWethAddr(validTokenOrNetworkCoin(sellTokenAddress as Address, isActiveSellAccount));
  buyTokenAddress = useMapAccountAddrToWethAddr(validTokenOrNetworkCoin(buyTokenAddress as Address, isActiveBuyAccount));

  const shouldFetch = sellTokenAddress && buyTokenAddress && sellTokenAddress !== buyTokenAddress && sellAmount !== 0n && userAddress && chainId !== HARDHAT;

  const slippagePercentage = Number.isFinite(tradeData.slippageBps) ? (tradeData.slippageBps! / 100).toString() : '1';

  const swrKey = shouldFetch
    ? [`${ONE_INCH_API_BASE}/${chainId}/swap?fromTokenAddress=${sellTokenAddress}&toTokenAddress=${buyTokenAddress}&amount=${sellAmount.toString()}&fromAddress=${userAddress}&slippage=${slippagePercentage}`]
    : null;

  useWhyDidYouUpdate('usePriceAPI_1inch', {
    tradeData,
    chainId,
    sellTokenAddress,
    buyTokenAddress,
    sellAmount,
    buyAmount,
    errorMessage,
    apiErrorMessage,
    swrKey
  });

  return useSWR(swrKey, fetcher, {
    onSuccess: (data) => {
      console.log(`[1inch SUCCESS]`, data);

      if (data?.toTokenAmount) {
        setBuyAmount(BigInt(data.toTokenAmount));
      }
    },
    onError: (error) => {
      setApiErrorMessage({
        status: STATUS.ERROR_API_PRICE,
        source: "1inchFetcher",
        errCode: error.code,
        msg: error,
      });
    },
  });
}

export { usePriceAPI };
