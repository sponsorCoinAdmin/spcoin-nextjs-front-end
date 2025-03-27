"use client";

import styles from '@/styles/Exchange.module.css';
import { ErrorDialog } from '@/components/Dialogs/Dialogs';
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount } from 'wagmi';
import { useEthersSigner } from '@/lib/hooks/useEthersSigner';
import { 
  TokenContract,
  ErrorMessage,
  TRADE_DIRECTION,
  CONTAINER_TYPE, 
  STATUS,
  TradeData,
  HARDHAT
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
  useSellTokenContract,
  useSlippageBps
} from "@/lib/context/contextHooks";  
import TokenSelectContainer from '@/components/containers/TokenSelectContainer';

import { stringifyBigInt } from '@/lib/spCoin/utils';

export default function PriceView() {
  const ACTIVE_ACCOUNT = useAccount();
  const signer = useEthersSigner();
  
  const { exchangeContext } = useExchangeContext();
  const tradeData: TradeData = exchangeContext.tradeData;

  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [showError, setShowError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useErrorMessage();
  const [resetAmounts, setResetAmounts] = useState<boolean>(false);
  const [toggleButton, setToggleButton] = useState<boolean>(false);
  const [sellTokenContract, setSellTokenContract] = useSellTokenContract();
  const [buyTokenContract, setBuyTokenContract] = useBuyTokenContract();
  const [containerSwapStatus, setContainerSwapStatus] = useBuySellSwap();

  const apiErrorCallBack = useCallback((apiErrorObj: ErrorMessage) => {
    setErrorMessage({
      errCode: apiErrorObj.errCode,
      msg: stringifyBigInt(apiErrorObj.msg),
      source: apiErrorObj.source,
      status: STATUS.ERROR_API_PRICE,
    });
  }, []);

  const { isLoading: isLoadingPrice, data: priceData, error: PriceError } = usePriceAPI();

  useEffect(() => {
    if (!ACTIVE_ACCOUNT.chainId || ACTIVE_ACCOUNT.chainId === tradeData?.chainId) return;
    tradeData.chainId = ACTIVE_ACCOUNT.chainId;
    setSellAmount(0n);
    setBuyAmount(0n);
    setSellTokenContract(undefined);
    setBuyTokenContract(undefined);
  }, [ACTIVE_ACCOUNT.chainId]);

  useEffect(() => {
    if (resetAmounts) {
      setBuyAmount(0n);
      setSellAmount(0n);
      setResetAmounts(false);
    }
  }, [resetAmounts]);

  useEffect(() => {
    if (containerSwapStatus) {
      setSellTokenContract(tradeData.buyTokenContract);
      setBuyTokenContract(tradeData.sellTokenContract);
      setContainerSwapStatus(false);
    }
  }, [containerSwapStatus]);

  return (
    <form autoComplete="off">
      <ErrorDialog showDialog={showError} />
      <div id="MainSwapContainer_ID" className={styles["mainSwapContainer"]}>
        <TradeContainerHeader />
        <TokenSelectContainer containerType={CONTAINER_TYPE.SELL_SELECT_CONTAINER} />
        <TokenSelectContainer containerType={CONTAINER_TYPE.BUY_SELECT_CONTAINER} />
        <BuySellSwapArrowButton />
        <PriceButton 
          isLoadingPrice={isLoadingPrice} 
          setResetAmounts={setResetAmounts} 
          toggleButton={toggleButton} 
        />
        <AffiliateFee priceResponse={priceData} />
      </div>
      <FeeDisclosure />
    </form>
  );
}
