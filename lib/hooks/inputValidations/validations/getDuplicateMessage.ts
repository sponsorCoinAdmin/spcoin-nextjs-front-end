// File: lib/hooks/inputValidations/validations/getDuplicateMessage.ts

import { CONTAINER_TYPE } from '@/lib/structure';

/**
 * Returns a context-aware message explaining that the selected token/account is a duplicate.
 * 
 * @param containerType - The input container currently being validated (SELL, BUY, etc.)
 * @returns A string describing the duplicate input error message.
 */
export function getDuplicateMessage(containerType: CONTAINER_TYPE): string {
  switch (containerType) {
    case CONTAINER_TYPE.SELL_SELECT_CONTAINER:
      return 'Sell Address Cannot Be the Same as Buy Address';

    case CONTAINER_TYPE.BUY_SELECT_CONTAINER:
      return 'Buy Address Cannot Be the Same as Sell Address';

    case CONTAINER_TYPE.RECIPIENT_SELECT_CONTAINER:
      return 'Recipient Address Cannot Match Sender';

    case CONTAINER_TYPE.AGENT_SELECT_CONTAINER:
      return 'Agent Address Cannot Match Connected Account';

    default:
      return 'Duplicate address input detected.';
  }
}
