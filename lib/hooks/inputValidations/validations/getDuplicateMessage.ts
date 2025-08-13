// File: lib/hooks/inputValidations/validations/getDuplicateMessage.ts

import { SP_COIN_DISPLAY_NEW } from '@/lib/structure';

/**
 * Returns a context-aware message explaining that the selected token/account is a duplicate.
 * 
 * @param containerType - The input container currently being validated (SELL, BUY, etc.)
 * @returns A string describing the duplicate input error message.
 */
export function getDuplicateMessage(containerType: SP_COIN_DISPLAY_NEW): string {
  switch (containerType) {
    case SP_COIN_DISPLAY_NEW.SELL_SELECT_SCROLL_PANEL:
      return 'Sell Address Cannot Be the Same as Buy Address';

    case SP_COIN_DISPLAY_NEW.BUY_SELECT_SCROLL_PANEL:
      return 'Buy Address Cannot Be the Same as Sell Address';

    case SP_COIN_DISPLAY_NEW.RECIPIENT_SELECT_PANEL:
      return 'Recipient Address Cannot Match Sender';

    case SP_COIN_DISPLAY_NEW.AGENT_SELECT_PANEL:
      return 'Agent Address Cannot Match Connected Account';

    default:
      return 'Duplicate address input detected.';
  }
}
