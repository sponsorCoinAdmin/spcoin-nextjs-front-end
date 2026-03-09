// File: app/(menu)/(dynamic)/SpCoinAccessController/hooks/useSpCoinAccessController.ts
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  chainId?: Record<string, Record<string, Record<string, unknown>>>;
};

const normalizeNetworkName = (value: string): string =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

type ManagerResponse = {
  ok: boolean;
  message?: string;
  packages?: string[];
  installSourceRoot?: string;
  version?: string;
  downloadBlocked?: boolean;
  uploadBlocked?: boolean;
  deploymentPublicKey?: string;
  localPathExists?: boolean;
  contractDirExists?: boolean;
  tokenStatus?: 'NOT_FOUND' | 'DEPLOYED' | 'SERVER_INSTALLED';
};

type SpCoinAccessStorage = {
  useLocalPackage: boolean;
  selectedPackage: string;
  selectedVersion: string;
  sourceRoot: string;
  localInstallSourceRoot: string;
  deploymentName: string;
  deploymentSymbol?: string;
  deploymentDecimals?: string;
  deploymentVersion: string;
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
  const [deploymentAccountPrivateKey, setDeploymentAccountPrivateKey] = useState('');
  const [deploymentMode, setDeploymentMode] = useState<'mocked' | 'blockcain'>('mocked');
  const [localSourceDeploymentPath, setLocalSourceDeploymentPath] = useState(DEFAULT_LOCAL_SOURCE_DEPLOYMENT_PATH);
  const [deploymentPublicKey, setDeploymentPublicKey] = useState('');
  const [deploymentLogoPath, setDeploymentLogoPath] = useState('/public/assets/miscellaneous/spCoin.png');
  const [localInstallSourceRoot, setLocalInstallSourceRoot] = useState('/spCoinAccess');
  const [localInstallSourceRootError, setLocalInstallSourceRootError] = useState('');
  const [sourceRoot, setSourceRoot] = useState(
    settings.NPM_Source ||
      (managerSettings.useLocalPackage ? '/spCoinAccess' : '/node_modules/@sponsorcoin/spcoin-access-modules'),
  );
  const [downloadBlocked, setDownloadBlocked] = useState(false);
  const [uploadBlocked, setUploadBlocked] = useState(true);
  const [flashTarget, setFlashTarget] = useState<'download' | 'upload' | null>(null);
  const [deploymentFlashError, setDeploymentFlashError] = useState(false);
  const [deploymentStatusIsError, setDeploymentStatusIsError] = useState(false);
  const [activeAction, setActiveAction] = useState<'download' | 'upload' | null>(null);
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
  const checkLocalDirectoryExists = async (localPath: string) => {
    try {
      const params = new URLSearchParams({ localPath });
      const response = await fetch(`/api/spCoin/access-manager?${params.toString()}`, { method: 'GET' });
      const data = (await response.json()) as ManagerResponse;
      return response.ok && data.ok && data.localPathExists === true;
    } catch {
      return false;
    }
  };
  const deploymentTokenName = buildDeploymentTokenName(deploymentName);
  const deploymentVersionPrefix = deploymentTokenName;
  const rawDeploymentChainId = Number((exchangeContext as any)?.network?.chainId);
  const mappedDeploymentChainId =
    Number.isFinite(rawDeploymentChainId) && rawDeploymentChainId > 0
      ? rawDeploymentChainId === 31337
        ? 8453
        : rawDeploymentChainId
      : NaN;
  const deploymentChainName =
    rawDeploymentChainId === 31337 ? 'HardHat BASE' : String((exchangeContext as any)?.network?.name || 'Unknown');
  const deploymentChainId = Number.isFinite(mappedDeploymentChainId) ? String(mappedDeploymentChainId) : 'Unknown';
  const deploymentKeyRequiredMessage = 'Account Private Key for Deployment Required';
  const existsInSpCoinDeploymentMap = useMemo(() => {
    const parsed = spCoinDeploymentMapRaw as SpCoinDeploymentFile;
    const chainIdKey = String(deploymentChainId || '').trim();
    const publicKeyUpper = String(deploymentPublicKey || '').trim().toUpperCase();
    if (!/^[0][xX][a-fA-F0-9]{40}$/.test(publicKeyUpper)) return false;
    const chainNode = parsed?.chainId?.[chainIdKey];
    if (!chainNode || typeof chainNode !== 'object') return false;
    const networkIdToName = parsed?.meta?.networkIdToName ?? {};
    const expectedNetwork = normalizeNetworkName(networkIdToName[chainIdKey] ?? '');
    const currentNetwork = normalizeNetworkName(deploymentChainName);
    const networkMatches =
      !expectedNetwork ||
      currentNetwork === expectedNetwork ||
      (chainIdKey === '8453' && currentNetwork === 'hardhatbase');
    if (!networkMatches) return false;
    for (const versionNode of Object.values(chainNode)) {
      if (!versionNode || typeof versionNode !== 'object') continue;
      if (Object.prototype.hasOwnProperty.call(versionNode, publicKeyUpper)) {
        return true;
      }
    }
    return false;
  }, [deploymentChainId, deploymentChainName, deploymentPublicKey]);
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

  const persistNpmSource = (nextSource: string) => {
    const fallback = managerSettings.useLocalPackage ? '/spCoinAccess' : '/node_modules/@sponsorcoin/spcoin-access-modules';
    const normalized = normalizeProjectRelativePath(nextSource, fallback);
    setSettings((prev) => (prev.NPM_Source === normalized ? prev : { ...prev, NPM_Source: normalized }));
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
    setDeploymentName(buildDeploymentNameFromVersion(deploymentVersion));
    setDeploymentSymbol(buildDeploymentSymbolFromVersion(deploymentVersion));
  }, [deploymentVersion]);
  useEffect(() => {
    setDeployUiState('idle');
  }, [deploymentMode, deploymentVersion]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(SPCOIN_ACCESS_STORAGE_KEY);
      if (!raw) {
        hasHydratedStorageRef.current = true;
        return;
      }
      const persisted = JSON.parse(raw) as Partial<SpCoinAccessStorage>;
      const nextUseLocalPackage = persisted.useLocalPackage ?? managerSettings.useLocalPackage;
      const nextSelectedPackage = persisted.selectedPackage || managerSettings.selectedPackage || selectedPackage;
      const hydratedVersion = persisted.selectedVersion === 'latest' ? '0.0.1' : persisted.selectedVersion;
      const nextSelectedVersion = hydratedVersion || managerSettings.selectedVersion || selectedVersion;
      persistManagerSettings({ useLocalPackage: nextUseLocalPackage, selectedPackage: nextSelectedPackage, selectedVersion: nextSelectedVersion });
      setSelectedPackage(nextSelectedPackage);
      setVersionInput(nextSelectedVersion);
      setSourceRoot(
        persisted.sourceRoot ||
          settings.NPM_Source ||
          (nextUseLocalPackage ? '/spCoinAccess' : '/node_modules/@sponsorcoin/spcoin-access-modules'),
      );
      setLocalInstallSourceRoot(persisted.localInstallSourceRoot || '/spCoinAccess');
      setDeploymentDecimals(persisted.deploymentDecimals || '18');
      setDeploymentVersion(persisted.deploymentVersion || '0.0.1');
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
    persistNpmSource(sourceRoot);
  }, [sourceRoot, managerSettings.useLocalPackage]);

  useEffect(() => {
    if (!hasHydratedStorageRef.current || typeof window === 'undefined') return;
    const persisted: SpCoinAccessStorage = {
      useLocalPackage: managerSettings.useLocalPackage,
      selectedPackage,
      selectedVersion,
      sourceRoot,
      localInstallSourceRoot,
      deploymentName,
      deploymentSymbol,
      deploymentDecimals,
      deploymentVersion,
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
    localInstallSourceRoot,
    managerSettings.useLocalPackage,
    selectedPackage,
    selectedVersion,
    sourceRoot,
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

  const handlePackageSourceModeChange = async (mode: 'local' | 'node_modules') => {
    if (mode === 'local') {
      const normalizedLocalPath = normalizeProjectRelativePath(localInstallSourceRoot, '/spCoinAccess');
      if (!validateLocalInstallSourceRoot(normalizedLocalPath)) {
        setStatus('*Error: Local source path is invalid. Expected path under /spCoinAccess.');
        return;
      }
      const exists = await checkLocalDirectoryExists(normalizedLocalPath);
      if (!exists) {
        setLocalInstallSourceRootError('Path Not found');
        setStatus(`*Error: Local source directory does not exist: ${normalizedLocalPath}`);
        return;
      }
      setLocalInstallSourceRootError('');
    }
    const nextUseLocalPackage = mode === 'local';
    const nextSourcePath = nextUseLocalPackage ? '/spCoinAccess' : '/node_modules/@sponsorcoin/spcoin-access-modules';
    setSourceRoot(nextSourcePath);
    persistManagerSettings({ useLocalPackage: nextUseLocalPackage, selectedVersion, selectedPackage });
    setStatus(`Active package source set to ${nextSourcePath}.`);
  };

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

  const runManagerAction = async (action: 'download' | 'upload') => {
    if (action === 'upload' && uploadBlocked) return setFlashTarget('upload');
    setActiveAction(action);
    setStatus(`${action === 'upload' ? 'Upload' : 'Download'} request queued for ${selectedPackage}...`);
    try {
      const response = await fetch('/api/spCoin/access-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          mode: managerSettings.useLocalPackage ? 'local' : 'node_modules',
          version: selectedVersion,
          packageName: selectedPackage,
        }),
      });
      const data = (await response.json()) as ManagerResponse;
      if (data.version) applyResolvedVersion(data.version);
      if (typeof data.downloadBlocked === 'boolean') setDownloadBlocked(data.downloadBlocked);
      if (typeof data.uploadBlocked === 'boolean') setUploadBlocked(data.uploadBlocked);
      if (response.ok && data.ok && action === 'download') {
        const defaultInstallSourceRoot = `/spCoinAccess/packages/${selectedPackage}`;
        setSourceRoot(normalizeProjectRelativePath(data.installSourceRoot || defaultInstallSourceRoot, defaultInstallSourceRoot));
      }
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

  return {
    chromeHeight,
    cardClass,
    managerSettings,
    availablePackages,
    selectedPackage,
    localInstallSourceRoot,
    localInstallSourceRootError,
    versionInput,
    activeAction,
    uploadBlocked,
    downloadBlocked,
    flashTarget,
    selectedVersion,
    sourceRoot,
    status,
    deploymentMode,
    deploymentName,
    deploymentSymbol,
    deploymentDecimals,
    deploymentVersion,
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
    handlePackageSourceModeChange,
    setLocalInstallSourceRoot,
    validateLocalInstallSourceRoot,
    handleVersionInputChange,
    handleVersionPersist,
    adjustVersion,
    runManagerAction,
    setSourceRoot,
    setDeploymentMode,
    handleDeploymentDecimalsInputChange,
    adjustDeploymentDecimals,
    handleDeploymentVersionInputChange,
    adjustDeploymentVersion,
    setLocalSourceDeploymentPath,
    handleDeploy,
    handleDeploymentPrivateKeyChange,
    handleDeploymentPrivateKeyBlur,
    setDeploymentLogoPath,
  };
}
