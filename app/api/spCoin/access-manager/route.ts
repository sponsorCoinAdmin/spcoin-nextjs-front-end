// File: app/api/spCoin/access-manager/route.ts
import { promises as fs } from 'fs';
import path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import { ContractFactory, JsonRpcProvider, Wallet } from 'ethers';

const execAsync = promisify(exec);
const WORKSPACE_ROOT = path.join(process.cwd(), 'spCoinAccess');
const PACKAGES_ROOT = path.join(WORKSPACE_ROOT, 'packages');
const BACKUPS_ROOT = path.join(WORKSPACE_ROOT, 'backups');
const CONTRACTS_ROOT = path.join(WORKSPACE_ROOT, 'contracts', 'spCoin');
const NETWORKS_REPOSITORY_PATH = path.join(WORKSPACE_ROOT, 'contracts', 'networks.json');
const SPONSORCOIN_SCOPE_DIR = path.join(process.cwd(), 'node_modules', '@sponsorcoin');
const MANAGER_STATE_PATH = path.join(BACKUPS_ROOT, 'manager-state.json');
const NPM_CMD = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const NPX_CMD = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const TAR_CMD = process.platform === 'win32' ? 'tar.exe' : 'tar';

type AccessManagerRequest = {
  action?: 'upload' | 'download' | 'deploy';
  mode?: 'local' | 'node_modules';
  version?: string;
  packageName?: string;
  deploymentName?: string;
  deploymentVersion?: string;
  deploymentAccountPrivateKey?: string;
  deploymentMode?: 'mocked' | 'blockcain';
  deploymentChainId?: number | string;
};

type AccessManagerResponse = {
  ok: boolean;
  action?: 'upload' | 'download' | 'deploy';
  mode?: 'local' | 'node_modules';
  version?: string;
  packageName?: string;
  installSourceRoot?: string;
  deploymentTokenName?: string;
  deploymentPublicKey?: string;
  deploymentPrivateKey?: string;
  deploymentTxHash?: string;
  deploymentChainId?: number;
  deploymentNetworkName?: string;
  message: string;
  packages?: string[];
  workspaceRoot?: string;
  localPath?: string;
  localPathExists?: boolean;
  downloadBlocked?: boolean;
  uploadBlocked?: boolean;
};

type NetworkRepositoryEntry = {
  name: string;
  chainId: number;
  currencySymbol: string;
  defaultRpcUrl: string;
  solcVersion?: string;
  optimizerEnabled?: boolean;
  optimizerRuns?: number;
  failoverRpcUrl?: string | null;
  blockExplorerUrl?: string | null;
};

type NetworkRepositoryFile = {
  version?: number;
  updatedAt?: string;
  networks: NetworkRepositoryEntry[];
};

type ManagerState = {
  packages: Record<
    string,
    {
      downloadedVersion?: string;
      activeArchive?: string;
    }
  >;
};

export const runtime = 'nodejs';

