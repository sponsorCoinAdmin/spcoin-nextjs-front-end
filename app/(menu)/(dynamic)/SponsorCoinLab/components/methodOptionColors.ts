const GREEN_HIGHLIGHT_METHODS = new Set([
  'creationTime',
  'getMasterAccountMetaData',
  'getMasterAccountKeys',
  'getAccountKeys',
  'getActiveAccountKeys',
  'getActiveAccountCount',
  'getSpCoinMetaData',
  'name',
  'symbol',
  'totalSupply',
  'decimals',
  'balanceOf',
  'getInflationRate',
  'setUpperAgentRate',
  'getLowerAgentRate',
  'totalInitialSupply',
  'version',
  'setLowerRecipientRate',
  'getLowerRecipientRate',
  'getRecipientRateRange',
  'getRecipientRateIncrement',
  'setUpperRecipientRate',
  'getUpperRecipientRate',
  'setRecipientRateRange',
  'setRecipientRateIncrement',
  'getAgentRateRange',
  'getAgentRateIncrement',
  'setAgentRateRange',
  'setAgentRateIncrement',
  'getUpperAgentRate',
  'setInflationRate',
  'setLowerAgentRate',
]);

export function getMethodOptionColor(methodName: string, executable?: boolean): string | undefined {
  if (executable === false) return '#ef4444';
  if (GREEN_HIGHLIGHT_METHODS.has(methodName)) return '#67e06d';
  return undefined;
}
