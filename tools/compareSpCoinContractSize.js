const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = process.cwd();
const ENTRY_FILE = 'SPCoin.sol';
const ENTRY_CONTRACT = 'SPCoin';
const SOLC_VERSION = '0.8.18';
const EIP170_LIMIT_BYTES = 24576;
const SOLC_TIMEOUT_MS = Number(process.env.SOLC_TIMEOUT_MS || 30 * 60 * 1000);
const CACHE_DIR = path.join(REPO_ROOT, 'tools', '.cache');
const CACHE_PATH = path.join(CACHE_DIR, 'compareSpCoinContractSize.json');
const SIZE_CACHE_FILE = 'size.json';

function getSolcCommand() {
  const explicit = String(process.env.SOLC_BIN || '').trim();
  if (explicit) {
    return process.platform === 'win32'
      ? { command: explicit, args: ['--standard-json'] }
      : { command: explicit, args: ['--standard-json'] };
  }

  const localBinCandidates =
    process.platform === 'win32'
      ? [
          path.join(REPO_ROOT, 'node_modules', '.bin', 'solc.cmd'),
          path.join(REPO_ROOT, 'node_modules', '.bin', 'solcjs.cmd'),
        ]
      : [
          path.join(REPO_ROOT, 'node_modules', '.bin', 'solc'),
          path.join(REPO_ROOT, 'node_modules', '.bin', 'solcjs'),
        ];

  for (const candidate of localBinCandidates) {
    if (fs.existsSync(candidate)) {
      return { command: candidate, args: ['--standard-json'] };
    }
  }

  return process.platform === 'win32'
    ? {
        command: 'cmd.exe',
        args: ['/d', '/s', '/c', `npx.cmd --yes --prefer-offline solc@${SOLC_VERSION} --standard-json`],
      }
    : {
        command: 'npx',
        args: ['--yes', '--prefer-offline', `solc@${SOLC_VERSION}`, '--standard-json'],
      };
}

function resolveVariantRoot(inputPath, fallbackPath) {
  const raw = String(inputPath || '').trim();
  if (!raw) return fallbackPath;
  return path.isAbsolute(raw) ? raw : path.resolve(REPO_ROOT, raw);
}

function getContractVariants() {
  const previousReleaseRoot = resolveVariantRoot(
    process.argv[2],
    path.join(REPO_ROOT, 'spCoinAccess', 'contracts', 'spCoinOrig.BAK'),
  );
  const latestReleaseRoot = resolveVariantRoot(
    process.argv[3],
    path.join(REPO_ROOT, 'spCoinAccess', 'contracts', 'spCoin'),
  );

  return [
    { label: 'latest', root: latestReleaseRoot },
    { label: 'previous', root: previousReleaseRoot },
  ];
}

function formatTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffsetMinutes = Math.abs(offsetMinutes);
  const offsetHours = pad(Math.floor(absoluteOffsetMinutes / 60));
  const offsetRemainderMinutes = pad(absoluteOffsetMinutes % 60);
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${sign}${offsetHours}:${offsetRemainderMinutes}`;
}

function toPosix(value) {
  return value.replace(/\\/g, '/');
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function loadCache() {
  try {
    return JSON.parse(readUtf8(CACHE_PATH));
  } catch (_error) {
    return { variants: {} };
  }
}

function saveCache(cache) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`);
}

function getSizeCachePath(sourceRoot) {
  return path.join(sourceRoot, SIZE_CACHE_FILE);
}

function getSourceFileMetadata(sourceRoot, sourcePaths) {
  return [...sourcePaths]
    .sort()
    .map((absolutePath) => {
      const stat = fs.statSync(absolutePath);
      return {
        key: toPosix(path.relative(sourceRoot, absolutePath)),
        size: stat.size,
        mtimeMs: stat.mtimeMs,
      };
    });
}

function readValidSizeCache(sourceRoot, fingerprint, sourceFiles) {
  const cachePath = getSizeCachePath(sourceRoot);
  try {
    const cacheStat = fs.statSync(cachePath);
    const parsed = JSON.parse(readUtf8(cachePath));
    const sourceChangedAfterCache = sourceFiles.some((file) => file.mtimeMs > cacheStat.mtimeMs);
    if (sourceChangedAfterCache) return null;
    if (parsed?.schemaVersion !== 1) return null;
    if (path.resolve(String(parsed?.sourceRoot || '')) !== sourceRoot) return null;
    if (parsed?.entryFile !== ENTRY_FILE) return null;
    if (parsed?.contractName !== ENTRY_CONTRACT) return null;
    if (parsed?.solcVersion !== SOLC_VERSION) return null;
    if (parsed?.optimizerEnabled !== true) return null;
    if (parsed?.optimizerRuns !== 200) return null;
    if (parsed?.viaIR !== true) return null;
    if (parsed?.sourceFingerprint !== fingerprint) return null;
    if (!Number.isFinite(Number(parsed?.creationBytes))) return null;
    if (!Number.isFinite(Number(parsed?.deployedBytes))) return null;
    return parsed;
  } catch (_error) {
    return null;
  }
}

