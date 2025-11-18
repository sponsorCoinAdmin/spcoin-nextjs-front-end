// File: lib/utils/toJSONUpper.ts

export type JsonRecord = Record<string, any>;

/**
 * Synchronous helper: upper-case a specific field for every item in a JSON array.
 *
 * Usage:
 *   import baseTokenListRaw from '@/resources/data/networks/base/tokenList.json';
 *   const baseTokenList = toJSONUpperSync('address', baseTokenListRaw as any[]);
 */
export function toJSONUpperSync<T extends JsonRecord>(field: string, data: T[]): T[] {
  return data.map((item) => {
    const value = item[field];
    if (typeof value !== 'string') return item;

    return {
      ...item,
      [field]: value.toUpperCase(),
    } as T;
  });
}

/**
 * Optional async variant: load a JSON module by path and upper-case the given field.
 *
 * Usage:
 *   const list = await toJSONUpperFromPath(
 *     'address',
 *     '@/resources/data/networks/base/tokenList.json',
 *   );
 */
export async function toJSONUpperFromPath<T extends JsonRecord>(
  field: string,
  modulePath: string,
): Promise<T[]> {
  const mod = await import(modulePath as string);
  const data = ((mod as any).default ?? mod) as T[];
  return toJSONUpperSync(field, data);
}
