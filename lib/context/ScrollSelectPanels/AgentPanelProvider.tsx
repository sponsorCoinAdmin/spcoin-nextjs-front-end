// File: lib/context/ScrollSelectPanels/AgentPanelProvider.tsx
// Author: Robin
// Date: 2023-07-07
// Description: Provider for the AgentPanelContext

'use client';

import React from 'react';
import { CONTAINER_TYPE, FEED_TYPE } from '@/lib/structure';
import { SharedPanelContext } from './SharedPanelContext';
import { usePanelContextBase } from './usePanelContextBase';

export function AgentPanelProvider({ children }: { children: React.ReactNode }) {
  const value = usePanelContextBase(
    FEED_TYPE.AGENT_ACCOUNTS,
    CONTAINER_TYPE.AGENT_SELECT_CONTAINER,
    'AgentPanelProvider',
    process.env.NEXT_PUBLIC_DEBUG_LOG_SCROLL_PANEL_CONTEXT === 'true'
  );

  return (
    <SharedPanelContext.Provider value={value}>
      {children}
    </SharedPanelContext.Provider>
  );
}