function writeSizeCache(sourceRoot, result, sourceFiles, fingerprint) {
  const payload = {
    schemaVersion: 1,
    createdAt: formatTimestamp(),
    sourceRoot,
    entryFile: ENTRY_FILE,
    contractName: ENTRY_CONTRACT,
    solcVersion: SOLC_VERSION,
    optimizerEnabled: true,
    optimizerRuns: 200,
    viaIR: true,
    sourceCount: result.sourceCount,
    sourceFingerprint: result.fingerprint || fingerprint,
    creationBytes: result.creationBytes,
    deployedBytes: result.deployedBytes,
    abiLength: result.abiLength,
    eip170LimitBytes: EIP170_LIMIT_BYTES,
    deployedMarginBytes: getMarginBytes(result.deployedBytes),
    deployedMarginLabel: `${formatSignedDelta(getMarginBytes(result.deployedBytes))} bytes vs EIP-170`,
    sourceFiles,
  };
  fs.writeFileSync(getSizeCachePath(sourceRoot), `${JSON.stringify(payload, null, 2)}\n`);
}

function createVariantFingerprint(sourceRoot, sourcePaths) {
  return JSON.stringify({
    sourceRoot,
    entry: `${ENTRY_FILE}:${ENTRY_CONTRACT}`,
    compiler: SOLC_VERSION,
    optimizerRuns: 200,
    viaIR: true,
    files: [...sourcePaths]
      .sort()
      .map((absolutePath) => {
        const stat = fs.statSync(absolutePath);
        return {
          relativePath: toPosix(path.relative(sourceRoot, absolutePath)),
          size: stat.size,
          mtimeMs: stat.mtimeMs,
        };
      }),
  });
}

