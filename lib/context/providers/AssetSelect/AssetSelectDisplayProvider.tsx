// File: lib/context/AssetSelect/AssetSelectDisplayProvider.tsx
'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ASSET_SELECTION_DISPLAY,
  type AssetSelectDisplay,
  ENV_DEBUG_ASSET_SELECTION,
} from '@/lib/structure/assetSelection';
import { createDebugLogger } from '@/lib/utils/debugLogger';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env[ENV_DEBUG_ASSET_SELECTION as 'NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL'] === 'true';
const debugLog = createDebugLogger('AssetSelectDisplayProvider', DEBUG_ENABLED, LOG_TIME);

export type AssetSelectDisplayContextType = {
  /** Optional: useful when multiple selection instances are mounted */
  instanceId?: string;

  /** Which nested view to show inside the selection panel */
  activeSubDisplay: AssetSelectDisplay;

  /** Low-level setter (kept public for flexibility) */
  setActiveSubDisplay: (d: AssetSelectDisplay) => void;

  /** Convenience actions that wrap setActiveSubDisplay */
  showErrorPreview: () => void;
  showAssetPreview: () => void;
  resetPreview: () => void;
};

const Ctx = createContext<AssetSelectDisplayContextType | null>(null);

type Props = {
  children: ReactNode;
  instanceId?: string;
  initial?: AssetSelectDisplay;
};

/**
 * Instance-scoped nested-visibility controller for AssetSelect panels.
 * Keeps AssetSelectProvider pure by externalizing sub-display state.
 */
export function AssetSelectDisplayProvider({
  children,
  instanceId,
  initial = ASSET_SELECTION_DISPLAY.IDLE,
}: Props) {
  const [activeSubDisplay, setActiveSubDisplay] =
    useState<AssetSelectDisplay>(initial);

  const value = useMemo<AssetSelectDisplayContextType>(
    () => ({
      instanceId,
      activeSubDisplay,
      setActiveSubDisplay: (next) => {
        if (DEBUG_ENABLED) {
          debugLog.log(
            `🎛️ subDisplay: ${activeSubDisplay} → ${next}${instanceId ? ` | ${instanceId}` : ''}`
          );
        }
        if (next !== activeSubDisplay) setActiveSubDisplay(next);
      },

      // Convenience actions
      showErrorPreview: () => setActiveSubDisplay(ASSET_SELECTION_DISPLAY.ERROR_PREVIEW),
      showAssetPreview: () => setActiveSubDisplay(ASSET_SELECTION_DISPLAY.ASSET_PREVIEW),
      resetPreview: () => setActiveSubDisplay(ASSET_SELECTION_DISPLAY.IDLE),
    }),
    [activeSubDisplay, instanceId]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAssetSelectDisplay(): AssetSelectDisplayContextType {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('useAssetSelectDisplay must be used within AssetSelectDisplayProvider');
  }
  return ctx;
}

/** Optional: lightweight hook when callers only need the actions */
export function useAssetSelectDisplayActions() {
  const { showErrorPreview, showAssetPreview, resetPreview } = useAssetSelectDisplay();
  return { showErrorPreview, showAssetPreview, resetPreview };
}
