'use client';

export const MERIT_WALLET_LS_KEY = 'meritWalletLS';

export type MeritWalletDefaultPanel =
  | 'MENU'
  | 'ACCOUNT'
  | 'REWARDS'
  | 'SWAP'
  | 'SPONSOR'
  | 'OPTIONS';

export interface MeritWalletConfig {
  showBackgroundPage: boolean;
  defaultPanel: MeritWalletDefaultPanel;
}

export interface MeritWalletLS {
  active: boolean;
  config: MeritWalletConfig;
}

const DEFAULT_MERIT_WALLET_LS: MeritWalletLS = {
  active: false,
  config: {
    showBackgroundPage: false,
    defaultPanel: 'MENU',
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
