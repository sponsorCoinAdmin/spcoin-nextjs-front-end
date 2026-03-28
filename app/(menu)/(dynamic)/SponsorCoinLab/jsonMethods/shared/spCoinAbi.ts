import spCoinAbi from '@/resources/data/ABIs/spcoinABI.json';

export const SPCOIN_ABI_UPDATED_EVENT = 'spcoin:abi-updated';
export const SPCOIN_ABI_VERSION_STORAGE_KEY = 'spcoin:abi-version';

let currentSpCoinAbi = Array.isArray(spCoinAbi) ? spCoinAbi : [];

export function getSpCoinLabAbi() {
  return currentSpCoinAbi;
}

export function setSpCoinLabAbi(nextAbi: unknown) {
  if (!Array.isArray(nextAbi)) return currentSpCoinAbi;
  currentSpCoinAbi = nextAbi;
  return currentSpCoinAbi;
}

export const SPCOIN_LAB_ABI = currentSpCoinAbi;