function quoteArg(value: string) {
  if (/^[A-Za-z0-9_./:@=-]+$/.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}

async function runCommand(command: string, args: string[], cwd: string) {
  const commandLine = [command, ...args.map(quoteArg)].join(' ');
  const { stdout, stderr } = await execAsync(commandLine, {
    cwd,
    windowsHide: true,
  });
  return {
    stdout: String(stdout ?? '').trim(),
    stderr: String(stderr ?? '').trim(),
  };
}

async function runCommandWithInput(command: string, args: string[], cwd: string, input: string) {
  const execute = async (useShell: boolean) =>
    await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      let child: ReturnType<typeof spawn>;
      try {
        child = spawn(command, args, {
          cwd,
          windowsHide: true,
          shell: useShell,
          stdio: ['pipe', 'pipe', 'pipe'],
        });
      } catch (error) {
        reject(error);
        return;
      }

      let stdout = '';
      let stderr = '';
      child.stdout?.on('data', (chunk) => {
        stdout += String(chunk);
      });
      child.stderr?.on('data', (chunk) => {
        stderr += String(chunk);
      });

      child.on('error', (error) => reject(error));
      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Command failed (${command} ${args.join(' ')}): ${stderr || stdout}`));
          return;
        }
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
      });

      child.stdin?.write(input);
      child.stdin?.end();
    });

  try {
    return await execute(false);
  } catch (error) {
    // Windows can throw EINVAL for .cmd spawn; retry through shell.
    if ((error as any)?.code === 'EINVAL' && process.platform === 'win32') {
      return await execute(true);
    }
    throw error;
  }
}

function ensureHttpUrl(rawUrl: string) {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

async function loadNetworkRepository(): Promise<NetworkRepositoryFile> {
  const raw = await fs.readFile(NETWORKS_REPOSITORY_PATH, 'utf8');
  const parsed = JSON.parse(raw) as Partial<NetworkRepositoryFile>;
  if (!Array.isArray(parsed.networks)) {
    throw new Error(`Invalid networks repository format at ${NETWORKS_REPOSITORY_PATH}`);
  }
  return {
    version: parsed.version,
    updatedAt: parsed.updatedAt,
    networks: parsed.networks,
  };
}

function inferRpcFromEnv(chainId: number): string {
  if (chainId === 31337) {
    return (
      process.env.NEXT_SERVER_HARDHAT_RPC_URL ||
      process.env.NEXT_PUBLIC_HARDHAT_RPC_URL ||
      ''
    );
  }
  if (chainId === 1) {
    return (
      process.env.NEXT_SERVER_MAINNET_RPC_URL ||
      process.env.NEXT_PUBLIC_INFURA_MAINNET_URL ||
      process.env.NEXT_PUBLIC_ALCHEMY_MAINNET_URL ||
      ''
    );
  }
  if (chainId === 8453) {
    return (
      process.env.NEXT_SERVER_BASE_RPC_URL ||
      process.env.NEXT_PUBLIC_BASE_RPC_URL ||
      ''
    );
  }
  if (chainId === 137) {
    return (
      process.env.NEXT_SERVER_POLYGON_RPC_URL ||
      process.env.NEXT_PUBLIC_INFURA_POLYGON_URL ||
      process.env.NEXT_PUBLIC_ALCHEMY_POLYGON_URL ||
      ''
    );
  }
  if (chainId === 11155111) {
    return (
      process.env.NEXT_SERVER_SEPOLIA_RPC_URL ||
      process.env.NEXT_PUBLIC_INFURA_SEPOLIA_URL ||
      process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL ||
      ''
    );
  }
  return '';
}

async function resolveDeployNetwork(targetChainIdRaw: number | string | undefined) {
  const requestedChainId = Number(targetChainIdRaw);
  const normalizedRequestedChainId =
    Number.isFinite(requestedChainId) && requestedChainId > 0 ? requestedChainId : 31337;

  const repository = await loadNetworkRepository();
  const network =
    repository.networks.find((entry) => Number(entry.chainId) === normalizedRequestedChainId) ??
    repository.networks.find((entry) => Number(entry.chainId) === 31337);

  if (!network) {
    throw new Error(`No network config found for chainId ${normalizedRequestedChainId}.`);
  }

  const envRpc = inferRpcFromEnv(Number(network.chainId));
  const rpcUrl = ensureHttpUrl(envRpc || network.defaultRpcUrl || network.failoverRpcUrl || '');
  if (!rpcUrl) {
    throw new Error(`No RPC URL configured for chainId ${network.chainId}.`);
  }

  return {
    chainId: Number(network.chainId),
    networkName: String(network.name || `chain-${network.chainId}`),
    rpcUrl,
    solcVersion: String(network.solcVersion || '0.8.18'),
    optimizerEnabled:
      typeof network.optimizerEnabled === 'boolean' ? network.optimizerEnabled : true,
    optimizerRuns:
      Number.isFinite(Number(network.optimizerRuns)) && Number(network.optimizerRuns) > 0
        ? Number(network.optimizerRuns)
        : 200,
  };
}

function tryExtractJsonDocument(rawText: string) {
  const text = String(rawText || '').trim();
  if (!text) return '';
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first < 0 || last < 0 || last <= first) return '';
  return text.slice(first, last + 1);
}

function parseImports(sourceText: string): string[] {
  const imports: string[] = [];
  const importRegex = /^\s*import\s+[^'"]*['"]([^'"]+)['"]\s*;/gm;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(sourceText)) !== null) {
    const importPath = String(match[1] || '').trim();
    if (importPath) imports.push(importPath);
  }
  return imports;
}

async function collectSoliditySourcesFromEntry(
  absoluteEntryPath: string,
  rootDir: string,
  out: Record<string, { content: string }>,
) {
  const normalizedEntry = path.normalize(absoluteEntryPath);
  const relativeKey = path.relative(rootDir, normalizedEntry).split(path.sep).join('/');
  if (out[relativeKey]) return;

  const sourceText = await fs.readFile(normalizedEntry, 'utf8');
  out[relativeKey] = { content: sourceText };

  const imports = parseImports(sourceText);
  for (const importPath of imports) {
    if (importPath === 'hardhat/console.sol') continue;
    if (!importPath.startsWith('.')) continue;
    const resolvedImportPath = path.resolve(path.dirname(normalizedEntry), importPath);
    await collectSoliditySourcesFromEntry(resolvedImportPath, rootDir, out);
  }
}

async function ensureWorkspace() {
  await fs.mkdir(WORKSPACE_ROOT, { recursive: true });
  await fs.mkdir(PACKAGES_ROOT, { recursive: true });
  await fs.mkdir(BACKUPS_ROOT, { recursive: true });
}

async function listSponsorcoinPackages(): Promise<string[]> {
  try {
    const entries = await fs.readdir(SPONSORCOIN_SCOPE_DIR, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => `@sponsorcoin/${entry.name}`)
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

function assertSponsorcoinPackage(packageName: string) {
  if (!packageName.startsWith('@sponsorcoin/')) {
    throw new Error('Only @sponsorcoin packages are supported.');
  }
}

function getPackageWorkspaceDir(packageName: string) {
  const [scope, name] = packageName.split('/');
  return path.join(PACKAGES_ROOT, scope, name);
}

function getArchiveFileName(packageName: string, version: string) {
  const [scope, name] = packageName.split('/');
  const safeScope = scope.replace(/^@/, '');
  return `${safeScope}-${name}-${version}.tgz`;
}

function getArchivePath(packageName: string, version: string) {
  return path.join(BACKUPS_ROOT, getArchiveFileName(packageName, version));
}

async function loadManagerState(): Promise<ManagerState> {
  try {
    const raw = await fs.readFile(MANAGER_STATE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<ManagerState>;
    return {
      packages:
        parsed && typeof parsed === 'object' && parsed.packages && typeof parsed.packages === 'object'
          ? parsed.packages
          : {},
    };
  } catch {
    return { packages: {} };
  }
}

async function saveManagerState(state: ManagerState) {
  await fs.writeFile(MANAGER_STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

async function resolveRequestedVersion(packageName: string, requestedVersion: string) {
  const normalized = String(requestedVersion || 'latest').trim() || 'latest';

  if (normalized !== 'latest' && normalized !== 'next') {
    return normalized;
  }

  if (normalized === 'latest') {
    const result = await runCommand(NPM_CMD, ['view', packageName, 'version'], process.cwd());
    const resolved = result.stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
    if (!resolved) throw new Error(`Could not resolve latest version for ${packageName}.`);
    return resolved;
  }

  const result = await runCommand(NPM_CMD, ['view', packageName, 'dist-tags', '--json'], process.cwd());
  const parsed = JSON.parse(result.stdout || '{}') as Record<string, string>;
  const resolved = String(parsed.next || '').trim();
  if (!resolved) throw new Error(`Could not resolve next version for ${packageName}.`);
  return resolved;
}

async function readLocalPackageVersion(packageName: string) {
  const packageJsonPath = path.join(getPackageWorkspaceDir(packageName), 'package.json');
  try {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8')) as { version?: string };
    return String(packageJson.version || '').trim();
  } catch {
    return '';
  }
}

async function writeLocalPackageVersion(packageName: string, nextVersion: string) {
  const packageJsonPath = path.join(getPackageWorkspaceDir(packageName), 'package.json');
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8')) as Record<string, unknown>;
  packageJson.version = nextVersion;
  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
}

async function getPackageButtonState(packageName: string, requestedVersion: string) {
  assertSponsorcoinPackage(packageName);

  const resolvedVersion = await resolveRequestedVersion(packageName, requestedVersion);
  const archiveExists = await fs
    .access(getArchivePath(packageName, resolvedVersion))
    .then(() => true)
    .catch(() => false);

  const managerState = await loadManagerState();
  const packageState = managerState.packages[packageName] ?? {};
  const downloadedVersion = String(packageState.downloadedVersion || '').trim();
  const localVersion = await readLocalPackageVersion(packageName);
  const requestedVersionNormalized = String(requestedVersion || '').trim();
  const uploadTargetVersion =
    requestedVersionNormalized === '' ? 'latest' : requestedVersionNormalized;
  const uploadBlocked =
    !localVersion ||
    uploadTargetVersion === 'latest' ||
    uploadTargetVersion === 'next' ||
    uploadTargetVersion === downloadedVersion;

  return {
    resolvedVersion,
    downloadBlocked: archiveExists,
    uploadBlocked,
  };
}

async function extractArchiveToWorkspace(packageName: string, tarballName: string) {
  const extractRoot = path.join(
    BACKUPS_ROOT,
    `.extract-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );
  const extractDirName = path.basename(extractRoot);
  await fs.mkdir(extractRoot, { recursive: true });

  try {
    await runCommand(TAR_CMD, ['-xf', tarballName, '-C', extractDirName], BACKUPS_ROOT);
    const extractedPackageDir = path.join(extractRoot, 'package');
    const extractedPackageJson = JSON.parse(
      await fs.readFile(path.join(extractedPackageDir, 'package.json'), 'utf8'),
    ) as { version?: string };
    const workspaceDir = getPackageWorkspaceDir(packageName);
    await fs.mkdir(path.dirname(workspaceDir), { recursive: true });
    await fs.rm(workspaceDir, { recursive: true, force: true });
    await fs.rename(extractedPackageDir, workspaceDir);

    return {
      workspaceDir,
      resolvedVersion:
        String(extractedPackageJson.version || '').trim() || '0.0.1',
    };
  } finally {
    await fs.rm(extractRoot, { recursive: true, force: true });
  }
}

