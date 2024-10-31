import { SWAP_STATE } from "../structure/types";
import { dumpSwapState } from "./utils";

const wrap = () => {
    alert(`WRAP`)
}

const unwrap = () => {
    alert(`UNWRAP`)
}

const doSwap = () => {
    alert(`SWAP`)
}

const swap = (swapState: SWAP_STATE) => {
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