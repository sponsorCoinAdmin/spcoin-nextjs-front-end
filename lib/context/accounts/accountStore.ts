import { getAccountsBatch } from '@/lib/api';
import {
  ACCOUNT_REGISTRY_UPDATED_EVENT,
  emitAccountRegistryUpdated,
} from '@/lib/accounts/accountEvents';
import { getAccountLogoURL } from '@/lib/context/helpers/assetHelpers';
import {
  accountRegistry,
  getAccountRegistryRecord,
  type AccountRegistryRecord,
  upsertAccountRegistryRecord,
} from '@/lib/context/accounts/accountRegistry';

export { ACCOUNT_REGISTRY_UPDATED_EVENT };

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
  address: string,
  data: Record<string, unknown>,
  payload?: { logoURL?: string; hasLogo?: boolean },
): AccountRegistryRecord {
  const normalized = normalizeAddress(address);
  const existing = getAccountRegistryRecord(accountRegistry, normalized);
  const next = {
    ...(existing ?? {}),
    ...data,
    address: normalized as any,
  } as AccountRegistryRecord;

  if (typeof payload?.logoURL === 'string' && payload.logoURL.trim()) {
    next.logoURL = payload.logoURL;
  } else if (!next.logoURL) {
    next.logoURL = getAccountLogoURL(normalized as any);
  }

  return next;
}

export async function loadAccountRecord(
  address: string,
  options: LoadOptions = {},
): Promise<AccountRegistryRecord> {
  const trimmed = String(address ?? '').trim();
  if (!isAddress(trimmed)) {
    throw new Error('Invalid account address');
  }

  const normalized = normalizeAddress(trimmed);
  if (!options.forceRefresh) {
    const cached = getAccountRegistryRecord(accountRegistry, normalized);
    if (cached) return cached;
  }

  const response = await fetch(
    `/api/spCoin/accounts/${encodeURIComponent(normalized)}`,
    {
      method: 'GET',
      cache: 'no-store',
      signal: options.signal,
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to load account record (HTTP ${response.status})`);
  }

  const payload = (await response.json()) as {
    data?: Record<string, unknown>;
    logoURL?: string;
    hasLogo?: boolean;
  };
  const data = payload?.data ?? {};
  const record = toRegistryRecord(normalized, data, payload);
  return upsertAccountRegistryRecord(accountRegistry, record);
}

export async function loadAccountRecordsBatch(
  addresses: readonly string[],
  options: LoadOptions = {},
): Promise<AccountRegistryRecord[]> {
  const normalizedAddresses = Array.from(
    new Set(
      addresses
        .map((address) => String(address ?? '').trim())
        .filter((address) => isAddress(address))
        .map((address) => normalizeAddress(address)),
    ),
  );

  if (!normalizedAddresses.length) return [];

  const cachedRecords = new Map<string, AccountRegistryRecord>();
  const missing: string[] = [];

  for (const address of normalizedAddresses) {
    if (!options.forceRefresh) {
      const cached = getAccountRegistryRecord(accountRegistry, address);
      if (cached) {
        cachedRecords.set(address, cached);
        continue;
      }
    }

    missing.push(address);
  }

  if (missing.length) {
    try {
      const response = await getAccountsBatch<Record<string, unknown>>(missing, {
        timeoutMs: 20000,
        signal: options.signal,
      });

      for (const item of response.items ?? []) {
        const address = String(item?.address ?? '').trim();
        if (!isAddress(address)) continue;

        const normalized = normalizeAddress(address);
        const record = toRegistryRecord(normalized, item?.data ?? {});
        cachedRecords.set(
          normalized,
          upsertAccountRegistryRecord(accountRegistry, record),
        );
      }
    } catch {
      await Promise.all(
        missing.map(async (address) => {
          try {
            const record = await loadAccountRecord(address, {
              forceRefresh: true,
              signal: options.signal,
            });
            cachedRecords.set(address, record);
          } catch {
            // Preserve prior behavior by skipping unresolved records.
          }
        }),
      );
    }
  }

  return normalizedAddresses
    .map(
      (address) =>
        cachedRecords.get(address) ??
        getAccountRegistryRecord(accountRegistry, address),
    )
    .filter((record): record is AccountRegistryRecord => Boolean(record));
}

export async function saveAccountRecord(
  address: string,
  body: Record<string, unknown>,
  authToken: string,
  method: 'PUT' | 'POST',
): Promise<AccountRegistryRecord> {
  const trimmed = String(address ?? '').trim();
  if (!isAddress(trimmed)) {
    throw new Error('Invalid account address');
  }

  const normalized = normalizeAddress(trimmed);
  const response = await fetch(
    `/api/spCoin/accounts/${encodeURIComponent(normalized)}`,
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
      failPayload?.error || failPayload?.details || 'Failed to save account.json',
    );
  }

  const saved = await loadAccountRecord(normalized, { forceRefresh: true });
  emitAccountRegistryUpdated(normalized);
  return saved;
}

export async function saveAccountLogo(
  address: string,
  formData: FormData,
  authToken: string,
): Promise<AccountRegistryRecord | undefined> {
  const trimmed = String(address ?? '').trim();
  if (!isAddress(trimmed)) {
    throw new Error('Invalid account address');
  }

  const normalized = normalizeAddress(trimmed);
  const response = await fetch(
    `/api/spCoin/accounts/${encodeURIComponent(normalized)}?target=logo`,
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
      failPayload?.error || failPayload?.details || 'Failed to save logo.png',
    );
  }

  const saved = await loadAccountRecord(normalized, { forceRefresh: true });
  emitAccountRegistryUpdated(normalized);
  return saved;
}
