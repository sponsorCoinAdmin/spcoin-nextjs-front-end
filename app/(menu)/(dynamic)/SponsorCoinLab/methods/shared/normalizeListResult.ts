export function normalizeStringListResult(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((entry) => String(entry));
  if (typeof (value as { toArray?: () => unknown[] }).toArray === 'function') {
    return (value as { toArray: () => unknown[] }).toArray().map((entry) => String(entry));
  }
  if (typeof (value as { length?: unknown })?.length === 'number') {
    return Array.from(value as ArrayLike<unknown>, (entry) => String(entry));
  }
  return [];
}
