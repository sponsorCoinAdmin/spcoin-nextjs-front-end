"use client";

import styles from '@/styles/Exchange.module.css';
import { ErrorDialog } from '@/components/Dialogs/Dialogs';
import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount } from 'wagmi';
import { useEthersSigner } from '@/lib/hooks/useEthersSigner';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import {
  ErrorMessage,
  CONTAINER_TYPE,
  STATUS,
  ERROR_CODES,
  TRADE_DIRECTION
} from '@/lib/structure/types';
import { usePriceAPI } from '@/lib/0X/fetcher';
import TradeContainerHeader from '@/components/Headers/TradeContainerHeader';
import BuySellSwapArrowButton, { useBuySellSwap } from '@/components/Buttons/BuySellSwapArrowButton';
import AffiliateFee from '@/components/containers/AffiliateFee';
import PriceButton from '@/components/Buttons/PriceButton';
import FeeDisclosure from '@/components/containers/FeeDisclosure';
import {
  useBuyAmount,
  useBuyTokenContract,
  useErrorMessage,
  useExchangeContext,
  useSellAmount,
  useSellTokenContract
} from "@/lib/context/contextHooks";
import TokenSelectContainer from '@/components/containers/TokenSelectContainer';
import { mutate } from 'swr'; // ✅ NEW

export default function PriceView() {
  const { chainId } = useAccount();
  const signer = useEthersSigner();

  const { exchangeContext } = useExchangeContext();
  const tradeData = exchangeContext?.tradeData;

  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [showError, setShowError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useErrorMessage();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();
  const [containerSwapStatus, setContainerSwapStatus] = useBuySellSwap();
  const [pendingSwapAmount, setPendingSwapAmount] = useState<bigint | null>(null);

  const apiErrorCallBack = useCallback((apiErrorObj: ErrorMessage) => {
    setErrorMessage({
      errCode: apiErrorObj.errCode,
      msg: stringifyBigInt(apiErrorObj.msg),
      source: apiErrorObj.source,
      status: STATUS.ERROR_API_PRICE,
    });
    setShowError(true);
  }, [setErrorMessage]);

  // ✅ swrKey added to destructure
  const {
    isLoading: isLoadingPrice,
    data: priceData,
    error: priceError,
    swrKey
  } = usePriceAPI();

  useEffect(() => {
    if (priceError) {
      apiErrorCallBack({
        errCode: ERROR_CODES.PRICE_FETCH_ERROR,
        msg: priceError.message || 'Unknown price API error',
        source: 'PriceAPI',
        status: STATUS.ERROR_API_PRICE,
      });
    }
  }, [priceError, apiErrorCallBack]);

  useEffect(() => {
    if (!chainId || !tradeData || chainId === tradeData.chainId) return;
    // Notify user about reset
    setErrorMessage({
      errCode: ERROR_CODES.CHAIN_SWITCH,
      msg: 'Switched chains — resetting token selections and amounts.',
      source: 'ChainMonitor',
      status: STATUS.INFO,
    });
    setShowError(true);

    tradeData.chainId = chainId;
    setSellAmount(0n);
    setSellTokenContract(undefined);
    setBuyAmount(0n);
    setBuyTokenContract(undefined);
  }, [chainId, tradeData]);

  // ✅ Updated to include mutate(swrKey) after swap
  useEffect(() => {
    if (containerSwapStatus && tradeData) {
      const oldSellAmount = tradeData.sellTokenContract?.amount || 0n;

      const newSellToken = tradeData.buyTokenContract;
      const newBuyToken = tradeData.sellTokenContract;

      setPendingSwapAmount(oldSellAmount);
      setSellTokenContract(newSellToken);
      setBuyTokenContract(newBuyToken);
      setContainerSwapStatus(false);

      if (swrKey) {
        console.log('🔁 Forcing mutate', swrKey);
        mutate(swrKey, undefined, { revalidate: true }); // OR use setTimeout
      }
    }
  }, [containerSwapStatus, tradeData, swrKey]);

  useEffect(() => {
    if (pendingSwapAmount !== null && sellTokenContract) {
      setSellAmount(pendingSwapAmount);
      setPendingSwapAmount(null);
    }
  }, [sellTokenContract]);

  // Clear stale buy/sell amount while debounce is active
const previousSellToken = useRef(tradeData.sellTokenContract);
const previousBuyToken = useRef(tradeData.buyTokenContract);

useEffect(() => {
  const sellTokenChanged = previousSellToken.current?.address !== tradeData.sellTokenContract?.address;
  const buyTokenChanged = previousBuyToken.current?.address !== tradeData.buyTokenContract?.address;

  if (tradeData.tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT && (sellTokenChanged || buyTokenChanged)) {
    setBuyAmount(0n);
  }

  if (tradeData.tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN && (sellTokenChanged || buyTokenChanged)) {
    setSellAmount(0n);
  }

  previousSellToken.current = tradeData.sellTokenContract;
  previousBuyToken.current = tradeData.buyTokenContract;
}, [
  tradeData.sellTokenContract,
  tradeData.buyTokenContract,
  tradeData.tradeDirection
]);

useEffect(() => {
  const sellTokenChanged = previousSellToken.current?.address !== tradeData.sellTokenContract?.address;
  const buyTokenChanged = previousBuyToken.current?.address !== tradeData.buyTokenContract?.address;

  if (tradeData.tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT && (sellTokenChanged || buyTokenChanged)) {
    alert('[⚠️ PriceView] Resetting buy amount due to token change');
    setBuyAmount(0n);
  }

  if (tradeData.tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN && (sellTokenChanged || buyTokenChanged)) {
    alert('[⚠️ PriceView] Resetting sell amount due to token change');
    setSellAmount(0n);
  }

  previousSellToken.current = tradeData.sellTokenContract;
  previousBuyToken.current = tradeData.buyTokenContract;
}, [
  tradeData.sellTokenContract,
  tradeData.buyTokenContract,
  tradeData.tradeDirection
]);

  return (
    <div>
      <ErrorDialog showDialog={showError} />
      <div id="MainSwapContainer_ID" className={styles["mainSwapContainer"]}>
        <TradeContainerHeader />
        <TokenSelectContainer containerType={CONTAINER_TYPE.SELL_SELECT_CONTAINER} />
        <TokenSelectContainer containerType={CONTAINER_TYPE.BUY_SELECT_CONTAINER} />
        <BuySellSwapArrowButton />
        <PriceButton isLoadingPrice={isLoadingPrice} />
        <AffiliateFee priceResponse={priceData} />
      </div>
      <FeeDisclosure />
    </div>
  );
}
