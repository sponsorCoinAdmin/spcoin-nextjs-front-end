'use client';

import React, { ReactNode } from 'react';
import { SharedPanelContext } from './useSharedPanelContext';
import { CONTAINER_TYPE, FEED_TYPE } from '@/lib/structure';
import { usePanelContextBase } from './usePanelContextBase';
import { SharedPanelManager } from './SharedPanelManager';

export const SharedPanelProvider = ({ children }: { children: ReactNode }) => {
  const contextValue = usePanelContextBase(
    FEED_TYPE.TOKEN_LIST,
    CONTAINER_TYPE.SELL_SELECT_CONTAINER,
    'SharedPanelProvider',
    process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true'
  );

  return (
    <SharedPanelContext.Provider value={contextValue}>
      <SharedPanelManager />
      {children}
    </SharedPanelContext.Provider>
  );
};