async function handleDownload(packageName: string, requestedVersion: string) {
  assertSponsorcoinPackage(packageName);
  await ensureWorkspace();

  const resolvedVersion = await resolveRequestedVersion(packageName, requestedVersion);
  const archivePath = getArchivePath(packageName, resolvedVersion);
  const archiveExists = await fs
    .access(archivePath)
    .then(() => true)
    .catch(() => false);

  const tarballName = getArchiveFileName(packageName, resolvedVersion);

  if (archiveExists) {
    const restored = await extractArchiveToWorkspace(packageName, tarballName);
    const managerState = await loadManagerState();
    managerState.packages[packageName] = {
      downloadedVersion: restored.resolvedVersion,
      activeArchive: tarballName,
    };
    await saveManagerState(managerState);

    return {
      tarballName,
      workspaceDir: restored.workspaceDir,
      resolvedVersion: restored.resolvedVersion,
      reverted: true,
    };
  }

  const spec = `${packageName}@${resolvedVersion}`;
  const packResult = await runCommand(NPM_CMD, ['pack', spec], BACKUPS_ROOT);
  const packedTarballName =
    packResult.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.endsWith('.tgz')) ?? '';

  if (!packedTarballName.endsWith('.tgz')) {
    throw new Error(`npm pack did not return a tarball name. Output: ${packResult.stdout || '(empty)'}`);
  }
  const archiveNameToUse =
    packedTarballName === tarballName ? packedTarballName : tarballName;
  if (packedTarballName !== archiveNameToUse) {
    await fs.rename(
      path.join(BACKUPS_ROOT, packedTarballName),
      path.join(BACKUPS_ROOT, archiveNameToUse),
    );
  }

  const restored = await extractArchiveToWorkspace(packageName, archiveNameToUse);
  const managerState = await loadManagerState();
  managerState.packages[packageName] = {
    downloadedVersion: restored.resolvedVersion,
    activeArchive: archiveNameToUse,
  };
  await saveManagerState(managerState);

  return {
    tarballName: archiveNameToUse,
    workspaceDir: restored.workspaceDir,
    resolvedVersion: restored.resolvedVersion,
    reverted: false,
  };
}

