// File: app/(menu)/(dynamic)/SpCoinAccessController/hooks/useSpCoinAccessController.ts
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { HDNodeWallet } from 'ethers';
import { useSettings } from '@/lib/context/hooks/ExchangeContext/nested/useSettings';
import { useExchangeContext } from '@/lib/context/hooks';
import spCoinDeploymentMapRaw from '@/resources/data/networks/spCoinDeployment.json';
import {
  buildDeploymentNameFromVersion,
  buildDeploymentSymbolFromVersion,
  buildDeploymentTokenName,
  clampDeploymentDecimals,
  DEFAULT_LOCAL_SOURCE_DEPLOYMENT_PATH,
  getDeploymentKeyValidationMessage,
  isVersionFormatValid,
  normalizeProjectRelativePath,
  sanitizeVersionInput,
  SPCOIN_ACCESS_STORAGE_KEY,
  VERSION_FORMAT_ERROR,
  VERSION_FORMAT_REGEX,
} from '../helpers';

type SpCoinDeploymentFile = {
  meta?: {
    networkIdToName?: Record<string, string>;
  };
  chainId?: Record<string, Record<string, unknown>>;
};

type DeploymentMapEntry = {
  version: string;
  publicKey: string;
  privateKey?: string;
  name?: string;
  symbol?: string;
  decimals?: number;
};

const HARDHAT_CHAIN_ID = 31337;
const HARDHAT_DEPLOYMENT_ACCOUNT_COUNT = 20;
const HARDHAT_DEFAULT_MNEMONIC = 'test test test test test test test test test test test junk';

const getHardhatPrivateKeyByIndex = (index: number): string => {
  if (!Number.isInteger(index) || index < 0) return '';
  try {
    return HDNodeWallet.fromPhrase(HARDHAT_DEFAULT_MNEMONIC, undefined, `m/44'/60'/0'/0/${index}`).privateKey;
  } catch {
    return '';
  }
};

const getDeploymentEntriesForChainVersion = (
  deploymentMap: SpCoinDeploymentFile,
  chainIdRaw: string,
  versionRaw: string,
): DeploymentMapEntry[] => {
  const chainIdKey = String(chainIdRaw || '').trim();
  const versionKey = String(versionRaw || '').trim() || '0';
  const chainNode = deploymentMap?.chainId?.[chainIdKey];
  if (!chainNode || typeof chainNode !== 'object') return [];

  const rows: DeploymentMapEntry[] = [];
  const pushVersionNode = (version: string, byAddress: unknown, wrapperPrivateKey?: string) => {
    if (!byAddress || typeof byAddress !== 'object') return;
    for (const [addressKey, addressValue] of Object.entries(byAddress as Record<string, unknown>)) {
      const normalizedAddress = String(addressKey || '').trim();
      if (!/^0[xX][a-fA-F0-9]{40}$/.test(normalizedAddress)) continue;
      const row = (addressValue || {}) as Record<string, unknown>;
      const rowSignerKey = String(row.signerKey || '').trim();
      const rowPrivateKey = String(row.privateKey || '').trim();
      const privateKey =
        rowPrivateKey ||
        wrapperPrivateKey ||
        (/^0x[a-fA-F0-9]{64}$/.test(rowSignerKey) ? rowSignerKey : '') ||
        undefined;
      const decimalsParsed = Number(row.decimals);
      rows.push({
        version,
        publicKey: normalizedAddress,
        privateKey,
        name: String(row.name || '').trim() || undefined,
        symbol: String(row.symbol || '').trim() || undefined,
        decimals: Number.isFinite(decimalsParsed) ? decimalsParsed : undefined,
      });
    }
  };

  for (const [nodeKey, nodeValue] of Object.entries(chainNode)) {
    const trimmedKey = String(nodeKey || '').trim();
    if (!nodeValue || typeof nodeValue !== 'object') continue;
    if (/^0x[a-fA-F0-9]{64}$/.test(trimmedKey)) {
      for (const [nestedVersion, byAddress] of Object.entries(nodeValue as Record<string, unknown>)) {
        if (nestedVersion !== versionKey) continue;
        pushVersionNode(nestedVersion, byAddress, trimmedKey);
      }
      continue;
    }
    if (trimmedKey !== versionKey) continue;
    pushVersionNode(trimmedKey, nodeValue);
  }

  return rows;
};

type ManagerResponse = {
  ok: boolean;
  message?: string;
  packages?: string[];
  installSourceRoot?: string;
  version?: string;
  localVersion?: string;
  downloadBlocked?: boolean;
  uploadBlocked?: boolean;
  deploymentPublicKey?: string;
  localPathExists?: boolean;
  contractDirExists?: boolean;
  tokenStatus?: 'NOT_FOUND' | 'DEPLOYED' | 'SERVER_INSTALLED';
};

const sanitizeNpmOtpInput = (value: string) => value.replace(/\D/g, '').slice(0, 6);

type SpCoinAccessStorage = {
  useLocalPackage: boolean;
  selectedPackage: string;
  selectedVersion: string;
  localInstallSourceRoot: string;
  deploymentName: string;
  deploymentSymbol?: string;
  deploymentDecimals?: string;
  deploymentVersion: string;
  hardhatDeploymentAccountNumber?: number;
  deploymentAccountPrivateKey: string;
  deploymentPublicKey: string;
  deploymentMode: 'mocked' | 'blockcain';
  localSourceDeploymentPath: string;
};

