const fs = require('fs');
const p = 'app/(menu)/(dynamic)/SponsorCoinLab/hooks/useSponsorCoinLabTreeMethods.ts';
let c = fs.readFileSync(p, 'utf8');

const old = `      if (parametersIndex < 1) {
        const lastSegment = payloadPath.at(-1);
        if (lastSegment !== 'claim' && lastSegment !== 'estimate') return 'unhandled';
        const totalSpCoinsPath = payloadPath.slice(0, -1);
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
        // payloadPath ends with 'claim' — toggle __claimModeUpdate on the claim node itself
        for (const entry of candidateEntries) {
          const payload = entry.payload;
          if (!payload) continue;
          const claimNode = readTogglePathValue(payload, payloadPath);
          if (!claimNode || typeof claimNode !== 'object' || Array.isArray(claimNode)) continue;
          const currentFlag = Boolean((claimNode as Record<string, unknown>).__claimModeUpdate);
          const nextClaimNode = { ...(claimNode as Record<string, unknown>), __claimModeUpdate: !currentFlag };
          const nextPayloadRecord = writePathValue(payload, payloadPath, nextClaimNode);
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
