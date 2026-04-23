import { existsSync, promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const REPO_ROOT = process.cwd();
const DEFAULT_SOLC_VERSION = '0.8.18';
const DEFAULT_SOLC_TIMEOUT_MS = Number(process.env.SOLC_TIMEOUT_MS || 30 * 60 * 1000);
const EIP170_LIMIT_BYTES = 24576;

export type CompileSpCoinParams = {
  sourceRoot: string;
  entryFile?: string;
  contractName?: string;
  solcVersion?: string;
  optimizerEnabled?: boolean;
  optimizerRuns?: number;
  viaIR?: boolean;
  includeAbi?: boolean;
  includeCreationBytecode?: boolean;
  includeDeployedBytecode?: boolean;
};

export type CompiledSpCoinContract = {
  sourceRoot: string;
  entryFile: string;
  contractName: string;
  solcVersion: string;
  sourceCount: number;
  sourceFingerprint: string;
  abi?: unknown[];
  abiLength: number;
  bytecode?: string;
  creationBytes: number;
  deployedBytecode?: string;
  deployedBytes: number;
};

type SpCoinSizeCacheFile = {
  schemaVersion: 1;
  createdAt: string;
  sourceRoot: string;
  entryFile: string;
  contractName: string;
  solcVersion: string;
  optimizerEnabled: boolean;
  optimizerRuns: number;
  viaIR: boolean;
  sourceCount: number;
  sourceFingerprint: string;
  creationBytes: number;
  deployedBytes: number;
  abiLength: number;
  eip170LimitBytes: number;
  deployedMarginBytes: number;
  deployedMarginLabel: string;
  sourceFiles: Array<{
    key: string;
    size: number;
    mtimeMs: number;
  }>;
};

export type CompareSpCoinContractSizeParams = {
  previousReleaseDir: string;
  latestReleaseDir: string;
  solcVersion?: string;
};

export type SpCoinContractSizeReport = {
  timestamp: string;
  title: string;
  compiler: string;
  entry: string;
  eip170LimitBytes: number;
  variants: Array<{
    label: string;
    root: string;
    sourceCount: number;
    abiEntries: number;
    creationBytes: number;
    deployedBytes: number;
    deployedMarginBytes: number;
    deployedMarginLabel: string;
    sourceFingerprint: string;
  }>;
  delta: null | {
    label: string;
    creationBytes: number;
    deployedBytes: number;
    creationPercentChange: string;
    deployedPercentChange: string;
  };
};

function toPosix(value: string) {
  return value.replace(/\\/g, '/');
}

function readUtf8(filePath: string) {
  return fs.readFile(filePath, 'utf8');
}

function formatTimestamp(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0');
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

function formatSignedDelta(value: number) {
  return `${value > 0 ? '+' : ''}${value}`;
}

function getMarginBytes(bytes: number) {
  return EIP170_LIMIT_BYTES - bytes;
}

function formatPercentChange(currentValue: number, backupValue: number) {
  if (!backupValue) return 'n/a';
  const percent = ((currentValue - backupValue) / backupValue) * 100;
  const absolute = Math.abs(percent).toFixed(2);
  if (percent < 0) return `${absolute}% smaller`;
  if (percent > 0) return `${absolute}% larger`;
  return '0.00% unchanged';
}

function getSolcCommand(solcVersion: string) {
  const explicit = String(process.env.SOLC_BIN || '').trim();
  if (explicit) {
    return { command: explicit, args: ['--standard-json'] };
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
    if (existsSync(candidate)) {
      return { command: candidate, args: ['--standard-json'] };
    }
  }

  return process.platform === 'win32'
    ? {
        command: 'cmd.exe',
        args: ['/d', '/s', '/c', `npx.cmd --yes --prefer-offline solc@${solcVersion} --standard-json`],
      }
    : {
        command: 'npx',
        args: ['--yes', '--prefer-offline', `solc@${solcVersion}`, '--standard-json'],
      };
}

function tryExtractJsonDocument(rawText: string) {
  const start = rawText.indexOf('{');
  const end = rawText.lastIndexOf('}');
  if (start < 0 || end < start) return null;
  return rawText.slice(start, end + 1);
}

async function runCommandWithInput(command: string, args: string[], cwd: string, input: string) {
  return await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'pipe',
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    let settled = false;
    const timeoutHandle = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill();
      reject(new Error(`Command timed out after ${DEFAULT_SOLC_TIMEOUT_MS}ms: ${command} ${args.join(' ')}`));
    }, DEFAULT_SOLC_TIMEOUT_MS);

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutHandle);
      reject(error);
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutHandle);
      if (code !== 0) {
        reject(new Error(`Command failed (${code}): ${command} ${args.join(' ')}\n${stderr || stdout}`));
        return;
      }
      resolve({ stdout, stderr });
    });

    child.stdin.write(input);
    child.stdin.end();
  });
}

