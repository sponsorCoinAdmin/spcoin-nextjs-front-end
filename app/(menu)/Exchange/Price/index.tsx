"use client";

import styles from "@/styles/Exchange.module.css";
import { ErrorDialog } from "@/components/Dialogs/Dialogs";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useChainId, useAccount } from "wagmi";
import { useEthersSigner } from "@/lib/hooks/useEthersSigner";
import {
  TokenContract,
  ErrorMessage,
  TRANSACTION_TYPE,
  CONTAINER_TYPE,
  STATUS,
  TradeData,
  HARDHAT,
} from "@/lib/structure/types";
import { usePriceAPI } from "@/lib/0X/fetcher";
import TradeContainerHeader from "@/components/Headers/TradeContainerHeader";
import BuySellSwapArrowButton from "@/components/Buttons/BuySellSwapArrowButton";
import AffiliateFee from "@/components/containers/AffiliateFee";
import PriceButton from "@/components/Buttons/PriceButton";
import FeeDisclosure from "@/components/containers/FeeDisclosure";
import { useExchangeContext } from "@/lib/context/ExchangeContext"; // ✅ Use context
import { stringifyBigInt } from "../../../../../node_modules-dev/spcoin-common/spcoin-lib-es6/utils";
import PriceInputContainer from "@/components/containers/AssetContainer";
import { Address } from "viem";
import { isWrappingTransaction } from "@/lib/network/utils";

