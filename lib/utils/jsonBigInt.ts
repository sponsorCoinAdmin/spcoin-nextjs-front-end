/**
 * Serializes objects containing BigInt values to JSON.
 * Converts BigInt to a wrapped string like "BigInt(12345)" or "BigInt(-12345)"
 */
export const serializeWithBigInt = (data: unknown): string =>
  JSON.stringify(data, (_key, value) => {
    if (typeof value === 'bigint') {
      return `BigInt(${value.toString()})`;
    }
    const passthrough: unknown = value;
    return passthrough;
  });

/**
 * Deserializes JSON strings that include BigInt-wrapped values.
 * Converts strings like "BigInt(12345)" or "BigInt(-12345)" back into actual BigInt values.
 * Leaves other strings untouched.
 */
export const deserializeWithBigInt = (json: string): unknown =>
  JSON.parse(json, (_key, value) => {
    if (typeof value === 'string') {
      const match = /^BigInt\((-?\d+)\)$/.exec(value);
      if (match) {
        return BigInt(match[1]);
      }
    }
    const passthrough: unknown = value;
    return passthrough;
  });
