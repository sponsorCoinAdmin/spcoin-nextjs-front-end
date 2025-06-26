// File: app/(menu)/Exchange/PriceView.tsx

'use client';

import styles from '@/styles/Exchange.module.css';
import { useState, useEffect, useCallback, useRef } from 'react';
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils';
import {
  ErrorMessage,
  CONTAINER_TYPE,
  STATUS,
  ERROR_CODES,
  TRADE_DIRECTION,
  InputState,
  TokenContract,
  WalletAccount,
  SP_COIN_DISPLAY,
} from '@/lib/structure';
import {
  useBuyAmount,
  useBuyTokenContract,
  useErrorMessage,
  useExchangeContext,
  useSellAmount,
  useSellTokenContract,
} from '@/lib/context/hooks';
import { useDisplayControls } from '@/lib/context/hooks/';
import { usePriceAPI } from '@/lib/0X/hooks/usePriceAPI';
import { mutate } from 'swr';

import { ErrorDialog } from '@/components/Dialogs/Dialogs';
import TradeContainerHeader from '@/components/Headers/TradeContainerHeader';
import BuySellSwapArrowButton, { useBuySellSwap } from '@/components/Buttons/BuySellSwapArrowButton';
import TokenSelectContainer from '@/components/containers/TokenSelectContainer';
import PriceButton from '@/components/Buttons/PriceButton';
import AffiliateFee from '@/components/containers/AffiliateFee';
import FeeDisclosure from '@/components/containers/FeeDisclosure';
import RecipientSelectContainer from '@/components/containers/RecipientSelectContainer';
import { RecipientSelectScrollPanel, TokenSelectScrollPanel } from '@/components/containers/AssetSelectScrollContainer';

import {
  validateDisplaySettings,
  resolveDisplaySettings,
} from '@/lib/context/helpers/displaySettingsHelpers';

export default function PriceView() {
  const { exchangeContext, setExchangeContext } = useExchangeContext();
  const tradeData = exchangeContext?.tradeData;
  const { errorDisplay, assetSelectScrollDisplay, spCoinDisplay } = exchangeContext.settings;
  const { updateAssetScrollDisplay } = useDisplayControls();

  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useErrorMessage();
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();
  const [containerSwapStatus, setContainerSwapStatus] = useBuySellSwap();
  const [pendingSwapAmount, setPendingSwapAmount] = useState<bigint | null>(null);

  const { isLoading: isLoadingPrice, data: priceData, error: priceError, swrKey } = usePriceAPI();

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

  // ✅ Ensure display settings are valid
  useEffect(() => {
    const settings = exchangeContext.settings;

    if (!validateDisplaySettings(settings)) {
      const resolved = resolveDisplaySettings(settings);
      setExchangeContext(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          ...resolved,
        },
      }));
    }
  }, [exchangeContext.settings, setExchangeContext]);

  useEffect(() => {
    if (containerSwapStatus && tradeData) {
      const oldSellAmount = tradeData.sellTokenContract?.amount || 0n;
      const newSellToken = tradeData.buyTokenContract;
      const newBuyToken = tradeData.sellTokenContract;

      setPendingSwapAmount(oldSellAmount);
      setSellTokenContract(newSellToken);
      setBuyTokenContract(newBuyToken);
      setContainerSwapStatus(false);

      if (swrKey) mutate(swrKey);
    }
  }, [containerSwapStatus, tradeData, swrKey]);

  useEffect(() => {
    if (pendingSwapAmount !== null) {
      if (sellTokenContract) setSellAmount(pendingSwapAmount);
      setPendingSwapAmount(null);
    }
  }, [sellTokenContract, pendingSwapAmount]);

  const previousSellToken = useRef(tradeData?.sellTokenContract);
  const previousBuyToken = useRef(tradeData?.buyTokenContract);

  useEffect(() => {
    if (!tradeData) return;

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
  }, [tradeData?.sellTokenContract, tradeData?.buyTokenContract, tradeData?.tradeDirection]);

  return (
    <div className={styles.pageWrap}>
      {errorDisplay === SP_COIN_DISPLAY.SHOW_ERROR_MESSAGE && (
        <ErrorDialog
          showDialog={true}
          closeDialog={() => setShowError(false)}
          message={errorMessage}
        />
      )}

      {errorDisplay === SP_COIN_DISPLAY.DISPLAY_OFF &&
        assetSelectScrollDisplay !== SP_COIN_DISPLAY.DISPLAY_OFF && (
          <>
            {assetSelectScrollDisplay === SP_COIN_DISPLAY.SHOW_TOKEN_SCROLL_CONTAINER && (
              <TokenSelectScrollPanel
                containerType={CONTAINER_TYPE.SELL_SELECT_CONTAINER}
                setShowDialog={show => {
                  if (!show) updateAssetScrollDisplay(SP_COIN_DISPLAY.EXCHANGE_ROOT);
                }}
                onSelect={(token: TokenContract, state: InputState) => {
                  if (state === InputState.CLOSE_INPUT) {
                    updateAssetScrollDisplay(SP_COIN_DISPLAY.EXCHANGE_ROOT);
                  }
                }}
              />
            )}

            {assetSelectScrollDisplay === SP_COIN_DISPLAY.SHOW_RECIPIENT_SCROLL_CONTAINER && (
              <RecipientSelectScrollPanel
                setShowDialog={show => {
                  if (!show) updateAssetScrollDisplay(SP_COIN_DISPLAY.EXCHANGE_ROOT);
                }}
                onSelect={(wallet: WalletAccount, state: InputState) => {
                  if (state === InputState.CLOSE_INPUT) {
                    updateAssetScrollDisplay(SP_COIN_DISPLAY.EXCHANGE_ROOT);
                  }
                }}
              />
            )}
          </>
      )}

      {errorDisplay === SP_COIN_DISPLAY.DISPLAY_OFF &&
        assetSelectScrollDisplay === SP_COIN_DISPLAY.DISPLAY_OFF &&
        spCoinDisplay !== SP_COIN_DISPLAY.DISPLAY_OFF && (
          <div id="MainPage_ID">
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
      )}
    </div>
  );
}
