'use client'
import { getInitialContext } from '@/lib/network/initialize/defaultNetworkSettings';

let exchangeContext = getInitialContext (1);

const resetNetworkContext = (chain:any) => {
    const networkName = chain?.name.toLowerCase();
    // console.debug("resetNetworkContext: newNetworkName = " + networkName);
    exchangeContext = getInitialContext(chain)
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
    exchangeContext
}
