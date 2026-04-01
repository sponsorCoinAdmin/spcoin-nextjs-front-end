// File: lib/context/helpers/loadLocalExchangeContext.ts
'use client';

import type { ExchangeContext } from '@/lib/structure';
import { deserializeWithBigInt } from '@/lib/utils/jsonBigInt';
import { createDebugLogger } from '@/lib/utils/debugLogger';
import { EXCHANGE_CONTEXT_LS_KEY } from '@/lib/context/exchangeContext/localStorageKeys';
import {
  DEFAULT_AGENT_RATE_RANGE,
  DEFAULT_RECIPIENT_RATE_RANGE,
  normalizeSpCoinRateRange,
} from './spCoinRateDefaults';

const LOG_TIME = false;
const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_HELPER === 'true';

// Extra toggle just for the big pretty-print dump
const VERBOSE_DUMP =
  process.env.NEXT_PUBLIC_DEBUG_LOG_EXCHANGE_HELPER_VERBOSE === 'true';

const debugLog = createDebugLogger(
  'loadLocalExchangeContext',
  DEBUG_ENABLED,
  LOG_TIME,
);

/** Small helper to inspect localStorage around loads. */
function debugLocalStorageSnapshot(stage: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(EXCHANGE_CONTEXT_LS_KEY);
    const size = raw ? raw.length : 0;

    debugLog.log?.(`📦 [${stage}] localStorage snapshot`, {
      key: EXCHANGE_CONTEXT_LS_KEY,
      hasValue: !!raw,
      size,
      head: raw?.slice(0, 180) ?? null,
    });
  } catch (err) {
    debugLog.error?.(`⛔ [${stage}] localStorage snapshot failed`, err);
  }
}

/**
 * ✅ SINGLE SOURCE OF TRUTH ENFORCER (LOAD-TIME):
 * - Canonical: parsed.settings.displayStack
 * - Legacy/shadow: parsed.displayStack (root) → migrate (only if settings empty) → delete root always
 *
 * NOTE: We do NOT normalize node shapes here (provider already does that).
 * We only ensure the path is `.settings.displayStack` and root is removed.
 */
function enforceSettingsDisplayStackOnly(parsed: any) {
  if (!parsed || typeof parsed !== 'object') return;

  parsed.settings = parsed.settings ?? {};

  const root = parsed.displayStack;
  const settings = parsed.settings.displayStack;

  const settingsEmpty = !Array.isArray(settings) || settings.length === 0;
  const rootHas = Array.isArray(root) && root.length > 0;

  if (rootHas && settingsEmpty) {
    parsed.settings.displayStack = root;
    debugLog.log?.('[loadLocalExchangeContext] migrated root displayStack → settings.displayStack', {
      migratedLen: root.length,
    });
  }

  if ('displayStack' in parsed) {
    delete parsed.displayStack;
    debugLog.log?.('[loadLocalExchangeContext] removed legacy root displayStack', {});
  }
}

function migrateLegacySpCoinProperties(parsed: any) {
  if (!parsed || typeof parsed !== 'object') return;

  parsed.settings = parsed.settings ?? {};

  const settingsContract =
    parsed.settings.spCoinContract &&
    typeof parsed.settings.spCoinContract === 'object'
      ? parsed.settings.spCoinContract
      : {};

  const legacySettingsProps =
    parsed.settings.spCoinProperties &&
    typeof parsed.settings.spCoinProperties === 'object'
      ? parsed.settings.spCoinProperties
      : {};

  const legacyRootProps =
    parsed.spCoinProperties && typeof parsed.spCoinProperties === 'object'
      ? parsed.spCoinProperties
      : {};

  const normalizeSpCoinVersion = (value: unknown): string => {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    if (!raw.includes('::')) return raw;
    return String(raw.split('::')[1] ?? '').trim();
  };

  parsed.settings.spCoinContract = {
    version: normalizeSpCoinVersion(
      settingsContract.version ??
        legacySettingsProps.version ??
        legacyRootProps.version ??
        '',
    ),
    ...legacyRootProps,
    ...legacySettingsProps,
    ...settingsContract,
    totalSypply:
      settingsContract.totalSypply ??
      legacySettingsProps.totalSypply ??
      legacySettingsProps.totalSupply ??
      legacyRootProps.totalSypply ??
      legacyRootProps.totalSupply ??
      '',
  };

  if ('spCoinProperties' in parsed.settings) {
    delete parsed.settings.spCoinProperties;
  }
  if ('spCoinProperties' in parsed) {
    delete parsed.spCoinProperties;
  }
}