async function handleUpload(packageName: string, requestedVersion: string) {
  assertSponsorcoinPackage(packageName);

  const workspaceDir = getPackageWorkspaceDir(packageName);
  const packageJsonPath = path.join(workspaceDir, 'package.json');

  try {
    await fs.access(packageJsonPath);
  } catch {
    throw new Error(`Local package source not found for ${packageName}. Download it first.`);
  }

  const managerState = await loadManagerState();
  const packageState = managerState.packages[packageName] ?? {};
  const requestedVersionNormalized = String(requestedVersion || '').trim();
  const targetVersion = requestedVersionNormalized || 'latest';
  const localVersion = await readLocalPackageVersion(packageName);
  const downloadedVersion = String(packageState.downloadedVersion || '').trim();

  if (!localVersion) {
    throw new Error(`Upload disabled: local package source is missing version information for ${packageName}.`);
  }

  if (targetVersion === 'latest' || targetVersion === 'next') {
    throw new Error(`Upload disabled: enter an explicit new version before publishing ${packageName}.`);
  }

  if (targetVersion === downloadedVersion) {
    throw new Error(`Upload disabled: change the package version before publishing ${packageName}.`);
  }

  await writeLocalPackageVersion(packageName, targetVersion);
  const publishResult = await runCommand(NPM_CMD, ['publish'], workspaceDir);

  const activeArchive = String(packageState.activeArchive || '').trim();
  if (activeArchive) {
    const activeArchivePath = path.join(BACKUPS_ROOT, activeArchive);
    const archiveExists = await fs
      .access(activeArchivePath)
      .then(() => true)
      .catch(() => false);
    if (archiveExists) {
      const tmpArchivePath = `${activeArchivePath}.TMP`;
      await fs.rm(tmpArchivePath, { force: true });
      await fs.rename(activeArchivePath, tmpArchivePath);
    }
  }

  managerState.packages[packageName] = {
    downloadedVersion: targetVersion,
    activeArchive: '',
  };
  await saveManagerState(managerState);

  return {
    workspaceDir,
    publishOutput: publishResult.stdout || publishResult.stderr || 'npm publish completed.',
    resolvedVersion: targetVersion,
  };
}

