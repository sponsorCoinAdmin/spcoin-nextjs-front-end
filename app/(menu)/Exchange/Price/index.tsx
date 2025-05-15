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
  TRADE_DIRECTION,
  SP_COIN_DISPLAY,
  TokenContract
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
  useSpCoinDisplay
} from "@/lib/context/contextHooks";
import TokenSelectContainer from '@/components/containers/TokenSelectContainer';
import { mutate } from 'swr';
import { isSpCoin } from '@/lib/spCoin/coreUtils';

const SWAP_STATUS = {
  OFF: 'OFF',
  BUY_TO_SELL: 'BUY_TO_SELL',
  SELL_TO_BUY: 'SELL_TO_BUY'
};

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
  const [spCoinDisplay, setSpCoinDisplay] = useSpCoinDisplay();

  const [swapStatus, setSwapStatus] = useState(SWAP_STATUS.OFF);
  const tmpSellTokenRef = useRef<TokenContract | undefined>(undefined);
  const tmpBuyTokenRef = useRef<TokenContract | undefined>(undefined);

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

  useEffect(() => {
    if (containerSwapStatus && tradeData) {
      tmpSellTokenRef.current = tradeData.buyTokenContract;
      tmpBuyTokenRef.current = tradeData.sellTokenContract;
      setBuyTokenContract(undefined);
      setSwapStatus(SWAP_STATUS.BUY_TO_SELL);
      setContainerSwapStatus(false);

      if (swrKey) {
        console.log('🔁 Forcing mutate', swrKey);
        mutate(swrKey, undefined, { revalidate: true });
      }
    }
  }, [containerSwapStatus, tradeData, swrKey]);

  useEffect(() => {
    if (swapStatus === SWAP_STATUS.BUY_TO_SELL && !buyTokenContract && tmpSellTokenRef.current) {
      setBuyTokenContract(tmpSellTokenRef.current);
      tmpSellTokenRef.current = undefined;
      setSwapStatus(SWAP_STATUS.SELL_TO_BUY);
      return;
    }

    if (swapStatus === SWAP_STATUS.SELL_TO_BUY && !sellTokenContract && tmpBuyTokenRef.current) {
      setSellTokenContract(tmpBuyTokenRef.current);
      tmpBuyTokenRef.current = undefined;
      setSwapStatus(SWAP_STATUS.OFF);
    }
  }, [buyTokenContract, sellTokenContract, swapStatus]);

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
  }, [tradeData.sellTokenContract, tradeData.buyTokenContract, tradeData.tradeDirection]);

  useEffect(() => {
    const isSellSp = isSpCoin(sellTokenContract);
    const isBuySp = isSpCoin(buyTokenContract);

    let nextPanel: SP_COIN_DISPLAY = SP_COIN_DISPLAY.OFF;

    if (isSellSp) nextPanel = SP_COIN_DISPLAY.MANAGE_RECIPIENT_BUTTON;
    else if (isBuySp) nextPanel = SP_COIN_DISPLAY.SELECT_RECIPIENT_BUTTON;

    if (spCoinDisplay !== nextPanel) {
      console.debug(`🔁 spCoinDisplay change (centralized): ${spCoinDisplay} → ${nextPanel}`);
      setSpCoinDisplay(nextPanel);
    }
  }, [sellTokenContract, buyTokenContract, spCoinDisplay, setSpCoinDisplay]);

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
