'use client';

function normalizeAddress(value: string): string {
  return `0x${String(value ?? '').trim().replace(/^0x/i, '').toLowerCase()}`;
}

function isAddress(value: string): boolean {
  return /^0[xX][0-9a-fA-F]{40}$/.test(String(value ?? '').trim());
}

export function getConfiguredOwnerAdminAddress(): string {
  const envValue =
    process.env.NEXT_PUBLIC_SPCOIN_OWNER_ADMIN_ADDRESS ??
    process.env.SPCOIN_OWNER_ADMIN_ADDRESS ??
    '';
  const trimmed = String(envValue).trim();
  return isAddress(trimmed) ? normalizeAddress(trimmed) : '';
}

export function isConfiguredOwnerAdminAddress(address?: string): boolean {
  const configured = getConfiguredOwnerAdminAddress();
  if (!configured || !isAddress(String(address ?? '').trim())) return false;
  return configured === normalizeAddress(String(address));
}
