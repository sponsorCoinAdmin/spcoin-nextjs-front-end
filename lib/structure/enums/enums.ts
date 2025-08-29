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
  CONNECTED,
  DISCONNECTED,
  CONNECTING,
  RECONNECTING,
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
