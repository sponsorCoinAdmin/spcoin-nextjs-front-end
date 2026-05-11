const fs = require('fs');
const p = 'components/shared/JsonInspector.tsx';
let c = fs.readFileSync(p, 'utf8');

const old1 = "    const runAction = getPendingRewardsRunAction(value);\n    if (runAction) return [['runPendingRewards', runAction], ...normalizedEntries] as Array<[string, any]>;";
const new1 = "    const runAction = getPendingRewardsRunAction(value);\n    if (runAction && !(value as Record<string, unknown>).runPendingRewards) return [['runPendingRewards', runAction], ...normalizedEntries] as Array<[string, any]>;";
console.log('1 found:', c.includes(old1));
c = c.replace(old1, new1);

const old2 = "  const runAction = getPendingRewardsRunAction(value);\n  if (runAction) return [['runPendingRewards', runAction], ...normalizedEntries] as Array<[string, any]>;";
const new2 = "  const runAction = getPendingRewardsRunAction(value);\n  if (runAction && !(value as Record<string, unknown>).runPendingRewards) return [['runPendingRewards', runAction], ...normalizedEntries] as Array<[string, any]>;";
console.log('2 found:', c.includes(old2));
c = c.replace(old2, new2);

fs.writeFileSync(p, c, 'utf8');
console.log('done');
