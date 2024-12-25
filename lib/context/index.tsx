'use client'
import { getInitialContext, initialContext } from '@/lib/network/initialize/defaultNetworkSettings';

let {exchangeContext, exchangeContextMap} = initialContext ();

const resetNetworkContext = (chain:number) => {
    exchangeContext = getInitialContext(chain)
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
