// File: app/api/spCoin/access-manager/route.ts
import { promises as fs } from 'fs';
import path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import { Contract, ContractFactory, JsonRpcProvider, Wallet } from 'ethers';
import {
  resolveSpCoinDiskChainId,
  toDiskAddressFolderName,
} from '@/lib/spCoin/diskPathResolver';

const execAsync = promisify(exec);
const WORKSPACE_ROOT = path.join(process.cwd(), 'spCoinAccess');
const PACKAGES_ROOT = path.join(WORKSPACE_ROOT, 'packages');
const BACKUPS_ROOT = path.join(WORKSPACE_ROOT, 'backups');
const NETWORKS_REPOSITORY_PATH = path.join(WORKSPACE_ROOT, 'contracts', 'networks.json');
const SPCOIN_DEPLOYMENT_MAP_PATH = path.join(
  process.cwd(),
  'resources',
  'data',
  'networks',
  'spCoinDeployment.json',
);
const SPCOIN_ABI_PATH = path.join(process.cwd(), 'resources', 'data', 'ABIs', 'spcoinABI.json');
const SPONSORCOIN_SCOPE_DIR = path.join(process.cwd(), 'node_modules', '@sponsorcoin');
const MANAGER_STATE_PATH = path.join(BACKUPS_ROOT, 'manager-state.json');
const NPM_CMD = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const NPX_CMD = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const TAR_CMD = process.platform === 'win32' ? 'tar.exe' : 'tar';
const EIP170_DEPLOYED_BYTECODE_LIMIT_BYTES = 24576;

function resolveSpCoinDeploymentAssetChainId(chainId: unknown): number {
  const parsed = Number(chainId);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 31337;
}

type AccessManagerRequest = {
  action?:
    | 'upload'
    | 'download'
    | 'install'
    | 'deploy'
    | 'updateServer'
    | 'prepareDeploy'
    | 'registerDeployment'
    | 'generateAbi'
    | 'removeDeployment';
  mode?: 'local' | 'node_modules';
  version?: string;
  packageName?: string;
  otp?: string;
  deploymentName?: string;
  deploymentSymbol?: string;
  deploymentDecimals?: number | string;
  deploymentLogoPath?: string;
  deploymentPublicKey?: string;
  deploymentVersion?: string;
  deploymentAccountPrivateKey?: string;
  deploymentSignerPublicKey?: string;
  deploymentChainId?: number | string;
  deploymentSourcePath?: string;
};

type AccessManagerResponse = {
  ok: boolean;
  action?:
    | 'upload'
    | 'download'
    | 'install'
    | 'deploy'
    | 'updateServer'
    | 'prepareDeploy'
    | 'registerDeployment'
    | 'generateAbi'
    | 'removeDeployment';
  mode?: 'local' | 'node_modules';
  version?: string;
  localVersion?: string;
  downloadedVersion?: string;
  localPackageVersion?: string;
  packageName?: string;
  installSourceRoot?: string;
  deploymentTokenName?: string;
  deploymentPublicKey?: string;
  deploymentAbi?: unknown[];
  deploymentBytecode?: string;
  deploymentConstructorArgs?: unknown[];
  deploymentPrivateKey?: string;
  deploymentTxHash?: string;
  deploymentChainId?: number;
  deploymentAssetChainId?: number;
  deploymentNetworkName?: string;
  deploymentSourcePath?: string;
  mapAdded?: boolean;
  spCoinMetaData?: {
    version: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSypply: string;
    inflationRate: number;
    recipientRateRange: [number, number];
    agentRateRange: [number, number];
  };
  message: string;
  packages?: string[];
  workspaceRoot?: string;
  localPath?: string;
  localPathExists?: boolean;
  localPackageExists?: boolean;
  contractDirExists?: boolean;
  resolvedChainId?: number;
  tokenStatus?: 'NOT_FOUND' | 'DEPLOYED' | 'SERVER_INSTALLED';
  downloadBlocked?: boolean;
  uploadBlocked?: boolean;
};

function normalizeSpCoinContractVersion(version: string): string {
  const trimmed = String(version || '').trim();
  if (!trimmed) return '_V001';
  return trimmed.startsWith('_V') ? trimmed : `_V${trimmed}`;
}

function getSpCoinConstructorArgs(abi: unknown[], deploymentVersion?: string) {
  const constructorEntry = abi.find(
    (entry): entry is { type?: string; inputs?: Array<{ type?: string }> } =>
      Boolean(entry) && typeof entry === 'object' && (entry as { type?: string }).type === 'constructor',
  );
  const inputs = Array.isArray(constructorEntry?.inputs) ? constructorEntry.inputs : [];
  if (inputs.length === 0) return [];
  if (inputs.length === 1 && inputs[0]?.type === 'string') {
    return [normalizeSpCoinContractVersion(String(deploymentVersion || '').trim())];
  }
  throw new Error(`Unsupported SPCoin constructor ABI with ${inputs.length} input(s).`);
}

function resolveDeploymentContractsRoot(deploymentSourcePath?: string) {
  const fallbackPath = '/spCoinAccess/contracts/spCoin';
  const normalized = normalizeProjectRelativePath(deploymentSourcePath || fallbackPath) || fallbackPath;
  const relative = normalized.slice(1);
  if (!relative || relative.includes('..')) {
    throw new Error(`Invalid deployment source path: ${deploymentSourcePath || '(empty)'}`);
  }

  const contractsBase = path.resolve(WORKSPACE_ROOT, 'contracts');
  const contractsRoot = path.resolve(process.cwd(), ...relative.split('/'));
  if (contractsRoot !== contractsBase && !contractsRoot.startsWith(`${contractsBase}${path.sep}`)) {
    throw new Error(`Deployment source must be under /spCoinAccess/contracts: ${normalized}`);
  }

  return {
    contractsRoot,
    deploymentSourcePath: normalized,
  };
}

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

