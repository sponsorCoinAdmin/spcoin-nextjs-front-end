'use client';

export const MERIT_WALLET_LS_KEY = 'meritWalletLS';

export type MeritWalletLocation = 'CENTER' | 'FIXED' | 'FLOATING' | 'SPLIT_PANE' | 'STICK_TO_TOP';

export interface MeritWalletConfig {
  showBackgroundPage: boolean;
  modalMode: boolean;
  location: MeritWalletLocation;
}

export interface MeritWalletLS {
  active: boolean;
  config: MeritWalletConfig;
}

const DEFAULT_MERIT_WALLET_LS: MeritWalletLS = {
  active: false,
  config: {
    showBackgroundPage: true,
    modalMode: false,
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
        location: (['CENTER', 'FIXED', 'FLOATING', 'SPLIT_PANE', 'STICK_TO_TOP'] as const).includes(config.location as MeritWalletLocation)
          ? config.location as MeritWalletLocation
          : 'FIXED',
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
