const HH_FORK_CHAIN_ID = 31337;
const HH_FORK_TOKEN_ASSET_CHAIN_ID = 8453;

function resolveHHForkTokenAssetChainId(chainId) {
  const id = Number(chainId);
  if (!Number.isFinite(id) || id <= 0) return id;
  return id === HH_FORK_CHAIN_ID ? HH_FORK_TOKEN_ASSET_CHAIN_ID : id;
}

module.exports = {
  HH_FORK_CHAIN_ID,
  HH_FORK_TOKEN_ASSET_CHAIN_ID,
  resolveHHForkTokenAssetChainId,
};
