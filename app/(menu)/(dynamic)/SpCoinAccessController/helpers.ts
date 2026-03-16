// File: app/(menu)/(dynamic)/SpCoinAccessController/helpers.ts
export const SPCOIN_ACCESS_STORAGE_KEY = 'spCoinAccess';
export const VERSION_FORMAT_ERROR = '*Error: Bad Format, format is Number and decimals only.';
export const VERSION_FORMAT_REGEX = /^\d+(?:\.\d+)*$/;
export const DEFAULT_LOCAL_SOURCE_DEPLOYMENT_PATH = '/spCoinAccess/contracts/spCoin';

export const normalizeProjectRelativePath = (value: string, fallback: string) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return fallback;
  const withoutLeadingOrTrailing = trimmed.replace(/^\/+|\/+$/g, '');
  if (!withoutLeadingOrTrailing) return fallback;
  return `/${withoutLeadingOrTrailing}`;
};

export const getDeploymentVersionTag = (version: string) => {
  const normalizedVersion = String(version || '').trim();
  return normalizedVersion ? `V${normalizedVersion}` : '';
};

export const buildDeploymentNameFromVersion = (version: string) => {
  const tag = getDeploymentVersionTag(version);
  return `Sponsor Coin ${tag}`.trim();
};

export const buildDeploymentSymbolFromVersion = (version: string) => {
  const tag = getDeploymentVersionTag(version);
  return tag ? `SPCOIN_${tag}` : 'SPCOIN';
};

export const buildDeploymentTokenName = (name: string) => {
  const normalizedName = String(name || '').trim() || 'Sponsor Coin';
  return normalizedName;
};

export const clampDeploymentDecimals = (value: number) => Math.min(255, Math.max(0, value));

export const getDeploymentKeyValidationMessage = (rawKey: string) => {
  const normalizedPrivateKey = String(rawKey || '').trim();
  if (!normalizedPrivateKey) {
    return '*Error: Account Private Key is required for Deployment.';
  }
  if (!/^(0x)?[0-9a-fA-F]{64}$/.test(normalizedPrivateKey)) {
    return '*Error: Invalid Account Private Key';
  }
  return '';
};

export const isVersionFormatValid = (value: string) => VERSION_FORMAT_REGEX.test(value.trim());

export const sanitizeVersionInput = (value: string) =>
  value
    .replace(/#/g, '.')
    .replace(/[^0-9.]/g, '')
    .replace(/\.{2,}/g, '.');