function collectSoliditySourcesFromEntry(entryPath, sourceRoot, sources, visited = new Set()) {
  const resolvedEntryPath = path.resolve(entryPath);
  if (visited.has(resolvedEntryPath)) return;
  visited.add(resolvedEntryPath);

  const content = readUtf8(resolvedEntryPath);
  const relativeKey = toPosix(path.relative(sourceRoot, resolvedEntryPath));
  sources[relativeKey] = { content };

  const importPattern = /import\s+(?:(?:[^'"]+from\s+)?["']([^"']+)["']);/g;
  let match;
  while ((match = importPattern.exec(content)) !== null) {
    const rawImportPath = String(match[1] || '').trim();
    if (!rawImportPath || !rawImportPath.endsWith('.sol')) continue;
    if (rawImportPath === 'hardhat/console.sol') continue;

    const resolvedImportPath = path.resolve(path.dirname(resolvedEntryPath), rawImportPath);
    collectSoliditySourcesFromEntry(resolvedImportPath, sourceRoot, sources, visited);
  }
}

function compileVariant(variantRoot) {
  const sources = {};
  const entryPath = path.join(variantRoot, ENTRY_FILE);
  const visitedSourcePaths = new Set();
  collectSoliditySourcesFromEntry(entryPath, variantRoot, sources, visitedSourcePaths);
  const variantFingerprint = createVariantFingerprint(variantRoot, visitedSourcePaths);
  const sourceFiles = getSourceFileMetadata(variantRoot, visitedSourcePaths);
  const sizeCachedVariant = readValidSizeCache(variantRoot, variantFingerprint, sourceFiles);
  if (sizeCachedVariant) {
    return {
      abiLength: Number(sizeCachedVariant.abiLength || 0),
      creationBytes: Number(sizeCachedVariant.creationBytes),
      deployedBytes: Number(sizeCachedVariant.deployedBytes),
      sourceCount: Number(sizeCachedVariant.sourceCount || sourceFiles.length),
      cacheHit: true,
      sizeCacheHit: true,
      fingerprint: variantFingerprint,
    };
  }

  const cache = loadCache();
  const cachedVariant = cache?.variants?.[variantRoot];
  if (cachedVariant?.fingerprint === variantFingerprint && cachedVariant?.result) {
    writeSizeCache(variantRoot, cachedVariant.result, sourceFiles, variantFingerprint);
    return {
      ...cachedVariant.result,
      cacheHit: true,
      sizeCacheHit: false,
      fingerprint: variantFingerprint,
    };
  }

  sources['hardhat/console.sol'] = {
    content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;
library console {
  function log(string memory) internal pure {}
  function log(string memory, uint256) internal pure {}
  function log(string memory, address) internal pure {}
  function log(string memory, string memory) internal pure {}
}`,
  };

  const standardInput = {
    language: 'Solidity',
    sources,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
      outputSelection: {
        '*': {
          '*': ['evm.bytecode.object', 'evm.deployedBytecode.object'],
        },
      },
    },
  };

  const solcCommand = getSolcCommand();
  const result = spawnSync(solcCommand.command, solcCommand.args, {
    cwd: REPO_ROOT,
    input: JSON.stringify(standardInput),
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    timeout: SOLC_TIMEOUT_MS,
  });

  if (result.error) {
    throw result.error;
  }

  const stdout = String(result.stdout || '');
  const stderr = String(result.stderr || '');
  const start = stdout.indexOf('{');
  const end = stdout.lastIndexOf('}');
  if (start < 0 || end < start) {
    throw new Error(`Unable to parse solc output.\nSTDERR:\n${stderr}\nSTDOUT:\n${stdout}`);
  }

  const payload = JSON.parse(stdout.slice(start, end + 1));
  const compileErrors = Array.isArray(payload.errors)
    ? payload.errors.filter((item) => item?.severity === 'error')
    : [];
  if (compileErrors.length > 0) {
    throw new Error(
      compileErrors.map((error) => error.formattedMessage || error.message || 'Unknown compiler error').join('\n'),
    );
  }

  const compiledContract = payload.contracts?.[ENTRY_FILE]?.[ENTRY_CONTRACT];
  const bytecodeObject = String(compiledContract?.evm?.bytecode?.object || '');
  const deployedBytecodeObject = String(compiledContract?.evm?.deployedBytecode?.object || '');
  if (!bytecodeObject || !deployedBytecodeObject) {
    throw new Error(`Compiled artifact missing bytecode for ${ENTRY_CONTRACT}.`);
  }

  const compiledResult = {
    abiLength: Array.isArray(compiledContract?.abi) ? compiledContract.abi.length : 0,
    creationBytes: Math.ceil(bytecodeObject.replace(/^0x/, '').length / 2),
    deployedBytes: Math.ceil(deployedBytecodeObject.replace(/^0x/, '').length / 2),
    sourceCount: Object.keys(sources).length,
    cacheHit: false,
    sizeCacheHit: false,
    fingerprint: variantFingerprint,
  };
  writeSizeCache(variantRoot, compiledResult, sourceFiles, variantFingerprint);
  return compiledResult;
}

function formatSignedDelta(value) {
  return `${value > 0 ? '+' : ''}${value}`;
}

function getMarginBytes(bytes) {
  return EIP170_LIMIT_BYTES - bytes;
}

function formatPercentChange(currentValue, backupValue) {
  if (!backupValue) return 'n/a';
  const percent = ((currentValue - backupValue) / backupValue) * 100;
  const absolute = Math.abs(percent).toFixed(2);
  if (percent < 0) return `${absolute}% smaller`;
  if (percent > 0) return `${absolute}% larger`;
  return '0.00% unchanged';
}

function main() {
  const contractVariants = getContractVariants();
  console.error(
    `[compare:spcoin:size] compiling ${contractVariants.length} variant(s) with solc ${SOLC_VERSION} (timeout ${SOLC_TIMEOUT_MS}ms)`,
  );
  const results = contractVariants.map((variant) => {
    console.error(`[compare:spcoin:size] compiling ${variant.label} from ${variant.root}`);
    const compiled = compileVariant(variant.root);
    const cacheLabel = compiled.sizeCacheHit ? 'size.json cache hit' : compiled.cacheHit ? 'cache hit' : 'compiled fresh';
    console.error(
      `[compare:spcoin:size] ${variant.label} ${cacheLabel} (${compiled.sourceCount} sources)`,
    );
    return {
      label: variant.label,
      root: variant.root,
      ...compiled,
    };
  });
  const cache = loadCache();
  cache.variants = cache.variants || {};
  for (const result of results) {
    cache.variants[result.root] = {
      fingerprint: result.fingerprint,
      result: {
        abiLength: result.abiLength,
        creationBytes: result.creationBytes,
        deployedBytes: result.deployedBytes,
        sourceCount: result.sourceCount,
      },
    };
  }
  saveCache(cache);

  const latest = results.find((entry) => entry.label === 'latest');
  const previous = results.find((entry) => entry.label === 'previous');
  const report = {
    timestamp: formatTimestamp(),
    title: 'SPCoin contract size comparison',
    compiler: `solc ${SOLC_VERSION}`,
    entry: `${ENTRY_FILE}:${ENTRY_CONTRACT}`,
    eip170LimitBytes: EIP170_LIMIT_BYTES,
    variants: results.map((result) => ({
      label: result.label,
      root: result.root,
      sourceCount: result.sourceCount,
      abiEntries: result.abiLength,
      creationBytes: result.creationBytes,
      deployedBytes: result.deployedBytes,
      deployedMarginBytes: getMarginBytes(result.deployedBytes),
      deployedMarginLabel: `${formatSignedDelta(getMarginBytes(result.deployedBytes))} bytes vs EIP-170`,
    })),
    delta:
      latest && previous
        ? {
            label: 'latest-vs-previous',
            creationBytes: latest.creationBytes - previous.creationBytes,
            deployedBytes: latest.deployedBytes - previous.deployedBytes,
            creationPercentChange: formatPercentChange(latest.creationBytes, previous.creationBytes),
            deployedPercentChange: formatPercentChange(latest.deployedBytes, previous.deployedBytes),
          }
        : null,
  };
  console.log(JSON.stringify(report, null, 2));
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
