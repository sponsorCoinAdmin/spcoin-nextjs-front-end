import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import { Wallet } from 'ethers';

const execAsync = promisify(exec);
const LEGACY_WORKSPACE_ROOT = path.join(process.cwd(), 'spCoinNpmSource');
const WORKSPACE_ROOT = path.join(process.cwd(), 'spCoinAccess', 'spCoinNpmSource');
const PACKAGES_ROOT = path.join(WORKSPACE_ROOT, 'packages');
const BACKUPS_ROOT = path.join(WORKSPACE_ROOT, 'backups');
const SPONSORCOIN_SCOPE_DIR = path.join(process.cwd(), 'node_modules', '@sponsorcoin');
const MANAGER_STATE_PATH = path.join(BACKUPS_ROOT, 'manager-state.json');
const NPM_CMD = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const TAR_CMD = process.platform === 'win32' ? 'tar.exe' : 'tar';

type AccessManagerRequest = {
  action?: 'upload' | 'download' | 'deploy';
  mode?: 'local' | 'node_modules';
  version?: string;
  packageName?: string;
  deploymentName?: string;
  deploymentVersion?: string;
  deploymentAccountPrivateKey?: string;
};

type AccessManagerResponse = {
  ok: boolean;
  action?: 'upload' | 'download' | 'deploy';
  mode?: 'local' | 'node_modules';
  version?: string;
  packageName?: string;
  deploymentTokenName?: string;
  deploymentPublicKey?: string;
  deploymentPrivateKey?: string;
  message: string;
  packages?: string[];
  workspaceRoot?: string;
  downloadBlocked?: boolean;
  uploadBlocked?: boolean;
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

async function ensureWorkspace() {
  await fs.mkdir(path.dirname(WORKSPACE_ROOT), { recursive: true });
  const workspaceExists = await fs
    .access(WORKSPACE_ROOT)
    .then(() => true)
    .catch(() => false);
  const legacyExists = await fs
    .access(LEGACY_WORKSPACE_ROOT)
    .then(() => true)
    .catch(() => false);

  if (!workspaceExists && legacyExists) {
    await fs.rename(LEGACY_WORKSPACE_ROOT, WORKSPACE_ROOT);
  }

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
  await ensureWorkspace();
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
  await ensureWorkspace();
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
  await ensureWorkspace();

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

async function handleDownload(packageName: string, requestedVersion: string) {
  assertSponsorcoinPackage(packageName);
  await ensureWorkspace();

  const resolvedVersion = await resolveRequestedVersion(packageName, requestedVersion);
  const archivePath = getArchivePath(packageName, resolvedVersion);
  const archiveExists = await fs
    .access(archivePath)
    .then(() => true)
    .catch(() => false);

  if (archiveExists) {
    throw new Error(`Active download already exists for ${packageName}@${resolvedVersion}.`);
  }

  const spec = `${packageName}@${resolvedVersion}`;
  const packResult = await runCommand(NPM_CMD, ['pack', spec], BACKUPS_ROOT);
  const tarballName =
    packResult.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.endsWith('.tgz')) ?? '';

  if (!tarballName.endsWith('.tgz')) {
    throw new Error(`npm pack did not return a tarball name. Output: ${packResult.stdout || '(empty)'}`);
  }

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

    const managerState = await loadManagerState();
    managerState.packages[packageName] = {
      downloadedVersion:
        String(extractedPackageJson.version || resolvedVersion).trim() || resolvedVersion,
      activeArchive: tarballName,
    };
    await saveManagerState(managerState);

    return {
      tarballName,
      workspaceDir,
      resolvedVersion:
        String(extractedPackageJson.version || resolvedVersion).trim() || resolvedVersion,
    };
  } finally {
    await fs.rm(extractRoot, { recursive: true, force: true });
  }
}

async function handleUpload(packageName: string, requestedVersion: string) {
  assertSponsorcoinPackage(packageName);
  await ensureWorkspace();

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

async function handleDeploy(
  deploymentName: string,
  deploymentVersion: string,
  deploymentAccountPrivateKey: string,
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const packageName = String(searchParams.get('packageName') || '').trim();
  const requestedVersion = String(searchParams.get('version') || 'latest').trim() || 'latest';
  const packages = await listSponsorcoinPackages();

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

    try {
      const result = await handleDeploy(deploymentName, deploymentVersion, deploymentAccountPrivateKey);
      return NextResponse.json({
        ok: true,
        action,
        mode,
        deploymentTokenName: result.deploymentTokenName,
        deploymentPublicKey: result.deploymentPublicKey,
        deploymentPrivateKey: result.deploymentPrivateKey,
        message: `Deployment scaffold prepared for "${result.deploymentTokenName}". Server-side deployment automation is not connected yet.`,
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
        version: result.resolvedVersion,
        downloadBlocked: true,
        uploadBlocked: true,
        message: `Downloaded ${packageName}@${result.resolvedVersion} to ${result.workspaceDir}. Tarball saved in backups as ${result.tarballName}.`,
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
