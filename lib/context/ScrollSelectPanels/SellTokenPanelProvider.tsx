// File: lib/context/ScrollSelectPanels/SellTokenPanelProvider.tsx
// Author: Robin
// Date: 2023-07-07
// Description: Provider for the SellTokenPanelContext

import { SP_COIN_DISPLAY, FEED_TYPE } from '@/lib/structure';
import { SharedPanelContext } from './useSharedPanelContext';
import { usePanelContextBase } from './usePanelContextBase';

export function SellTokenPanelProvider({ children }: { children: React.ReactNode }) {
    const value = usePanelContextBase(
        FEED_TYPE.TOKEN_LIST,
        SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL,
        'SellTokenPanelProvider',
        process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true'
    );

    return (
        <SharedPanelContext.Provider value={value}>
            {children}
        </SharedPanelContext.Provider>
    );
}
