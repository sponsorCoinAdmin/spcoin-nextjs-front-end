'use client';

import styles from '@/styles/Exchange.module.css';
import { ErrorDialog } from '@/components/Dialogs/Dialogs';
import { useState, useEffect, useCallback, useRef } from 'react';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import {
  ErrorMessage,
  CONTAINER_TYPE,
  STATUS,
  ERROR_CODES,
  TRADE_DIRECTION,
} from '@/lib/structure/types';
import { usePriceAPI } from '@/lib/0X/hooks/usePriceAPI.ts';
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
  useSellTokenContract,
} from '@/lib/context/contextHooks';
import TokenSelectContainer from '@/components/containers/TokenSelectContainer';
import { mutate } from 'swr';

export default function PriceView() {
  const { exchangeContext } = useExchangeContext();
  const tradeData = exchangeContext?.tradeData;

  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useErrorMessage();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();
  const [containerSwapStatus, setContainerSwapStatus] = useBuySellSwap();
  const [pendingSwapAmount, setPendingSwapAmount] = useState<bigint | null>(null);

  const {
    isLoading: isLoadingPrice,
    data: priceData,
    error: priceError,
    swrKey,
  } = usePriceAPI();

  const apiErrorCallBack = useCallback(
    (apiErrorObj: ErrorMessage) => {
      setErrorMessage({
        errCode: apiErrorObj.errCode,
        msg: stringifyBigInt(apiErrorObj.msg),
        source: apiErrorObj.source,
        status: STATUS.ERROR_API_PRICE,
      });
      setShowError(true);
    },
    [setErrorMessage]
  );

  useEffect(() => {
    if (priceError) {
      apiErrorCallBack({
        errCode: ERROR_CODES.PRICE_FETCH_ERROR,
        msg: (priceError as Error)?.message ?? 'Unknown price API error',
        source: 'PriceAPI',
        status: STATUS.ERROR_API_PRICE,
      });
    }
  }, [priceError, apiErrorCallBack]);

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
        mutate(swrKey);
      }
    }
  }, [containerSwapStatus, tradeData, swrKey]);

  useEffect(() => {
    if (pendingSwapAmount !== null) {
      if (sellTokenContract) {
        setSellAmount(pendingSwapAmount);
      }
      setPendingSwapAmount(null); // Always clear
    }
  }, [sellTokenContract, pendingSwapAmount]);

  const previousSellToken = useRef(tradeData?.sellTokenContract);
  const previousBuyToken = useRef(tradeData?.buyTokenContract);

  useEffect(() => {
    if (!tradeData) return;

    const sellChanged =
      previousSellToken.current?.address !== tradeData.sellTokenContract?.address;
    const buyChanged =
      previousBuyToken.current?.address !== tradeData.buyTokenContract?.address;

    if (tradeData.tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT && (sellChanged || buyChanged)) {
      console.debug('[PriceView] Resetting buy amount due to token change');
      setBuyAmount(0n);
    }

    if (tradeData.tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN && (sellChanged || buyChanged)) {
      console.debug('[PriceView] Resetting sell amount due to token change');
      setSellAmount(0n);
    }

    previousSellToken.current = tradeData.sellTokenContract;
    previousBuyToken.current = tradeData.buyTokenContract;
  }, [tradeData?.sellTokenContract, tradeData?.buyTokenContract, tradeData?.tradeDirection]);

  return (
    <div className={styles.pageWrap}>
      <ErrorDialog
        showDialog={showError}
        closeDialog={() => setShowError(false)}
        message={errorMessage}
      />
      <div id="MainSwapContainer_ID" className={styles.mainSwapContainer}>
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
