export const DEFAULT_RECIPIENT_RATE_RANGE: [number, number] = [20, 100];
export const DEFAULT_AGENT_RATE_RANGE: [number, number] = [2, 10];

export function normalizeSpCoinRateRange(
  value: unknown,
  fallback: [number, number],
): [number, number] {
  if (Array.isArray(value)) {
    const lower = Number(value[0] ?? fallback[0]);
    const upper = Number(value[1] ?? fallback[1]);
    if (!Number.isFinite(lower) || !Number.isFinite(upper)) return [...fallback] as [number, number];
    if (lower === 0 && upper === 0) return [...fallback] as [number, number];
    return [lower, upper];
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric !== 0) {
    return [fallback[0], numeric];
  }
  return [...fallback] as [number, number];
}
