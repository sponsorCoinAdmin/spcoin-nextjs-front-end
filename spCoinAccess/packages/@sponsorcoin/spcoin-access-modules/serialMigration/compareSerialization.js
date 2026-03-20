#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

function parseArgs(argv) {
  const args = {};
  for (let idx = 0; idx < argv.length; idx++) {
    const token = argv[idx];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[idx + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    idx += 1;
  }
  return args;
}

function repoRootFromPackageDir(packageDir) {
  return path.resolve(packageDir, '..', '..', '..', '..');
}

function resolveAbiPath(packageDir, customPath) {
  if (customPath) return path.resolve(process.cwd(), customPath);
  const repoRoot = repoRootFromPackageDir(packageDir);
  const defaultPath = path.join(repoRoot, 'resources', 'data', 'ABIs', 'spcoinABI.json');
  if (fs.existsSync(defaultPath)) return defaultPath;
  throw new Error(`Unable to find default ABI at ${defaultPath}. Pass --abi <path>.`);
}

function normalizeValue(value) {
  if (value == null) return '';
  return String(value).replace(/\r\n/g, '\n').trim();
}

async function loadAbi(abiPath) {
  const raw = await fs.promises.readFile(abiPath, 'utf8');
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.abi)) return parsed.abi;
  throw new Error(`Unsupported ABI JSON format in ${abiPath}`);
}

async function discoverSampleInputs(contract) {
  const accountList = ((await contract.getAccountList()) || []).map((value) => String(value));
  const sample = {
    account: accountList[0] || null,
    sponsor: null,
    recipient: null,
    recipientRateKey: null,
    agent: null,
    agentRateKey: null,
    accountList,
  };

  for (const sponsor of accountList) {
    const recipients = ((await contract.getAccountRecipientList(sponsor)) || []).map((value) => String(value));
    if (recipients.length === 0) continue;
    sample.sponsor = sponsor;
    sample.recipient = recipients[0];

    const recipientRateList = ((await contract.getRecipientRateList(sponsor, sample.recipient)) || []).map((value) =>
      String(value),
    );
    if (recipientRateList.length === 0) break;
    sample.recipientRateKey = recipientRateList[0];

    const agentList = ((await contract.getRecipientRateAgentList(sponsor, sample.recipient, sample.recipientRateKey)) || []).map(
      (value) => String(value),
    );
    if (agentList.length === 0) break;
    sample.agent = agentList[0];

    const agentRateList = ((await contract.getAgentRateList(
      sponsor,
      sample.recipient,
      sample.recipientRateKey,
      sample.agent,
    )) || []).map((value) => String(value));
    if (agentRateList.length === 0) break;
    sample.agentRateKey = agentRateList[0];
    break;
  }

  return sample;
}

async function rebuildSerializedSPCoinHeader(contract) {
  const readAnnualInflation = async () => {
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
  };
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
    readAnnualInflation(),
    contract.totalBalanceOf(),
    contract.totalStakingRewards(),
    contract.totalStakedSPCoins(),
    contract.symbol(),
    contract.version(),
  ]);

  return [
    `NAME:${name}`,
    `CREATION_TIME:${creationTime}`,
    `DECIMALS:${decimals}`,
    `TOTAL_SUPPLY:${totalSupply}`,
    `INITIAL_TOTAL_SUPPLY:${initialTotalSupply}`,
    `ANNUAL_INFLATION:${annualInflation}`,
    `TOTAL_BALANCE_OF:${totalBalanceOf}`,
    `TOTAL_STAKED_REWARDS:${totalStakingRewards}`,
    `TOTAL_STAKED_SP_COINS:${totalStakedSPCoins}`,
    `SYMBOL:${symbol}`,
    `VERSION:${version}`,
  ].join(',');
}

function makeBlockedResult(method, sample, reason) {
  return {
    method,
    status: 'blocked',
    sample,
    reason,
  };
}

async function compareMethod(method, sample, legacyCall, rebuildCall, blockedReason) {
  if (blockedReason) return makeBlockedResult(method, sample, blockedReason);
  if (!sample.ready) {
    return {
      method,
      status: 'skipped',
      sample,
      reason: sample.reason || 'No sample inputs available on this contract state.',
    };
  }

  const legacy = await legacyCall();
  const rebuilt = await rebuildCall();
  const normalizedLegacy = normalizeValue(legacy);
  const normalizedRebuilt = normalizeValue(rebuilt);
  const match = normalizedLegacy === normalizedRebuilt;
  return {
    method,
    status: match ? 'match' : 'mismatch',
    sample,
    legacy: normalizedLegacy,
    rebuilt: normalizedRebuilt,
  };
}

function sampleForHeader() {
  return { ready: true };
}

function sampleForAccount(discovery) {
  return discovery.account
    ? { ready: true, account: discovery.account }
    : { ready: false, reason: 'Contract has no accounts yet.' };
}

function sampleForRecipient(discovery) {
  return discovery.sponsor && discovery.recipient
    ? { ready: true, sponsor: discovery.sponsor, recipient: discovery.recipient }
    : { ready: false, reason: 'No sponsor/recipient pair found.' };
}

function sampleForRecipientRate(discovery) {
  return discovery.sponsor && discovery.recipient && discovery.recipientRateKey
    ? {
        ready: true,
        sponsor: discovery.sponsor,
        recipient: discovery.recipient,
        recipientRateKey: discovery.recipientRateKey,
      }
    : { ready: false, reason: 'No sponsor/recipient/rate tuple found.' };
}