async function compileSpCoinContract(params?: {
  solcVersion?: string;
  optimizerEnabled?: boolean;
  optimizerRuns?: number;
}) {
  const solcVersion = String(params?.solcVersion || '0.8.18').trim() || '0.8.18';
  const optimizerEnabled =
    typeof params?.optimizerEnabled === 'boolean' ? params.optimizerEnabled : true;
  const optimizerRuns =
    Number.isFinite(Number(params?.optimizerRuns)) && Number(params?.optimizerRuns) > 0
      ? Number(params?.optimizerRuns)
      : 200;
  const sources: Record<string, { content: string }> = {};
  const entryPath = path.join(CONTRACTS_ROOT, 'SPCoin.sol');
  await collectSoliditySourcesFromEntry(entryPath, CONTRACTS_ROOT, sources);

  // Minimal stub for compatibility with contracts importing hardhat/console.sol.
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
      optimizer: { enabled: optimizerEnabled, runs: optimizerRuns },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object'],
        },
      },
    },
  };

  const compileResult = await runCommandWithInput(
    NPX_CMD,
    ['--yes', `solc@${solcVersion}`, '--standard-json'],
    process.cwd(),
    JSON.stringify(standardInput),
  );

  const jsonPayload = tryExtractJsonDocument(compileResult.stdout);
  if (!jsonPayload) {
    throw new Error(`Unable to parse compiler output: ${compileResult.stdout || compileResult.stderr}`);
  }

  const parsed = JSON.parse(jsonPayload) as {
    contracts?: Record<string, Record<string, { abi?: any[]; evm?: { bytecode?: { object?: string } } }>>;
    errors?: Array<{ severity?: string; formattedMessage?: string; message?: string }>;
  };

  const compileErrors = (parsed.errors || []).filter((item) => item?.severity === 'error');
  if (compileErrors.length > 0) {
    const details = compileErrors
      .map((error) => error.formattedMessage || error.message || 'Unknown compiler error')
      .join('\n');
    throw new Error(`Solidity compile failed:\n${details}`);
  }

  const spCoinContract = parsed.contracts?.['SPCoin.sol']?.SPCoin;
  const abi = spCoinContract?.abi;
  const bytecodeObject = spCoinContract?.evm?.bytecode?.object || '';
  const bytecode = String(bytecodeObject).startsWith('0x')
    ? String(bytecodeObject)
    : `0x${String(bytecodeObject)}`;

  if (!Array.isArray(abi) || !bytecode || bytecode === '0x') {
    throw new Error('Compiled SPCoin artifact is missing ABI or bytecode.');
  }

  return { abi, bytecode };
}