async function collectSoliditySourcesFromEntry(
  entryPath: string,
  rootDir: string,
  out: Record<string, { content: string }>,
  visited = new Set<string>(),
) {
  const resolvedEntryPath = path.resolve(entryPath);
  if (visited.has(resolvedEntryPath)) return;
  visited.add(resolvedEntryPath);

  const content = await readUtf8(resolvedEntryPath);
  out[toPosix(path.relative(rootDir, resolvedEntryPath))] = { content };

  const importPattern = /import\s+(?:(?:[^'"]+from\s+)?["']([^"']+)["']);/g;
  let match: RegExpExecArray | null;
  while ((match = importPattern.exec(content)) !== null) {
    const rawImportPath = String(match[1] || '').trim();
    if (!rawImportPath || !rawImportPath.endsWith('.sol') || rawImportPath === 'hardhat/console.sol') continue;
    const resolvedImportPath = path.resolve(path.dirname(resolvedEntryPath), rawImportPath);
    await collectSoliditySourcesFromEntry(resolvedImportPath, rootDir, out, visited);
  }
}

function createSourceFingerprint(sourceRoot: string, sourceKeys: string[], sources: Record<string, { content: string }>) {
  return JSON.stringify({
    sourceRoot,
    files: [...sourceKeys]
      .sort()
      .map((key) => ({
        key,
        size: String(sources[key]?.content || '').length,
      })),
  });
}

function getSizeCachePath(sourceRoot: string) {
  return path.join(sourceRoot, 'size.json');
}

async function getSourceFileMetadata(sourceRoot: string, sourceKeys: string[]) {
  return await Promise.all(
    [...sourceKeys].sort().map(async (key) => {
      const absolutePath = path.join(sourceRoot, key);
      const stat = await fs.stat(absolutePath);
      return {
        key,
        size: stat.size,
        mtimeMs: stat.mtimeMs,
      };
    }),
  );
}

async function readValidSizeCache(params: {
  sourceRoot: string;
  entryFile: string;
  contractName: string;
  solcVersion: string;
  optimizerEnabled: boolean;
  optimizerRuns: number;
  viaIR: boolean;
  sourceFingerprint: string;
  sourceFiles: Array<{ key: string; size: number; mtimeMs: number }>;
}) {
  const cachePath = getSizeCachePath(params.sourceRoot);
  try {
    const [cacheStat, raw] = await Promise.all([
      fs.stat(cachePath),
      fs.readFile(cachePath, 'utf8'),
    ]);
    const parsed = JSON.parse(raw) as Partial<SpCoinSizeCacheFile>;
    const sourceChangedAfterCache = params.sourceFiles.some((file) => file.mtimeMs > cacheStat.mtimeMs);
    if (sourceChangedAfterCache) return null;
    if (parsed.schemaVersion !== 1) return null;
    if (path.resolve(String(parsed.sourceRoot || '')) !== params.sourceRoot) return null;
    if (parsed.entryFile !== params.entryFile) return null;
    if (parsed.contractName !== params.contractName) return null;
    if (parsed.solcVersion !== params.solcVersion) return null;
    if (parsed.optimizerEnabled !== params.optimizerEnabled) return null;
    if (parsed.optimizerRuns !== params.optimizerRuns) return null;
    if (parsed.viaIR !== params.viaIR) return null;
    const cachedSourceFiles = Array.isArray(parsed.sourceFiles) ? parsed.sourceFiles : [];
    const cachedSourceFileMap = new Map(
      cachedSourceFiles.map((file) => [String(file?.key || ''), Number(file?.size)]),
    );
    const sourceListMatches = params.sourceFiles.every(
      (file) => cachedSourceFileMap.get(file.key) === file.size,
    );
    if (!sourceListMatches || cachedSourceFileMap.size !== params.sourceFiles.length) return null;
    if (!Number.isFinite(Number(parsed.creationBytes))) return null;
    if (!Number.isFinite(Number(parsed.deployedBytes))) return null;
    return parsed as SpCoinSizeCacheFile;
  } catch {
    return null;
  }
}

async function writeSizeCache(params: {
  compiled: CompiledSpCoinContract;
  optimizerEnabled: boolean;
  optimizerRuns: number;
  viaIR: boolean;
  sourceFiles: Array<{ key: string; size: number; mtimeMs: number }>;
}) {
  const payload: SpCoinSizeCacheFile = {
    schemaVersion: 1,
    createdAt: formatTimestamp(),
    sourceRoot: params.compiled.sourceRoot,
    entryFile: params.compiled.entryFile,
    contractName: params.compiled.contractName,
    solcVersion: params.compiled.solcVersion,
    optimizerEnabled: params.optimizerEnabled,
    optimizerRuns: params.optimizerRuns,
    viaIR: params.viaIR,
    sourceCount: params.compiled.sourceCount,
    sourceFingerprint: params.compiled.sourceFingerprint,
    creationBytes: params.compiled.creationBytes,
    deployedBytes: params.compiled.deployedBytes,
    abiLength: params.compiled.abiLength,
    eip170LimitBytes: EIP170_LIMIT_BYTES,
    deployedMarginBytes: getMarginBytes(params.compiled.deployedBytes),
    deployedMarginLabel: `${formatSignedDelta(getMarginBytes(params.compiled.deployedBytes))} bytes vs EIP-170`,
    sourceFiles: params.sourceFiles,
  };
  await fs.writeFile(getSizeCachePath(params.compiled.sourceRoot), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

export async function getSpCoinSourceFingerprint(params: {
  sourceRoot: string;
  entryFile?: string;
}) {
  const sourceRoot = path.resolve(params.sourceRoot);
  const entryFile = String(params.entryFile || 'SPCoin.sol').trim() || 'SPCoin.sol';
  const entryPath = path.join(sourceRoot, entryFile);
  await fs.access(entryPath).catch(() => {
    throw new Error(`Deployment source is missing ${entryFile}: ${sourceRoot}`);
  });
  const sources: Record<string, { content: string }> = {};
  await collectSoliditySourcesFromEntry(entryPath, sourceRoot, sources);
  const sourceKeys = Object.keys(sources);
  return {
    sourceRoot,
    entryFile,
    sourceCount: sourceKeys.length,
    sourceFingerprint: createSourceFingerprint(sourceRoot, sourceKeys, sources),
  };
}

export async function compileSpCoinContractSource(params: CompileSpCoinParams): Promise<CompiledSpCoinContract> {
  const sourceRoot = path.resolve(params.sourceRoot);
  const entryFile = String(params.entryFile || 'SPCoin.sol').trim() || 'SPCoin.sol';
  const contractName = String(params.contractName || 'SPCoin').trim() || 'SPCoin';
  const solcVersion = String(params.solcVersion || DEFAULT_SOLC_VERSION).trim() || DEFAULT_SOLC_VERSION;
  const optimizerEnabled = typeof params.optimizerEnabled === 'boolean' ? params.optimizerEnabled : true;
  const optimizerRuns =
    Number.isFinite(Number(params.optimizerRuns)) && Number(params.optimizerRuns) > 0 ? Number(params.optimizerRuns) : 200;
  const viaIR = typeof params.viaIR === 'boolean' ? params.viaIR : true;
  const includeAbi = typeof params.includeAbi === 'boolean' ? params.includeAbi : true;
  const includeCreationBytecode =
    typeof params.includeCreationBytecode === 'boolean' ? params.includeCreationBytecode : true;
  const includeDeployedBytecode =
    typeof params.includeDeployedBytecode === 'boolean' ? params.includeDeployedBytecode : true;

  const entryPath = path.join(sourceRoot, entryFile);
  await fs.access(entryPath).catch(() => {
    throw new Error(`Deployment source is missing ${entryFile}: ${sourceRoot}`);
  });

  const sources: Record<string, { content: string }> = {};
  await collectSoliditySourcesFromEntry(entryPath, sourceRoot, sources);
  const sourceKeys = Object.keys(sources).filter((key) => key !== 'hardhat/console.sol');
  const sourceFingerprint = createSourceFingerprint(sourceRoot, sourceKeys, sources);
  const sourceFiles = await getSourceFileMetadata(sourceRoot, sourceKeys);
  const canUseSizeCache =
    !includeAbi &&
    includeCreationBytecode &&
    includeDeployedBytecode;
  if (canUseSizeCache) {
    const cached = await readValidSizeCache({
      sourceRoot,
      entryFile,
      contractName,
      solcVersion,
      optimizerEnabled,
      optimizerRuns,
      viaIR,
      sourceFingerprint,
      sourceFiles,
    });
    if (cached) {
      return {
        sourceRoot,
        entryFile,
        contractName,
        solcVersion,
        sourceCount: cached.sourceCount,
        sourceFingerprint: cached.sourceFingerprint,
        abiLength: cached.abiLength,
        creationBytes: cached.creationBytes,
        deployedBytes: cached.deployedBytes,
      };
    }
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

  const selectedOutputs = [
    ...(includeAbi ? ['abi'] : []),
    ...(includeCreationBytecode ? ['evm.bytecode.object'] : []),
    ...(includeDeployedBytecode ? ['evm.deployedBytecode.object'] : []),
  ];
  const standardInput = {
    language: 'Solidity',
    sources,
    settings: {
      viaIR,
      optimizer: { enabled: optimizerEnabled, runs: optimizerRuns },
      outputSelection: {
        '*': {
          '*': selectedOutputs,
        },
      },
    },
  };

  const solcCommand = getSolcCommand(solcVersion);
  const compileResult = await runCommandWithInput(
    solcCommand.command,
    solcCommand.args,
    REPO_ROOT,
    JSON.stringify(standardInput),
  );
  const jsonPayload = tryExtractJsonDocument(compileResult.stdout);
  if (!jsonPayload) {
    throw new Error(`Unable to parse compiler output: ${compileResult.stdout || compileResult.stderr}`);
  }

  const parsed = JSON.parse(jsonPayload) as {
    contracts?: Record<
      string,
      Record<string, { abi?: unknown[]; evm?: { bytecode?: { object?: string }; deployedBytecode?: { object?: string } } }>
    >;
    errors?: Array<{ severity?: string; formattedMessage?: string; message?: string }>;
  };

  const compileErrors = (parsed.errors || []).filter((item) => item?.severity === 'error');
  if (compileErrors.length > 0) {
    const details = compileErrors
      .map((error) => error.formattedMessage || error.message || 'Unknown compiler error')
      .join('\n');
    throw new Error(`Solidity compile failed:\n${details}`);
  }

  const compiledContract = parsed.contracts?.[entryFile]?.[contractName];
  const abi = compiledContract?.abi;
  const bytecodeObject = String(compiledContract?.evm?.bytecode?.object || '');
  const deployedBytecodeObject = String(compiledContract?.evm?.deployedBytecode?.object || '');
  const bytecode = bytecodeObject ? (bytecodeObject.startsWith('0x') ? bytecodeObject : `0x${bytecodeObject}`) : undefined;
  const deployedBytecode = deployedBytecodeObject
    ? deployedBytecodeObject.startsWith('0x')
      ? deployedBytecodeObject
      : `0x${deployedBytecodeObject}`
    : undefined;

  if (!Array.isArray(abi) && includeAbi) {
    throw new Error(`Compiled ${contractName} artifact is missing ABI.`);
  }
  if (includeCreationBytecode && (!bytecode || bytecode === '0x')) {
    throw new Error(`Compiled ${contractName} artifact is missing creation bytecode.`);
  }
  if (includeDeployedBytecode && (!deployedBytecode || deployedBytecode === '0x')) {
    throw new Error(`Compiled ${contractName} artifact is missing deployed bytecode.`);
  }

  const compiled: CompiledSpCoinContract = {
    sourceRoot,
    entryFile,
    contractName,
    solcVersion,
    sourceCount: sourceKeys.length,
    sourceFingerprint,
    abi: Array.isArray(abi) ? abi : undefined,
    abiLength: Array.isArray(abi) ? abi.length : 0,
    bytecode,
    creationBytes: bytecode ? Math.ceil(bytecode.replace(/^0x/, '').length / 2) : 0,
    deployedBytecode,
    deployedBytes: deployedBytecode ? Math.ceil(deployedBytecode.replace(/^0x/, '').length / 2) : 0,
  };
  if (canUseSizeCache) {
    await writeSizeCache({
      compiled,
      optimizerEnabled,
      optimizerRuns,
      viaIR,
      sourceFiles,
    });
  }
  return compiled;
}

export async function compareSpCoinContractSizes(
  params: CompareSpCoinContractSizeParams,
): Promise<{
  report: SpCoinContractSizeReport;
  previousReleaseDir: string;
  latestReleaseDir: string;
  variantFingerprints: { previous: string; latest: string };
}> {
  const previousReleaseDir = path.resolve(params.previousReleaseDir);
  const latestReleaseDir = path.resolve(params.latestReleaseDir);
  const solcVersion = String(params.solcVersion || DEFAULT_SOLC_VERSION).trim() || DEFAULT_SOLC_VERSION;

  const previous = await compileSpCoinContractSource({
    sourceRoot: previousReleaseDir,
    solcVersion,
    includeAbi: false,
    includeCreationBytecode: true,
    includeDeployedBytecode: true,
  });
  const latest = await compileSpCoinContractSource({
    sourceRoot: latestReleaseDir,
    solcVersion,
    includeAbi: false,
    includeCreationBytecode: true,
    includeDeployedBytecode: true,
  });

  const report: SpCoinContractSizeReport = {
    timestamp: formatTimestamp(),
    title: 'SPCoin contract size comparison',
    compiler: `solc ${solcVersion}`,
    entry: `${latest.entryFile}:${latest.contractName}`,
    eip170LimitBytes: EIP170_LIMIT_BYTES,
    variants: [
      {
        label: 'latest',
        root: latest.sourceRoot,
        sourceCount: latest.sourceCount,
        abiEntries: latest.abiLength,
        creationBytes: latest.creationBytes,
        deployedBytes: latest.deployedBytes,
        deployedMarginBytes: getMarginBytes(latest.deployedBytes),
        deployedMarginLabel: `${formatSignedDelta(getMarginBytes(latest.deployedBytes))} bytes vs EIP-170`,
        sourceFingerprint: latest.sourceFingerprint,
      },
      {
        label: 'previous',
        root: previous.sourceRoot,
        sourceCount: previous.sourceCount,
        abiEntries: previous.abiLength,
        creationBytes: previous.creationBytes,
        deployedBytes: previous.deployedBytes,
        deployedMarginBytes: getMarginBytes(previous.deployedBytes),
        deployedMarginLabel: `${formatSignedDelta(getMarginBytes(previous.deployedBytes))} bytes vs EIP-170`,
        sourceFingerprint: previous.sourceFingerprint,
      },
    ],
    delta: {
      label: 'latest-vs-previous',
      creationBytes: latest.creationBytes - previous.creationBytes,
      deployedBytes: latest.deployedBytes - previous.deployedBytes,
      creationPercentChange: formatPercentChange(latest.creationBytes, previous.creationBytes),
      deployedPercentChange: formatPercentChange(latest.deployedBytes, previous.deployedBytes),
    },
  };

  return {
    report,
    previousReleaseDir,
    latestReleaseDir,
    variantFingerprints: {
      previous: previous.sourceFingerprint,
      latest: latest.sourceFingerprint,
    },
  };
}

export { EIP170_LIMIT_BYTES as EIP170_DEPLOYED_BYTECODE_LIMIT_BYTES };
