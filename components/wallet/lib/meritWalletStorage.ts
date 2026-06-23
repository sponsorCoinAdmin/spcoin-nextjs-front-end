'use client';

export const MERIT_WALLET_LS_KEY = 'meritWalletLS';

export type MeritWalletDefaultPanel =
  | 'MENU'
  | 'ACCOUNT'
  | 'REWARDS'
  | 'SWAP'
  | 'SPONSOR'
  | 'OPTIONS';

export type MeritWalletLocation = 'FIXED' | 'FLOATING';

export interface MeritWalletConfig {
  showBackgroundPage: boolean;
  modalMode: boolean;
  defaultPanel: MeritWalletDefaultPanel;
  location: MeritWalletLocation;
}

export interface MeritWalletLS {
  active: boolean;
  config: MeritWalletConfig;
}

const DEFAULT_MERIT_WALLET_LS: MeritWalletLS = {
  active: false,
  config: {
    showBackgroundPage: false,
    modalMode: true,
    defaultPanel: 'MENU',
    location: 'FIXED',
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

const VALID_DEFAULT_PANELS = new Set<MeritWalletDefaultPanel>(
  ['MENU', 'ACCOUNT', 'REWARDS', 'SWAP', 'SPONSOR', 'OPTIONS'],
);
const MIGRATED_DEFAULT_PANELS: Record<string, MeritWalletDefaultPanel> = {
  TRADE_STATION: 'SWAP',
  MANAGE_ACCOUNT: 'ACCOUNT',
  MANAGE_REWARDS: 'REWARDS',
};
function normalizeDefaultPanel(value: unknown): MeritWalletDefaultPanel {
  if (typeof value === 'string') {
    if (VALID_DEFAULT_PANELS.has(value as MeritWalletDefaultPanel)) return value as MeritWalletDefaultPanel;
    if (value in MIGRATED_DEFAULT_PANELS) return MIGRATED_DEFAULT_PANELS[value];
  }
  return 'MENU';
}

export function readMeritWalletLS(): MeritWalletLS {
  if (typeof window === 'undefined') return DEFAULT_MERIT_WALLET_LS;

  try {
    const raw = window.localStorage.getItem(MERIT_WALLET_LS_KEY);
    if (!raw) return DEFAULT_MERIT_WALLET_LS;

    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return DEFAULT_MERIT_WALLET_LS;

    const config = isRecord(parsed.config) ? parsed.config : {};

    return {
      active: parsed.active === true,
      config: {
        showBackgroundPage: config.showBackgroundPage === true,
        modalMode: config.modalMode !== false,
        defaultPanel: normalizeDefaultPanel(config.defaultPanel),
        location: config.location === 'FLOATING' ? 'FLOATING' : 'FIXED',
      },
    };
  } catch {
    return DEFAULT_MERIT_WALLET_LS;
  }
}

export function writeMeritWalletLS(next: MeritWalletLS) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MERIT_WALLET_LS_KEY, JSON.stringify(next));
}

export function updateMeritWalletLS(
  updater: (previous: MeritWalletLS) => MeritWalletLS,
) {
  writeMeritWalletLS(updater(readMeritWalletLS()));
}