export default function PriceView() {
  const { exchangeContext, setExchangeContext } = useExchangeContext(); // ✅ Get global context
  const ACTIVE_ACCOUNT = useAccount();
  const signer = useEthersSigner();
  const chainId = useChainId();

  // Extract trade data from global context
  const tradeData: TradeData = exchangeContext.tradeData;

  // Local state derived from trade data
  const [sellAmount, setSellAmount] = useState<bigint>(tradeData.sellAmount);
  const [buyAmount, setBuyAmount] = useState<bigint>(tradeData.buyAmount);
  const [slippageBps, setSlippageBps] = useState<number>(tradeData.slippageBps);
  const [showError, setShowError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<ErrorMessage | undefined>();
  const [resetAmounts, setResetAmounts] = useState<boolean>(false);
  const [sellTokenContract, setSellTokenContract] = useState<TokenContract | undefined>(
    tradeData.sellTokenContract
  );
  const [buyTokenContract, setBuyTokenContract] = useState<TokenContract | undefined>(
    tradeData.buyTokenContract
  );
  const [transactionType, setTransactionType] = useState<TRANSACTION_TYPE>(tradeData.transactionType);
  const [toggleButton, setToggleButton] = useState<boolean>(false);

  const sellTokenAddress = sellTokenContract?.address;
  const buyTokenAddress = buyTokenContract?.address;

  // Memoized check for wrapping transaction
  const isWrapTransaction = useMemo(
    () => isWrappingTransaction(sellTokenAddress, buyTokenAddress),
    [sellTokenAddress, buyTokenAddress]
  );

  /**
   * Updates the global trade data context when local trade data changes.
   */
  useEffect(() => {
    setExchangeContext({
      ...exchangeContext,
      tradeData: {
        ...exchangeContext.tradeData,
        buyAmount,
        sellAmount,
        signer,
        slippageBps,
        transactionType,
        sellTokenContract,
        buyTokenContract,
        chainId,
      },
    });
  }, [buyAmount, sellAmount, signer, slippageBps, transactionType, sellTokenContract, buyTokenContract, chainId]);

  /**
   * Handles chain changes and resets trade data accordingly.
   */
  useEffect(() => {
    if (ACTIVE_ACCOUNT.chainId && ACTIVE_ACCOUNT.chainId !== tradeData.chainId) {
      setExchangeContext({
        ...exchangeContext,
        tradeData: {
          ...tradeData,
          chainId: ACTIVE_ACCOUNT.chainId,
          sellAmount: 0n,
          buyAmount: 0n,
          sellTokenContract: undefined,
          buyTokenContract: undefined,
        },
      });
    }
  }, [ACTIVE_ACCOUNT.chainId]);

  /**
   * Updates the active account address in the global context.
   */
  useEffect(() => {
    if (ACTIVE_ACCOUNT.address) {
      setExchangeContext({
        ...exchangeContext,
        activeAccountAddress: ACTIVE_ACCOUNT.address as Address,
      });

      if (sellTokenContract && sellTokenContract.address === exchangeContext.activeAccountAddress)
        sellTokenContract.address = ACTIVE_ACCOUNT.address;
      else if (buyTokenContract && buyTokenContract.address === exchangeContext.activeAccountAddress)
        buyTokenContract.address = ACTIVE_ACCOUNT.address;
    }
  }, [ACTIVE_ACCOUNT.address]);

  /**
   * Adjusts token amounts if the transaction type is a wrapping operation.
   */
  useEffect(() => {
    if (isWrapTransaction) {
      if (transactionType === TRANSACTION_TYPE.SELL_EXACT_OUT) {
        setBuyAmount(sellAmount);
      } else if (transactionType === TRANSACTION_TYPE.BUY_EXACT_IN) {
        setSellAmount(buyAmount);
      }
    }
  }, [buyAmount, sellAmount, isWrapTransaction]);

  /**
   * Resets trade amounts when needed.
   */
  useEffect(() => {
    if (resetAmounts) {
      setExchangeContext({
        ...exchangeContext,
        tradeData: {
          ...exchangeContext.tradeData,
          sellAmount: 0n,
          buyAmount: 0n,
        },
      });
      setBuyAmount(0n);
      setSellAmount(0n);
      setResetAmounts(false);
    }
  }, [resetAmounts]);

  /**
   * Handles API errors.
   */
  const apiErrorCallBack = useCallback((apiErrorObj: ErrorMessage) => {
    setErrorMessage({
      errCode: apiErrorObj.errCode,
      msg: stringifyBigInt(apiErrorObj.msg),
      source: apiErrorObj.source,
      status: STATUS.ERROR_API_PRICE,
    });
  }, []);

  // Fetch price data
  const { isLoading: isLoadingPrice, data: priceData, error: PriceError } = usePriceAPI({
    transactionType,
    sellTokenAddress,
    buyTokenAddress,
    sellAmount,
    buyAmount,
    slippageBps,
    setBuyAmount,
    setSellAmount,
    setErrorMessage,
    apiErrorCallBack,
  });

  /**
   * Handles price API errors.
   */
  useEffect(() => {
    if (PriceError && !isWrapTransaction) {
      setErrorMessage({
        status: tradeData.chainId === HARDHAT ? STATUS.WARNING_HARDHAT : STATUS.ERROR_API_PRICE,
        source: "PriceError: ",
        errCode: PriceError.errCode,
        msg: PriceError.errMsg,
      });
    }
  }, [PriceError, isWrapTransaction]);

  /**
   * Swaps buy/sell tokens.
   */
  const swapBuySellTokens = useCallback(() => {
    setSellTokenContract(tradeData.buyTokenContract);
    setBuyTokenContract(tradeData.sellTokenContract);
  }, []);

  return (
    <form autoComplete="off">
      <ErrorDialog errMsg={errorMessage} showDialog={showError} />
      <div id="MainSwapContainer_ID" className={styles["mainSwapContainer"]}>
        <TradeContainerHeader slippageBps={slippageBps} setSlippageBpsCallback={setSlippageBps} />
        <PriceInputContainer
          priceInputContainerType={CONTAINER_TYPE.INPUT_SELL_PRICE}
          updateAmount={sellAmount}
          activeContract={sellTokenContract}
          setCallbackAmount={setSellAmount}
          slippageBps={slippageBps}
          setTransactionType={setTransactionType}
          setTokenContractCallback={setSellTokenContract}
        />
        <PriceInputContainer
          priceInputContainerType={CONTAINER_TYPE.INPUT_BUY_PRICE}
          updateAmount={buyAmount}
          activeContract={buyTokenContract}
          setCallbackAmount={setBuyAmount}
          slippageBps={slippageBps}
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
