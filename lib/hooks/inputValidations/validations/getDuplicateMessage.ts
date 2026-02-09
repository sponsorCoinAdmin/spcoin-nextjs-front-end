// File: @/lib/hooks/inputValidations/validations/getDuplicateMessage.ts

import { SP_COIN_DISPLAY } from '@/lib/structure';

/**
 * Returns a context-aware message explaining that the selected token/account is a duplicate.
 * 
 * @param containerType - The input container currently being validated (SELL, BUY, etc.)
 * @returns A string describing the duplicate input error message.
 */
export function getDuplicateMessage(containerType: SP_COIN_DISPLAY): string {
  switch (containerType) {
    case SP_COIN_DISPLAY.TOKEN_LIST_SELECT_PANEL:
      return 'Sell Address Cannot Be the Same as Buy Address';

    case SP_COIN_DISPLAY.RECIPIENT_LIST_SELECT_PANEL:
      return 'Recipient Address Cannot Match Sender';

    case SP_COIN_DISPLAY.AGENT_LIST_SELECT_PANEL:
      return 'Agent Address Cannot Match Connected Account';

    default:
      return 'Duplicate address input detected.';
  }
}
