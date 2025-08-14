// lib/structure/assetSelection/constants/keys.ts

/** Debug flag env key used around the selection stack */
export const ENV_DEBUG_ASSET_SELECTION = 'NEXT_PUBLIC_DEBUG_LOG_SHARED_PANEL';

/** Optional LS keys if you decide to persist sub-display per-instance (off by default) */
export const LS_ASSET_SELECTION_PREFIX = 'assetSelection:';

export const LS_SUBDISPLAY_KEY = (instanceId: string) =>
  `${LS_ASSET_SELECTION_PREFIX}${instanceId}:subdisplay`;
