// lib/structure/assetSelection/types/context.ts

import type { AssetSelectionDisplay } from '../enums';

export type AssetSelectionContextType = {
  /** Optional: useful when multiple selection instances are mounted */
  instanceId?: string;

  /** Local FSM state (kept minimal here so we avoid coupling to global types) */
  inputState?: number; // temp: your provider enforces real enum

  setInputState?: (s: number) => void;

  /** Validated entity chosen by the selection flow (token/account/etc.) */
  validatedAsset?: unknown;
  setValidatedAsset?: (v: unknown) => void;

  /** Identity of this selection container (BUY/SELL/RECIPIENT/AGENT) */
  containerType?: number; // temp: avoids importing SP_COIN_DISPLAY

  /** Optional feed type (token list, accounts) */
  feedType?: number;

  /** Local logging helper */
  dumpFSMContext?: (header?: string) => void;
};

/** Optional helper type if you want a read-only view */
export type ReadonlyAssetSelectionContext = Readonly<AssetSelectionContextType>;
