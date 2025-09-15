'use client';

import { useMemo } from 'react';
import { FEED_TYPE, SP_COIN_DISPLAY } from '@/lib/structure';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL === 'true';
const debugLog = createDebugLogger('useFeedType', DEBUG, false);

export function useFeedType(containerType: SP_COIN_DISPLAY): FEED_TYPE {
  const feed = useMemo<FEED_TYPE>(() => {
    switch (containerType) {
      case SP_COIN_DISPLAY.RECIPIENT_SELECT_CONFIG_PANEL:
        return FEED_TYPE.RECIPIENT_ACCOUNTS;

    //   If you later add an Agent panel:
      case SP_COIN_DISPLAY.AGENT_SELECT_CONFIG_PANEL:
        return FEED_TYPE.AGENT_ACCOUNTS;

      case SP_COIN_DISPLAY.BUY_SELECT_SCROLL_PANEL:
      case SP_COIN_DISPLAY.SELL_SELECT_SCROLL_PANEL:
      default:
        return FEED_TYPE.TOKEN_LIST;
    }
  }, [containerType]);

  DEBUG && debugLog.log?.(
    `feedType resolved for ${SP_COIN_DISPLAY[containerType]} → ${FEED_TYPE[feed]}`
  );

  return feed;
}
