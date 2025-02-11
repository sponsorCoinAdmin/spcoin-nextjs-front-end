import { SWAP_TYPE, TradeData } from "@/lib/structure/types";
import { exchangeContext } from "@/lib/context";
import { stringifyBigInt } from '../../../node_modules-dev/spcoin-common/spcoin-lib-es6/utils';
import { useSwapState } from '@/lib/hooks/useSwapState';

// ToDo: The error on the next line is a typescript definition for a javascript file requirement
// since javascript does not define types and typescript is looking for a specific type.
// START: Create a new file, e.g., weth-access-module.d.ts inside your @types or src/types directory and add:
// Create a Custom Declaration File
// declare module '@sponsorcoin/weth-access-module-es6/index.js' {
//   const value: any; // Change `any` to the correct type if known
//   export default value;
// }
// then install with // npm i --save-dev @types/sponsorcoin__weth-access-module-es6
// Youtube tutorial => https://www.youtube.com/watch?v=iKNfDKrJRP4
// import { WethMethods, weth9ABI } from "@sponsorcoin/weth-access-module-es6"
import { WethMethods, weth9ABI } from "../../../node_modules-dev/spcoin-back-end/weth-access-module-es6"
import { isNetworkAddress, isTokenAddress, isWrappedNetworkAddress } from "../network/utils";
import { Address } from "viem";

const wethMethods = new WethMethods();

const wrap = async () => {
    console.log(`WRAP:`+stringifyBigInt(exchangeContext.tradeData))
    alert(`WRAP`)
    const tradeData:TradeData = exchangeContext.tradeData
    const weiDepositAmount:bigint = tradeData.sellAmount
    const signer = tradeData.signer
    const chainId = tradeData.chainId
    const weth9Address =   wethMethods.getWeth9NetworkAddress(chainId)
    // alert(`chainId = ${chainId} weth9Address = ${weth9Address}`)
    wethMethods.connect(weth9Address, weth9ABI, signer);
    const tx = await wethMethods.depositWEI(weiDepositAmount);
    tx.wait();
}

const unwrap = async () => {
    console.log(`WRAP:`+stringifyBigInt(exchangeContext.tradeData))
    alert(`UN_WRAP`)
    const tradeData:TradeData = exchangeContext.tradeData
    const weiWithdrawAmount:bigint = tradeData.sellAmount
    const signer = tradeData.signer
    const chainId = tradeData.chainId
    const weth9Address = wethMethods.getWeth9NetworkAddress(chainId)
    alert(`chainId = ${chainId} weth9Address = ${weth9Address}`)
    wethMethods.connect(weth9Address, weth9ABI, signer);
    const tx = await wethMethods.withdrawWEI(weiWithdrawAmount);
    tx.wait();
}

const doSwap = async () => {
    console.log(`SWAP:`+stringifyBigInt(exchangeContext.tradeData))
    alert(`SWAP:`)
}

const swap = async() => {
    let swapType:SWAP_TYPE;
    const sellTokenAddress = exchangeContext.tradeData.sellTokenContract?.address
    const buyTokenAddress  = exchangeContext.tradeData.buyTokenContract?.address
    console.log(`sellTokenAddress =${sellTokenAddress}\nbuyTokenAddress =${buyTokenAddress}`)

    const setSwapType = (_swapType:SWAP_TYPE) => {
        swapType = _swapType
        exchangeContext.tradeData.swapType = _swapType;
      };;
     
      // useEffect(() => {
      //   getSwapState(exchangeContext.tradeData.sellTokenContract?.address, exchangeContext.tradeData.buyTokenContract?.address);
      // }, [exchangeContext.tradeData.sellTokenContract?.address, exchangeContext.tradeData.buyTokenContract?.address]);
    
    const getSwapState = () => {
        let swapType:SWAP_TYPE = SWAP_TYPE.UNDEFINED
        if (isTokenAddress(sellTokenAddress)) {
            if (isTokenAddress(buyTokenAddress))
                swapType = SWAP_TYPE.SWAP
            else  
                if (isNetworkAddress(buyTokenAddress))
                    if (isWrappedNetworkAddress(sellTokenAddress))
                        swapType = SWAP_TYPE.UNWRAP
                    else
                        swapType = SWAP_TYPE.SWAP_UNWRAP
        } else if (isNetworkAddress(sellTokenAddress)){
            if (isWrappedNetworkAddress(buyTokenAddress))
                swapType = SWAP_TYPE.WRAP
            else
                swapType = SWAP_TYPE.WRAP_SWAP
            } else
        swapType = SWAP_TYPE.UNDEFINED
        exchangeContext.tradeData.swapType = swapType;
        return swapType;
    }

    console.debug(stringifyBigInt(exchangeContext.tradeData))
    swapType = getSwapState()
    switch (swapType) {
        case SWAP_TYPE.SWAP:
            await doSwap()
        break
        case SWAP_TYPE.SWAP_UNWRAP:
            await doSwap()
            await unwrap()
        break
        case SWAP_TYPE.UNWRAP:
            await unwrap()
        break
        case SWAP_TYPE.WRAP_SWAP:
            await wrap()
            doSwap()
        break
        case SWAP_TYPE.WRAP:
            await wrap()
        break
        case SWAP_TYPE.UNDEFINED:
            alert(`UNDEFINED SWAP_TYPE`)
        break
    }
    return swapType;
}

export default swap