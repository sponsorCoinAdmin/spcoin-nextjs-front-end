// File: app/(menu)/Exchange/Price/index.tsx

'use client';

import styles from '@/styles/Exchange.module.css';
import { ErrorDialog } from '@/components/Dialogs/Dialogs';
import { useState, useEffect, useCallback, useRef } from 'react';
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
import { usePriceAPI } from '@/lib/0X/hooks/usePriceAPI.ts';
import TradeContainerHeader from '@/components/Headers/TradeContainerHeader';
import BuySellSwapArrowButton from '@/components/Buttons/BuySellSwapArrowButton';
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
import { useSyncSpCoinDisplay } from '@/lib/hooks/useSyncSpCoinDisplay';

export default function PriceView() {
  const { chainId } = useAccount();
  const signer = useEthersSigner();
  const { exchangeContext } = useExchangeContext();
  const tradeData = exchangeContext?.tradeData;

  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useErrorMessage();
  const [, setSellTokenContract] = useSellTokenContract();
  const [, setBuyTokenContract] = useBuyTokenContract();

  useSyncSpCoinDisplay(); // ✅ centralized spCoin display sync

  const apiErrorCallBack = useCallback((apiErrorObj: ErrorMessage) => {
    setErrorMessage({
      errCode: apiErrorObj.errCode,
      msg: stringifyBigInt(apiErrorObj.msg),
      source: apiErrorObj.source,
      status: STATUS.ERROR_API_PRICE,
    });
    setShowError(true);
  }, [setErrorMessage]);

  const {
    isLoading: isLoadingPrice,
    data: priceData,
    error: priceError,
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

  const previousSellToken = useRef(tradeData.sellTokenContract);
  const previousBuyToken = useRef(tradeData.buyTokenContract);

  useEffect(() => {
    const sellChanged = previousSellToken.current?.address !== tradeData.sellTokenContract?.address;
    const buyChanged = previousBuyToken.current?.address !== tradeData.buyTokenContract?.address;

    if (tradeData.tradeDirection === TRADE_DIRECTION.SELL_EXACT_OUT && (sellChanged || buyChanged)) {
      setBuyAmount(0n);
    }

    if (tradeData.tradeDirection === TRADE_DIRECTION.BUY_EXACT_IN && (sellChanged || buyChanged)) {
      setSellAmount(0n);
    }

    previousSellToken.current = tradeData.sellTokenContract;
    previousBuyToken.current = tradeData.buyTokenContract;
  }, [tradeData.sellTokenContract, tradeData.buyTokenContract, tradeData.tradeDirection]);

  return (
    <div>
      <ErrorDialog showDialog={showError} />
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