function seedSpCoinContractFromPageStorage(parsed: any) {
  if (typeof window === 'undefined') return;
  if (!parsed || typeof parsed !== 'object') return;

  const normalizeSpCoinVersion = (value: unknown): string => {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    if (!raw.includes('::')) return raw;
    return String(raw.split('::')[1] ?? '').trim();
  };

  parsed.settings = parsed.settings ?? {};
  const currentContract =
    parsed.settings.spCoinContract &&
    typeof parsed.settings.spCoinContract === 'object'
      ? parsed.settings.spCoinContract
      : {};

  const currentName = String(currentContract.name ?? '').trim();
  const currentVersion = normalizeSpCoinVersion(currentContract.version);
  if (currentVersion !== String(currentContract.version ?? '').trim()) {
    currentContract.version = currentVersion;
  }

  let sponsorCoinLabSeed: {
    version?: string;
    name?: string;
    symbol?: string;
  } = {};
  let spCoinAccessSeed: {
    version?: string;
    name?: string;
    symbol?: string;
    decimals?: number;
  } = {};

  try {
    const rawLab = window.localStorage.getItem('spCoinLabKey');
    if (rawLab) {
      const parsedLab = JSON.parse(rawLab) as {
        selectedSponsorCoinVersion?: string;
      };
      const version = normalizeSpCoinVersion(parsedLab?.selectedSponsorCoinVersion);
      if (version) {
        sponsorCoinLabSeed = {
          version,
          name: `Sponsor Coin V${version}`,
          symbol: `SPCOIN_V${version}`,
        };
      }
    }
  } catch {
    // Ignore malformed SponsorCoinLab storage payloads.
  }

  try {
    const rawAccess = window.localStorage.getItem('spCoinAccess');
    if (rawAccess) {
      const parsedAccess = JSON.parse(rawAccess) as {
        deploymentVersion?: string;
        deploymentName?: string;
        deploymentSymbol?: string;
        deploymentDecimals?: string;
      };
      spCoinAccessSeed = {
        version: String(parsedAccess?.deploymentVersion ?? '').trim(),
        name: String(parsedAccess?.deploymentName ?? '').trim(),
        symbol: String(parsedAccess?.deploymentSymbol ?? '').trim(),
        decimals: Number(parsedAccess?.deploymentDecimals ?? 0),
      };
    }
  } catch {
    // Ignore malformed SpCoinAccess storage payloads.
  }

  const mergedSeed = {
    version:
      sponsorCoinLabSeed.version ??
      spCoinAccessSeed.version ??
      '',
    name:
      sponsorCoinLabSeed.name ??
      spCoinAccessSeed.name ??
      '',
    symbol:
      sponsorCoinLabSeed.symbol ??
      spCoinAccessSeed.symbol ??
      '',
    decimals:
      Number.isFinite(Number(spCoinAccessSeed.decimals)) && Number(spCoinAccessSeed.decimals) > 0
        ? Number(spCoinAccessSeed.decimals)
        : 18,
  };

  const hasLabSeed = Boolean(
    sponsorCoinLabSeed.version || sponsorCoinLabSeed.name || sponsorCoinLabSeed.symbol,
  );
  const hasAnySeed = Boolean(mergedSeed.version || mergedSeed.name || mergedSeed.symbol);
  if (!hasAnySeed) return;
  if (!hasLabSeed && (currentName || currentVersion)) return;

  parsed.settings.spCoinContract = {
    ...currentContract,
    version: mergedSeed.version,
    name: mergedSeed.name,
    symbol: mergedSeed.symbol,
    decimals:
      Number.isFinite(Number(currentContract.decimals)) && Number(currentContract.decimals) > 0
        ? Number(currentContract.decimals)
        : mergedSeed.decimals,
    totalSypply: String(currentContract.totalSypply ?? ''),
    inflationRate: Number(currentContract.inflationRate ?? 0),
    recipientRateRange: normalizeSpCoinRateRange(
      currentContract.recipientRateRange,
      DEFAULT_RECIPIENT_RATE_RANGE,
    ),
    agentRateRange: normalizeSpCoinRateRange(
      currentContract.agentRateRange,
      DEFAULT_AGENT_RATE_RANGE,
    ),
  };
}

