'use client'
import { getInitialContext, initialContext, getEmptyContext } from '@/lib/network/initialize/defaultNetworkSettings';

const {exchangeContext, exchangeContextMap} = initialContext ();
let emptyContext = getEmptyContext();

// exchangeContext = emptyContext;

const resetNetworkContext = (chain:any) => {
    const networkName = chain?.name.toLowerCase();
// exchangeContext = getInitialContext(chain)
    
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
