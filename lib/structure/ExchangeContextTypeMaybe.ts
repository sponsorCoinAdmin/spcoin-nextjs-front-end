// File: @/lib/structure/ExchangeContextTypeMaybe.ts

/**
 * ExchangeContextTypeMaybe
 * ------------------------
 * Explicit helper type used in a few UI / overlay scenarios where
 * the ExchangeContext may be temporarily unavailable during hydration
 * or provider transitions.
 *
 * NOTE:
 * This type is intentionally small and explicit instead of being
 * redefined inline as `ExchangeContextType | null | undefined`.
 *
 * Usage is OPTIONAL — most code should continue to rely on
 * optional chaining against `useContext(ExchangeContextState)`.
 */

import type { ExchangeContextType } from "../context";

export type ExchangeContextTypeMaybe =
  | ExchangeContextType
  | null
  | undefined;