async function deploySpCoinToChain(params: {
  deploymentPrivateKey: string;
  deploymentName: string;
  deploymentVersion: string;
  deploymentChainId?: number | string;
}) {
  const network = await resolveDeployNetwork(params.deploymentChainId);
  const provider = new JsonRpcProvider(network.rpcUrl, network.chainId);
  const wallet = new Wallet(params.deploymentPrivateKey, provider);
  const compiled = await compileSpCoinContract({
    solcVersion: network.solcVersion,
    optimizerEnabled: network.optimizerEnabled,
    optimizerRuns: network.optimizerRuns,
  });
  const factory = new ContractFactory(compiled.abi, compiled.bytecode, wallet);
  const contract = await factory.deploy();
  const deploymentTx = contract.deploymentTransaction();
  if (!deploymentTx) {
    throw new Error('Deployment transaction was not created.');
  }
  const receipt = await deploymentTx.wait();
  const contractAddress = await contract.getAddress();
  if (!contractAddress) {
    throw new Error('Deployment succeeded but no contract address was returned.');
  }

  const deploymentTokenName =
    params.deploymentVersion.trim().length > 0
      ? `${params.deploymentName}.${params.deploymentVersion}`
      : params.deploymentName;

  return {
    deploymentTokenName,
    deploymentPublicKey: contractAddress,
    deploymentPrivateKey: '',
    deploymentTxHash: String(receipt?.hash || deploymentTx.hash || ''),
    deploymentChainId: network.chainId,
    deploymentNetworkName: network.networkName,
  };
}

async function handleDeploy(
  deploymentName: string,
  deploymentVersion: string,
  deploymentAccountPrivateKey: string,
  deploymentMode: 'mocked' | 'blockcain',
  deploymentChainId?: number | string,
) {
  const normalizedName = String(deploymentName || '').trim() || 'sPCoin';
  const normalizedVersion = String(deploymentVersion || '').trim();
  const deploymentTokenName = normalizedVersion ? `${normalizedName}.${normalizedVersion}` : normalizedName;
  const rawPrivateKey = String(deploymentAccountPrivateKey || '').trim();
  const normalizedPrivateKey = rawPrivateKey.startsWith('0x') ? rawPrivateKey : `0x${rawPrivateKey}`;

  if (!/^0x[0-9a-fA-F]{64}$/.test(normalizedPrivateKey)) {
    throw new Error('Invalid deployment private key format.');
  }

  // Validate deployment signer key (used by deployer account).
  const deployerWallet = new Wallet(normalizedPrivateKey);
  if (!deployerWallet.address) {
    throw new Error('Unable to resolve deployer account.');
  }

  if (deploymentMode === 'blockcain') {
    return await deploySpCoinToChain({
      deploymentPrivateKey: normalizedPrivateKey,
      deploymentName: normalizedName,
      deploymentVersion: normalizedVersion,
      deploymentChainId,
    });
  }

  // Scaffold token key material as a distinct keypair from the deployer account.
  const tokenWallet = Wallet.createRandom();
  // Use address-form public identifier for GUI compatibility.
  const deploymentPublicKey = tokenWallet.address;

  return {
    deploymentTokenName,
    deploymentPublicKey,
    deploymentPrivateKey: tokenWallet.privateKey,
  };
}

function normalizeProjectRelativePath(input: string) {
  const trimmed = String(input || '').trim();
  if (!trimmed) return '';
  const withoutSlashes = trimmed.replace(/^\/+|\/+$/g, '');
  return withoutSlashes ? `/${withoutSlashes}` : '';
}