type SpCoinDeploymentMapFile = {
  meta?: {
    networkIdToName?: Record<string, string>;
  };
  chainId?: Record<string, Record<string, unknown>>;
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

function unexpectedAccessManagerError(
  error: unknown,
  extras: Partial<AccessManagerResponse> = {},
  status = 500,
) {
  const message = error instanceof Error ? error.message : 'Unexpected access manager failure.';
  return NextResponse.json(
    {
      ok: false,
      message,
      ...extras,
    } satisfies AccessManagerResponse,
    { status },
  );
}

function quoteArg(value: string) {
  if (/^[A-Za-z0-9_./:@=-]+$/.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms.`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
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

async function shouldPublishPackageWithoutScripts(workspaceDir: string) {
  const packageJsonPath = path.join(workspaceDir, 'package.json');
  const tsconfigPath = path.join(workspaceDir, 'tsconfig.json');
  const distPath = path.join(workspaceDir, 'dist');

  try {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8')) as {
      scripts?: { build?: string; prepack?: string };
    };
    const buildScript = String(packageJson?.scripts?.build || '').trim();
    const prepackScript = String(packageJson?.scripts?.prepack || '').trim();
    const tsconfigExists = await fs
      .access(tsconfigPath)
      .then(() => true)
      .catch(() => false);
    const distExists = await fs
      .access(distPath)
      .then(() => true)
      .catch(() => false);

    // Dist-only local package workflow:
    // use the downloaded artifact as-is when build/prepack expects tsconfig
    // but the extracted package only contains dist output.
    return Boolean(distExists && !tsconfigExists && (buildScript || prepackScript));
  } catch {
    return false;
  }
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
  const downloadedVersionRaw = String(packageState.downloadedVersion || '').trim();
  const activeArchive = String(packageState.activeArchive || '').trim();
  const activeArchivePath = activeArchive ? path.join(BACKUPS_ROOT, activeArchive) : '';
  const activeArchiveExists =
    !!activeArchivePath &&
    (await fs
      .access(activeArchivePath)
      .then(() => true)
      .catch(() => false));
  const downloadedVersion =
    activeArchiveExists && /\.tgz$/i.test(activeArchive) ? downloadedVersionRaw : '';
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
    localVersion,
    downloadedVersion,
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

async function handleUpload(packageName: string, requestedVersion: string, otp?: string) {
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

  const normalizedOtp = String(otp || '').trim();
  if (normalizedOtp && !/^\d{6}$/.test(normalizedOtp)) {
    throw new Error('Invalid npm one-time password. Enter the current 6-digit authenticator code.');
  }

  await writeLocalPackageVersion(packageName, targetVersion);
  const publishWithoutScripts = await shouldPublishPackageWithoutScripts(workspaceDir);
  const publishArgs = ['publish'];
  if (normalizedOtp) publishArgs.push(`--otp=${normalizedOtp}`);
  if (publishWithoutScripts) publishArgs.push('--ignore-scripts');
  const publishResult = await runCommand(NPM_CMD, publishArgs, workspaceDir);

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
    publishOutput:
      (publishResult.stdout || publishResult.stderr || 'npm publish completed.') +
      (publishWithoutScripts ? '\nPublished using local dist artifact mode (--ignore-scripts).' : ''),
    resolvedVersion: targetVersion,
  };
}

async function handleInstall(packageName: string, requestedVersion: string) {
  assertSponsorcoinPackage(packageName);

  const resolvedVersion = await resolveRequestedVersion(packageName, requestedVersion);
  const installSpec = `${packageName}@${resolvedVersion}`;
  const installResult = await runCommand(
    NPM_CMD,
    ['install', installSpec, '--no-save', '--no-package-lock'],
    process.cwd(),
  );

  return {
    resolvedVersion,
    installOutput: installResult.stdout || installResult.stderr || `Installed ${installSpec}.`,
  };
}

async function compileSpCoinContract(params?: {
  solcVersion?: string;
  optimizerEnabled?: boolean;
  optimizerRuns?: number;
  deploymentSourcePath?: string;
}) {
  const solcVersion = String(params?.solcVersion || '0.8.18').trim() || '0.8.18';
  const optimizerEnabled =
    typeof params?.optimizerEnabled === 'boolean' ? params.optimizerEnabled : true;
  const optimizerRuns =
    Number.isFinite(Number(params?.optimizerRuns)) && Number(params?.optimizerRuns) > 0
      ? Number(params?.optimizerRuns)
      : 200;
  const deploymentSource = resolveDeploymentContractsRoot(params?.deploymentSourcePath);
  const sources: Record<string, { content: string }> = {};
  const entryPath = path.join(deploymentSource.contractsRoot, 'SPCoin.sol');
  await fs.access(entryPath).catch(() => {
    throw new Error(`Deployment source is missing SPCoin.sol: ${deploymentSource.deploymentSourcePath}`);
  });
  await collectSoliditySourcesFromEntry(entryPath, deploymentSource.contractsRoot, sources);

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
      viaIR: true,
      optimizer: { enabled: optimizerEnabled, runs: optimizerRuns },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'],
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
    contracts?: Record<string, Record<string, { abi?: any[]; evm?: { bytecode?: { object?: string }; deployedBytecode?: { object?: string } } }>>;
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
  const deployedBytecodeObject = spCoinContract?.evm?.deployedBytecode?.object || '';
  const bytecode = String(bytecodeObject).startsWith('0x')
    ? String(bytecodeObject)
    : `0x${String(bytecodeObject)}`;
  const deployedBytecodeBytes = Math.ceil(String(deployedBytecodeObject).replace(/^0x/, '').length / 2);

  if (!Array.isArray(abi) || !bytecode || bytecode === '0x') {
    throw new Error('Compiled SPCoin artifact is missing ABI or bytecode.');
  }
  if (deployedBytecodeBytes > EIP170_DEPLOYED_BYTECODE_LIMIT_BYTES) {
    throw new Error(
      `Compiled SPCoin deployed bytecode is ${deployedBytecodeBytes} bytes, which exceeds the EIP-170 limit of ${EIP170_DEPLOYED_BYTECODE_LIMIT_BYTES} bytes by ${deployedBytecodeBytes - EIP170_DEPLOYED_BYTECODE_LIMIT_BYTES} bytes. Reduce contract size before deploying.`,
    );
  }

  return { abi, bytecode, deploymentSourcePath: deploymentSource.deploymentSourcePath };
}

async function deploySpCoinToChain(params: {
  deploymentPrivateKey: string;
  deploymentName: string;
  deploymentVersion: string;
  deploymentChainId?: number | string;
  deploymentSourcePath?: string;
}) {
  const network = await resolveDeployNetwork(params.deploymentChainId);
  const provider = new JsonRpcProvider(network.rpcUrl, network.chainId);
  try {
    await withTimeout(
      provider.getBlockNumber(),
      10000,
      `RPC health check for ${network.networkName} (${network.rpcUrl})`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown RPC health check failure.';
    throw new Error(`Unable to reach deployment RPC ${network.rpcUrl}: ${message}`);
  }
  const wallet = new Wallet(params.deploymentPrivateKey, provider);
  const compiled = await compileSpCoinContract({
    solcVersion: network.solcVersion,
    optimizerEnabled: network.optimizerEnabled,
    optimizerRuns: network.optimizerRuns,
    deploymentSourcePath: params.deploymentSourcePath,
  });
  const factory = new ContractFactory(compiled.abi, compiled.bytecode, wallet);
  const contract = await factory.deploy(
    ...getSpCoinConstructorArgs(compiled.abi, params.deploymentVersion),
  );
  const deploymentTx = contract.deploymentTransaction();
  if (!deploymentTx) {
    throw new Error('Deployment transaction was not created.');
  }
  const receipt = await deploymentTx.wait();
  const contractAddress = await contract.getAddress();
  if (!contractAddress) {
    throw new Error('Deployment succeeded but no contract address was returned.');
  }

  const deploymentTokenName = params.deploymentName.trim() || 'Sponsor Coin';

  return {
    deploymentTokenName,
    deploymentPublicKey: contractAddress,
    deploymentPrivateKey: '',
    deploymentTxHash: String(receipt?.hash || deploymentTx.hash || ''),
    deploymentChainId: network.chainId,
    deploymentNetworkName: network.networkName,
    deploymentSourcePath: compiled.deploymentSourcePath,
  };
}

async function handleDeploy(
  deploymentName: string,
  deploymentVersion: string,
  deploymentAccountPrivateKey: string,
  deploymentChainId?: number | string,
  deploymentSourcePath?: string,
) {
  const normalizedName = String(deploymentName || '').trim() || 'sPCoin';
  const normalizedVersion = String(deploymentVersion || '').trim();
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

  const deployed = await deploySpCoinToChain({
    deploymentPrivateKey: normalizedPrivateKey,
    deploymentName: normalizedName,
    deploymentVersion: normalizedVersion,
    deploymentChainId,
    deploymentSourcePath,
  });
  return {
    ...deployed,
    deploymentAssetChainId: resolveSpCoinDeploymentAssetChainId(deployed.deploymentChainId),
  };
}

function normalizePublicAssetPath(input: string) {
  const raw = String(input || '').trim().replace(/\\/g, '/');
  if (!raw) return 'assets/miscellaneous/spCoin.png';
  const withoutLeadingSlash = raw.replace(/^\/+/, '');
  const withoutPublicPrefix = withoutLeadingSlash.replace(/^public\//i, '');
  if (withoutPublicPrefix.includes('..')) {
    throw new Error('Invalid logo path.');
  }
  return withoutPublicPrefix || 'assets/miscellaneous/spCoin.png';
}

async function handleUpdateServer(params: {
  deploymentName: string;
  deploymentSymbol: string;
  deploymentVersion: string;
  deploymentDecimals: number | string;
  deploymentLogoPath: string;
  deploymentPublicKey: string;
  deploymentChainId?: number | string;
}) {
  const chainIdRaw = Number(params.deploymentChainId);
  const requestedChainId = Number.isFinite(chainIdRaw) && chainIdRaw > 0 ? chainIdRaw : 31337;
  const chainId = resolveSpCoinDeploymentAssetChainId(requestedChainId);
  const address = String(params.deploymentPublicKey || '').trim();
  if (!/^0[xX][a-fA-F0-9]{40}$/.test(address)) {
    throw new Error('Invalid deployment public key. Deploy token first.');
  }
  const addressFolder = toDiskAddressFolderName(address);

  const version = String(params.deploymentVersion || '').trim() || 'N/A';
  const versionTag = version === 'N/A' ? '' : `V${version}`;
  const normalizedName = `Sponsor Coin ${versionTag}`.trim();
  const normalizedSymbol = versionTag ? `SPCOIN_${versionTag}` : 'SPCOIN';
  const decimalsRaw = Number(params.deploymentDecimals);
  const decimals =
    Number.isFinite(decimalsRaw) && decimalsRaw >= 0 ? Math.min(255, Math.floor(decimalsRaw)) : 18;

  const contractDir = path.join(
    process.cwd(),
    'public',
    'assets',
    'blockchains',
    String(chainId),
    'contracts',
    addressFolder,
  );
  const contractDirAlreadyExists = await fs
    .access(contractDir)
    .then(() => true)
    .catch(() => false);
  const tokenStatusBefore = await validateTokenStatus(address, requestedChainId);
  await fs.mkdir(contractDir, { recursive: true });

  const sourceLogoRelative = normalizePublicAssetPath(params.deploymentLogoPath);
  const sourceLogoPath = path.join(process.cwd(), 'public', ...sourceLogoRelative.split('/'));
  const logoPathRelative = `public/assets/blockchains/${chainId}/contracts/${addressFolder}/logo.png`;
  const logoPathAbsolute = path.join(contractDir, 'logo.png');
  await fs.copyFile(sourceLogoPath, logoPathAbsolute);

  const date = new Date().toISOString();
  const metadata = {
    name: normalizedName,
    website: 'N/A',
    description: `Sponsor Coin Token, Version ${version} created on ${date}`,
    explorer: 'N/A',
    symbol: normalizedSymbol,
    decimals,
    status: 'active',
    logoURL: logoPathRelative,
    address,
  };
  const metadataPathRelative = `public/assets/blockchains/${chainId}/contracts/${addressFolder}/info.json`;
  const metadataPathAbsolute = path.join(contractDir, 'info.json');
  await fs.writeFile(metadataPathAbsolute, JSON.stringify(metadata, null, 2), 'utf8');

  // If the token folder already exists, treat it as already-registered and skip list updates.
  if (!contractDirAlreadyExists) {
    const networkNameByChainId: Record<number, string> = {
      1: 'ethereum',
      137: 'polygon',
      8453: 'base',
      31337: 'hardhat',
      11155111: 'sepolia',
    };
    const networkName = networkNameByChainId[requestedChainId];
    if (networkName) {
      const tokenListPath = path.join(
        process.cwd(),
        'resources',
        'data',
        'networks',
        networkName,
        'tokenList.json',
      );
      const tokenListExists = await fs
        .access(tokenListPath)
        .then(() => true)
        .catch(() => false);
      if (tokenListExists) {
        const rawTokenList = await fs.readFile(tokenListPath, 'utf8');
        const parsed = JSON.parse(rawTokenList);
        if (Array.isArray(parsed)) {
          const upperAddress = toDiskAddressFolderName(address);
          const filtered = parsed.filter(
            (entry) => String(entry || '').toUpperCase() !== upperAddress,
          );
          const insertIndex = filtered.length > 0 ? 1 : 0;
          filtered.splice(insertIndex, 0, upperAddress);
          await fs.writeFile(tokenListPath, JSON.stringify(filtered, null, 2), 'utf8');
        }
      }
    }
  }

  const tokenStatusAfter = await validateTokenStatus(address, requestedChainId);

  return {
    metadataPathRelative,
    logoPathRelative,
    metadata,
    debug: {
      requestedChainId,
      resolvedChainId: chainId,
      contractDir,
      contractDirAlreadyExists,
      tokenStatusBefore: tokenStatusBefore.tokenStatus,
      tokenStatusAfter: tokenStatusAfter.tokenStatus,
    },
  };
}

async function handlePrepareDeployArtifact(
  deploymentChainId?: number | string,
  deploymentVersion?: string,
  deploymentSourcePath?: string,
) {
  const network = await resolveDeployNetwork(deploymentChainId);
  const compiled = await compileSpCoinContract({
    solcVersion: network.solcVersion,
    optimizerEnabled: network.optimizerEnabled,
    optimizerRuns: network.optimizerRuns,
    deploymentSourcePath,
  });
  return {
    deploymentAbi: compiled.abi,
    deploymentBytecode: compiled.bytecode,
    deploymentConstructorArgs: getSpCoinConstructorArgs(compiled.abi, deploymentVersion),
    deploymentChainId: network.chainId,
    deploymentNetworkName: network.networkName,
    deploymentAssetChainId: resolveSpCoinDeploymentAssetChainId(network.chainId),
    deploymentSourcePath: compiled.deploymentSourcePath,
  };
}

async function handleGenerateAbi(deploymentChainId?: number | string, deploymentSourcePath?: string) {
  const network = await resolveDeployNetwork(deploymentChainId);
  const compiled = await compileSpCoinContract({
    solcVersion: network.solcVersion,
    optimizerEnabled: network.optimizerEnabled,
    optimizerRuns: network.optimizerRuns,
    deploymentSourcePath,
  });
  await fs.writeFile(SPCOIN_ABI_PATH, `${JSON.stringify(compiled.abi, null, 2)}\n`, 'utf8');
  return {
    deploymentAbi: compiled.abi,
    deploymentChainId: network.chainId,
    deploymentNetworkName: network.networkName,
    deploymentAssetChainId: resolveSpCoinDeploymentAssetChainId(network.chainId),
    abiPath: SPCOIN_ABI_PATH,
    deploymentSourcePath: compiled.deploymentSourcePath,
  };
}

const SPCOIN_METADATA_ABI = [
  'function getInflationRate() view returns (uint256)',
  'function owner() view returns (address)',
  'function getVersion() view returns (string)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function creationTime() view returns (uint256)',
  'function getLowerRecipientRate() view returns (uint256)',
  'function getUpperRecipientRate() view returns (uint256)',
  'function getLowerAgentRate() view returns (uint256)',
  'function getUpperAgentRate() view returns (uint256)',
] as const;

async function handleGetSpCoinMetaData(
  deploymentPublicKey: string,
  deploymentChainId?: number | string,
) {
  const network = await resolveDeployNetwork(deploymentChainId);
  const provider = new JsonRpcProvider(network.rpcUrl, network.chainId);
  const contract = new Contract(deploymentPublicKey, SPCOIN_METADATA_ABI, provider);
  const code = await withTimeout(
    provider.getCode(deploymentPublicKey),
    10000,
    `getCode(${deploymentPublicKey})`,
  );
  if (!code || code === '0x') {
    throw new Error(`No deployed contract code found at ${deploymentPublicKey}.`);
  }

  const readOptionalValue = async <T>(reader: string, fallbackValue: T): Promise<T> => {
    const contractReader = (contract as Record<string, (...args: never[]) => Promise<T>>)[reader];
    if (typeof contractReader !== 'function') return fallbackValue;
    try {
      return await withTimeout(contractReader.call(contract), 10000, `${reader}()`);
    } catch (_error) {
      return fallbackValue;
    }
  };

  const normalizeBigInt = (value: unknown) => String(value ?? '0').trim();

  let owner = '';
  let version = '';
  let name = '';
  let symbol = '';
  let decimals = 0;
  let totalSupply = '0';
  let inflationRate = 0;
  let recipientRateRange: [number, number] = [0, 0];
  let agentRateRange: [number, number] = [0, 0];

  const [
    ownerValue,
    versionValue,
    nameValue,
    symbolValue,
    decimalsValue,
    totalSupplyValue,
    inflationRateValue,
    lowerRecipientRateValue,
    upperRecipientRateValue,
    lowerAgentRateValue,
    upperAgentRateValue,
    creationTimeValue,
  ] = await Promise.all([
    readOptionalValue('owner', ''),
    readOptionalValue('getVersion', ''),
    readOptionalValue('name', ''),
    readOptionalValue('symbol', ''),
    readOptionalValue('decimals', 0),
    readOptionalValue('totalSupply', 0),
    readOptionalValue('getInflationRate', 10),
    readOptionalValue('getLowerRecipientRate', 0),
    readOptionalValue('getUpperRecipientRate', 0),
    readOptionalValue('getLowerAgentRate', 0),
    readOptionalValue('getUpperAgentRate', 0),
    readOptionalValue('creationTime', 0),
  ]);
  owner = String(ownerValue ?? '').trim();
  version = String(versionValue ?? '').trim();
  name = String(nameValue ?? '').trim();
  symbol = String(symbolValue ?? '').trim();
  decimals = Number(decimalsValue ?? 0);
  totalSupply = normalizeBigInt(totalSupplyValue);
  inflationRate = Number(inflationRateValue ?? 0);
  recipientRateRange = [Number(lowerRecipientRateValue ?? 0), Number(upperRecipientRateValue ?? 0)];
  agentRateRange = [Number(lowerAgentRateValue ?? 0), Number(upperAgentRateValue ?? 0)];
  const creationDateSeconds = Number(creationTimeValue ?? 0);
  const creationDate =
    Number.isFinite(creationDateSeconds) && creationDateSeconds > 0
      ? new Date(creationDateSeconds * 1000).toISOString()
      : '';

  return {
    owner,
    version,
    name,
    symbol,
    decimals,
    totalSypply: totalSupply,
    inflationRate,
    recipientRateRange,
    agentRateRange,
    creationDate,
  };
}

async function handleRegisterDeployment(params: {
  deploymentName: string;
  deploymentSymbol: string;
  deploymentDecimals: number | string;
  deploymentVersion: string;
  deploymentPublicKey: string;
  deployer?: string;
  deploymentSignerPublicKey?: string;
  deploymentChainId?: number | string;
}) {
  const deploymentPublicKey = String(params.deploymentPublicKey || '').trim();
  if (!/^0[xX][a-fA-F0-9]{40}$/.test(deploymentPublicKey)) {
    throw new Error('Invalid deployment public key.');
  }
  const chainId = Number(params.deploymentChainId || 0);
  const decimalsRaw = Number(params.deploymentDecimals);
  const decimals =
    Number.isFinite(decimalsRaw) && decimalsRaw >= 0 ? Math.min(255, Math.floor(decimalsRaw)) : 18;
  const mapUpsert = await upsertSpCoinDeploymentMap({
    chainId,
    version: String(params.deploymentVersion || '').trim() || '0',
    publicKey: deploymentPublicKey,
    name: String(params.deploymentName || '').trim() || 'Sponsor Coin',
    symbol: String(params.deploymentSymbol || '').trim() || 'SPCOIN',
    decimals,
    deployer: String(params.deployer || params.deploymentSignerPublicKey || '').trim() || undefined,
    signerKey: String(params.deploymentSignerPublicKey || '').trim() || undefined,
  });
  return mapUpsert;
}

function mapNetworkNameByChainId(chainId: number): string {
  switch (Number(chainId)) {
    case 1:
      return 'ethereum';
    case 137:
      return 'polygon';
    case 8453:
      return 'base';
    case 31337:
      return 'hardhat';
    case 11155111:
      return 'sepolia';
    default:
      return `chain-${String(chainId)}`;
  }
}

async function upsertSpCoinDeploymentMap(params: {
  chainId: number;
  version: string;
  publicKey: string;
  name: string;
  symbol: string;
  decimals: number;
  deployer?: string;
  signerKey?: string;
}) {
  const raw = await fs
    .readFile(SPCOIN_DEPLOYMENT_MAP_PATH, 'utf8')
    .catch(() => '{"meta":{"networkIdToName":{}},"chainId":{}}');
  const parsed = JSON.parse(raw || '{}') as SpCoinDeploymentMapFile;
  const out: SpCoinDeploymentMapFile = {
    meta: {
      networkIdToName: { ...(parsed.meta?.networkIdToName ?? {}) },
    },
    chainId: { ...(parsed.chainId ?? {}) },
  };
  const chainIdKey = String(params.chainId);
  const versionKey = String(params.version || '').trim() || '0';
  const publicKeyUpper = toDiskAddressFolderName(params.publicKey);
  const deployerUpper = toDiskAddressFolderName(params.deployer) || undefined;
  const normalizedPrivateKey =
    String(params.signerKey || '').trim().toLowerCase() || undefined;

  out.meta!.networkIdToName![chainIdKey] = mapNetworkNameByChainId(params.chainId);
  out.chainId![chainIdKey] = out.chainId![chainIdKey] ?? {};

  if (normalizedPrivateKey && /^0x[a-f0-9]{64}$/.test(normalizedPrivateKey)) {
    const signerNode =
      (out.chainId![chainIdKey][normalizedPrivateKey] as Record<string, unknown> | undefined) ??
      {};
    out.chainId![chainIdKey][normalizedPrivateKey] = signerNode;
    const versionNode =
      (signerNode[versionKey] as Record<string, unknown> | undefined) ?? {};
    signerNode[versionKey] = versionNode;
    const exists = Object.prototype.hasOwnProperty.call(versionNode, publicKeyUpper);
    if (!exists) {
      versionNode[publicKeyUpper] = {
        ...(deployerUpper ? { deployer: deployerUpper } : {}),
        name: params.name,
        symbol: params.symbol,
        decimals: params.decimals,
      };
      await fs.writeFile(SPCOIN_DEPLOYMENT_MAP_PATH, JSON.stringify(out, null, 2), 'utf8');
    }
    return { added: !exists, chainIdKey, versionKey, publicKeyUpper };
  }

  out.chainId![chainIdKey][versionKey] =
    (out.chainId![chainIdKey][versionKey] as Record<string, unknown> | undefined) ?? {};
  const versionNode = out.chainId![chainIdKey][versionKey] as Record<string, unknown>;
  const exists = Object.prototype.hasOwnProperty.call(versionNode, publicKeyUpper);
  if (!exists) {
    versionNode[publicKeyUpper] = {
      ...(deployerUpper ? { deployer: deployerUpper } : {}),
      name: params.name,
      symbol: params.symbol,
      decimals: params.decimals,
    };
    await fs.writeFile(SPCOIN_DEPLOYMENT_MAP_PATH, JSON.stringify(out, null, 2), 'utf8');
  }
  return { added: !exists, chainIdKey, versionKey, publicKeyUpper };
}

function normalizeDeploymentAddress(value: string) {
  return toDiskAddressFolderName(value);
}

function isDeploymentAddressKey(value: string) {
  return /^0[xX][a-fA-F0-9]{40}$/.test(String(value || '').trim());
}

function pruneDeploymentAddressEntries(
  node: unknown,
  targetAddressUpper: string,
): { nextNode?: unknown; removedCount: number } {
  if (!node || typeof node !== 'object' || Array.isArray(node)) {
    return { nextNode: node, removedCount: 0 };
  }

  const source = node as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  let removedCount = 0;

  for (const [key, value] of Object.entries(source)) {
    if (isDeploymentAddressKey(key)) {
      if (normalizeDeploymentAddress(key) === targetAddressUpper) {
        removedCount += 1;
        continue;
      }
      next[key] = value;
      continue;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const child = pruneDeploymentAddressEntries(value, targetAddressUpper);
      removedCount += child.removedCount;
      if (
        child.nextNode &&
        typeof child.nextNode === 'object' &&
        !Array.isArray(child.nextNode) &&
        Object.keys(child.nextNode as Record<string, unknown>).length > 0
      ) {
        next[key] = child.nextNode;
      }
      continue;
    }

    next[key] = value;
  }

  if (Object.keys(next).length === 0) {
    return { nextNode: undefined, removedCount };
  }

  return { nextNode: next, removedCount };
}

async function removeAddressFromTokenList(networkName: string, targetAddressUpper: string) {
  const tokenListPath = path.join(
    process.cwd(),
    'resources',
    'data',
    'networks',
    networkName,
    'tokenList.json',
  );
  const tokenListExists = await fs
    .access(tokenListPath)
    .then(() => true)
    .catch(() => false);
  if (!tokenListExists) {
    return { tokenListPath, removedCount: 0 };
  }

  const raw = await fs.readFile(tokenListPath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    return { tokenListPath, removedCount: 0 };
  }

  const filtered = parsed.filter(
    (entry) => normalizeDeploymentAddress(String(entry || '')) !== targetAddressUpper,
  );
  const removedCount = parsed.length - filtered.length;
  if (removedCount > 0) {
    await fs.writeFile(tokenListPath, JSON.stringify(filtered, null, 2), 'utf8');
  }
  return { tokenListPath, removedCount };
}

async function removeAddressFromRelevantTokenLists(requestedChainId: number, targetAddressUpper: string) {
  const networksRoot = path.join(process.cwd(), 'resources', 'data', 'networks');
  const knownEntries = await fs.readdir(networksRoot, { withFileTypes: true }).catch(() => []);
  const networkNames = new Set<string>();
  knownEntries
    .filter((entry) => entry.isDirectory())
    .forEach((entry) => {
      networkNames.add(entry.name);
    });

  networkNames.add(mapNetworkNameByChainId(requestedChainId));
  const assetChainId = resolveSpCoinDeploymentAssetChainId(requestedChainId);
  if (Number.isFinite(assetChainId) && assetChainId > 0) {
    networkNames.add(mapNetworkNameByChainId(assetChainId));
  }

  const results = await Promise.all(
    Array.from(networkNames)
      .filter((networkName) => networkName && !networkName.startsWith('chain-'))
      .map((networkName) => removeAddressFromTokenList(networkName, targetAddressUpper)),
  );

  return {
    removedCount: results.reduce((sum, entry) => sum + entry.removedCount, 0),
    tokenListPaths: results.map((entry) => entry.tokenListPath),
    networkNames: Array.from(networkNames).filter((networkName) => !networkName.startsWith('chain-')),
  };
}

async function handleRemoveDeployment(params: {
  deploymentPublicKey: string;
  deploymentChainId?: number | string;
}) {
  const deploymentPublicKey = String(params.deploymentPublicKey || '').trim();
  if (!/^0[xX][a-fA-F0-9]{40}$/.test(deploymentPublicKey)) {
    throw new Error('Invalid deployment public key.');
  }

  const requestedChainIdParsed = Number(params.deploymentChainId);
  const requestedChainId =
    Number.isFinite(requestedChainIdParsed) && requestedChainIdParsed > 0
      ? requestedChainIdParsed
      : 31337;
  const chainIdKey = String(requestedChainId);
  const targetAddressUpper = normalizeDeploymentAddress(deploymentPublicKey);

  const raw = await fs
    .readFile(SPCOIN_DEPLOYMENT_MAP_PATH, 'utf8')
    .catch(() => '{"meta":{"networkIdToName":{}},"chainId":{}}');
  const parsed = JSON.parse(raw || '{}') as SpCoinDeploymentMapFile;
  const nextMap: SpCoinDeploymentMapFile = {
    meta: {
      networkIdToName: { ...(parsed.meta?.networkIdToName ?? {}) },
    },
    chainId: { ...(parsed.chainId ?? {}) },
  };

  const currentChainNode = nextMap.chainId?.[chainIdKey];
  const prunedChainNode = pruneDeploymentAddressEntries(currentChainNode, targetAddressUpper);
  const removedDeploymentEntries = prunedChainNode.removedCount;
  nextMap.chainId![chainIdKey] =
    prunedChainNode.nextNode &&
    typeof prunedChainNode.nextNode === 'object' &&
    !Array.isArray(prunedChainNode.nextNode)
      ? (prunedChainNode.nextNode as Record<string, unknown>)
      : {};
  await fs.writeFile(SPCOIN_DEPLOYMENT_MAP_PATH, JSON.stringify(nextMap, null, 2), 'utf8');

  const assetChainId = resolveSpCoinDeploymentAssetChainId(requestedChainId);
  const networkName = mapNetworkNameByChainId(requestedChainId);
  const tokenListResult = await removeAddressFromRelevantTokenLists(requestedChainId, targetAddressUpper);
  const contractDir = path.join(
    process.cwd(),
    'public',
    'assets',
    'blockchains',
    String(assetChainId),
    'contracts',
    targetAddressUpper,
  );
  const contractDirExisted = await fs
    .access(contractDir)
    .then(() => true)
    .catch(() => false);
  await fs.rm(contractDir, { recursive: true, force: true });

  return {
    chainIdKey,
    requestedChainId,
    networkName,
    assetChainId,
    targetAddressUpper,
    removedDeploymentEntries,
    removedTokenListEntries: tokenListResult.removedCount,
    tokenListPath: tokenListResult.tokenListPaths.join(', '),
    contractDir,
    contractDirExisted,
  };
}

async function validateTokenStatus(
  tokenPublicKey: string,
  deploymentChainIdRaw: number | string | undefined,
): Promise<{
  tokenStatus: 'NOT_FOUND' | 'DEPLOYED' | 'SERVER_INSTALLED';
  contractDirExists: boolean;
  resolvedChainId: number;
}> {
  if (!/^0[xX][a-fA-F0-9]{40}$/.test(tokenPublicKey)) {
    throw new Error('Invalid deployment public key.');
  }
  const requestedChainIdParsed = Number(deploymentChainIdRaw);
  const requestedChainId =
    Number.isFinite(requestedChainIdParsed) && requestedChainIdParsed > 0
      ? requestedChainIdParsed
      : 31337;
  const resolvedChainId = resolveSpCoinDeploymentAssetChainId(requestedChainId);
  const address = String(tokenPublicKey || '').trim();
  const addressFolder = toDiskAddressFolderName(address);
  const contractDir = path.join(
    process.cwd(),
    'public',
    'assets',
    'blockchains',
    String(resolvedChainId),
    'contracts',
    addressFolder,
  );
  const contractDirExists = await fs
    .access(contractDir)
    .then(() => true)
    .catch(() => false);
  if (contractDirExists) {
    return {
      tokenStatus: 'SERVER_INSTALLED',
      contractDirExists: true,
      resolvedChainId,
    };
  }

  try {
    const network = await resolveDeployNetwork(requestedChainId);
    const provider = new JsonRpcProvider(network.rpcUrl, network.chainId);
    const code = await withTimeout(
      provider.getCode(address),
      5000,
      `token status lookup for ${network.networkName} (${network.rpcUrl})`,
    );
    if (code && code !== '0x') {
      return {
        tokenStatus: 'DEPLOYED',
        contractDirExists: false,
        resolvedChainId,
      };
    }
  } catch {
    // If chain RPC is unavailable, we still return deterministic local status.
  }

  return {
    tokenStatus: 'NOT_FOUND',
    contractDirExists: false,
    resolvedChainId,
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

async function checkLocalSpCoinAccessPackage(localPathRaw: string) {
  const normalized = normalizeProjectRelativePath(localPathRaw);
  if (!normalized) {
    return { normalized, exists: false, version: '' };
  }

  const relative = normalized.slice(1);
  if (relative.includes('..')) {
    return { normalized, exists: false, version: '' };
  }

  const packageJsonPath = path.join(
    process.cwd(),
    ...relative.split('/'),
    'packages',
    '@sponsorcoin',
    'spcoin-access-modules',
    'package.json',
  );

  try {
    const parsed = JSON.parse(await fs.readFile(packageJsonPath, 'utf8')) as { version?: string };
    return {
      normalized,
      exists: true,
      version: String(parsed.version || '').trim(),
    };
  } catch {
    return { normalized, exists: false, version: '' };
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const localPathRaw = String(searchParams.get('localPath') || '').trim();
    const deploymentPublicKey = String(searchParams.get('deploymentPublicKey') || '').trim();
    const deploymentChainIdRaw = String(searchParams.get('deploymentChainId') || '').trim();
    const includeMetadata = String(searchParams.get('includeMetadata') || '').trim().toLowerCase() === 'true';
    const includeDeploymentMap =
      String(searchParams.get('includeDeploymentMap') || '').trim().toLowerCase() === 'true';
    const packageName = String(searchParams.get('packageName') || '').trim();
    const requestedVersion = String(searchParams.get('version') || 'latest').trim() || 'latest';
    const packages = await listSponsorcoinPackages();

    if (includeDeploymentMap) {
      const raw = await fs
        .readFile(SPCOIN_DEPLOYMENT_MAP_PATH, 'utf8')
        .catch(() => '{"meta":{"networkIdToName":{}},"chainId":{}}');
      const deploymentMap = JSON.parse(raw || '{}');
      return NextResponse.json({
        ok: true,
        message: 'Deployment map loaded.',
        packages,
        workspaceRoot: WORKSPACE_ROOT,
        deploymentMap,
      });
    }

    if (localPathRaw) {
      const result = await checkLocalDirectoryExists(localPathRaw);
      const localPackage = result.exists
        ? await checkLocalSpCoinAccessPackage(result.normalized)
        : { normalized: result.normalized, exists: false, version: '' };
      return NextResponse.json({
        ok: true,
        message: result.exists
          ? `Local directory exists: ${result.normalized}`
          : `Local directory not found: ${result.normalized}`,
        packages,
        workspaceRoot: WORKSPACE_ROOT,
        localPath: result.normalized,
        localPathExists: result.exists,
        localPackageVersion: localPackage.version,
        localPackageExists: localPackage.exists,
      } satisfies AccessManagerResponse);
    }

    if (deploymentPublicKey || deploymentChainIdRaw) {
      if (!/^0[xX][a-fA-F0-9]{40}$/.test(deploymentPublicKey)) {
        return NextResponse.json(
          {
            ok: false,
            message: 'Invalid deployment public key.',
            packages,
            workspaceRoot: WORKSPACE_ROOT,
            contractDirExists: false,
          } satisfies AccessManagerResponse,
          { status: 400 },
        );
      }
      const status = await validateTokenStatus(deploymentPublicKey, deploymentChainIdRaw);
      let spCoinMetaData: AccessManagerResponse['spCoinMetaData'] | undefined;
      let metadataWarning = '';
      if (includeMetadata) {
        try {
          spCoinMetaData = await handleGetSpCoinMetaData(deploymentPublicKey, deploymentChainIdRaw);
        } catch (error) {
          metadataWarning = String(error instanceof Error ? error.message : error || '').trim();
        }
      }
      return NextResponse.json({
        ok: true,
        message: metadataWarning
          ? `Token status: ${status.tokenStatus}. Metadata unavailable: ${metadataWarning}`
          : `Token status: ${status.tokenStatus}`,
        packages,
        workspaceRoot: WORKSPACE_ROOT,
        contractDirExists: status.contractDirExists,
        resolvedChainId: status.resolvedChainId,
        tokenStatus: status.tokenStatus,
        spCoinMetaData,
      } satisfies AccessManagerResponse);
    }

    let stateFields: Partial<AccessManagerResponse> = {};
    if (packageName) {
      try {
        const state = await getPackageButtonState(packageName, requestedVersion);
        stateFields = {
          packageName,
          version: state.resolvedVersion,
          localVersion: state.localVersion,
          downloadedVersion: state.downloadedVersion,
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
  } catch (error) {
    return unexpectedAccessManagerError(error, { workspaceRoot: WORKSPACE_ROOT });
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as AccessManagerRequest;
  const action =
    body.action === 'upload'
      ? 'upload'
      : body.action === 'install'
      ? 'install'
      : body.action === 'deploy'
      ? 'deploy'
      : body.action === 'updateServer'
      ? 'updateServer'
      : body.action === 'prepareDeploy'
      ? 'prepareDeploy'
      : body.action === 'registerDeployment'
      ? 'registerDeployment'
      : body.action === 'generateAbi'
      ? 'generateAbi'
      : body.action === 'removeDeployment'
      ? 'removeDeployment'
      : 'download';
  const mode = body.mode === 'node_modules' ? 'node_modules' : 'local';
  const requestedVersion = String(body.version || 'latest').trim() || 'latest';
  const packageName = String(body.packageName || '').trim();
  const otp = String(body.otp || '').trim();

  try {
    if (action === 'prepareDeploy') {
      try {
        const result = await handlePrepareDeployArtifact(
          body.deploymentChainId,
          body.deploymentVersion,
          body.deploymentSourcePath,
        );
        return NextResponse.json({
          ok: true,
          action,
          mode,
          deploymentAbi: result.deploymentAbi,
          deploymentBytecode: result.deploymentBytecode,
          deploymentConstructorArgs: result.deploymentConstructorArgs,
          deploymentChainId: result.deploymentChainId,
          deploymentAssetChainId: result.deploymentAssetChainId,
          deploymentNetworkName: result.deploymentNetworkName,
          deploymentSourcePath: result.deploymentSourcePath,
          message: `Prepared deploy artifact for ${String(result.deploymentNetworkName || 'chain')} (${String(result.deploymentChainId || 'unknown')}).`,
        } satisfies AccessManagerResponse);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown deploy artifact preparation failure.';
        return NextResponse.json(
          {
            ok: false,
            action,
            mode,
            message: `*Error: ${message}`,
          } satisfies AccessManagerResponse,
          { status: 500 },
        );
      }
    }

    if (action === 'generateAbi') {
      try {
        const result = await handleGenerateAbi(body.deploymentChainId, body.deploymentSourcePath);
        return NextResponse.json({
          ok: true,
          action,
          mode,
          deploymentAbi: result.deploymentAbi,
          deploymentChainId: result.deploymentChainId,
          deploymentAssetChainId: result.deploymentAssetChainId,
          deploymentNetworkName: result.deploymentNetworkName,
          deploymentSourcePath: result.deploymentSourcePath,
          message: `Generated SPCoin ABI for ${String(result.deploymentNetworkName || 'chain')} (${String(result.deploymentChainId || 'unknown')}) from ${result.deploymentSourcePath} and wrote ${result.abiPath}.`,
        } satisfies AccessManagerResponse);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown ABI generation failure.';
        return NextResponse.json(
          {
            ok: false,
            action,
            mode,
            message: `*Error: ${message}`,
          } satisfies AccessManagerResponse,
          { status: 500 },
        );
      }
    }

    if (action === 'registerDeployment') {
      try {
        const result = await handleRegisterDeployment({
          deploymentName: String(body.deploymentName || '').trim(),
          deploymentSymbol: String(body.deploymentSymbol || '').trim(),
          deploymentDecimals: body.deploymentDecimals ?? '18',
          deploymentVersion: String(body.deploymentVersion || '').trim(),
          deploymentPublicKey: String(body.deploymentPublicKey || '').trim(),
          deployer: String(body.deploymentSignerPublicKey || '').trim(),
          deploymentSignerPublicKey: String(body.deploymentSignerPublicKey || '').trim(),
          deploymentChainId: body.deploymentChainId,
        });
        return NextResponse.json({
          ok: true,
          action,
          mode,
          mapAdded: result.added,
          message: `Deployment map: ${result.added ? 'added' : 'exists'} (${result.chainIdKey}/${result.versionKey}/${result.publicKeyUpper})`,
        } satisfies AccessManagerResponse);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown deployment registration failure.';
        return NextResponse.json(
          {
            ok: false,
            action,
            mode,
            message: `*Error: ${message}`,
          } satisfies AccessManagerResponse,
          { status: 500 },
        );
      }
    }

    if (action === 'removeDeployment') {
      try {
        const result = await handleRemoveDeployment({
          deploymentPublicKey: String(body.deploymentPublicKey || '').trim(),
          deploymentChainId: body.deploymentChainId,
        });
        return NextResponse.json({
          ok: true,
          action,
          mode,
          message: [
            `Removed SponsorCoin app entry for ${result.targetAddressUpper}.`,
            `Deployment map entries removed: ${String(result.removedDeploymentEntries)}`,
            `Token list entries removed: ${String(result.removedTokenListEntries)}`,
            `Token list files: ${result.tokenListPath || '(none)'}`,
            `Asset directory ${result.contractDirExisted ? 'removed' : 'not found'}: ${result.contractDir}`,
          ].join('\n'),
        } satisfies AccessManagerResponse);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown deployment removal failure.';
        return NextResponse.json(
          {
            ok: false,
            action,
            mode,
            message: `*Error: ${message}`,
          } satisfies AccessManagerResponse,
          { status: 500 },
        );
      }
    }

    if (action === 'updateServer') {
      try {
        const result = await handleUpdateServer({
          deploymentName: String(body.deploymentName || '').trim(),
          deploymentSymbol: String(body.deploymentSymbol || '').trim(),
          deploymentVersion: String(body.deploymentVersion || '').trim(),
          deploymentDecimals: body.deploymentDecimals ?? '18',
          deploymentLogoPath: String(body.deploymentLogoPath || '/public/assets/miscellaneous/spCoin.png'),
          deploymentPublicKey: String(body.deploymentPublicKey || '').trim(),
          deploymentChainId: body.deploymentChainId,
        });
        return NextResponse.json({
          ok: true,
          action,
          mode,
          message: [
            `SponsorCoin Meta Data and Image uploader to server at:`,
            result.metadataPathRelative,
            result.logoPathRelative,
            '',
            'Debug:',
            `requestedChainId: ${String((result as any).debug?.requestedChainId ?? 'unknown')}`,
            `resolvedChainId: ${String((result as any).debug?.resolvedChainId ?? 'unknown')}`,
            `contractDirAlreadyExists: ${String((result as any).debug?.contractDirAlreadyExists ?? false)}`,
            `tokenStatusBefore: ${String((result as any).debug?.tokenStatusBefore ?? 'unknown')}`,
            `tokenStatusAfter: ${String((result as any).debug?.tokenStatusAfter ?? 'unknown')}`,
            `contractDir: ${String((result as any).debug?.contractDir ?? '')}`,
            '',
            'MetaData:',
            JSON.stringify(result.metadata, null, 2),
          ].join('\n'),
        } satisfies AccessManagerResponse);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown server update failure.';
        return NextResponse.json(
          {
            ok: false,
            action,
            mode,
            message: `*Error: ${message}`,
          } satisfies AccessManagerResponse,
          { status: 500 },
        );
      }
    }

    if (action === 'deploy') {
      const deploymentName = String(body.deploymentName || '').trim();
      const deploymentVersion = String(body.deploymentVersion || '').trim();
      const deploymentAccountPrivateKey = String(body.deploymentAccountPrivateKey || '').trim();
      const deploymentSymbol = String(body.deploymentSymbol || '').trim() || 'SPCOIN';
      const deploymentDecimalsRaw = Number(body.deploymentDecimals);
      const deploymentDecimals =
        Number.isFinite(deploymentDecimalsRaw) && deploymentDecimalsRaw >= 0
          ? Math.min(255, Math.floor(deploymentDecimalsRaw))
          : 18;
      const deploymentChainId = body.deploymentChainId;
      const normalizedDeploymentSignerKey = (() => {
        const raw = String(deploymentAccountPrivateKey || '').trim();
        if (!raw) return '';
        const normalized = raw.startsWith('0x') ? raw : `0x${raw}`;
        return /^0x[0-9a-fA-F]{64}$/.test(normalized) ? normalized : '';
      })();

      try {
        const result = await handleDeploy(
          deploymentName,
          deploymentVersion,
          deploymentAccountPrivateKey,
          deploymentChainId,
          body.deploymentSourcePath,
        );
        const upsertChainId = Number((result as any).deploymentChainId || 0);
        const upsertMappedChainId = Number(resolveSpCoinDiskChainId(upsertChainId));
        const isMappedHardhatChain = upsertChainId > 0 && upsertMappedChainId !== upsertChainId;
        const mapUpsert = await upsertSpCoinDeploymentMap({
          chainId: upsertChainId,
          version: String(deploymentVersion || '').trim() || '0',
          publicKey: String(result.deploymentPublicKey || '').trim(),
          name: String(deploymentName || '').trim() || 'Sponsor Coin',
          symbol: deploymentSymbol,
          decimals: deploymentDecimals,
          deployer: normalizedDeploymentSignerKey ? new Wallet(normalizedDeploymentSignerKey).address : undefined,
          signerKey: isMappedHardhatChain ? normalizedDeploymentSignerKey || undefined : undefined,
        });
        return NextResponse.json({
          ok: true,
          action,
          mode: 'node_modules',
          deploymentTokenName: result.deploymentTokenName,
          deploymentPublicKey: result.deploymentPublicKey,
          deploymentPrivateKey: result.deploymentPrivateKey,
          deploymentTxHash: (result as any).deploymentTxHash,
          deploymentChainId: (result as any).deploymentChainId,
          deploymentAssetChainId: (result as any).deploymentAssetChainId,
          deploymentNetworkName: (result as any).deploymentNetworkName,
          deploymentSourcePath: (result as any).deploymentSourcePath,
          mapAdded: mapUpsert.added,
          message:
            `Contract "${result.deploymentTokenName}" deployed on ${String((result as any).deploymentNetworkName || 'chain')} (${String((result as any).deploymentChainId || 'unknown')}). Tx: ${String((result as any).deploymentTxHash || '(unknown)')}` +
            `\nDeployment source: ${String((result as any).deploymentSourcePath || '(default)')}` +
            `\nDeployment map: ${mapUpsert.added ? 'added' : 'exists'} (${mapUpsert.chainIdKey}/${mapUpsert.versionKey}/${mapUpsert.publicKeyUpper})`,
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

    if (action === 'download') {
      const result = await handleDownload(packageName, requestedVersion);
      return NextResponse.json({
        ok: true,
        action,
        mode,
        packageName,
        installSourceRoot: `/spCoinAccess/packages/${packageName}`,
        version: result.resolvedVersion,
        localVersion: result.resolvedVersion,
        downloadBlocked: true,
        uploadBlocked: true,
        message: `Success: ${packageName}.${result.resolvedVersion} reverted to NPM version.`,
      } satisfies AccessManagerResponse);
    }

    if (action === 'install') {
      const result = await handleInstall(packageName, requestedVersion);
      return NextResponse.json({
        ok: true,
        action,
        mode: 'node_modules',
        packageName,
        version: result.resolvedVersion,
        message: `Installed ${packageName}@${result.resolvedVersion} into node_modules. ${result.installOutput}`,
      } satisfies AccessManagerResponse);
    }

    const result = await handleUpload(packageName, requestedVersion, otp);
    return NextResponse.json({
      ok: true,
      action,
      mode,
      packageName,
      version: result.resolvedVersion || requestedVersion,
      localVersion: result.resolvedVersion || requestedVersion,
      downloadBlocked: false,
      uploadBlocked: true,
      message: `Published ${packageName}${result.resolvedVersion ? `@${result.resolvedVersion}` : ''} from ${result.workspaceDir}. ${result.publishOutput}`,
    } satisfies AccessManagerResponse);
  } catch (error) {
    return unexpectedAccessManagerError(error, {
      action,
      mode,
      packageName,
      version: requestedVersion,
    });
  }
}
