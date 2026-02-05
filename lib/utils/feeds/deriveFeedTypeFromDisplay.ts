// File: @/lib/utils/feeds/deriveFeedTypeFromDisplay.ts
// File: @/lib/utils/feeds/deriveFeedTypeFromDisplay'
import { FEED_TYPE, SP_COIN_DISPLAY } from '@/lib/structure';

/**
 * Global SSOT mapping: SP_COIN_DISPLAY -> FEED_TYPE
 * Keep this exhaustive for every list-like overlay that needs data.
 */
export function deriveFeedTypeFromDisplay(display: SP_COIN_DISPLAY): FEED_TYPE | undefined {
  switch (display) {
    // First-class list overlays
    case SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL:
      return FEED_TYPE.AGENT_ACCOUNTS;

    case SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL:
      return FEED_TYPE.RECIPIENT_ACCOUNTS;

      return FEED_TYPE.SPONSOR_ACCOUNTS;

    // Manage-style overlays
    case SP_COIN_DISPLAY.ACCOUNT_LIST_REWARDS_PANEL:
      // If you need "manage agents vs manage recipients" you must read it from context
      // or split into two displays. For now return undefined to force explicitness.
      return undefined;

    // Sponsor list select sub-panels (if they should reuse existing feeds)
    case SP_COIN_DISPLAY.PENDING_AGENT_REWARDS:
      return FEED_TYPE.AGENT_ACCOUNTS;

    case SP_COIN_DISPLAY.PENDING_RECIPIENT_REWARDS:
      return FEED_TYPE.RECIPIENT_ACCOUNTS;

    case SP_COIN_DISPLAY.PENDING_SPONSOR_REWARDS:
    case SP_COIN_DISPLAY.ACTIVE_SPONSORSHIPS:
      return FEED_TYPE.SPONSOR_ACCOUNTS;

    // Trading overlays (if they show token lists)
    case SP_COIN_DISPLAY.TOKEN_CONTRACT_PANEL:
      return FEED_TYPE.TOKEN_LIST;

    default:
      return undefined;
  }
}
