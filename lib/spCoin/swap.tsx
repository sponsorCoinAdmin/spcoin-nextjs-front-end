import { SWAP_TYPE, TradeData } from "@/lib/structure/types";
import { exchangeContext } from "@/lib/context";
import { stringifyBigInt } from '../../../node_modules-dev/spcoin-common/spcoin-lib/utils';

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
import { WethMethods, weth9ABI } from "@sponsorcoin/weth-access-module-es6/index.js"

const wethMethods = new WethMethods();
// Example: Call
// it("9. <TYPE SCRIPT> Wrap/Unwrap WEI Using connectWeth9DefaultNetwork with HardHat Network and Signer account[11]", async function () {
//     const signer = SPONSOR_ACCOUNT_SIGNERS[11];
//     const weiDepositAmount = ethers.parseUnits("123");
//     const weiWithdrawAmount = ethers.parseUnits("23");

//     const wethMethods = new WethMethods();
//     wethMethods.connect(weth9Address, weth9ABI, signer);

//     await wethMethods.depositWEI(weiDepositAmount);
//     await wethMethods.withdrawWEI(weiWithdrawAmount);
// });

const wrap = () => {
    console.log(`AAA WRAP:`+stringifyBigInt(exchangeContext.tradeData))
    alert(`WRAP`)
    const tradeData:TradeData = exchangeContext.tradeData
    const weiDepositAmount:bigint = tradeData.sellAmount
    const signer = tradeData.signer
    const chainId = tradeData.chainId
    const weth9Address = wethMethods.getWeth9NetworkAddress(chainId)
    alert(`chainId = ${chainId} weth9Address = ${weth9Address}`)

    wethMethods.connect(weth9Address, weth9ABI, signer);
        // await wethMethods.depositWEI(weiDepositAmount);



}

const unwrap = () => {
    console.log(`UNWRAP:`+stringifyBigInt(exchangeContext.tradeData))
    alert(`UNWRAP:`)
}

const doSwap = () => {
    console.log(`SWAP:`+stringifyBigInt(exchangeContext.tradeData))
    alert(`SWAP:`)
}

/*
 it("10. <TYPE SCRIPT> wrap.un-wrap WEI Using connectWeth9DefaultNetwork with HardHat Network and Sinner account[11]", async function () {
    let tx;
    const signer = SPONSOR_ACCOUNT_SIGNERS[11];
    const weiDepositAmount = "2";
    const weiWithdrawAmount = "1";

    const wethMethods = new WethMethods();
    wethMethods.connectWeth9DefaultNetwork( HARDHAT, signer );
    tx = await wethMethods.depositWEI(weiDepositAmount)
    // console.log(`tx(${wethMethods.depositETH(weiDepositAmount)} = ${JSON.stringify(tx,null,2)}`);
    tx = await wethMethods.withdrawWEI(weiWithdrawAmount)
    // console.log(`tx(${wethMethods.withdrawETH(ethWithdrawAmount)} = ${JSON.stringify(tx,null,2)}`);
  });
*/

const swap = (swapType: SWAP_TYPE) => {
    console.debug(stringifyBigInt(exchangeContext.tradeData))
    // dumpSwapState(swapType);
    switch (swapType) {
        case SWAP_TYPE.SWAP:
            doSwap()
        break
        case SWAP_TYPE.SWAP_UNWRAP:
            doSwap()
            unwrap();
        break
        case SWAP_TYPE.UNWRAP:
            unwrap();
        break
        case SWAP_TYPE.WRAP_SWAP:
            wrap()
            doSwap()
        break
        case SWAP_TYPE.WRAP:
            wrap();
        break
        case SWAP_TYPE.UNDEFINED:
            alert(`UNDEFINED SWAP_TYPE`)
        break
    }
}

export {
    swap
}