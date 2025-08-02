// File: lib/context/ScrollSelectPanels/RecipientPanelProvider.tsx
// Author: Robin
// Date: 2023-07-07
// Description: Provider for the RecipientPanelContext

import { SP_COIN_DISPLAY, FEED_TYPE } from '@/lib/structure';
import { SharedPanelContext } from './useSharedPanelContext';
import { usePanelContextBase } from './usePanelContextBase';

export function RecipientPanelProvider({ children }: { children: React.ReactNode }) {
  const value = usePanelContextBase(
    FEED_TYPE.RECIPIENT_ACCOUNTS,
    SP_COIN_DISPLAY.RECIPIENT_SELECT_PANEL,
    'RecipientPanelProvider',
    process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true'
  );

  return (
    <SharedPanelContext.Provider value={value}>
      {children}
    </SharedPanelContext.Provider>
  );
}
