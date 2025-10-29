// File: lib/rest/resolveWallet.ts
/* Resolve the wallet's effective website URL via priority:
   1) query ?url
   2) recipientMeta.website
   3) connectedWebsite
   4) fallback static page with siteKey
*/
import { withProtocol } from '@/lib/rest/http';
import type { RecipientMeta } from '@/lib/rest/recipientMeta';

export type ResolveWalletParams = {
  queryUrl?: string | null;
  recipientMeta?: Pick<RecipientMeta, 'website' | 'address'>;
  connectedWebsite?: string | null;
  fallbackBaseUrl: string;
};

export function resolveWallet(params: ResolveWalletParams): string {
  const { queryUrl, recipientMeta, connectedWebsite, fallbackBaseUrl } = params;

  const siteKey = recipientMeta?.address ? `siteKey=${recipientMeta.address}` : '';
  const fallback = siteKey ? `${fallbackBaseUrl}?${siteKey}` : fallbackBaseUrl;

  const candidate =
    withProtocol(queryUrl) ??
    withProtocol(recipientMeta?.website) ??
    withProtocol(connectedWebsite) ??
    fallback;

  return candidate;
}
