import {
  buildMethodTimingMeta,
  type MethodTimingCollector,
  type MethodTimingMeta,
} from '../../../../../spCoinAccess/packages/@sponsorcoin/spcoin-access-modules/src/utils/methodTiming';

export type MethodExecutionMeta = MethodTimingMeta;

interface ContractCodeProvider {
  getCode: (target: string) => Promise<string>;
  getNetwork?: () => Promise<{ chainId?: unknown } | null>;
}

function toErrorText(value: unknown, fallback = '') {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') return String(value);
  return fallback;
}

function isContractCodeProvider(value: unknown): value is ContractCodeProvider {
  return Boolean(value && typeof value === 'object' && typeof (value as { getCode?: unknown }).getCode === 'function');
}

function getContractCodeProvider(runner: unknown): ContractCodeProvider | null {
  if (isContractCodeProvider(runner)) return runner;
  const provider = runner && typeof runner === 'object' ? (runner as { provider?: unknown }).provider : null;
  return isContractCodeProvider(provider) ? provider : null;
}

export function normalizeUnsignedIntegerInput(value: string) {
  return String(value || '').trim().replace(/,/g, '');
}

export function parseComparableUint(value: string): bigint | null {
  const normalized = normalizeUnsignedIntegerInput(value);
  if (!/^\d+$/.test(normalized)) return null;
  try {
    return BigInt(normalized);
  } catch {
    return null;
  }
}

export function isBadDataError(error: unknown) {
  const code = toErrorText((error as { code?: unknown } | null)?.code);
  const message = toErrorText((error as { message?: unknown } | null)?.message);
  return code === 'BAD_DATA' || /could not decode result data/i.test(message);
}

export function isAbortError(error: unknown) {
  if (!error) return false;
  const name = toErrorText((error as { name?: unknown } | null)?.name);
  const code = toErrorText((error as { code?: unknown } | null)?.code);
  const message = toErrorText((error as { message?: unknown } | null)?.message);
  return name === 'AbortError' || code === 'ABORT_ERR' || /aborted|cancelled by user/i.test(message);
}

export function getErrorDebugTrace(error: unknown): string[] {
  const trace = (error as { spCoinDebugTrace?: unknown } | null)?.spCoinDebugTrace;
  return Array.isArray(trace) ? trace.map((entry) => String(entry)) : [];
}

export function attachReadDebugTrace(error: unknown, trace: string[]) {
  if (!error || typeof error !== 'object') return error;
  const target = error as { spCoinDebugTrace?: string[] };
  const existingTrace = Array.isArray(target.spCoinDebugTrace) ? target.spCoinDebugTrace.map((entry) => String(entry)) : [];
  target.spCoinDebugTrace = [...existingTrace, ...trace.map((entry) => String(entry))];
  return error;
}

export function buildExecutionMeta(collector: MethodTimingCollector, completedAtMs = Date.now()): MethodExecutionMeta {
  return buildMethodTimingMeta(collector, completedAtMs);
}

export function attachExecutionMeta(error: unknown, meta?: MethodExecutionMeta) {
  if (!error || typeof error !== 'object' || !meta) return error;
  const target = error as { spCoinExecutionMeta?: MethodExecutionMeta };
  target.spCoinExecutionMeta ??= meta;
  return error;
}

export function getExecutionMetaFromError(error: unknown): MethodExecutionMeta | undefined {
  const meta = (error as { spCoinExecutionMeta?: unknown } | null)?.spCoinExecutionMeta;
  if (!meta || typeof meta !== 'object') return undefined;
  return meta as MethodExecutionMeta;
}

export async function enrichDirectReadError(params: {
  error: unknown;
  method: string;
  target: string;
  runner: unknown;
}) {
  const { error, method, target, runner } = params;
  if (!isBadDataError(error)) return error;

  const provider = getContractCodeProvider(runner);
  if (!provider) return error;

  try {
    const [code, network] = await Promise.all([
      provider.getCode(target),
      typeof provider.getNetwork === 'function' ? provider.getNetwork() : Promise.resolve(null),
    ]);
    const chainId = toErrorText(network?.chainId, 'unknown');
    const hasCode = typeof code === 'string' && code !== '0x';
    const nextError = new Error(
      hasCode
        ? `SpCoin read method ${method} failed at ${target} on chain ${chainId}: the contract returned undecodable data. This usually means the deployed bytecode does not match the current SPCoin ABI or does not implement ${method}().`
        : `SpCoin read method ${method} failed at ${target} on chain ${chainId}: no contract code was found at that address.`,
    );
    (nextError as Error & { cause?: unknown; code?: unknown }).cause = error;
    (nextError as Error & { cause?: unknown; code?: string }).code =
      toErrorText((error as { code?: unknown } | null)?.code, 'BAD_DATA');
    return nextError;
  } catch {
    return error;
  }
}
