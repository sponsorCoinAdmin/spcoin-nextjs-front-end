import { useEffect, useRef } from 'react';
import { TRADE_DIRECTION, HARDHAT, STATUS } from '@/lib/structure';
import useSWR from 'swr';
import {
  useApiErrorMessage,
  useBuyAmount,
  useErrorMessage,
  useExchangeContext,
  useSellAmount,
  useTradeData,
} from '@/lib/context/hooks';
import { useMapAccountAddrToWethAddr } from '../network/utils';
import { Address } from 'viem';
import { useAccount, useChainId } from 'wagmi';

const API_PROVIDER = '1Inch/';
const NEXT_PUBLIC_API_SERVER = process.env.NEXT_PUBLIC_API_SERVER + API_PROVIDER;
const apiPriceBase = '/quote';

const WRAPPED_ETHEREUM_ADDRESS: Address = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000';

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
  const { address: userAddress } = useAccount();
  const [errorMessage] = useErrorMessage();
  const [apiErrorMessage, setApiErrorMessage] = useApiErrorMessage();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [sellAmount] = useSellAmount();

  const rawSellTokenAddress = tradeData.sellTokenContract?.address;
  const rawBuyTokenAddress = tradeData.buyTokenContract?.address;

  const mappedSellTokenAddress = useMapAccountAddrToWethAddr(
    rawSellTokenAddress ?? ZERO_ADDRESS
  );

  const mappedBuyTokenAddress = useMapAccountAddrToWethAddr(
    rawBuyTokenAddress ?? ZERO_ADDRESS
  );

  const slippagePercentage = Number.isFinite(tradeData.slippageBps)
    ? (tradeData.slippageBps! / 100).toString()
    : '1';

  const shouldFetch =
    !!rawSellTokenAddress &&
    !!rawBuyTokenAddress &&
    mappedSellTokenAddress !== mappedBuyTokenAddress &&
    sellAmount > 0n &&
    !!userAddress &&
    chainId !== HARDHAT;

  const swrKey = shouldFetch
    ? [
        `${NEXT_PUBLIC_API_SERVER}${apiPriceBase}?chainId=${chainId}` +
          `&fromTokenAddress=${mappedSellTokenAddress}` +
          `&toTokenAddress=${mappedBuyTokenAddress}` +
          `&amount=${sellAmount.toString()}` +
          `&fromAddress=${userAddress}` +
          `&slippage=${slippagePercentage}`,
      ]
    : null;

  useWhyDidYouUpdate('usePriceAPI_1inch', {
    tradeData,
    chainId,
    rawSellTokenAddress,
    rawBuyTokenAddress,
    sellAmount,
    buyAmount,
    errorMessage,
    apiErrorMessage,
    swrKey,
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
        source: '1inchFetcher',
        errCode: error.code ?? 500,
        msg: error,
      });
    },
  });
}

export { usePriceAPI };
