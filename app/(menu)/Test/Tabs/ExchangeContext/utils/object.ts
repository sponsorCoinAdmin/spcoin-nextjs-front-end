// File: app/(menu)/Test/Tabs/ExchangeContext/utils/object.ts
export function isObjectLike(v: any) {
  return v !== null && typeof v === 'object';
}

export function quoteIfString(v: any) {
  return typeof v === 'string' ? `"${v}"` : String(v);
}
