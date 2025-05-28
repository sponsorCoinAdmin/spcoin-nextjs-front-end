"use client";

import { SWAP_TYPE, TradeData } from "@/lib/structure/types";
import { useBuyAmount, useExchangeContext, useSellAmount } from "@/lib/context/hooks/contextHooks";
import { stringifyBigInt } from '@sponsorcoin/spcoin-lib/utils'
;

// import { WethMethods, weth9ABI } from "../../../node_modules-dev/spcoin-back-end/weth-access-module-es6";
import { WethMethods, weth9ABI } from '@sponsorcoin/weth-access-module-es6';

import {
    isActiveAccountSellToken,
    isActiveAccountBuyToken,
    isBlockChainBuyToken,
    isBlockChainSellToken,
    isWrappedSellToken,
    isWrappedBuyToken
} from "../network/utils";
import { useCallback } from "react";

// ✅ Hooks must be at the top level, so we use a custom hook to wrap them
const useSwapFunctions = () => {
    const { exchangeContext } = useExchangeContext(); // ✅ Moved to the top level (Rules of Hooks)
    const tradeData = exchangeContext.tradeData;
  const [sellAmount, setSellAmount] = useSellAmount();
  const [buyAmount, setBuyAmount] = useBuyAmount();

    // ✅ Fix: Instantiate `wethMethods` inside the hook
    const wethMethods = new WethMethods();

    // ✅ Async functions are wrapped inside `useCallback` to ensure stable references
    const wrap = useCallback(async () => {
        console.log(`WRAP:` + stringifyBigInt(tradeData));
        alert(`WRAP`);

        const weiDepositAmount: bigint = sellAmount;
        const signer = tradeData.signer;
        const chainId = tradeData.chainId;
        const weth9Address = wethMethods.getWeth9NetworkAddress(chainId);

        wethMethods.connect(weth9Address, weth9ABI, signer);
        const tx = await wethMethods.depositWEI(weiDepositAmount);
        await tx.wait();
    }, [tradeData, wethMethods]);

    const unwrap = useCallback(async () => {
        console.log(`UNWRAP:` + stringifyBigInt(tradeData));
        alert(`UN_WRAP`);

        const weiWithdrawAmount: bigint = sellAmount;
        const signer = tradeData.signer;
        const chainId = tradeData.chainId;
        const weth9Address = wethMethods.getWeth9NetworkAddress(chainId);

        alert(`chainId = ${chainId} weth9Address = ${weth9Address}`);
        wethMethods.connect(weth9Address, weth9ABI, signer);
        const tx = await wethMethods.withdrawWEI(weiWithdrawAmount);
        await tx.wait();
    }, [tradeData, wethMethods]);

    const doSwap = useCallback(async () => {
        console.log(`SWAP:` + stringifyBigInt(tradeData));
        alert(`SWAP:`);
    }, [tradeData]);

    const swap = useCallback(async () => {
        let swapType: SWAP_TYPE;

        const setSwapType = (_swapType: SWAP_TYPE) => {
            swapType = _swapType;
            tradeData.swapType = _swapType;
        };

        const getSwapState = () => {
            let swapType: SWAP_TYPE = SWAP_TYPE.UNDEFINED;
            if (isActiveAccountSellToken(exchangeContext)) {
                if (isActiveAccountBuyToken(exchangeContext)) {
                    swapType = SWAP_TYPE.SWAP;
                } else if (isBlockChainBuyToken(exchangeContext)) {
                    swapType = isWrappedSellToken(tradeData) ? SWAP_TYPE.UNWRAP : SWAP_TYPE.SWAP_UNWRAP;
                }
            } else if (isBlockChainSellToken(exchangeContext)) {
                swapType = isWrappedBuyToken(tradeData) ? SWAP_TYPE.WRAP : SWAP_TYPE.WRAP_SWAP;
            } else {
                swapType = SWAP_TYPE.UNDEFINED;
            }
            tradeData.swapType = swapType;
            return swapType;
        };

        console.debug(stringifyBigInt(tradeData));
        swapType = getSwapState();
        
        switch (swapType) {
            case SWAP_TYPE.SWAP:
                await doSwap();
                break;
            case SWAP_TYPE.SWAP_UNWRAP:
                await doSwap();
                await unwrap();
                break;
            case SWAP_TYPE.UNWRAP:
                await unwrap();
                break;
            case SWAP_TYPE.WRAP_SWAP:
                await wrap();
                await doSwap();
                break;
            case SWAP_TYPE.WRAP:
                await wrap();
                break;
            case SWAP_TYPE.UNDEFINED:
                alert(`UNDEFINED SWAP_TYPE`);
                break;
        }
        return swapType;
    }, [exchangeContext, tradeData, wrap, unwrap, doSwap]);

    return swap;
};

export default useSwapFunctions;