export function useSpCoinAccessController() {
  const router = useRouter();
  const [settings, setSettings] = useSettings();
  const { exchangeContext } = useExchangeContext();
  const hasHydratedStorageRef = useRef(false);
  const [chromeHeight, setChromeHeight] = useState(72);
  const managerSettings = settings.spCoinAccessManager ?? {
    useLocalPackage: true,
    selectedVersion: '0.0.1',
    selectedPackage: '@sponsorcoin/spcoin-access-modules',
  };
  const [versionInput, setVersionInput] = useState(managerSettings.selectedVersion || '0.0.1');
  const [status, setStatus] = useState<string>(
    'Select a SponsorCoin package and version before running download or upload.',
  );
  const [availablePackages, setAvailablePackages] = useState<string[]>([]);
  const [selectedPackage, setSelectedPackage] = useState(
    managerSettings.selectedPackage || '@sponsorcoin/spcoin-access-modules',
  );
  const [deploymentStatus, setDeploymentStatus] = useState(
    'Enter your private spCoin deployment values, then use Deploy once the server-side contract automation is connected.',
  );
  const [deploymentName, setDeploymentName] = useState('Sponsor Coin');
  const [deploymentSymbol, setDeploymentSymbol] = useState('SPCOIN');
  const [deploymentDecimals, setDeploymentDecimals] = useState('18');
  const [deploymentVersion, setDeploymentVersion] = useState('0.0.1');
  const [hardhatDeploymentAccountNumber, setHardhatDeploymentAccountNumber] = useState(0);
  const [deploymentAccountPrivateKey, setDeploymentAccountPrivateKey] = useState('');
  const [deploymentMode, setDeploymentMode] = useState<'mocked' | 'blockcain'>('mocked');
  const [localSourceDeploymentPath, setLocalSourceDeploymentPath] = useState(DEFAULT_LOCAL_SOURCE_DEPLOYMENT_PATH);
  const [deploymentPublicKey, setDeploymentPublicKey] = useState('');
  const [deploymentLogoPath, setDeploymentLogoPath] = useState('/public/assets/miscellaneous/spCoin.png');
  const [localInstallSourceRoot, setLocalInstallSourceRoot] = useState('/spCoinAccess');
  const [localInstallSourceRootError, setLocalInstallSourceRootError] = useState('');
  const [npmOtp, setNpmOtp] = useState('');
  const [downloadBlocked, setDownloadBlocked] = useState(false);
  const [uploadBlocked, setUploadBlocked] = useState(true);
  const [resolvedNpmVersion, setResolvedNpmVersion] = useState(managerSettings.selectedVersion || '0.0.1');
  const [localPackageVersion, setLocalPackageVersion] = useState(managerSettings.selectedVersion || '0.0.1');
  const [flashTarget, setFlashTarget] = useState<'download' | 'upload' | null>(null);
  const [deploymentFlashError, setDeploymentFlashError] = useState(false);
  const [deploymentStatusIsError, setDeploymentStatusIsError] = useState(false);
  const [activeAction, setActiveAction] = useState<'download' | 'upload' | 'install' | null>(null);
  const [deploymentContractDirExists, setDeploymentContractDirExists] = useState(false);
  const [deploymentTokenStatus, setDeploymentTokenStatus] = useState<
    'NOT_FOUND' | 'DEPLOYED' | 'SERVER_INSTALLED'
  >('NOT_FOUND');
  const [deployUiState, setDeployUiState] = useState<'idle' | 'in_progress' | 'deployed'>('idle');
  const refreshDeploymentTokenStatus = async () => {
    const key = String(deploymentPublicKey || '').trim();
    const chainId = Number((exchangeContext as any)?.network?.chainId || 0);
    if (deploymentMode !== 'blockcain' || !/^0[xX][a-fA-F0-9]{40}$/.test(key)) {
      setDeploymentContractDirExists(false);
      setDeploymentTokenStatus('NOT_FOUND');
      return;
    }
    try {
      const params = new URLSearchParams({
        deploymentPublicKey: key,
        deploymentChainId: String(chainId || 0),
      });
      const response = await fetch(`/api/spCoin/access-manager?${params.toString()}`, { method: 'GET' });
      const data = (await response.json()) as ManagerResponse;
      const status =
        response.ok && data.ok && data.tokenStatus ? data.tokenStatus : 'NOT_FOUND';
      setDeploymentTokenStatus(status);
      setDeploymentContractDirExists(status === 'SERVER_INSTALLED');
    } catch {
      setDeploymentContractDirExists(false);
      setDeploymentTokenStatus('NOT_FOUND');
    }
  };

  const cardClass =
    'rounded-2xl border border-[#2B3A67] bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.25)]';
  const validateLocalInstallSourceRoot = (value: string) => {
    const normalized = normalizeProjectRelativePath(value, '');
    const isValid = normalized.startsWith('/spCoinAccess');
    setLocalInstallSourceRootError(isValid ? '' : 'Path Not found');
    return isValid;
  };
  const deploymentTokenName = buildDeploymentTokenName(deploymentName);
  const deploymentVersionPrefix = deploymentTokenName;
  const rawDeploymentChainId = Number((exchangeContext as any)?.network?.chainId);
  const deploymentChainName =
    rawDeploymentChainId === 31337 ? 'HardHat BASE' : String((exchangeContext as any)?.network?.name || 'Unknown');
  const deploymentChainId =
    Number.isFinite(rawDeploymentChainId) && rawDeploymentChainId > 0
      ? String(rawDeploymentChainId)
      : 'Unknown';
  const deploymentKeyRequiredMessage = 'Account Private Key for Deployment Required';
  const hardhatDeploymentAccountOptions = useMemo(
    () =>
      Array.from({ length: HARDHAT_DEPLOYMENT_ACCOUNT_COUNT }, (_, accountNumber) => ({
        accountNumber,
        privateKey: getHardhatPrivateKeyByIndex(accountNumber),
      })),
    [],
  );
  const canIncrementHardhatDeploymentAccountNumber =
    hardhatDeploymentAccountNumber < HARDHAT_DEPLOYMENT_ACCOUNT_COUNT - 1;
  const canDecrementHardhatDeploymentAccountNumber = hardhatDeploymentAccountNumber > 0;
  const deploymentMapEntries = useMemo(() => {
    const parsed = spCoinDeploymentMapRaw as SpCoinDeploymentFile;
    return getDeploymentEntriesForChainVersion(parsed, deploymentChainId, deploymentVersion);
  }, [deploymentChainId, deploymentVersion]);
  const selectedHardhatDeploymentAccount = useMemo(
    () =>
      hardhatDeploymentAccountOptions.find(
        (entry) => entry.accountNumber === hardhatDeploymentAccountNumber,
      ) ?? hardhatDeploymentAccountOptions[0],
    [hardhatDeploymentAccountNumber, hardhatDeploymentAccountOptions],
  );
  const existsInSpCoinDeploymentMap = useMemo(() => {
    const parsed = spCoinDeploymentMapRaw as SpCoinDeploymentFile;
    const chainIdKey = String(deploymentChainId || '').trim();
    const versionKey = String(deploymentVersion || '').trim() || '0';
    const publicKeyUpper = String(deploymentPublicKey || '').trim().toUpperCase();
    const signerKeyRaw = String(deploymentAccountPrivateKey || '').trim();
    const signerKeyLower = signerKeyRaw.toLowerCase();
    if (!/^[0][xX][a-fA-F0-9]{40}$/.test(publicKeyUpper)) return false;
    if (!/^0x[a-fA-F0-9]{64}$/.test(signerKeyLower)) return false;
    const chainNode = parsed?.chainId?.[chainIdKey];
    if (!chainNode || typeof chainNode !== 'object') return false;
    const signerNodeEntry = Object.entries(chainNode).find(
      ([nodeKey]) => String(nodeKey || '').trim().toLowerCase() === signerKeyLower,
    );
    if (!signerNodeEntry) return false;
    const signerNode = signerNodeEntry[1];
    if (!signerNode || typeof signerNode !== 'object') return false;
    const versionNode = (signerNode as Record<string, unknown>)[versionKey];
    if (!versionNode || typeof versionNode !== 'object') return false;
    return Object.keys(versionNode as Record<string, unknown>).some(
      (nodePublicKey) => String(nodePublicKey || '').trim().toUpperCase() === publicKeyUpper,
    );
  }, [deploymentAccountPrivateKey, deploymentChainId, deploymentPublicKey, deploymentVersion]);
  const deployDisableReason = useMemo(() => {
    if (deployUiState === 'in_progress') return 'DEPLOYMENT_IN_PROGRESS';
    if (deployUiState === 'deployed') return 'DEPLOYED';
    if (deploymentMode === 'blockcain' && existsInSpCoinDeploymentMap) return 'DEPLOYED_IN_MAP';
    return 'ENABLED';
  }, [deployUiState, deploymentMode, existsInSpCoinDeploymentMap]);
  const deployButtonLabel =
    deployUiState === 'in_progress'
      ? 'Deployment In Progress'
      : deployUiState === 'deployed' || (deploymentMode === 'blockcain' && existsInSpCoinDeploymentMap)
      ? 'Deployed'
      : 'Deploy';
  const isDeployedState =
    deployUiState === 'deployed' || (deploymentMode === 'blockcain' && existsInSpCoinDeploymentMap);
  const deploymentPublicKeyDisplay = isDeployedState ? deploymentPublicKey : '';
  const deploymentGuidanceMessage = useMemo(() => {
    const publicKey = String(deploymentPublicKey || '').trim() || '(pending)';
    const deployLine =
      deployDisableReason === 'ENABLED'
        ? 'Deploy: ENABLED'
        : `Deploy: DISABLED (${deployDisableReason})`;
    const updateServerLine = 'Update Server: AUTO (runs after successful deploy)';
    if (deploymentMode === 'mocked') {
      return [
        'Status: READY',
        `Mocked Deployment: "${deploymentTokenName}" is ready for deployment.`,
        `Contract Public Key: ${publicKey}`,
        `Contract Name: ${deploymentTokenName}`,
        `Network: ${deploymentChainName} (${deploymentChainId})`,
        `Token Status: ${deploymentTokenStatus}`,
        `Deployment Map Match: ${existsInSpCoinDeploymentMap ? 'YES' : 'NO'}`,
        deployLine,
        updateServerLine,
        '',
        'Set toggle radio button to Blockchain for real deployment execution',
      ].join('\n');
    }
    return [
      'Status: READY',
      `Blockchain Deployment: "${deploymentTokenName}" is ready for deployment.`,
      `Contract Public Key: ${publicKey}`,
      `Contract Name: ${deploymentTokenName}`,
      `Network: ${deploymentChainName} (${deploymentChainId})`,
      `Token Status: ${deploymentTokenStatus}`,
      `Deployment Map Match: ${existsInSpCoinDeploymentMap ? 'YES' : 'NO'}`,
      deployLine,
      updateServerLine,
      '',
      'Press Deploy to execute blockchain deployment',
    ].join('\n');
  }, [
    deploymentChainId,
    deploymentChainName,
    deploymentMode,
    deploymentPublicKey,
    deploymentPublicKeyDisplay,
    deploymentTokenStatus,
    deploymentTokenName,
    deployDisableReason,
    existsInSpCoinDeploymentMap,
  ]);
  const deploymentPathDisplayValue =
    deploymentMode === 'mocked' ? 'Mocking Deployment' : localSourceDeploymentPath;
  const selectedVersion = useMemo(() => {
    const trimmed = versionInput.trim();
    if (!trimmed) return managerSettings.selectedVersion || '0.0.1';
    return isVersionFormatValid(trimmed) ? trimmed : managerSettings.selectedVersion || '0.0.1';
  }, [managerSettings.selectedVersion, versionInput]);

  const adjustDeploymentDecimals = (direction: 1 | -1) => {
    const current = Number.parseInt(String(deploymentDecimals || '18'), 10);
    const safeCurrent = Number.isFinite(current) ? current : 18;
    setDeploymentDecimals(String(clampDeploymentDecimals(safeCurrent + direction)));
  };
  const handleDeploymentDecimalsInputChange = (nextValue: string) => {
    const digitsOnly = String(nextValue || '').replace(/[^0-9]/g, '').slice(0, 3);
    if (!digitsOnly) return setDeploymentDecimals('0');
    const parsed = Number.parseInt(digitsOnly, 10);
    setDeploymentDecimals(String(clampDeploymentDecimals(Number.isFinite(parsed) ? parsed : 0)));
  };

  const handleDeploy = async () => {
    if (deployDisableReason !== 'ENABLED') return;
    const normalizedName = deploymentName.trim() || buildDeploymentNameFromVersion(deploymentVersion);
    const normalizedVersion = deploymentVersion.trim();
    const normalizedSymbol = deploymentSymbol.trim() || buildDeploymentSymbolFromVersion(deploymentVersion);
    const normalizedDecimals = clampDeploymentDecimals(Number.parseInt(String(deploymentDecimals || '18'), 10) || 18);
    const deploymentContractName = buildDeploymentTokenName(normalizedName);
    const normalizedPrivateKey = deploymentAccountPrivateKey.trim();
    const isValidPrivateKey = /^(0x)?[0-9a-fA-F]{64}$/.test(normalizedPrivateKey);

    if (!isValidPrivateKey) {
      setDeploymentStatus(normalizedPrivateKey ? '*Error: Invalid Account Private Key' : '*Error: Account Private Key is required for Deployment.');
      setDeploymentStatusIsError(true);
      setDeploymentFlashError(true);
      setDeployUiState('idle');
      return;
    }

    setDeployUiState('in_progress');
    setDeploymentStatusIsError(false);
    setDeploymentFlashError(false);
    setDeploymentStatus('Deployment in progress');
    try {
      const response = await fetch('/api/spCoin/access-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deploy',
          deploymentName: normalizedName,
          deploymentSymbol: normalizedSymbol,
          deploymentDecimals: normalizedDecimals,
          deploymentVersion: normalizedVersion,
          deploymentAccountPrivateKey: normalizedPrivateKey,
          hardhatDeploymentAccountNumber,
          deploymentMode,
          deploymentChainId: Number((exchangeContext as any)?.network?.chainId || 0),
        }),
      });
      const data = (await response.json()) as ManagerResponse;
      if (!response.ok || !data.ok) {
        setDeploymentStatus(`*Error: Status ${response.status}: ${data.message || 'Deployment request failed.'}`);
        setDeploymentStatusIsError(true);
        setDeploymentFlashError(true);
        setDeployUiState('idle');
        return;
      }
      const contractPublicKey = String(data.deploymentPublicKey || '');
      const statusMessage =
        data.message ||
        `Deployment scaffold prepared for "${deploymentContractName}". Server-side deployment automation is not connected yet.`;
      setDeploymentPublicKey(contractPublicKey);
      if (deploymentMode === 'mocked') {
        setDeploymentStatus(
          [
            `Status: ${response.status}`,
            `Deployment: ${statusMessage}`,
            `Contract Public Key: ${contractPublicKey || '(not returned)'}`,
            `Contract Name: ${deploymentContractName}`,
            `Network: ${deploymentChainName}`,
            '',
            'Mocked mode: server update skipped.',
          ].join('\n'),
        );
        setDeployUiState('idle');
        return;
      }
      setDeploymentStatus('Deployment complete. Updating server assets...');
      const updateResponse = await fetch('/api/spCoin/access-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateServer',
          deploymentName: normalizedName,
          deploymentVersion: normalizedVersion,
          deploymentSymbol: normalizedSymbol,
          deploymentDecimals: normalizedDecimals,
          deploymentLogoPath,
          deploymentPublicKey: contractPublicKey,
          hardhatDeploymentAccountNumber,
          deploymentMode,
          deploymentChainId: Number((exchangeContext as any)?.network?.chainId || 0),
        }),
      });
      const updateData = (await updateResponse.json()) as ManagerResponse;
      if (!updateResponse.ok || !updateData.ok) {
        setDeploymentStatus(`*Error: Deploy succeeded, but update server failed: ${updateData.message || 'Unknown update failure.'}`);
        setDeploymentStatusIsError(true);
        setDeploymentFlashError(true);
        setDeployUiState('idle');
        return;
      }
      setDeploymentStatus(
        [
          `Status: ${response.status}`,
          `Deployment: ${statusMessage}`,
          '',
          String(updateData.message || 'Server update completed.'),
          '',
          `Contract Public Key: ${contractPublicKey || '(not returned)'}`,
          `Contract Name: ${deploymentContractName}`,
          `Network: ${deploymentChainName}`,
        ].join('\n'),
      );
      await refreshDeploymentTokenStatus();
      setDeployUiState('deployed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown deployment request failure';
      setDeploymentStatus(`*Error: ${message}`);
      setDeploymentStatusIsError(true);
      setDeploymentFlashError(true);
      setDeployUiState('idle');
    }
  };

  const adjustDeploymentVersion = (direction: 1 | -1) => {
    const sanitized = sanitizeVersionInput(deploymentVersion).replace(/^\.+|\.+$/g, '');
    const segments = sanitized
      .split('.')
      .filter(Boolean)
      .map((segment) => Number.parseInt(segment, 10))
      .filter((segment) => Number.isFinite(segment) && segment >= 0);
    const nextSegments = segments.length > 0 ? [...segments] : [0, 0, 0];
    const lastIndex = nextSegments.length - 1;
    nextSegments[lastIndex] = Math.max(0, (nextSegments[lastIndex] ?? 0) + direction);
    setDeploymentStatusIsError(false);
    setDeploymentVersion(nextSegments.join('.'));
  };

  const handleDeploymentVersionInputChange = (nextValue: string) => {
    const trimmed = String(nextValue || '').trim();
    if (!trimmed) {
      setDeploymentStatusIsError(false);
      setDeploymentVersion('');
      return;
    }
    if (!VERSION_FORMAT_REGEX.test(trimmed)) {
      setDeploymentStatus(VERSION_FORMAT_ERROR);
      setDeploymentStatusIsError(true);
      return;
    }
    setDeploymentStatusIsError(false);
    setDeploymentVersion(trimmed);
  };

  const persistManagerSettings = (next: { useLocalPackage: boolean; selectedVersion: string; selectedPackage: string }) => {
    setSettings((prev) => ({ ...prev, spCoinAccessManager: next }));
  };
  const adjustVersion = (direction: 1 | -1) => {
    const sanitized = sanitizeVersionInput(versionInput).replace(/^\.+|\.+$/g, '');
    const segments = sanitized
      .split('.')
      .filter(Boolean)
      .map((segment) => Number.parseInt(segment, 10))
      .filter((segment) => Number.isFinite(segment) && segment >= 0);
    const nextSegments = segments.length > 0 ? [...segments] : [0, 0, 0];
    const lastIndex = nextSegments.length - 1;
    nextSegments[lastIndex] = Math.max(0, (nextSegments[lastIndex] ?? 0) + direction);
    const nextVersion = nextSegments.join('.');
    setVersionInput(nextVersion);
    persistManagerSettings({ useLocalPackage: managerSettings.useLocalPackage, selectedVersion: nextVersion, selectedPackage });
    setStatus(`Version set to ${nextVersion}`);
  };

  const applyResolvedVersion = (nextVersion: string) => {
    const normalized = String(nextVersion || '').trim();
    if (!normalized) return;
    setVersionInput(normalized);
    persistManagerSettings({ useLocalPackage: managerSettings.useLocalPackage, selectedVersion: normalized, selectedPackage });
  };

  useEffect(() => {
    const measure = () => {
      const header = document.querySelector('header');
      const footer = document.querySelector('footer');
      const headerHeight = header instanceof HTMLElement ? header.offsetHeight : 72;
      const footerHeight = footer instanceof HTMLElement ? footer.offsetHeight : 0;
      setChromeHeight(Math.max(72, headerHeight + footerHeight));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    validateLocalInstallSourceRoot(localInstallSourceRoot);
  }, []);
  useEffect(() => {
    const fallbackName = buildDeploymentNameFromVersion(deploymentVersion);
    const fallbackSymbol = buildDeploymentSymbolFromVersion(deploymentVersion);
    const fallbackDecimals = '18';
    const isHardhatChain = Number(deploymentChainId) === HARDHAT_CHAIN_ID;
    const activeEntry = (() => {
      if (deploymentMapEntries.length === 0) return undefined;
      const selectedPrivateKeyLower = String(selectedHardhatDeploymentAccount?.privateKey || '').trim().toLowerCase();
      if (isHardhatChain && selectedPrivateKeyLower) {
        const byPrivateKey = deploymentMapEntries.find(
          (entry) => String(entry.privateKey || '').trim().toLowerCase() === selectedPrivateKeyLower,
        );
        if (byPrivateKey) return byPrivateKey;
        return undefined;
      }
      const currentPublicKeyUpper = String(deploymentPublicKey || '').trim().toUpperCase();
      const byPublicKey = deploymentMapEntries.find(
        (entry) => String(entry.publicKey || '').trim().toUpperCase() === currentPublicKeyUpper,
      );
      if (byPublicKey) return byPublicKey;
      return deploymentMapEntries[0];
    })();

    const nextName = String(activeEntry?.name || '').trim() || fallbackName;
    const nextSymbol = String(activeEntry?.symbol || '').trim() || fallbackSymbol;
    const nextDecimals =
      Number.isFinite(activeEntry?.decimals) && Number(activeEntry?.decimals) >= 0
        ? String(activeEntry?.decimals)
        : fallbackDecimals;
    const nextPublicKey = String(activeEntry?.publicKey || '').trim();
    const nextPrivateKey = String(activeEntry?.privateKey || '').trim();
    const fallbackHardhatKey = String(selectedHardhatDeploymentAccount?.privateKey || '').trim();
    const resolvedPrivateKey = isHardhatChain ? nextPrivateKey || fallbackHardhatKey : nextPrivateKey;

    if (deploymentName !== nextName) setDeploymentName(nextName);
    if (deploymentSymbol !== nextSymbol) setDeploymentSymbol(nextSymbol);
    if (deploymentDecimals !== nextDecimals) setDeploymentDecimals(nextDecimals);
    if (nextPublicKey && deploymentPublicKey !== nextPublicKey) setDeploymentPublicKey(nextPublicKey);
    if (resolvedPrivateKey && deploymentAccountPrivateKey !== resolvedPrivateKey) {
      setDeploymentAccountPrivateKey(resolvedPrivateKey);
    }
  }, [
    deploymentAccountPrivateKey,
    deploymentChainId,
    deploymentDecimals,
    deploymentMapEntries,
    deploymentName,
    deploymentPublicKey,
    deploymentSymbol,
    deploymentVersion,
    hardhatDeploymentAccountNumber,
    hardhatDeploymentAccountOptions,
    selectedHardhatDeploymentAccount,
  ]);
  useEffect(() => {
    setDeployUiState('idle');
  }, [deploymentMode, deploymentVersion, hardhatDeploymentAccountNumber]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(SPCOIN_ACCESS_STORAGE_KEY);
      if (!raw) {
        hasHydratedStorageRef.current = true;
        return;
      }
      const persisted = JSON.parse(raw) as Partial<SpCoinAccessStorage>;
      const nextSelectedPackage = persisted.selectedPackage || managerSettings.selectedPackage || selectedPackage;
      const hydratedVersion = persisted.selectedVersion === 'latest' ? '0.0.1' : persisted.selectedVersion;
      const nextSelectedVersion = hydratedVersion || managerSettings.selectedVersion || selectedVersion;
      persistManagerSettings({ useLocalPackage: true, selectedPackage: nextSelectedPackage, selectedVersion: nextSelectedVersion });
      setSelectedPackage(nextSelectedPackage);
      setVersionInput(nextSelectedVersion);
      setLocalInstallSourceRoot(persisted.localInstallSourceRoot || '/spCoinAccess');
      setDeploymentDecimals(persisted.deploymentDecimals || '18');
      setDeploymentVersion(persisted.deploymentVersion || '0.0.1');
      setHardhatDeploymentAccountNumber(
        Number.isInteger(persisted.hardhatDeploymentAccountNumber) &&
          Number(persisted.hardhatDeploymentAccountNumber) >= 0 &&
          Number(persisted.hardhatDeploymentAccountNumber) < HARDHAT_DEPLOYMENT_ACCOUNT_COUNT
          ? Number(persisted.hardhatDeploymentAccountNumber)
          : 0,
      );
      setDeploymentAccountPrivateKey(persisted.deploymentAccountPrivateKey || '');
      setDeploymentPublicKey(persisted.deploymentPublicKey || '');
      setDeploymentMode(persisted.deploymentMode || 'mocked');
      setLocalSourceDeploymentPath(persisted.localSourceDeploymentPath || DEFAULT_LOCAL_SOURCE_DEPLOYMENT_PATH);
    } finally {
      hasHydratedStorageRef.current = true;
    }
  }, []);

  useEffect(() => {
    let active = true;
    const loadPackages = async () => {
      try {
        const response = await fetch('/api/spCoin/access-manager', { method: 'GET' });
        const data = (await response.json()) as ManagerResponse;
        const packages = Array.isArray(data.packages) ? data.packages : [];
        if (!active) return;
        setAvailablePackages(packages);
        if (packages.length === 0) return setStatus('No @sponsorcoin packages were found in node_modules.');
        const nextSelected = packages.includes(selectedPackage) ? selectedPackage : packages[0];
        setSelectedPackage(nextSelected);
        persistManagerSettings({ useLocalPackage: managerSettings.useLocalPackage, selectedVersion, selectedPackage: nextSelected });
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Unknown package discovery failure';
        setStatus(`Failed to load package list: ${message}`);
      }
    };
    void loadPackages();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const refreshState = async () => {
      if (!selectedPackage) return;
      try {
        const params = new URLSearchParams({ packageName: selectedPackage, version: selectedVersion });
        const response = await fetch(`/api/spCoin/access-manager?${params.toString()}`, { method: 'GET' });
        const data = (await response.json()) as ManagerResponse;
        if (!active) return;
        if (data.version) setResolvedNpmVersion(String(data.version).trim());
        if (typeof data.localVersion === 'string') setLocalPackageVersion(String(data.localVersion).trim());
        setDownloadBlocked(Boolean(data.downloadBlocked));
        setUploadBlocked(Boolean(data.uploadBlocked));
      } catch {
        if (!active) return;
        setDownloadBlocked(false);
        setUploadBlocked(true);
      }
    };
    void refreshState();
    return () => {
      active = false;
    };
  }, [selectedPackage, selectedVersion]);

  useEffect(() => {
    if (!flashTarget) return;
    const timeoutId = window.setTimeout(() => setFlashTarget(null), 450);
    return () => window.clearTimeout(timeoutId);
  }, [flashTarget]);

  useEffect(() => {
    const keyValidationMessage = getDeploymentKeyValidationMessage(deploymentAccountPrivateKey);
    if (keyValidationMessage) {
      setDeploymentStatusIsError(true);
      setDeploymentFlashError(true);
      setDeploymentStatus(keyValidationMessage);
      return;
    }
    setDeploymentStatusIsError(false);
    setDeploymentFlashError(false);
    setDeploymentStatus(deploymentGuidanceMessage);
  }, [deploymentGuidanceMessage]);

  useEffect(() => {
    let active = true;
    const checkDeploymentContractDir = async () => {
      const key = String(deploymentPublicKey || '').trim();
      const chainId = Number((exchangeContext as any)?.network?.chainId || 0);
      if (deploymentMode !== 'blockcain' || !/^0[xX][a-fA-F0-9]{40}$/.test(key)) {
        if (active) {
          setDeploymentContractDirExists(false);
          setDeploymentTokenStatus('NOT_FOUND');
        }
        return;
      }
      try {
        const params = new URLSearchParams({
          deploymentPublicKey: key,
          deploymentChainId: String(chainId || 0),
        });
        const response = await fetch(`/api/spCoin/access-manager?${params.toString()}`, { method: 'GET' });
        const data = (await response.json()) as ManagerResponse;
        if (!active) return;
        const status =
          response.ok && data.ok && data.tokenStatus ? data.tokenStatus : 'NOT_FOUND';
        setDeploymentTokenStatus(status);
        setDeploymentContractDirExists(status === 'SERVER_INSTALLED');
      } catch {
        if (!active) return;
        setDeploymentContractDirExists(false);
        setDeploymentTokenStatus('NOT_FOUND');
      }
    };
    void checkDeploymentContractDir();
    return () => {
      active = false;
    };
  }, [deploymentMode, deploymentPublicKey, rawDeploymentChainId]);

  useEffect(() => {
    if (!hasHydratedStorageRef.current || typeof window === 'undefined') return;
    const persisted: SpCoinAccessStorage = {
      useLocalPackage: true,
      selectedPackage,
      selectedVersion,
      localInstallSourceRoot,
      deploymentName,
      deploymentSymbol,
      deploymentDecimals,
      deploymentVersion,
      hardhatDeploymentAccountNumber,
      deploymentAccountPrivateKey,
      deploymentPublicKey,
      deploymentMode,
      localSourceDeploymentPath,
    };
    window.localStorage.setItem(SPCOIN_ACCESS_STORAGE_KEY, JSON.stringify(persisted));
  }, [
    deploymentAccountPrivateKey,
    deploymentMode,
    deploymentName,
    deploymentSymbol,
    deploymentDecimals,
    deploymentPublicKey,
    localSourceDeploymentPath,
    deploymentVersion,
    hardhatDeploymentAccountNumber,
    localInstallSourceRoot,
    selectedPackage,
    selectedVersion,
  ]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (validateLocalInstallSourceRoot(localInstallSourceRoot)) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [localInstallSourceRoot]);

  const handleCloseAttempt = () => {
    if (!validateLocalInstallSourceRoot(localInstallSourceRoot)) return window.alert('Path Not found');
    router.back();
  };

  const handleVersionPersist = () => {
    const trimmed = versionInput.trim();
    if (!isVersionFormatValid(trimmed)) return setStatus(VERSION_FORMAT_ERROR);
    setVersionInput(trimmed);
    persistManagerSettings({ useLocalPackage: managerSettings.useLocalPackage, selectedVersion: trimmed, selectedPackage });
    setStatus(`Version set to ${trimmed}`);
  };

  const handleVersionInputChange = (nextValue: string) => {
    const sanitized = sanitizeVersionInput(nextValue);
    setVersionInput(sanitized);
    const trimmed = sanitized.trim();
    if (!isVersionFormatValid(trimmed)) return setStatus(VERSION_FORMAT_ERROR);
    persistManagerSettings({ useLocalPackage: managerSettings.useLocalPackage, selectedVersion: trimmed, selectedPackage });
    setStatus(`Version set to ${trimmed}`);
  };

  const handlePackagePersist = (nextPackage: string) => {
    setSelectedPackage(nextPackage);
    persistManagerSettings({ useLocalPackage: managerSettings.useLocalPackage, selectedVersion, selectedPackage: nextPackage });
  };

  const runManagerAction = async (action: 'download' | 'upload' | 'install') => {
    if (action === 'upload' && uploadBlocked) return setFlashTarget('upload');
    const normalizedOtp = sanitizeNpmOtpInput(npmOtp);
    if (action === 'upload' && normalizedOtp && normalizedOtp.length !== 6) {
      setStatus('Enter the current 6-digit npm authenticator code or leave OTP blank.');
      return;
    }
    setActiveAction(action);
    setStatus(
      `${action === 'upload' ? 'Upload' : action === 'install' ? 'Install' : 'Download'} request queued for ${selectedPackage}...`,
    );
    try {
      const response = await fetch('/api/spCoin/access-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          mode: 'local',
          version: selectedVersion,
          packageName: selectedPackage,
          otp: action === 'upload' ? normalizedOtp : '',
        }),
      });
      const data = (await response.json()) as ManagerResponse;
      if (data.version) applyResolvedVersion(data.version);
      if (data.version) setResolvedNpmVersion(String(data.version).trim());
      if (typeof data.localVersion === 'string') setLocalPackageVersion(String(data.localVersion).trim());
      if (typeof data.downloadBlocked === 'boolean') setDownloadBlocked(data.downloadBlocked);
      if (typeof data.uploadBlocked === 'boolean') setUploadBlocked(data.uploadBlocked);
      if (response.ok && data.ok && action === 'upload') setNpmOtp('');
      setStatus(data.message ?? 'No response message returned.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown request failure';
      setStatus(`Request failed: ${message}`);
    } finally {
      setActiveAction(null);
    }
  };

  const handleDeploymentPrivateKeyChange = (nextValue: string) => {
    setDeploymentAccountPrivateKey(nextValue);
    setDeploymentPublicKey('');
    setDeployUiState('idle');
  };
  const handleDeploymentPrivateKeyBlur = () => {
    const normalizedPrivateKey = deploymentAccountPrivateKey.trim();
    setDeploymentAccountPrivateKey(normalizedPrivateKey);
    const keyValidationMessage = getDeploymentKeyValidationMessage(normalizedPrivateKey);
    if (keyValidationMessage) {
      setDeploymentStatus(keyValidationMessage);
      setDeploymentStatusIsError(true);
      setDeploymentFlashError(true);
      return;
    }
    setDeploymentStatusIsError(false);
    setDeploymentFlashError(false);
    setDeploymentStatus(deploymentGuidanceMessage);
  };
  const adjustHardhatDeploymentAccountNumber = (direction: 1 | -1) => {
    setHardhatDeploymentAccountNumber((previous) =>
      Math.max(0, Math.min(HARDHAT_DEPLOYMENT_ACCOUNT_COUNT - 1, previous + direction)),
    );
  };
  const handleHardhatDeploymentAccountNumberChange = (nextValue: string) => {
    const parsed = Number.parseInt(String(nextValue || '').replace(/[^0-9]/g, ''), 10);
    if (!Number.isFinite(parsed)) {
      setHardhatDeploymentAccountNumber(0);
      return;
    }
    setHardhatDeploymentAccountNumber(
      Math.max(0, Math.min(HARDHAT_DEPLOYMENT_ACCOUNT_COUNT - 1, parsed)),
    );
  };

  return {
    chromeHeight,
    cardClass,
    managerSettings,
    availablePackages,
    selectedPackage,
    localInstallSourceRoot,
    localInstallSourceRootError,
    npmOtp,
    versionInput,
    activeAction,
    uploadBlocked,
    resolvedNpmVersion,
    localPackageVersion,
    downloadBlocked,
    flashTarget,
    selectedVersion,
    status,
    deploymentMode,
    deploymentName,
    deploymentSymbol,
    deploymentDecimals,
    deploymentVersion,
    hardhatDeploymentAccountNumber,
    canIncrementHardhatDeploymentAccountNumber,
    canDecrementHardhatDeploymentAccountNumber,
    deploymentChainName,
    deploymentChainId,
    deploymentPathDisplayValue,
    deploymentFlashError,
    deploymentAccountPrivateKey,
    deploymentKeyRequiredMessage,
    deploymentVersionPrefix,
    deploymentPublicKey,
    deploymentPublicKeyDisplay,
    deploymentLogoPath,
    deploymentStatus,
    deploymentStatusIsError,
    deploymentContractDirExists,
    deploymentTokenStatus,
    deployDisableReason,
    deployButtonLabel,
    handleCloseAttempt,
    handlePackagePersist,
    setLocalInstallSourceRoot,
    validateLocalInstallSourceRoot,
    setNpmOtp,
    handleVersionInputChange,
    handleVersionPersist,
    adjustVersion,
    runManagerAction,
    setDeploymentMode,
    handleDeploymentDecimalsInputChange,
    adjustDeploymentDecimals,
    handleDeploymentVersionInputChange,
    adjustDeploymentVersion,
    handleHardhatDeploymentAccountNumberChange,
    adjustHardhatDeploymentAccountNumber,
    setLocalSourceDeploymentPath,
    handleDeploy,
    handleDeploymentPrivateKeyChange,
    handleDeploymentPrivateKeyBlur,
    setDeploymentLogoPath,
  };
}
