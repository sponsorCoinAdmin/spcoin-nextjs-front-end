const chainIdMapRaw = require('../../resources/data/networks/chainIdMap.json');

function toPositiveInt(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function normalizeMap(input) {
  const out = {};
  if (!input || typeof input !== 'object') return out;
  for (const [k, v] of Object.entries(input)) {
    const key = toPositiveInt(k);
    const val = toPositiveInt(v);
    if (!key || !val) continue;
    out[key] = val;
  }
  return out;
}

const ASSET_MAP = normalizeMap(chainIdMapRaw && chainIdMapRaw.assetMap);
const HH_FORK_CHAIN_ID = 31337;
const HH_FORK_TOKEN_ASSET_CHAIN_ID = HH_FORK_CHAIN_ID;

function resolveHHForkTokenAssetChainId(chainId) {
  const id = toPositiveInt(chainId);
  if (!id) return Number(chainId) || 0;
  return ASSET_MAP[id] || id;
}

module.exports = {
  HH_FORK_CHAIN_ID,
  HH_FORK_TOKEN_ASSET_CHAIN_ID,
  resolveHHForkTokenAssetChainId,
};
