import { CONTAINER_TYPE } from '@/lib/structure';

export default function setContainerType(containerType: CONTAINER_TYPE) {
  const inputPlaceholder = (() => {
    switch (containerType) {
      case CONTAINER_TYPE.BUY_SELECT_CONTAINER:
      case CONTAINER_TYPE.SELL_SELECT_CONTAINER:
        return 'Type or paste token address';
      case CONTAINER_TYPE.RECIPIENT_CONTAINER:
        return 'Paste recipient wallet address';
      case CONTAINER_TYPE.AGENT_CONTAINER:
        return 'Paste agent wallet address';
      default:
        return 'Enter address';
    }
  })();

  const title = (() => {
    switch (containerType) {
      case CONTAINER_TYPE.BUY_SELECT_CONTAINER:
        return 'Select a Token to Buy';
      case CONTAINER_TYPE.SELL_SELECT_CONTAINER:
        return 'Select a Token to Sell';
      case CONTAINER_TYPE.RECIPIENT_CONTAINER:
        return 'Select a Recipient';
      case CONTAINER_TYPE.AGENT_CONTAINER:
        return 'Select an Agent';
      default:
        return 'Undefined Container';
    }
  })();

  const duplicateMessage = (() => {
    return containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
      ? 'Sell Address Cannot Be the Same as Buy Address'
      : 'Buy Address Cannot Be the Same as Sell Address';
  })();

  const showDuplicateCheck = (
    containerType === CONTAINER_TYPE.BUY_SELECT_CONTAINER ||
    containerType === CONTAINER_TYPE.SELL_SELECT_CONTAINER
  );

  return {
    inputPlaceholder,
    title,
    duplicateMessage,
    showDuplicateCheck,
  };
}
