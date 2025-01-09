import { SWAP_STATE } from "@/lib/structure/types";
import { exchangeContext } from "@/lib/context";
import { stringifyBigInt } from '@/node_modules-dev/spcoin-common/spcoin-lib';
// const { WethMethods }  = require("@sponsorcoin/spcoin-weth-module-CJS/index");


const wrap = () => {
    alert(`WRAP`)
}

const unwrap = () => {
    alert(`UNWRAP`)
}

const doSwap = () => {
    alert(`SWAP`)
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

const swap = (swapState: SWAP_STATE) => {
    console.debug(stringifyBigInt(exchangeContext.tradeData))
    // dumpSwapState(swapState);
    
    switch (swapState) {
        case SWAP_STATE.SWAP:
            doSwap()
        break
        case SWAP_STATE.SWAP_TO_NETWORK_TOKEN_UNWRAP:
            doSwap()
            unwrap();
        break
        case SWAP_STATE.UNWRAP:
            unwrap();
        break
        case SWAP_STATE.WRAP_TO_NETWORK_TOKEN_SWAP:
            wrap()
            doSwap()
        break
        case SWAP_STATE.WRAP:
            wrap();
        break
        case SWAP_STATE.UNDEFINED:
            alert(`UNDEFINED SWAP_STATE`)
        break
    }
}

export {
    swap
}