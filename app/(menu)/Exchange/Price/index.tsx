'use client';
import styles from '@/styles/Exchange.module.css';
import { ErrorDialog } from '@/components/Dialogs/Dialogs';
import { useState, useEffect, useCallback, useMemo } from "react";
import { useChainId, useAccount } from 'wagmi';
import { useEthersSigner } from '@/lib/hooks/useEthersSigner';
import { TokenContract, ErrorMessage, TRANSACTION_TYPE, CONTAINER_TYPE, STATUS, TradeData, HARDHAT } from '@/lib/structure/types';
import { usePriceAPI } from '@/lib/0X/fetcher';
import TradeContainerHeader from '@/components/Headers/TradeContainerHeader';
import BuySellSwapArrowButton from '@/components/Buttons/BuySellSwapArrowButton';
import AffiliateFee from '@/components/containers/AffiliateFee';
import PriceButton from '@/components/Buttons/PriceButton';
import FeeDisclosure from '@/components/containers/FeeDisclosure';
import { exchangeContext, resetNetworkContext } from "@/lib/context";
import { stringifyBigInt } from '../../../../../node_modules-dev/spcoin-common/spcoin-lib-es6/utils';
import PriceInputContainer from '@/components/containers/PriceInputContainer';
import { Address } from 'viem';
import { isWrappingTransaction } from '@/lib/network/utils';

export default function PriceView() {
  const ACTIVE_ACCOUNT = useAccount();
  const signer = useEthersSigner();
  const chainId = useChainId();
  const tradeData: TradeData = exchangeContext.tradeData;
  const [sellAmount, setSellAmount] = useState<bigint>(tradeData.sellAmount);
  const [buyAmount, setBuyAmount] = useState<bigint>(tradeData.buyAmount);
  const [slippage, setSlippage] = useState<number>(tradeData.slippage);
  const [showError, setShowError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | undefined>();
  const [resetAmounts, setResetAmounts] = useState<boolean>(false);
  const [sellTokenContract, setSellTokenContract] = useState<TokenContract | undefined>(tradeData.sellTokenContract);
  const [buyTokenContract, setBuyTokenContract] = useState<TokenContract | undefined>(tradeData.buyTokenContract);
  const [transactionType, setTransactionType] = useState<TRANSACTION_TYPE>(tradeData.transactionType);
  const [toggleButton,setToggleButton ] = useState<boolean>(false);

  const sellTokenAddress = sellTokenContract?.address;
  const buyTokenAddress = buyTokenContract?.address;

  // Memoize transaction validity check
  const isWrapTransaction = useMemo(() => isWrappingTransaction(sellTokenAddress, buyTokenAddress), [sellTokenAddress, buyTokenAddress]);

  useEffect(() => {
    tradeData.buyAmount = buyAmount;
    tradeData.sellAmount = sellAmount;
    tradeData.signer = signer;
    tradeData.slippage = slippage;
    tradeData.transactionType = transactionType;
  }, [buyAmount, sellAmount, signer, slippage, transactionType]);
  
  useEffect(() => {
    tradeData.sellTokenContract = sellTokenContract;
    tradeData.buyTokenContract = buyTokenContract;
    setToggleButton(!toggleButton)
  }, [buyTokenContract, transactionType]);
  
  const apiErrorCallBack = useCallback((apiErrorObj: ErrorMessage) => {
    setErrorMessage({
      errCode: apiErrorObj.errCode,
      msg: stringifyBigInt(apiErrorObj.msg),
      source: apiErrorObj.source,
      status: STATUS.ERROR_API_PRICE,
    });
  }, []);
  
  useEffect(() => {
    if (ACTIVE_ACCOUNT.chain) {
      tradeData.chainId = chainId;
      setSellAmount(0n);
      setBuyAmount(0n);
      setSellTokenContract(undefined)
      setBuyTokenContract(undefined)
      resetNetworkContext(ACTIVE_ACCOUNT.chain);
    }
  }, [chainId]);
  
  useEffect(() => {
    if (sellTokenContract && sellTokenContract.address === exchangeContext.activeAccountAddress)
      sellTokenContract.address = ACTIVE_ACCOUNT.address
    else
      if (buyTokenContract && buyTokenContract.address === exchangeContext.activeAccountAddress)
        buyTokenContract.address = ACTIVE_ACCOUNT.address
    exchangeContext.activeAccountAddress = ACTIVE_ACCOUNT.address as Address
  }, [ACTIVE_ACCOUNT.address]);
  
  useEffect(() => {
    if (isWrapTransaction) {
      if (transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT) {
        setBuyAmount(sellAmount);
      } else if (transactionType === TRANSACTION_TYPE.BUY_EXACT_IN) {
        setSellAmount(buyAmount);
      }
    }
  }, [buyAmount, sellAmount, isWrapTransaction]);
  
  useEffect(() => {
    if (resetAmounts) {
      tradeData.sellAmount = 0n;
      tradeData.buyAmount = 0n;
      setBuyAmount(0n);
      setSellAmount(0n);
      setResetAmounts(false);
    }
  }, [resetAmounts]);
  
   const { isLoading: isLoadingPrice, data: priceData, error: PriceError } = usePriceAPI({
    transactionType,
    sellTokenAddress,
    buyTokenAddress,
    sellAmount,
    buyAmount,
    setBuyAmount,
    setSellAmount,
    setErrorMessage,
    apiErrorCallBack,
  });

  useEffect(() => {
    if (PriceError && !isWrapTransaction) {
      setErrorMessage({
        status: chainId === HARDHAT ? STATUS.WARNING_HARDHAT : STATUS.ERROR_API_PRICE,
        source: "PriceError: ",
        errCode: PriceError.errCode,
        msg: PriceError.errMsg,
      });
    }
  }, [PriceError, isWrapTransaction]);

  const swapBuySellTokens = useCallback(() => {
    setSellTokenContract(tradeData.buyTokenContract);
    setBuyTokenContract(tradeData.sellTokenContract);
  }, []);

  return (
    <form autoComplete="off">
      <ErrorDialog errMsg={errorMessage} showDialog={showError} />
      <div id="MainSwapContainer_ID" className={styles["mainSwapContainer"]}>
        <TradeContainerHeader slippage={slippage} setSlippageCallback={setSlippage} />
        <PriceInputContainer
          priceInputContainerType={CONTAINER_TYPE.INPUT_SELL_PRICE}
          updateAmount={sellAmount}
          activeContract={sellTokenContract}
          setCallbackAmount={setSellAmount}
          slippage={slippage}
          setTransactionType={setTransactionType}
          setTokenContractCallback={setSellTokenContract}
        />
        <PriceInputContainer
          priceInputContainerType={CONTAINER_TYPE.INPUT_BUY_PRICE}
          updateAmount={buyAmount}
          activeContract={buyTokenContract}
          setCallbackAmount={setBuyAmount}
          slippage={slippage}
          setTransactionType={setTransactionType}
          setTokenContractCallback={setBuyTokenContract}
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
