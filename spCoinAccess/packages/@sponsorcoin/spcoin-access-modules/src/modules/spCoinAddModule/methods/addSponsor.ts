// @ts-nocheck
export const addSponsor = async (context, _sponsorKey) => {
  context.spCoinLogger.logFunctionHeader("addSponsor = async(" + _sponsorKey + ")");
  context.spCoinLogger.logDetail("JS => Inserting Sponsor " + _sponsorKey + " To Blockchain Network");
  const tx = await context.spCoinContractDeployed.addSponsor(_sponsorKey);
  context.spCoinLogger.logDetail("JS => Added Sponsor " + _sponsorKey + " Record");
  context.spCoinLogger.logExitFunction();
  return tx;
};
