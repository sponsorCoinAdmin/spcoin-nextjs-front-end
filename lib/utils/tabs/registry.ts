// File: @/lib/utils/tabs/registry.ts
/* Server-safe: no 'use client' here. Central registry + helpers for tab metadata. */

export const TAB_REGISTRY = {
  EXCHANGE:       { id: 'exchange',        path: '/Exchange',                     label: 'Exchange',         closable: false, order: 0  },
  WHITE_PAPER:    { id: 'white-paper',     path: '/WhitePaper',                   label: 'White Paper',      closable: true,  order: 10 },
  SPCOIN_API:     { id: 'spcoin-api',      path: '/SpCoinAPI',                    label: 'Sponsor Coin API', closable: true,  order: 20 },
  CREATE_ACCOUNT: { id: 'create-account',  path: '/EditAccount',   label: 'Edit Account',     closable: true,  order: 30 },
  MANAGE_ACCTS:   { id: 'manage-accounts', path: '/ManageAccounts',               label: 'Manage Accounts',  closable: true,  order: 40 },
  CREATE_AGENT:   { id: 'create-agent',    path: '/CreateAgent',                  label: 'Create Agent',     closable: true,  order: 50 },
  RECIPIENT_SITE: { id: 'recipient-site',  path: '/RecipientSite',                label: 'Recipient Site',   closable: true,  order: 60 },
} as const;

export type TabMeta = typeof TAB_REGISTRY[keyof typeof TAB_REGISTRY];
export type TabId = TabMeta['id'];

export const DEFAULT_FALLBACK_TAB_ID: TabId = TAB_REGISTRY.EXCHANGE.id;

/** Lookup by id (throws in dev if unknown to catch typos) */
export function getTabById(id: TabId): TabMeta {
  const found = (Object.values(TAB_REGISTRY) as TabMeta[]).find(t => t.id === id);
  if (!found) throw new Error(`Unknown TabId: ${id}`);
  return found;
}

/* ---------- Path helpers (labels & id lookup) ---------- */

export const PATH_TO_ID: Record<string, TabId> =
  (Object.values(TAB_REGISTRY) as TabMeta[]).reduce((acc, t) => {
    acc[t.path] = t.id;
    return acc;
  }, {} as Record<string, TabId>);

export const PATH_TO_LABEL: Record<string, string> =
  (Object.values(TAB_REGISTRY) as TabMeta[]).reduce((acc, t) => {
    acc[t.path] = t.label;
    return acc;
  }, {} as Record<string, string>);

/** Get a human label for a route; falls back to the raw href if unknown. */
export function labelForPath(href: string): string {
  return PATH_TO_LABEL[href] ?? href;
}
