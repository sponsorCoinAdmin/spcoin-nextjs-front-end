'use client';

export const MERIT_WALLET_LS_KEY = 'meritWalletLS';

export type MeritWalletDefaultPanel = 'MENU' | 'TRADE_STATION' | 'MANAGE_REWARDS';

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
          config.defaultPanel === 'TRADE_STATION'
            ? config.defaultPanel
            : config.defaultPanel === 'MANAGE_ACCOUNT'
              ? 'MANAGE_REWARDS'
              : config.defaultPanel === 'MANAGE_REWARDS'
                ? config.defaultPanel
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
