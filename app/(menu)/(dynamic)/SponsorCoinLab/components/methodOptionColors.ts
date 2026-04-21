const GREEN_HIGHLIGHT_METHODS = new Set([
  'creationTime',
  'getMasterAccountKeys',
  'getAccountKeys',
  'getMasterAccountCount',
  'getAccountKeyCount',
  'getSpCoinMetaData',
  'name',
  'symbol',
  'totalSupply',
  'decimals',
  'balanceOf',
  'getInflationRate',
  'setUpperAgentRate',
  'getLowerAgentRate',
  'getInitialTotalSupply',
  'version',
  'setLowerRecipientRate',
  'getLowerRecipientRate',
  'getRecipientRateRange',
  'setUpperRecipientRate',
  'getUpperRecipientRate',
  'setRecipientRateRange',
  'getAgentRateRange',
  'setAgentRateRange',
  'getUpperAgentRate',
  'setInflationRate',
  'setLowerAgentRate',
]);

export function getMethodOptionColor(methodName: string, executable?: boolean): string | undefined {
  if (executable === false) return '#ef4444';
  if (GREEN_HIGHLIGHT_METHODS.has(methodName)) return '#67e06d';
  return undefined;
}
