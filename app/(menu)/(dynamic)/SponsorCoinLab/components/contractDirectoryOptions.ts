export type ContractDirectoryOption = {
  value: string;
  label: string;
};

const DEFAULT_CONTRACT_DIRECTORY_VALUES = [
  'spCoinAccess/contracts/spCoinOrig.BAK',
  'spCoinAccess/contracts/spCoin',
] as const;

export const FALLBACK_CONTRACT_DIRECTORY_OPTIONS: ContractDirectoryOption[] = [
  'spCoin',
  'spCoin 2026-04-22',
  'spCoin-2026-03-27',
  'spCoin-2026-03-28',
  'spCoin-2026-04-18',
  'spCoin-2026-04-28',
  'spCoinOrig.BAK',
].map((label) => ({
  label,
  value: `spCoinAccess/contracts/${label}`,
}));

let cachedContractDirectoryOptions: ContractDirectoryOption[] = FALLBACK_CONTRACT_DIRECTORY_OPTIONS;
let contractDirectoryOptionsPromise: Promise<ContractDirectoryOption[]> | null = null;

function normalizeDirectoryValue(value: string) {
  return String(value || '').trim().replace(/\\/g, '/');
}

function getDefaultContractDirectoryValue(options: ContractDirectoryOption[], index: number) {
  const preferredValue = DEFAULT_CONTRACT_DIRECTORY_VALUES[index];
  const preferredLabel = preferredValue?.split('/').pop();
  const preferredOption = options.find(
    (option) =>
      option.value === preferredValue ||
      (preferredLabel ? option.label.toLowerCase() === preferredLabel.toLowerCase() : false),
  );
  if (preferredOption) return preferredOption.value;
  return index === 0 ? options[options.length - 1]?.value || '' : options[0]?.value || '';
}

export function normalizeContractDirectoryOptions(
  entries: Array<{ value?: string; label?: string }> | undefined,
): ContractDirectoryOption[] {
  return Array.isArray(entries)
    ? entries
        .map((entry) => {
          const value = normalizeDirectoryValue(String(entry?.value || ''));
          return {
            value,
            label: String(entry?.label || '').trim() || value,
          };
        })
        .filter((entry) => entry.value.length > 0)
    : [];
}

export function getInitialContractDirectoryOptions(
  entries: Array<{ value?: string; label?: string }> | undefined,
): ContractDirectoryOption[] {
  const normalizedEntries = normalizeContractDirectoryOptions(entries);
  if (normalizedEntries.length > 0) {
    cachedContractDirectoryOptions = normalizedEntries;
    return normalizedEntries;
  }
  return cachedContractDirectoryOptions;
}

export async function loadContractDirectoryOptions(): Promise<ContractDirectoryOption[]> {
  if (typeof window === 'undefined') return cachedContractDirectoryOptions;
  if (contractDirectoryOptionsPromise) return contractDirectoryOptionsPromise;

  contractDirectoryOptionsPromise = fetch('/api/spCoin/contract-directories', { cache: 'no-store' })
    .then(async (response) => {
      const payload = (await response.json()) as {
        ok?: boolean;
        directories?: Array<{ value?: string; label?: string }>;
      };
      if (!response.ok || payload?.ok === false) return cachedContractDirectoryOptions;
      const nextOptions = normalizeContractDirectoryOptions(payload?.directories);
      if (nextOptions.length > 0) cachedContractDirectoryOptions = nextOptions;
      return cachedContractDirectoryOptions;
    })
    .catch(() => cachedContractDirectoryOptions)
    .finally(() => {
      contractDirectoryOptionsPromise = null;
    });

  return contractDirectoryOptionsPromise;
}

if (typeof window !== 'undefined') {
  void loadContractDirectoryOptions();
}

export function reconcileContractDirectoryParams(
  params: string[],
  options: ContractDirectoryOption[],
): { changed: boolean; next: string[] } {
  if (options.length === 0) return { changed: false, next: params };

  const validValues = new Set(options.map((option) => option.value));
  const next = [...params];
  let changed = false;

  for (const idx of [0, 1]) {
    const current = normalizeDirectoryValue(next[idx] || '');
    if (current && validValues.has(current)) {
      if (next[idx] !== current) {
        next[idx] = current;
        changed = true;
      }
      continue;
    }

    const fallbackValue = getDefaultContractDirectoryValue(options, idx);
    if (fallbackValue && next[idx] !== fallbackValue) {
      next[idx] = fallbackValue;
      changed = true;
    }
  }

  return { changed, next };
}
