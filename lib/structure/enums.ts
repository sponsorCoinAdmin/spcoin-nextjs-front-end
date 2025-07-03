// File: lib/structure/enums.ts
export enum BUTTON_TYPE {
  API_TRANSACTION_ERROR,
  BUY_ERROR_REQUIRED,
  BUY_TOKEN_REQUIRED,
  CONNECT,
  INSUFFICIENT_BALANCE,
  IS_LOADING_PRICE,
  NO_HARDHAT_API,
  SELL_ERROR_REQUIRED,
  SELL_TOKEN_REQUIRED,
  SWAP,
  TOKENS_REQUIRED,
  UNDEFINED,
  ZERO_AMOUNT
}

export enum CONTAINER_TYPE {
  SELL_SELECT_CONTAINER = 'SELL_SELECT_CONTAINER',
  BUY_SELECT_CONTAINER = 'BUY_SELECT_CONTAINER',
  AGENT_SELECT_CONTAINER = 'RECIPIENT_SELECT_CONTAINER',
  RECIPIENT_SELECT_CONTAINER = 'RECIPIENT_SELECT_CONTAINER',
}

export enum EXCHANGE_STATE {
  APPROVE,
  INSUFFICIENT_BALANCE,
  MISSING_SELL_AMOUNT,
  NOT_CONNECTED,
  PENDING,
  SWAP
}

export enum FEED_TYPE {
  AGENT_ACCOUNTS,
  RECIPIENT_ACCOUNTS,
  TOKEN_LIST
}

export enum SP_COIN_DISPLAY {
  DISPLAY_OFF,
  DISPLAY_ON,
  EXCHANGE_ROOT,
  SHOW_MANAGE_SPONSORS_BUTTON,
  SHOW_RECIPIENT_SCROLL_CONTAINER,
  SHOW_TOKEN_SCROLL_CONTAINER,
  SHOW_ERROR_MESSAGE,
}

export enum STATUS {
  ERROR_API_PRICE,
  FAILED,
  MESSAGE_ERROR,
  SUCCESS,
  WARNING_HARDHAT,
  INFO
}

export enum TRADE_DIRECTION {
  SELL_EXACT_OUT,
  BUY_EXACT_IN
}

export enum API_TRADING_PROVIDER {
  API_0X,
  API_1INCH
}

export enum InputState {
  // 0️⃣ Initial Trigger
  VALIDATE_INPUT,                     // Initial trigger on input change

  // 1️⃣ Input Check
  EMPTY_INPUT,                        // Input is blank → stop early

  // 2️⃣ Address Validation
  VALIDATE_ADDRESS,                   // Test if Address is Valid
  INVALID_ADDRESS_INPUT,             // Not a valid hex address

  // 3️⃣ Duplication Check
  TEST_DUPLICATE_INPUT,              // Check if token/account already selected
  DUPLICATE_INPUT,                   // It is a duplicate → exit

  // 4️⃣ Blockchain Existence Check
  VALIDATE_EXISTS_ON_CHAIN,          // Trigger async contract resolution
  CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,  // Valid address, but not a contract

  // 5️⃣ Local Metadata Check
  VALIDATE_CONTRACT_EXISTS_LOCALLY,  // Check if image/logo metadata exists
  CONTRACT_NOT_FOUND_LOCALLY,        // Metadata or logo missing

  // 6️⃣ Final Success
  VALID_INPUT,                       // Fully validated

  // 7️⃣ Close Trigger
  CLOSE_SELECT_INPUT,                // Close after valid input

  // 8️⃣ Running Status (Non-linear)
  IS_LOADING                         // Indicates a check is in progress
}

export const getInputStateString = (state: InputState): string => {
  switch (state) {
    // 🔹 Phase 1: Trigger
    case InputState.VALIDATE_INPUT:
      return 'VALIDATE_INPUT';

    // 🔹 Phase 2: Input Checks
    case InputState.EMPTY_INPUT:
      return 'EMPTY_INPUT';

    // 🔹 Phase 3: Address Validation
    case InputState.VALIDATE_ADDRESS:
      return 'VALIDATE_ADDRESS';
    case InputState.INVALID_ADDRESS_INPUT:
      return 'INVALID_ADDRESS_INPUT';

    // 🔹 Phase 4: Duplication Check
    case InputState.TEST_DUPLICATE_INPUT:
      return 'TEST_DUPLICATE_INPUT';
    case InputState.DUPLICATE_INPUT:
      return 'DUPLICATE_INPUT';

    // 🔹 Phase 5: Blockchain Contract Resolution
    case InputState.VALIDATE_EXISTS_ON_CHAIN:
      return 'VALIDATE_EXISTS_ON_CHAIN';
    case InputState.CONTRACT_NOT_FOUND_ON_BLOCKCHAIN:
      return 'CONTRACT_NOT_FOUND_ON_BLOCKCHAIN';

    // 🔹 Phase 6: Local Metadata Validation
    case InputState.VALIDATE_CONTRACT_EXISTS_LOCALLY:
      return 'VALIDATE_CONTRACT_EXISTS_LOCALLY';
    case InputState.CONTRACT_NOT_FOUND_LOCALLY:
      return 'CONTRACT_NOT_FOUND_LOCALLY';

    // 🔹 Phase 7: Final State
    case InputState.VALID_INPUT:
      return 'VALID_INPUT';
    case InputState.CLOSE_SELECT_INPUT:
      return 'CLOSE_SELECT_INPUT';

    // 🔹 Utility
    case InputState.IS_LOADING:
      return 'IS_LOADING';

    // 🔹 Unknown (fallback)
    default:
      return 'UNKNOWN_INPUT_STATE';
  }
};

