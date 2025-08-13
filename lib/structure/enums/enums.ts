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
  RECIPIENT_SELECT_PANEL,
  TOKEN_SELECT_PANEL,
  ERROR_MESSAGE_PANEL,
  SPONSOR_RATE_CONFIG_PANEL,
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

// File: lib/structure.ts (or wherever InputState is defined)
export enum InputState {
  // 0️⃣ FSM Entry Point
  FSM_READY = 0,                           // 0

  // 1️⃣ Blank input
  EMPTY_INPUT = 1,                         // 1

  // 2️⃣ Hex input validation
  INVALID_HEX_INPUT = 2,                   // 2
  VALIDATE_ADDRESS = 3,                    // 3
  INCOMPLETE_ADDRESS = 4,                  // 4
  INVALID_ADDRESS_INPUT = 5,               // 5

  // 3️⃣ Duplication check
  TEST_DUPLICATE_INPUT = 6,                // 6
  DUPLICATE_INPUT_ERROR = 7,               // 7

  // 4️⃣ Preview check phase
  VALIDATE_PREVIEW = 8,                    // 8
  PREVIEW_ADDRESS = 9,                     // 9
  PREVIEW_CONTRACT_EXISTS_LOCALLY = 10,   // 10
  PREVIEW_CONTRACT_NOT_FOUND_LOCALLY = 11,// 11

  // 5️⃣ Blockchain existence check
  VALIDATE_EXISTS_ON_CHAIN = 12,          // 12
  CONTRACT_NOT_FOUND_ON_BLOCKCHAIN = 13,  // 13

  // 6️⃣ Asset check (balance, metadata)
  RESOLVE_ASSET = 14,                      // 14
  TOKEN_NOT_RESOLVED_ERROR = 15,           // 15
  RESOLVE_ASSET_ERROR = 16,                // 16
  MISSING_ACCOUNT_ADDRESS = 17,            // 17

  // 7️⃣ Final delivery
  UPDATE_VALIDATED_ASSET = 18,             // 18

  // 8️⃣ Final close
  CLOSE_SELECT_PANEL = 19,                 // 19
}

export const getInputStateString = (state: InputState): string =>
  InputState[state] ?? 'UNKNOWN_INPUT_STATE';
