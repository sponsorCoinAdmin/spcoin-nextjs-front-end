'use client'
import { getInitialContext, initialContext } from '@/lib/network/initialize/defaultNetworkSettings';
import { ExchangeContext } from "@/lib/structure/types";

let {exchangeContext, exchangeContextMap} = initialContext ();

const resetNetworkContext = (chain:any) => {
    const networkName = chain?.name.toLowerCase();
    // console.debug("resetNetworkContext: newNetworkName = " + networkName);
    const exchangeContext:ExchangeContext = getInitialContext(chain)
    // console.debug("resetNetworkContext: exchangeContext.network.name = " + exchangeContext.network.name);
    // console.debug(`UPDATING NETWORK to ${networkName}`);
}

export function ExchangeWrapper({children} : {
    children: React.ReactNode;
}) {
    return (
        <div>
            {children}
        </div>
    )
}

export {
    resetNetworkContext,
    exchangeContext,
    exchangeContextMap
}
