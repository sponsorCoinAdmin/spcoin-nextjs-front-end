const fs = require('fs');
const p = 'app/(menu)/(dynamic)/SponsorCoinLab/hooks/useSponsorCoinLabTreeMethods.ts';
let c = fs.readFileSync(p, 'utf8');

// Replace the entire parametersIndex < 1 block with a simple flag toggle
const old = `      if (parametersIndex < 1) {
        const lastSegment = payloadPath.at(-1);
        if (lastSegment !== 'claim' && lastSegment !== 'estimate') return 'unhandled';
        // claim is injected at totalSpCoins level, so path is e.g. result.totalSpCoins.claim
        // pendingRewards is a child of totalSpCoins, not in the path
        const totalSpCoinsPath = payloadPath.slice(0, -1); // up to totalSpCoins
        const pendingRewardsPath = [...totalSpCoinsPath, 'pendingRewards'];
        for (const entry of candidateEntries) {
          const payload = entry.payload;
          if (!payload) continue;
          const pendingRewardsNode = readTogglePathValue(payload, pendingRewardsPath);
          if (!pendingRewardsNode || typeof pendingRewardsNode !== 'object' || Array.isArray(pendingRewardsNode)) continue;
          const runPendingRewards = (pendingRewardsNode as Record<string, unknown>).runPendingRewards;
          if (!runPendingRewards || typeof runPendingRewards !== 'object' || Array.isArray(runPendingRewards)) continue;
          // Toggle __claimModeUpdate flag without touching runPendingRewards
          const currentFlag = Boolean((pendingRewardsNode as Record<string, unknown>).__claimModeUpdate);
          const nextPendingRewards = { ...(pendingRewardsNode as Record<string, unknown>), __claimModeUpdate: !currentFlag };
          const nextPayloadRecord = writePathValue(payload, pendingRewardsPath, nextPendingRewards);
          const nextRootPayload = normalizeExecutionPayload(nextPayloadRecord) as Record<string, unknown>;
          const nextPayload = formatFormattedPanelPayload(nextRootPayload);
          if (blocks.length > 1) {
            const nextBlocks = [...blocks];
            nextBlocks[entry.index] = nextPayload;
            if (inTreePanel) { setTrackedTreeOutputDisplay(nextBlocks.join('\\n\\n')); }
            else { setFormattedOutputDisplay(nextBlocks.join('\\n\\n')); }
          } else if (inTreePanel) { setTrackedTreeOutputDisplay(nextPayload); }
          else { setFormattedOutputDisplay(nextPayload); }
          setStatus('Cleared pending rewards result.');
          return 'expanded';
        }
        return 'unhandled';
      }`;

const next = `      if (parametersIndex < 1) {
        const lastSegment = payloadPath.at(-1);
        if (lastSegment !== 'claim' && lastSegment !== 'estimate') return 'unhandled';
        const totalSpCoinsPath = payloadPath.slice(0, -1);
        const pendingRewardsPath = [...totalSpCoinsPath, 'pendingRewards'];
        for (const entry of candidateEntries) {
          const payload = entry.payload;
          if (!payload) continue;
          const pendingRewardsNode = readTogglePathValue(payload, pendingRewardsPath);
          if (!pendingRewardsNode || typeof pendingRewardsNode !== 'object' || Array.isArray(pendingRewardsNode)) continue;
          const currentFlag = Boolean((pendingRewardsNode as Record<string, unknown>).__claimModeUpdate);
          const nextPendingRewards = { ...(pendingRewardsNode as Record<string, unknown>), __claimModeUpdate: !currentFlag };
          const nextPayloadRecord = writePathValue(payload, pendingRewardsPath, nextPendingRewards);
          const nextRootPayload = normalizeExecutionPayload(nextPayloadRecord) as Record<string, unknown>;
          const nextPayload = formatFormattedPanelPayload(nextRootPayload);
          if (blocks.length > 1) {
            const nextBlocks = [...blocks];
            nextBlocks[entry.index] = nextPayload;
            if (inTreePanel) { setTrackedTreeOutputDisplay(nextBlocks.join('\\n\\n')); }
            else { setFormattedOutputDisplay(nextBlocks.join('\\n\\n')); }
          } else if (inTreePanel) { setTrackedTreeOutputDisplay(nextPayload); }
          else { setFormattedOutputDisplay(nextPayload); }
          setStatus('Toggled claim mode.');
          return 'expanded';
        }
        return 'unhandled';
      }`;

console.log('found:', c.includes(old));
c = c.replace(old, next);
fs.writeFileSync(p, c, 'utf8');
console.log('done');
