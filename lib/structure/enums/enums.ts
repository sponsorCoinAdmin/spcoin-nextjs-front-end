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

/**
 * ✅ Make provider IDs stable for persistence/telemetry by using string enums.
 * (Safer than numeric enums when writing to localStorage or sending over the wire.)
 */
export enum API_TRADING_PROVIDER {
  API_0X = 'API_0X',
  API_1INCH = 'API_1INCH',
}

/** Convenience: all providers as a readonly tuple */
export const API_TRADING_PROVIDERS = [
  API_TRADING_PROVIDER.API_0X,
  API_TRADING_PROVIDER.API_1INCH,
] as const;

/** Type guard */
export function isApiTradingProvider(x: unknown): x is API_TRADING_PROVIDER {
  return typeof x === 'string' && (API_TRADING_PROVIDERS as readonly string[]).includes(x);
}

// ---------------------------------------------------------------------------
// InputState (leave as-is unless you’re migrating to the latest canonical set)
// ---------------------------------------------------------------------------

export enum InputState {
  // 0️⃣ FSM Entry Point
  FSM_READY = 0,

  // 1️⃣ Blank input
  EMPTY_INPUT = 1,

  // 2️⃣ Hex input validation
  INVALID_HEX_INPUT = 2,
  VALIDATE_ADDRESS = 3,
  INCOMPLETE_ADDRESS = 4,
  INVALID_ADDRESS_INPUT = 5,

  // 3️⃣ Duplication check
  TEST_DUPLICATE_INPUT = 6,
  DUPLICATE_INPUT_ERROR = 7,

  // 4️⃣ Preview check phase
  VALIDATE_PREVIEW = 8,
  PREVIEW_ADDRESS = 9,
  PREVIEW_CONTRACT_EXISTS_LOCALLY = 10,
  PREVIEW_CONTRACT_NOT_FOUND_LOCALLY = 11,

  // 5️⃣ Blockchain existence check
  VALIDATE_EXISTS_ON_CHAIN = 12,
  CONTRACT_NOT_FOUND_ON_BLOCKCHAIN = 13,

  // 6️⃣ Asset check (balance, metadata)
  RESOLVE_ASSET = 14,
  TOKEN_NOT_RESOLVED_ERROR = 15,
  RESOLVE_ASSET_ERROR = 16,
  MISSING_ACCOUNT_ADDRESS = 17,

  // 7️⃣ Final delivery
  UPDATE_VALIDATED_ASSET = 18,

  // 8️⃣ Final close
  CLOSE_SELECT_PANEL = 19,
}

export const getInputStateString = (state: InputState): string =>
  InputState[state] ?? 'UNKNOWN_INPUT_STATE';
