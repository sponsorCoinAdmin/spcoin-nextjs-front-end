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
  TRADING_STATION_PANEL,
  MANAGE_SPONSORS_BUTTON,
  RECIPIENT_SCROLL_PANEL,
  TOKEN_SCROLL_PANEL,
  ERROR_MESSAGE_PANEL,
  SPONSOR_RATE_CONFIG_PANEL,
  RECIPIENT_SELECT_PANEL,
  AGENT_SELECT_PANEL,
  SELL_SELECT_SCROLL_PANEL,
  BUY_SELECT_SCROLL_PANEL,
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

// File: lib/structure/enums.ts

export enum InputState {
  // 0️⃣ Blank input
  EMPTY_INPUT,                            // 0

  // 1️⃣ Hex input validation
  INVALID_HEX_INPUT,                      // 1
  VALIDATE_ADDRESS,                       // 2
  INCOMPLETE_ADDRESS,                     // 3
  INVALID_ADDRESS_INPUT,                  // 4

  // 2️⃣ Duplication check
  TEST_DUPLICATE_INPUT,                   // 5
  DUPLICATE_INPUT_ERROR,                  // 6

  // 3️⃣ Preview check phase
  VALIDATE_PREVIEW,                       // 7
  PREVIEW_ADDRESS,                        // 8
  PREVIEW_CONTRACT_EXISTS_LOCALLY,        // 9
  PREVIEW_CONTRACT_NOT_FOUND_LOCALLY,     // 10

  // 4️⃣ Blockchain existence check
  VALIDATE_EXISTS_ON_CHAIN,               // 11
  CONTRACT_NOT_FOUND_ON_BLOCKCHAIN,       // 12

  // 5️⃣ Asset check (balance, metadata)
  RESOLVE_ASSET,                         // 13
  TOKEN_NOT_RESOLVED_ERROR,               // 14
  RESOLVE_ASSET_ERROR,                   // 15
  MISSING_ACCOUNT_ADDRESS,                // 16

  // 6️⃣ Final delivery
  UPDATE_VALIDATED_ASSET,                 // 17

  // 7️⃣ Final close
  CLOSE_SELECT_PANEL,                     // 18
}

export const getInputStateString = (state: InputState): string =>
  InputState[state] ?? 'UNKNOWN_INPUT_STATE';
