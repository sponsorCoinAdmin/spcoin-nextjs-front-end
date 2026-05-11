const fs = require('fs');
const p = 'app/(menu)/(dynamic)/SponsorCoinLab/hooks/useSponsorCoinLabTreeMethods.ts';
let c = fs.readFileSync(p, 'utf8');

const old = `          // Clear runPendingRewards to reset back to Claim state
          const nextPendingRewards = Object.fromEntries(
            Object.entries(pendingRewardsNode as Record<string, unknown>).filter(([k]) => k !== 'runPendingRewards')
          );
          const nextPayloadRecord = writePathValue(payload, pendingRewardsPath, nextPendingRewards);`;

const next = `          // Toggle __claimModeUpdate flag without touching runPendingRewards
          const currentFlag = Boolean((pendingRewardsNode as Record<string, unknown>).__claimModeUpdate);
          const nextPendingRewards = { ...(pendingRewardsNode as Record<string, unknown>), __claimModeUpdate: !currentFlag };
          const nextPayloadRecord = writePathValue(payload, pendingRewardsPath, nextPendingRewards);`;

console.log('found:', c.includes(old));
c = c.replace(old, next);
fs.writeFileSync(p, c, 'utf8');
console.log('done');
