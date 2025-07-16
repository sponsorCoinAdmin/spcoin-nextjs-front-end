// File: lib/context/ScrollSelectPanels/SellTradePanelProvider.tsx
// Author: Robin
// Date: 2023-07-07
// Description: Provider for the SellTradePanelContext

import { CONTAINER_TYPE, FEED_TYPE } from '@/lib/structure';
import { SharedPanelContext } from './useSharedPanelContext';
import { usePanelContextBase } from './usePanelContextBase';

export function SellTradePanelProvider({ children }: { children: React.ReactNode }) {
    const value = usePanelContextBase(
        FEED_TYPE.TOKEN_LIST,
        CONTAINER_TYPE.SELL_SELECT_CONTAINER,
        'SellTradePanelProvider',
        process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true'
    );

    return (
        <SharedPanelContext.Provider value={value}>
            {children}
        </SharedPanelContext.Provider>
    );
}
