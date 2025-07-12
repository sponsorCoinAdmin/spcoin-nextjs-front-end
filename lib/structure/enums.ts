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
  ZERO_AMOUNT,
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
  SWAP,
}

export enum FEED_TYPE {
  AGENT_ACCOUNTS,
  RECIPIENT_ACCOUNTS,
  TOKEN_LIST,
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
  INFO,
}

export enum TRADE_DIRECTION {
  SELL_EXACT_OUT,
  BUY_EXACT_IN,
}

export enum API_TRADING_PROVIDER {
  API_0X,
  API_1INCH,
}

// File: lib/structure/enums.ts (or equivalent)

export enum InputState {
  // 0️⃣ Blank input
  EMPTY_INPUT,                    // 0

  // 1️⃣ Triggered by user input
  VALIDATE_INPUT,                // 1

  // 2️⃣ Hex address validation
  VALIDATE_ADDRESS,              // 2
  INCOMPLETE_ADDRESS,             // 3

  INVALID_ADDRESS_INPUT,         // 4

  // 3️⃣ Duplication check
  TEST_DUPLICATE_INPUT,          // 5
  DUPLICATE_INPUT_ERROR,               // 6

  // 4️⃣ Blockchain existence check
  VALIDATE_EXISTS_ON_CHAIN,              // 7
  CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,      // 8

  // 5️⃣ Local metadata check
  VALIDATE_CONTRACT_EXISTS_LOCALLY,      // 9
  CONTRACT_NOT_FOUND_LOCALLY,            // 10

  // 6️⃣ Balance check
  VALIDATE_BALANCE,                      // 11
  VALIDATE_BALANCE_ERROR,                // 12

  // 7️⃣ Final validated state
  VALID_INPUT,                           // 13

  // 8️⃣ Close panel trigger
  CLOSE_SELECT_INPUT,                    // 14

  // 9️⃣ Async indicator
  IS_LOADING                             // 15
}


export const getInputStateString = (state: InputState): string =>
  InputState[state] ?? 'UNKNOWN_INPUT_STATE';
