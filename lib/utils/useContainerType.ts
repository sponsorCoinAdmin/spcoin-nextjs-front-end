// File: lib/hooks/useContainerType.ts

import { CONTAINER_TYPE } from '@/lib/structure';

export function useContainerType(containerType: CONTAINER_TYPE) {
  let inputPlaceholder = 'Enter address';
  let title = 'Select Address';
  let duplicateMessage = '';
  let showDuplicateCheck = false;

  switch (containerType) {
    case CONTAINER_TYPE.SELL_SELECT_CONTAINER:
      inputPlaceholder = 'Type or paste token address';
      title = 'Select a Token to Sell';
      duplicateMessage = 'Sell Address Cannot Be the Same as Buy Address';
      showDuplicateCheck = true;
      break;

    case CONTAINER_TYPE.BUY_SELECT_CONTAINER:
      inputPlaceholder = 'Type or paste token address';
      title = 'Select a Token to Buy';
      duplicateMessage = 'Buy Address Cannot Be the Same as Sell Address';
      showDuplicateCheck = true;
      break;

    case CONTAINER_TYPE.RECIPIENT_CONTAINER:
      inputPlaceholder = 'Paste recipient wallet address';
      title = 'Select a Recipient';
      break;

    case CONTAINER_TYPE.AGENT_CONTAINER:
      inputPlaceholder = 'Paste agent wallet address';
      title = 'Select an Agent';
      break;

    default:
      // fallback values already assigned
      break;
  }

  return {
    inputPlaceholder,
    title,
    duplicateMessage,
    showDuplicateCheck,
  };
}
