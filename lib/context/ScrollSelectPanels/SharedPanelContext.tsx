// File: lib/context/ScrollSelectPanels/SharedPanelContext.tsx

'use client';

import { createContext, useContext } from 'react';
import { InputState, CONTAINER_TYPE, FEED_TYPE } from '@/lib/structure';
import { ValidatedAsset } from '@/lib/hooks/inputValidations/types/validationTypes';

export interface SharedPanelContextType {
  // ─── FSM state ─────────────────────────────────
  /** The current step of your validation FSM */
  inputState: InputState;
  /** Move the FSM to a new step */
  setInputState: (state: InputState) => void;

  /** The currently validated asset (if any) */
  validatedAsset?: ValidatedAsset;
  /** Setter for the validated asset */
  setValidatedAsset?: (asset: ValidatedAsset | undefined) => void;

  // ─── Panel identity ─────────────────────────────
  /** Which container this context drives (buy / sell / agent etc.) */
  containerType: CONTAINER_TYPE;
  /** Which data‐feed this panel is bound to */
  feedType: FEED_TYPE;

  // ─── Hex‐input state + setters ───────────────────
  /** The raw hex string as the user types */
  validHexInput: string;
  /** The last *invalid* hex string the user tried */
  failedHexInput?: string;
  /** Predicate to check if a raw input is valid */
  isValidHexInput: (raw: string) => boolean;
  /** Overwrite the raw hex input in context */
  setValidHexInput: (raw: string) => void;
  /** Overwrite the failed hex input in context */
  setFailedHexInput: (raw?: string) => void;

  // ─── Debounced hex‐input ────────────────────────
  /** A debounced version of `validHexInput` (e.g. 250 ms delay) */
  debouncedHexInput: string;

  // ─── Debug helper ───────────────────────────────
  /** Dumps *all* of the above into the console for inspection */
  dumpSharedPanelContext: () => void;
}

export const SharedPanelContext = createContext<SharedPanelContextType | undefined>(undefined);

export const useSharedPanelContext = (): SharedPanelContextType => {
  const ctx = useContext(SharedPanelContext);
  if (!ctx) {
    throw new Error('❌ useSharedPanelContext must be used within a Panel Provider');
  }
  return ctx;
};
