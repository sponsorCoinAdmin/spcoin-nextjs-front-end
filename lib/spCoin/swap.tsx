"use client";

import { SWAP_TYPE, TradeData } from "@/lib/structure/types";
import { useExchangeContext } from "@/lib/context/ExchangeContext"; // ✅ Use context
import { stringifyBigInt } from "../../../node_modules-dev/spcoin-common/spcoin-lib-es6/utils";

// Import WethMethods from your external module
import { WethMethods, weth9ABI } from "../../../node_modules-dev/spcoin-back-end/weth-access-module-es6";
import { isNetworkAddress, isTokenAddress, isWrappedNetworkAddress } from "../network/utils";

const wethMethods = new WethMethods();

/**
 * Handles the wrap transaction
 */
const wrap = async (exchangeContext: TradeData) => {
  console.log(`WRAP: ${stringifyBigInt(exchangeContext)}`);
  alert(`WRAP`);

  const { sellAmount, signer, chainId } = exchangeContext;
  const weth9Address = wethMethods.getWeth9NetworkAddress(chainId);

  // Connect to the WETH contract and perform the wrap transaction
  wethMethods.connect(weth9Address, weth9ABI, signer);
  const tx = await wethMethods.depositWEI(sellAmount);
  await tx.wait();
};

/**
 * Handles the unwrap transaction
 */
const unwrap = async (exchangeContext: TradeData) => {
  console.log(`UNWRAP: ${stringifyBigInt(exchangeContext)}`);
  alert(`UNWRAP`);

  const { sellAmount, signer, chainId } = exchangeContext;
  const weth9Address = wethMethods.getWeth9NetworkAddress(chainId);

  // Connect to the WETH contract and perform the unwrap transaction
  wethMethods.connect(weth9Address, weth9ABI, signer);
  const tx = await wethMethods.withdrawWEI(sellAmount);
  await tx.wait();
};

/**
 * Handles the token swap transaction
 */
const doSwap = async (exchangeContext: TradeData) => {
  console.log(`SWAP: ${stringifyBigInt(exchangeContext)}`);
  alert(`SWAP`);
};

/**
 * Determines the type of swap and executes the appropriate transaction(s)
 */
const swap = async () => {
  const { exchangeContext, setExchangeContext } = useExchangeContext(); // ✅ Get context

  let swapType: SWAP_TYPE;
  const sellTokenAddress = exchangeContext.tradeData.sellTokenContract?.address;
  const buyTokenAddress = exchangeContext.tradeData.buyTokenContract?.address;

  console.log(`sellTokenAddress = ${sellTokenAddress}\nbuyTokenAddress = ${buyTokenAddress}`);

  /**
   * Determines the type of swap based on the provided token addresses
   * and updates the global context with the swap type
   */
  const getSwapState = () => {
    let swapType: SWAP_TYPE = SWAP_TYPE.UNDEFINED;

    if (isTokenAddress(sellTokenAddress)) {
      if (isTokenAddress(buyTokenAddress)) swapType = SWAP_TYPE.SWAP;
      else if (isNetworkAddress(buyTokenAddress))
        swapType = isWrappedNetworkAddress(sellTokenAddress) ? SWAP_TYPE.UNWRAP : SWAP_TYPE.SWAP_UNWRAP;
    } else if (isNetworkAddress(sellTokenAddress)) {
      swapType = isWrappedNetworkAddress(buyTokenAddress) ? SWAP_TYPE.WRAP : SWAP_TYPE.WRAP_SWAP;
    } else {
      swapType = SWAP_TYPE.UNDEFINED;
    }

    // ✅ Update global context with the determined swap type
    setExchangeContext({
      ...exchangeContext,
      tradeData: {
        ...exchangeContext.tradeData,
        swapType,
      },
    });

    return swapType;
  };

  console.debug(stringifyBigInt(exchangeContext.tradeData));

  // Determine the swap type and execute the corresponding transaction
  swapType = getSwapState();
  switch (swapType) {
    case SWAP_TYPE.SWAP:
      await doSwap(exchangeContext.tradeData);
      break;
    case SWAP_TYPE.SWAP_UNWRAP:
      await doSwap(exchangeContext.tradeData);
      await unwrap(exchangeContext.tradeData);
      break;
    case SWAP_TYPE.UNWRAP:
      await unwrap(exchangeContext.tradeData);
      break;
    case SWAP_TYPE.WRAP_SWAP:
      await wrap(exchangeContext.tradeData);
      await doSwap(exchangeContext.tradeData);
      break;
    case SWAP_TYPE.WRAP:
      await wrap(exchangeContext.tradeData);
      break;
    case SWAP_TYPE.UNDEFINED:
      alert(`UNDEFINED SWAP_TYPE`);
      break;
  }

  return swapType;
};

export default swap;