function sampleForAgentRate(discovery) {
  return discovery.sponsor &&
    discovery.recipient &&
    discovery.recipientRateKey &&
    discovery.agent &&
    discovery.agentRateKey
    ? {
        ready: true,
        sponsor: discovery.sponsor,
        recipient: discovery.recipient,
        recipientRateKey: discovery.recipientRateKey,
        agent: discovery.agent,
        agentRateKey: discovery.agentRateKey,
      }
    : { ready: false, reason: 'No full sponsor/recipient/rate/agent/agentRate tuple found.' };
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const packageDir = path.resolve(__dirname, '..');
  const abiPath = resolveAbiPath(packageDir, args.abi);
  const rpcUrl = String(args.rpc || 'http://127.0.0.1:8545');
  const contractAddress = String(args.contract || '').trim();

  if (!contractAddress) {
    throw new Error('Missing required --contract <address> argument.');
  }
  if (!ethers.isAddress(contractAddress)) {
    throw new Error(`Invalid contract address: ${contractAddress}`);
  }

  const abi = await loadAbi(abiPath);
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(contractAddress, abi, provider);
  const discovery = await discoverSampleInputs(contract);

  const results = [];

  results.push(
    await compareMethod(
      'getSerializedSPCoinHeader',
      sampleForHeader(),
      () => contract.getSerializedSPCoinHeader(),
      () => rebuildSerializedSPCoinHeader(contract),
    ),
  );

  results.push(
    await compareMethod(
      'getSerializedAccountRecord',
      sampleForAccount(discovery),
      () => contract.getSerializedAccountRecord(discovery.account),
      () => '',
      'Blocked: account creationTime, verified, stakingRewards, and nested account lists are not exposed via non-serialization public getters.',
    ),
  );

  results.push(
    await compareMethod(
      'getSerializedAccountRewards',
      sampleForAccount(discovery),
      () => contract.getSerializedAccountRewards(discovery.account),
      () => '',
      'Blocked: account reward totals are not exposed as structured public getters; only serialized rewards and reward-account strings exist today.',
    ),
  );

  results.push(
    await compareMethod(
      'getSerializedRecipientRecordList',
      sampleForRecipient(discovery),
      () => contract.getSerializedRecipientRecordList(discovery.sponsor, discovery.recipient),
      () => '',
      'Blocked: recipient creationTime and stakedSPCoins are not exposed through non-serialization public getters.',
    ),
  );

  results.push(
    await compareMethod(
      'getSerializedRecipientRateList',
      sampleForRecipientRate(discovery),
      () => contract.getSerializedRecipientRateList(discovery.sponsor, discovery.recipient, discovery.recipientRateKey),
      () => '',
      'Blocked: recipient-rate creationTime, lastUpdateTime, and stakedSPCoins are not exposed through non-serialization public getters.',
    ),
  );

  results.push(
    await compareMethod(
      'serializeAgentRateRecordStr',
      sampleForAgentRate(discovery),
      () =>
        contract.serializeAgentRateRecordStr(
          discovery.sponsor,
          discovery.recipient,
          discovery.recipientRateKey,
          discovery.agent,
          discovery.agentRateKey,
        ),
      () => '',
      'Blocked: agent-rate creationTime, lastUpdateTime, and stakedSPCoins are not exposed through non-serialization public getters.',
    ),
  );

  results.push(
    await compareMethod(
      'getSerializedRateTransactionList',
      sampleForAgentRate(discovery),
      () =>
        contract.getSerializedRateTransactionList(
          discovery.sponsor,
          discovery.recipient,
          discovery.recipientRateKey,
          discovery.agent,
          discovery.agentRateKey,
        ),
      () => '',
      'Blocked: agent-rate transaction lists are only exposed through the current serialization method.',
    ),
  );

  const summary = {
    contractAddress,
    rpcUrl,
    abiPath,
    counts: {
      total: results.length,
      match: results.filter((entry) => entry.status === 'match').length,
      mismatch: results.filter((entry) => entry.status === 'mismatch').length,
      blocked: results.filter((entry) => entry.status === 'blocked').length,
      skipped: results.filter((entry) => entry.status === 'skipped').length,
    },
    sampleDiscovery: discovery,
    results,
  };

  if (args.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log('Serialization Compare');
    console.log(`Contract: ${contractAddress}`);
    console.log(`RPC: ${rpcUrl}`);
    console.log(`ABI: ${abiPath}`);
    console.log(
      `Summary: ${summary.counts.match} match, ${summary.counts.mismatch} mismatch, ${summary.counts.blocked} blocked, ${summary.counts.skipped} skipped, ${summary.counts.total} total`,
    );
    console.log('');
    for (const entry of results) {
      console.log(`[${entry.status.toUpperCase()}] ${entry.method}`);
      if (entry.sample && Object.keys(entry.sample).length > 0) {
        console.log(`  Sample: ${JSON.stringify(entry.sample)}`);
      }
      if (entry.reason) {
        console.log(`  Reason: ${entry.reason}`);
      }
      if (entry.status === 'mismatch') {
        console.log(`  Legacy:  ${entry.legacy}`);
        console.log(`  Rebuilt: ${entry.rebuilt}`);
      }
      console.log('');
    }
  }

  if (summary.counts.mismatch > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(`Serialization compare failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