async function checkLocalDirectoryExists(localPathRaw: string) {
  const normalized = normalizeProjectRelativePath(localPathRaw);
  if (!normalized) {
    return { normalized, exists: false };
  }

  const relative = normalized.slice(1);
  if (relative.includes('..')) {
    return { normalized, exists: false };
  }

  const absoluteTarget = path.join(process.cwd(), ...relative.split('/'));
  const exists = await fs
    .access(absoluteTarget)
    .then(() => true)
    .catch(() => false);
  return { normalized, exists };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const localPathRaw = String(searchParams.get('localPath') || '').trim();
  const packageName = String(searchParams.get('packageName') || '').trim();
  const requestedVersion = String(searchParams.get('version') || 'latest').trim() || 'latest';
  const packages = await listSponsorcoinPackages();

  if (localPathRaw) {
    const result = await checkLocalDirectoryExists(localPathRaw);
    return NextResponse.json({
      ok: true,
      message: result.exists
        ? `Local directory exists: ${result.normalized}`
        : `Local directory not found: ${result.normalized}`,
      packages,
      workspaceRoot: WORKSPACE_ROOT,
      localPath: result.normalized,
      localPathExists: result.exists,
    } satisfies AccessManagerResponse);
  }

  let stateFields: Partial<AccessManagerResponse> = {};
  if (packageName) {
    try {
      const state = await getPackageButtonState(packageName, requestedVersion);
      stateFields = {
        packageName,
        version: state.resolvedVersion,
        downloadBlocked: state.downloadBlocked,
        uploadBlocked: state.uploadBlocked,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to resolve package state.';
      return NextResponse.json(
        {
          ok: false,
          message,
          packages,
          workspaceRoot: WORKSPACE_ROOT,
        } satisfies AccessManagerResponse,
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    message:
      packages.length > 0
        ? 'Loaded SponsorCoin packages from node_modules.'
        : 'No @sponsorcoin packages were found in node_modules.',
    packages,
    workspaceRoot: WORKSPACE_ROOT,
    ...stateFields,
  } satisfies AccessManagerResponse);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as AccessManagerRequest;
  const action = body.action === 'upload' ? 'upload' : body.action === 'deploy' ? 'deploy' : 'download';
  const mode = body.mode === 'node_modules' ? 'node_modules' : 'local';
  const requestedVersion = String(body.version || 'latest').trim() || 'latest';
  const packageName = String(body.packageName || '').trim();

  if (action === 'deploy') {
    const deploymentName = String(body.deploymentName || '').trim();
    const deploymentVersion = String(body.deploymentVersion || '').trim();
    const deploymentAccountPrivateKey = String(body.deploymentAccountPrivateKey || '').trim();
    const deploymentMode = body.deploymentMode === 'blockcain' ? 'blockcain' : 'mocked';
    const deploymentChainId = body.deploymentChainId;

    try {
      const result = await handleDeploy(
        deploymentName,
        deploymentVersion,
        deploymentAccountPrivateKey,
        deploymentMode,
        deploymentChainId,
      );
      return NextResponse.json({
        ok: true,
        action,
        mode: deploymentMode === 'blockcain' ? 'node_modules' : mode,
        deploymentTokenName: result.deploymentTokenName,
        deploymentPublicKey: result.deploymentPublicKey,
        deploymentPrivateKey: result.deploymentPrivateKey,
        deploymentTxHash: (result as any).deploymentTxHash,
        deploymentChainId: (result as any).deploymentChainId,
        deploymentNetworkName: (result as any).deploymentNetworkName,
        message:
          deploymentMode === 'blockcain'
            ? `Contract "${result.deploymentTokenName}" deployed on ${String((result as any).deploymentNetworkName || 'chain')} (${String((result as any).deploymentChainId || 'unknown')}). Tx: ${String((result as any).deploymentTxHash || '(unknown)')}`
            : `Deployment scaffold prepared for "${result.deploymentTokenName}". Server-side deployment automation is not connected yet.`,
      } satisfies AccessManagerResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown deployment manager failure.';
      return NextResponse.json(
        {
          ok: false,
          action,
          mode,
          message,
        } satisfies AccessManagerResponse,
        { status: 500 },
      );
    }
  }

  if (!packageName) {
    return NextResponse.json(
      {
        ok: false,
        action,
        mode,
        version: requestedVersion,
        message: 'Select a package before running the manager action.',
      } satisfies AccessManagerResponse,
      { status: 400 },
    );
  }

  try {
    if (action === 'download') {
      const result = await handleDownload(packageName, requestedVersion);
      return NextResponse.json({
        ok: true,
        action,
        mode,
        packageName,
        installSourceRoot: `/spCoinAccess/packages/${packageName}`,
        version: result.resolvedVersion,
        downloadBlocked: true,
        uploadBlocked: true,
        message: `Success: ${packageName}.${result.resolvedVersion} reverted to NPM version.`,
      } satisfies AccessManagerResponse);
    }

    const result = await handleUpload(packageName, requestedVersion);
    return NextResponse.json({
      ok: true,
      action,
      mode,
      packageName,
      version: result.resolvedVersion || requestedVersion,
      downloadBlocked: false,
      uploadBlocked: true,
      message: `Published ${packageName}${result.resolvedVersion ? `@${result.resolvedVersion}` : ''} from ${result.workspaceDir}. ${result.publishOutput}`,
    } satisfies AccessManagerResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown npm manager failure.';
    return NextResponse.json(
      {
        ok: false,
        action,
        mode,
        packageName,
        version: requestedVersion,
        message,
      } satisfies AccessManagerResponse,
      { status: 500 },
    );
  }
}
