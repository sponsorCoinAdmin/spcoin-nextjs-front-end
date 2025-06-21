import { CONTAINER_TYPE } from "../structure";

export const getContainerTitle = (containerType: CONTAINER_TYPE): string =>{
    // default title (if containerType is not matched
    let resolvedTitle;

    switch (containerType) {
        case CONTAINER_TYPE.SELL_SELECT_CONTAINER:
            resolvedTitle = 'Select a Token to Sell';
            break;
        case CONTAINER_TYPE.BUY_SELECT_CONTAINER:
            resolvedTitle = 'Select a Token to Buy';
            break;
        case CONTAINER_TYPE.RECIPIENT_CONTAINER:
            resolvedTitle = 'Select a Recipient';
            break;
        case CONTAINER_TYPE.AGENT_CONTAINER:
            resolvedTitle = 'Select a Recipient';
            break;
        default:
            resolvedTitle = 'Select an Address';
    }
    return resolvedTitle;
}