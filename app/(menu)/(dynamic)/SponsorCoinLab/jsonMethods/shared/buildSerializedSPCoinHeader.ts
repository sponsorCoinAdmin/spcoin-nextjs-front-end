async function readAnnualInflation(contract: any) {
  if (typeof contract?.getInflationRate === 'function') {
    try {
      return await contract.getInflationRate();
    } catch {
      // Fall back for older deployments that still expose annualInflation().
    }
  }
  if (typeof contract?.annualInflation === 'function') {
    try {
      return await contract.annualInflation();
    } catch {
      // Fall through to the historical default below.
    }
  }
  return 10;
}

async function readInitialTotalSupply(contract: any) {
  if (typeof contract?.totalInitialSupply === 'function') {
    try {
      return await contract.totalInitialSupply();
    } catch {
      // Fall back for older deployments that still expose the previous getter names.
    }
  }
  if (typeof contract?.getInitialTotalSupply === 'function') {
    try {
      return await contract.getInitialTotalSupply();
    } catch {
      // Fall back for older deployments that still expose initialTotalSupply().
    }
  }
  if (typeof contract?.initialTotalSupply === 'function') {
    return contract.initialTotalSupply();
  }
  throw new Error('SpCoin contract does not expose totalInitialSupply().');
}

export async function buildSPCoinHeaderRecord(contract: any) {
  const versionFn =
    typeof contract?.version === 'function'
      ? contract.version.bind(contract)
      : typeof contract?.getVersion === 'function'
        ? contract.getVersion.bind(contract)
        : null;
  if (!versionFn) {
    throw new Error('SpCoin contract does not expose version().');
  }

  const [
    name,
    creationTime,
    decimals,
    totalSupply,
    initialTotalSupply,
    annualInflation,
    totalUnstakedSpCoins,
    totalStakingRewards,
    totalStakedSPCoins,
    symbol,
    version,
  ] = await Promise.all([
    contract.name(),
    contract.creationTime(),
    contract.decimals(),
    contract.totalSupply(),
    readInitialTotalSupply(contract),
    readAnnualInflation(contract),
    contract.totalUnstakedSpCoins(),
    contract.totalStakingRewards(),
    contract.totalStakedSPCoins(),
    contract.symbol(),
    versionFn(),
  ]);

  return {
    name: String(name),
    creationTime: String(creationTime),
    decimals: String(decimals),
    totalSupply: String(totalSupply),
    initialTotalSupply: String(initialTotalSupply),
    annualInflation: String(annualInflation),
    totalUnstakedSpCoins: String(totalUnstakedSpCoins),
    totalStakingRewards: String(totalStakingRewards),
    totalStakedSPCoins: String(totalStakedSPCoins),
    symbol: String(symbol),
    version: String(version),
  };
}

export const buildSerializedSPCoinHeader = buildSPCoinHeaderRecord;
