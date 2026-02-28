import { getTokenByAddress, getTokensBatch } from '@/lib/api';
import { emitTokenRegistryUpdated, TOKEN_REGISTRY_UPDATED_EVENT } from '@/lib/tokens/tokenEvents';
import { getTokenLogoURL, defaultMissingImage } from '@/lib/context/helpers/assetHelpers';
import {
  getTokenRegistryRecord,
  tokenRegistry,
  type TokenRegistryRecord,
  upsertTokenRegistryRecord,
} from '@/lib/context/tokens/tokenRegistry';

export { TOKEN_REGISTRY_UPDATED_EVENT };

type LoadOptions = {
  forceRefresh?: boolean;
  signal?: AbortSignal;
};

function normalizeAddress(value: string): string {
  return `0x${value.slice(2).toLowerCase()}`;
}

function isAddress(value: string): boolean {
  return /^0[xX][0-9a-fA-F]{40}$/.test(value);
}

function toRegistryRecord(
  chainId: number,
  address: string,
  data: Record<string, unknown>,
): TokenRegistryRecord {
  const normalized = normalizeAddress(address);
  const existing = getTokenRegistryRecord(tokenRegistry, chainId, normalized);
  const next = {
    ...(existing ?? {}),
    ...data,
    chainId,
    address: normalized as any,
  } as TokenRegistryRecord;

  if (!next.logoURL) {
    next.logoURL =
      getTokenLogoURL({ chainId, address: normalized as any }) ?? defaultMissingImage;
  }

  return next;
}

export async function loadTokenRecord(
  chainId: number,
  address: string,
  options: LoadOptions = {},
): Promise<TokenRegistryRecord> {
  const safeChainId = Number(chainId ?? 0);
  const trimmed = String(address ?? '').trim();
  if (!Number.isFinite(safeChainId) || safeChainId <= 0) {
    throw new Error('Invalid chainId');
  }
  if (!isAddress(trimmed)) {
    throw new Error('Invalid token address');
  }

  const normalized = normalizeAddress(trimmed);
  if (!options.forceRefresh) {
    const cached = getTokenRegistryRecord(tokenRegistry, safeChainId, normalized);
    if (cached) return cached;
  }

  const payload = await getTokenByAddress<Record<string, unknown>>(
    safeChainId,
    normalized,
    {
      timeoutMs: 8000,
      signal: options.signal,
    },
  );

  const record = toRegistryRecord(safeChainId, normalized, payload?.data ?? {});
  return upsertTokenRegistryRecord(tokenRegistry, record);
}

export async function loadTokenRecordsBatch(
  requests: readonly Array<{ chainId: number; address: string }>,
  options: LoadOptions = {},
): Promise<TokenRegistryRecord[]> {
  const normalizedRequests = Array.from(
    new Map(
      requests
        .map((request) => {
          const chainId = Number(request?.chainId ?? 0);
          const address = String(request?.address ?? '').trim();
          if (!Number.isFinite(chainId) || chainId <= 0 || !isAddress(address)) {
            return null;
          }
          const normalized = normalizeAddress(address);
          return [`${chainId}:${normalized}`, { chainId, address: normalized }] as const;
        })
        .filter(Boolean) as Array<readonly [string, { chainId: number; address: string }]>,
    ).values(),
  );

  if (!normalizedRequests.length) return [];

  const cachedRecords = new Map<string, TokenRegistryRecord>();
  const missing: Array<{ chainId: number; address: string }> = [];

  for (const request of normalizedRequests) {
    const key = `${request.chainId}:${request.address}`;
    if (!options.forceRefresh) {
      const cached = getTokenRegistryRecord(
        tokenRegistry,
        request.chainId,
        request.address,
      );
      if (cached) {
        cachedRecords.set(key, cached);
        continue;
      }
    }
    missing.push(request);
  }

  if (missing.length) {
    try {
      const response = await getTokensBatch<Record<string, unknown>>(
        { requests: missing },
        {
          timeoutMs: 20000,
          signal: options.signal,
        },
      );

      for (const item of response.items ?? []) {
        const chainId = Number(item?.chainId ?? 0);
        const address = String(item?.address ?? '').trim();
        if (!Number.isFinite(chainId) || chainId <= 0 || !isAddress(address)) continue;
        const normalized = normalizeAddress(address);
        const key = `${chainId}:${normalized}`;
        const record = toRegistryRecord(chainId, normalized, item?.data ?? {});
        cachedRecords.set(key, upsertTokenRegistryRecord(tokenRegistry, record));
      }
    } catch {
      await Promise.all(
        missing.map(async (request) => {
          try {
            const record = await loadTokenRecord(
              request.chainId,
              request.address,
              {
                forceRefresh: true,
                signal: options.signal,
              },
            );
            cachedRecords.set(`${request.chainId}:${request.address}`, record);
          } catch {
            // Keep prior behavior by skipping unresolved tokens.
          }
        }),
      );
    }
  }

  return normalizedRequests
    .map((request) => {
      const key = `${request.chainId}:${request.address}`;
      return (
        cachedRecords.get(key) ??
        getTokenRegistryRecord(tokenRegistry, request.chainId, request.address)
      );
    })
    .filter((record): record is TokenRegistryRecord => Boolean(record));
}

export async function saveTokenRecord(
  chainId: number,
  address: string,
  body: Record<string, unknown>,
  authToken: string,
  method: 'PUT' | 'POST',
): Promise<TokenRegistryRecord> {
  const safeChainId = Number(chainId ?? 0);
  const trimmed = String(address ?? '').trim();
  if (!Number.isFinite(safeChainId) || safeChainId <= 0) {
    throw new Error('Invalid chainId');
  }
  if (!isAddress(trimmed)) {
    throw new Error('Invalid token address');
  }

  const normalized = normalizeAddress(trimmed);
  const response = await fetch(
    `/api/spCoin/tokens/${encodeURIComponent(String(safeChainId))}/${encodeURIComponent(normalized)}`,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const failPayload = (await response.json().catch(() => ({}))) as {
      error?: string;
      details?: string;
    };
    throw new Error(
      failPayload?.error || failPayload?.details || 'Failed to save token info.json',
    );
  }

  const saved = await loadTokenRecord(safeChainId, normalized, { forceRefresh: true });
  emitTokenRegistryUpdated(safeChainId, normalized);
  return saved;
}

export async function saveTokenLogo(
  chainId: number,
  address: string,
  formData: FormData,
  authToken: string,
): Promise<TokenRegistryRecord | undefined> {
  const safeChainId = Number(chainId ?? 0);
  const trimmed = String(address ?? '').trim();
  if (!Number.isFinite(safeChainId) || safeChainId <= 0) {
    throw new Error('Invalid chainId');
  }
  if (!isAddress(trimmed)) {
    throw new Error('Invalid token address');
  }

  const normalized = normalizeAddress(trimmed);
  const response = await fetch(
    `/api/spCoin/tokens/${encodeURIComponent(String(safeChainId))}/${encodeURIComponent(normalized)}?target=logo`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    },
  );

  if (!response.ok) {
    const failPayload = (await response.json().catch(() => ({}))) as {
      error?: string;
      details?: string;
    };
    throw new Error(
      failPayload?.error || failPayload?.details || 'Failed to save token logo.png',
    );
  }

  const saved = await loadTokenRecord(safeChainId, normalized, { forceRefresh: true });
  emitTokenRegistryUpdated(safeChainId, normalized);
  return saved;
}
