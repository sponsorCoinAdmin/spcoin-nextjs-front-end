"use client";

import { SWAP_TYPE, TradeData } from "@/lib/structure/types";
import { useExchangeContext } from "@/lib/context/ExchangeContext";
import { stringifyBigInt } from "../../../node_modules-dev/spcoin-common/spcoin-lib-es6/utils";

// ToDo: The error on the next line is a TypeScript definition for a JavaScript file requirement
// since JavaScript does not define types and TypeScript is looking for a specific type.
// START: Create a new file, e.g., weth-access-module.d.ts inside your @types or src/types directory and add:
// Create a Custom Declaration File
// declare module '@sponsorcoin/weth-access-module-es6/index.js' {
//   const value: any; // Change `any` to the correct type if known
//   export default value;
// }
// then install with // npm i --save-dev @types/sponsorcoin__weth-access-module-es6
// Youtube tutorial => https://www.youtube.com/watch?v=iKNfDKrJRP4
// import { WethMethods, weth9ABI } from "@sponsorcoin/weth-access-module-es6"

import { WethMethods, weth9ABI } from "../../../node_modules-dev/spcoin-back-end/weth-access-module-es6";
import { isActiveSellToken, 
    isActiveBuyToken, 
    isBlockChainBuyToken, 
    isBlockChainSellToken, 
    isWrappedSellToken, 
    isWrappedBuyToken } from "../network/utilsOLD";

const wethMethods = new WethMethods();

const wrap = async () => {
    const { exchangeContext } = useExchangeContext();
    const tradeData = exchangeContext.tradeData;

    console.log(`WRAP:` + stringifyBigInt(tradeData));
    alert(`WRAP`);

    const weiDepositAmount: bigint = tradeData.sellAmount;
    const signer = tradeData.signer;
    const chainId = tradeData.chainId;
    const weth9Address = wethMethods.getWeth9NetworkAddress(chainId);

    // alert(`chainId = ${chainId} weth9Address = ${weth9Address}`)
    wethMethods.connect(weth9Address, weth9ABI, signer);
    const tx = await wethMethods.depositWEI(weiDepositAmount);
    await tx.wait();
};

const unwrap = async () => {
    const { exchangeContext } = useExchangeContext();
    const tradeData = exchangeContext.tradeData;

    console.log(`UNWRAP:` + stringifyBigInt(tradeData));
    alert(`UN_WRAP`);

    const weiWithdrawAmount: bigint = tradeData.sellAmount;
    const signer = tradeData.signer;
    const chainId = tradeData.chainId;
    const weth9Address = wethMethods.getWeth9NetworkAddress(chainId);

    alert(`chainId = ${chainId} weth9Address = ${weth9Address}`);
    wethMethods.connect(weth9Address, weth9ABI, signer);
    const tx = await wethMethods.withdrawWEI(weiWithdrawAmount);
    await tx.wait();
};

const doSwap = async () => {
    const { exchangeContext } = useExchangeContext();
    const tradeData = exchangeContext.tradeData;

    console.log(`SWAP:` + stringifyBigInt(tradeData));
    alert(`SWAP:`);
};

const swap = async () => {
    const { exchangeContext } = useExchangeContext();
    const tradeData = exchangeContext.tradeData;

    let swapType: SWAP_TYPE;
 
    const setSwapType = (_swapType: SWAP_TYPE) => {
        swapType = _swapType;
        tradeData.swapType = _swapType;
    };

    const getSwapState = () => {
        let swapType: SWAP_TYPE = SWAP_TYPE.UNDEFINED;
        if (isActiveSellToken(exchangeContext, tradeData)) {
            if (isActiveBuyToken(exchangeContext, tradeData)) {
                swapType = SWAP_TYPE.SWAP;
            } else if (isBlockChainBuyToken(exchangeContext, tradeData)) {
                if (isWrappedSellToken(tradeData)) {
                    swapType = SWAP_TYPE.UNWRAP;
                } else {
                    swapType = SWAP_TYPE.SWAP_UNWRAP;
                }
            }
        } else if (isBlockChainSellToken(exchangeContext, tradeData)) {
            if (isWrappedBuyToken(tradeData)) {
                swapType = SWAP_TYPE.WRAP;
            } else {
                swapType = SWAP_TYPE.WRAP_SWAP;
            }
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
};

export default swap;
