// File: lib/hooks/inputValidations/validations/getDuplicateMessage.ts

import { SP_COIN_DISPLAY } from '@/lib/structure';

/**
 * Returns a context-aware message explaining that the selected token/account is a duplicate.
 * 
 * @param containerType - The input container currently being validated (SELL, BUY, etc.)
 * @returns A string describing the duplicate input error message.
 */
export function getDuplicateMessage(containerType: SP_COIN_DISPLAY): string {
  switch (containerType) {
    case SP_COIN_DISPLAY.SELL_SELECT_CONTAINER:
      return 'Sell Address Cannot Be the Same as Buy Address';

    case SP_COIN_DISPLAY.BUY_SELECT_CONTAINER:
      return 'Buy Address Cannot Be the Same as Sell Address';

    case SP_COIN_DISPLAY.RECIPIENT_SELECT_CONTAINER:
      return 'Recipient Address Cannot Match Sender';

    case SP_COIN_DISPLAY.AGENT_SELECT_CONTAINER:
      return 'Agent Address Cannot Match Connected Account';

    default:
      return 'Duplicate address input detected.';
  }
}