export function loadLocalExchangeContext(): ExchangeContext | null {
  try {
    // Never touch localStorage on the server
    if (typeof window === 'undefined') {
      return null;
    }

    debugLocalStorageSnapshot('before-load');

    const serializedContext = window.localStorage.getItem(EXCHANGE_CONTEXT_LS_KEY);

    if (!serializedContext) {
      debugLog.warn?.(
        `⚠️ NO LOADED EXCHANGE CONTEXT FOUND FOR KEY\n${EXCHANGE_CONTEXT_LS_KEY}`,
      );
      return null;
    }

    debugLog.log?.(
      '🔓 LOADED EXCHANGE CONTEXT FROM LOCALSTORAGE (metadata)',
      {
        key: EXCHANGE_CONTEXT_LS_KEY,
        size: serializedContext.length,
        head: serializedContext.slice(0, 180),
      },
    );

    let parsed: any;
    try {
      parsed = deserializeWithBigInt(serializedContext);
    } catch (parseError) {
      debugLog.error?.(
        '❌ Failed to deserializeWithBigInt',
        parseError instanceof Error ? parseError.message : String(parseError),
      );
      return null;
    }

    // ✅ Enforce canonical `.settings.displayStack` and delete any root `displayStack`
    enforceSettingsDisplayStackOnly(parsed);
    migrateLegacySpCoinProperties(parsed);
    seedSpCoinContractFromPageStorage(parsed);

    // Derive stored + effective appChainId for diagnostics
    const storedAppChainId =
      typeof parsed?.network?.appChainId === 'number'
        ? (parsed.network.appChainId as number)
        : null;

    const storedChainId =
      typeof parsed?.network?.chainId === 'number'
        ? (parsed.network.chainId as number)
        : null;

    const effectiveAppChainId = storedAppChainId ?? storedChainId ?? null;

    debugLog.log?.(
      '✅ PARSED LOADED EXCHANGE CONTEXT FROM LOCALSTORAGE (summary)',
      {
        hasNetwork: !!parsed?.network,
        storedChainId,
        storedAppChainId,
        effectiveAppChainId,
        hasSettings: !!parsed?.settings,
        hasPanelTree: Array.isArray(parsed?.settings?.spCoinPanelTree),
        hasSettingsDisplayStack: Array.isArray(parsed?.settings?.displayStack),
        settingsDisplayStackLen: Array.isArray(parsed?.settings?.displayStack)
          ? parsed.settings.displayStack.length
          : 0,
        // Should now ALWAYS be false:
        hasRootDisplayStack: Array.isArray((parsed as any)?.displayStack),
      },
    );

    // Pretty-print only when the verbose flag is enabled
    if (VERBOSE_DUMP) {
      try {
        const prettyPrinted = JSON.stringify(
          parsed,
          (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
          2,
        );
        debugLog.log?.(
          '✅ (PRETTY PRINT) LOADED EXCHANGE CONTEXT FROM LOCALSTORAGE (parsed)',
          prettyPrinted,
        );
      } catch (stringifyError) {
        debugLog.warn?.(
          '⚠️ Failed to pretty-print parsed ExchangeContext',
          stringifyError,
        );
      }
    }

    debugLocalStorageSnapshot('after-load');

    // 🔄 Do NOT sanitize here; initExchangeContext owns sanitizeExchangeContext
    //     and will decide the final effective appChainId.
    return parsed as ExchangeContext;
  } catch (error) {
    debugLog.error?.(
      '⛔ Failed to load exchangeContext',
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}
