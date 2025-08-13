// File: lib/structure/constants/types/settings.ts
// (If your Settings is elsewhere, apply the same change in that file)

import { SP_COIN_DISPLAY } from '../enums/spCoinDisplay';

export interface SettingsNEW {
  // ... your existing fields

  /** App-level panel visibility (single source of truth) */
  spCoinDisplay: SP_COIN_DISPLAY;
}
