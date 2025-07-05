// File: lib/context/ScrollSelectPanels/RecipientPanelProvider.tsx
// Author: Robin
// Date: 2023-07-07
// Description: Provider for the RecipientPanelContext

import { CONTAINER_TYPE, FEED_TYPE } from '@/lib/structure';
import { SharedPanelContext } from './SharedPanelContext';
import { usePanelContextBase } from './usePanelContextBase';

export function RecipientPanelProvider({ children }: { children: React.ReactNode }) {
  const value = usePanelContextBase(
    FEED_TYPE.RECIPIENT_ACCOUNTS,
    CONTAINER_TYPE.RECIPIENT_SELECT_CONTAINER,
    'RecipientPanelProvider',
    process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true'
  );

  return (
    <SharedPanelContext.Provider value={value}>
      {children}
    </SharedPanelContext.Provider>
  );
}
