/**
 * Serializes objects containing BigInt values to JSON.
 * Converts BigInt to a wrapped string like "BigInt(12345)" or "BigInt(-12345)"
 */
export const serializeWithBigInt = (data: any): string =>
  JSON.stringify(data, (_key, value) =>
    typeof value === 'bigint' ? `BigInt(${value.toString()})` : value
  );

/**
 * Deserializes JSON strings that include BigInt-wrapped values.
 * Converts strings like "BigInt(12345)" or "BigInt(-12345)" back into actual BigInt values.
 * Leaves other strings untouched.
 */
export const deserializeWithBigInt = (json: string): any =>
  JSON.parse(json, (_key, value) => {
    if (typeof value === 'string') {
      const match = /^BigInt\((-?\d+)\)$/.exec(value);
      if (match) {
        return BigInt(match[1]);
      }
    }
    return value;
  });
