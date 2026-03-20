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

export async function buildSerializedSPCoinHeader(contract: any) {
  const [
    name,
    creationTime,
    decimals,
    totalSupply,
    initialTotalSupply,
    annualInflation,
    totalBalanceOf,
    totalStakingRewards,
    totalStakedSPCoins,
    symbol,
    version,
  ] = await Promise.all([
    contract.name(),
    contract.creationTime(),
    contract.decimals(),
    contract.totalSupply(),
    contract.initialTotalSupply(),
    readAnnualInflation(contract),
    contract.totalBalanceOf(),
    contract.totalStakingRewards(),
    contract.totalStakedSPCoins(),
    contract.symbol(),
    contract.version(),
  ]);

  return [
    `NAME:${String(name)}`,
    `CREATION_TIME:${String(creationTime)}`,
    `DECIMALS:${String(decimals)}`,
    `TOTAL_SUPPLY:${String(totalSupply)}`,
    `INITIAL_TOTAL_SUPPLY:${String(initialTotalSupply)}`,
    `ANNUAL_INFLATION:${String(annualInflation)}`,
    `TOTAL_BALANCE_OF:${String(totalBalanceOf)}`,
    `TOTAL_STAKED_REWARDS:${String(totalStakingRewards)}`,
    `TOTAL_STAKED_SP_COINS:${String(totalStakedSPCoins)}`,
    `SYMBOL:${String(symbol)}`,
    `VERSION:${String(version)}`,
  ].join(',');
}
