'use client';

import styles from '@/styles/Exchange.module.css';
import { ErrorDialog } from '@/components/Dialogs/Dialogs';
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount } from 'wagmi';
import { useEthersSigner } from '@/lib/hooks/useEthersSigner';
import { 
  TokenContract,
  ErrorMessage,
  TRANS_DIRECTION,
  CONTAINER_TYPE, 
  STATUS,
  TradeData,
  HARDHAT
} from '@/lib/structure/types';
import { usePriceAPI } from '@/lib/0X/fetcher';
import TradeContainerHeader from '@/components/Headers/TradeContainerHeader';
import BuySellSwapArrowButton from '@/components/Buttons/BuySellSwapArrowButton';
import AffiliateFee from '@/components/containers/AffiliateFee';
import PriceButton from '@/components/Buttons/PriceButton';
import FeeDisclosure from '@/components/containers/FeeDisclosure';
import { useBuyAmount, useExchangeContext, useSellAmount } from "@/lib/context/ExchangeContext";  
import TokenSelectContainer from '@/components/containers/TokenSelectContainer';
import { Address } from 'viem';
import { isWrappingTransaction } from '@/lib/network/utils';
import { stringifyBigInt } from '@/lib/spCoin/utils';

export default function PriceView() {
  const ACTIVE_ACCOUNT = useAccount();
  const signer = useEthersSigner();
  
  // ✅ Ensure all hooks are at the top level
  const { exchangeContext } = useExchangeContext();
  const tradeData: TradeData = exchangeContext.tradeData;

  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();
  const [slippageBps, setSlippageBps] = useState<number>(tradeData.slippageBps);
  const [showError, setShowError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | undefined>();
  const [resetAmounts, setResetAmounts] = useState<boolean>(false);
  const [sellTokenContract, setSellTokenContract] = useState<TokenContract | undefined>(tradeData.sellTokenContract);
  const [buyTokenContract, setBuyTokenContract] = useState<TokenContract | undefined>(tradeData.buyTokenContract);
  const [transactionType, setTransactionType] = useState<TRANS_DIRECTION>(tradeData.transactionType);
  const [toggleButton, setToggleButton] = useState<boolean>(false);

  const sellTokenAddress = sellTokenContract?.address;
  const buyTokenAddress = buyTokenContract?.address;

  // ✅ Move `useMemo` to top level
  const isWrapTransaction = useMemo(() => {
    return sellTokenAddress && buyTokenAddress ? isWrappingTransaction(exchangeContext) : false;
  }, [sellTokenAddress, buyTokenAddress]);

  // ✅ Move `useCallback` to top level before passing it to `usePriceAPI`
  const apiErrorCallBack = useCallback((apiErrorObj: ErrorMessage) => {
    setErrorMessage({
      errCode: apiErrorObj.errCode,
      msg: stringifyBigInt(apiErrorObj.msg),
      source: apiErrorObj.source,
      status: STATUS.ERROR_API_PRICE,
    });
  }, []);

  // ✅ Ensure `usePriceAPI` is called at the top level
  const { isLoading: isLoadingPrice, data: priceData, error: PriceError } = usePriceAPI({
    setErrorMessage,
    apiErrorCallBack
  });

  // ✅ Ensure `useEffect` only references values, not hooks
  useEffect(() => {
    if (!ACTIVE_ACCOUNT.chainId || ACTIVE_ACCOUNT.chainId === tradeData?.chainId) return;
    tradeData.chainId = ACTIVE_ACCOUNT.chainId;
    setSellAmount(0n);
    setBuyAmount(0n);
    setSellTokenContract(undefined);
    setBuyTokenContract(undefined);
  }, [ACTIVE_ACCOUNT.chainId]);

  useEffect(() => {
    if (!ACTIVE_ACCOUNT.address) return;
    if (sellTokenContract && sellTokenContract.address === exchangeContext.activeAccountAddress) {
      sellTokenContract.address = ACTIVE_ACCOUNT.address;
    } else if (buyTokenContract && buyTokenContract.address === exchangeContext.activeAccountAddress) {
      buyTokenContract.address = ACTIVE_ACCOUNT.address;
    }
    exchangeContext.activeAccountAddress = ACTIVE_ACCOUNT.address as Address;
  }, [ACTIVE_ACCOUNT.address, sellTokenContract, buyTokenContract, exchangeContext]);

    useEffect(() => {
    if (resetAmounts) {
      setBuyAmount(0n);
      setSellAmount(0n);
      setResetAmounts(false);
    }
  }, [resetAmounts]);

  useEffect(() => {
    if (PriceError && !isWrapTransaction) {
      setErrorMessage({
        status: tradeData.chainId === HARDHAT ? STATUS.WARNING_HARDHAT : STATUS.ERROR_API_PRICE,
        source: "PriceError: ",
        errCode: PriceError.errCode,
        msg: PriceError.errMsg,
      });
    }
  }, [PriceError, isWrapTransaction, tradeData.chainId]);

  const swapBuySellTokens = useCallback(() => {
    if (!tradeData.buyTokenContract || !tradeData.sellTokenContract) return;
    setSellTokenContract(tradeData.buyTokenContract);
    setBuyTokenContract(tradeData.sellTokenContract);
  }, [tradeData.buyTokenContract, tradeData.sellTokenContract]);

  return (
    <form autoComplete="off">
      <ErrorDialog errMsg={errorMessage} showDialog={showError} />
      <div id="MainSwapContainer_ID" className={styles["mainSwapContainer"]}>
        <TradeContainerHeader slippageBps={slippageBps} setSlippageBpsCallback={setSlippageBps} />
        <TokenSelectContainer
          containerType={CONTAINER_TYPE.SELL_SELECT_CONTAINER}
          setTransactionType={setTransactionType}
          setTokenContractCallback={setSellTokenContract}
          slippageBps={slippageBps}
        />
        <TokenSelectContainer
          containerType={CONTAINER_TYPE.BUY_SELECT_CONTAINER}
          setTransactionType={setTransactionType}
          setTokenContractCallback={setBuyTokenContract}
          slippageBps={slippageBps}
        />
        <BuySellSwapArrowButton swapBuySellTokens={swapBuySellTokens} />
        <PriceButton 
          isLoadingPrice={isLoadingPrice} 
          errorMessage={errorMessage} 
          setErrorMessage={setErrorMessage} 
          setResetAmounts={setResetAmounts} 
          toggleButton={toggleButton} 
        />
        <AffiliateFee priceResponse={priceData} buyTokenContract={buyTokenContract} />
      </div>
      <FeeDisclosure />
    </form>
  );
}
