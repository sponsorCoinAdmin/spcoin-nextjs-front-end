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
  throw new Error('SpCoin contract does not expose getInitialTotalSupply().');
}

export async function buildSerializedSPCoinHeader(contract: any) {
  const versionFn = typeof contract?.getVersion === 'function' ? contract.getVersion.bind(contract) : null;
  if (!versionFn) {
    throw new Error('SpCoin contract does not expose getVersion().');
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

  return [
    `NAME:${String(name)}`,
    `CREATION_TIME:${String(creationTime)}`,
    `DECIMALS:${String(decimals)}`,
    `TOTAL_SUPPLY:${String(totalSupply)}`,
    `INITIAL_TOTAL_SUPPLY:${String(initialTotalSupply)}`,
    `ANNUAL_INFLATION:${String(annualInflation)}`,
    `TOTAL_UNSTAKED_SP_COINS:${String(totalUnstakedSpCoins)}`,
    `TOTAL_STAKED_REWARDS:${String(totalStakingRewards)}`,
    `TOTAL_STAKED_SP_COINS:${String(totalStakedSPCoins)}`,
    `SYMBOL:${String(symbol)}`,
    `VERSION:${String(version)}`,
  ].join(',');
}
