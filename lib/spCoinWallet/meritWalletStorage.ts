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
        defaultPanel:
          config.defaultPanel === 'ACCOUNT'
            ? config.defaultPanel
            : config.defaultPanel === 'REWARDS'
              ? config.defaultPanel
              : config.defaultPanel === 'SWAP'
                ? config.defaultPanel
                : config.defaultPanel === 'SPONSOR'
                  ? config.defaultPanel
                  : config.defaultPanel === 'OPTIONS'
                    ? config.defaultPanel
                    : config.defaultPanel === 'TRADE_STATION'
                      ? 'SWAP'
                      : config.defaultPanel === 'MANAGE_ACCOUNT'
                        ? 'ACCOUNT'
                        : config.defaultPanel === 'MANAGE_REWARDS'
                          ? 'REWARDS'
                          : 'MENU',
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
