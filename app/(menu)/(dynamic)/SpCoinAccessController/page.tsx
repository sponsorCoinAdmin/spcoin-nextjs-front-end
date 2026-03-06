// File: app/(menu)/(dynamic)/SpCoinAccessController/page.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import CloseButton from '@/components/views/Buttons/CloseButton';
import { useSettings } from '@/lib/context/hooks/ExchangeContext/nested/useSettings';
import { useExchangeContext } from '@/lib/context/hooks';

type ManagerResponse = {
  ok: boolean;
  message?: string;
  packages?: string[];
  packageName?: string;
  installSourceRoot?: string;
  workspaceRoot?: string;
  action?: 'upload' | 'download' | 'deploy';
  mode?: 'local' | 'node_modules';
  version?: string;
  downloadBlocked?: boolean;
  uploadBlocked?: boolean;
  deploymentTokenName?: string;
  deploymentPublicKey?: string;
  deploymentPrivateKey?: string;
  deploymentTxHash?: string;
  deploymentChainId?: number;
  deploymentNetworkName?: string;
  localPath?: string;
  localPathExists?: boolean;
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

const SPCOIN_ACCESS_STORAGE_KEY = 'spCoinAccess';
const VERSION_FORMAT_ERROR = '*Error: Bad Format, format is Number and decimals only.';
const VERSION_FORMAT_REGEX = /^\d+(?:\.\d+)*$/;
const DEFAULT_LOCAL_SOURCE_DEPLOYMENT_PATH = '/spCoinAccess/contracts/spCoin';

export default function SpCoinAccessControllerPage() {
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

  const cardClass =
    'rounded-2xl border border-[#2B3A67] bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.25)]';
  const normalizeProjectRelativePath = (value: string, fallback: string) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return fallback;
    const withoutLeadingOrTrailing = trimmed.replace(/^\/+|\/+$/g, '');
    if (!withoutLeadingOrTrailing) return fallback;
    return `/${withoutLeadingOrTrailing}`;
  };
  const validateLocalInstallSourceRoot = (value: string) => {
    const normalized = normalizeProjectRelativePath(value, '');
    const isValid = normalized.startsWith('/spCoinAccess');
    setLocalInstallSourceRootError(isValid ? '' : 'Path Not found');
    return isValid;
  };
  const checkLocalDirectoryExists = async (localPath: string) => {
    try {
      const params = new URLSearchParams({ localPath });
      const response = await fetch(`/api/spCoin/access-manager?${params.toString()}`, {
        method: 'GET',
      });
      const data = (await response.json()) as ManagerResponse;
      return response.ok && data.ok && data.localPathExists === true;
    } catch {
      return false;
    }
  };
  const renderErrorWordInRed = (message: string) => {
    const parts = String(message || '').split(/(Error:?)/g);
    return (
      <>
        {parts.map((part, index) =>
          /^Error:?$/.test(part) ? (
            <span key={`error-part-${index}`} className="text-red-400">
              {part}
            </span>
          ) : (
            <span key={`error-part-${index}`}>{part}</span>
          ),
        )}
      </>
    );
  };
  const buildDeploymentTokenName = (name: string, version: string) => {
    const normalizedName = String(name || '').trim() || 'Sponsor Coin';
    const normalizedVersion = String(version || '').trim();
    return normalizedVersion ? `${normalizedName} V ${normalizedVersion}` : normalizedName;
  };
  const clampDeploymentDecimals = (value: number) => Math.min(255, Math.max(0, value));
  const getDeploymentKeyValidationMessage = (rawKey: string) => {
    const normalizedPrivateKey = String(rawKey || '').trim();
    if (!normalizedPrivateKey) {
      return '*Error: Account Private Key is required for Deployment.';
    }
    if (!/^(0x)?[0-9a-fA-F]{64}$/.test(normalizedPrivateKey)) {
      return '*Error: Invalid Account Private Key';
    }
    return '';
  };
  const deploymentTokenName = buildDeploymentTokenName(deploymentName, deploymentVersion);
  const deploymentVersionPrefix = deploymentTokenName;
  const deploymentChainName = String((exchangeContext as any)?.network?.name || 'Unknown');
  const deploymentChainId = String((exchangeContext as any)?.network?.chainId ?? 'Unknown');
  const deploymentKeyRequiredMessage = 'Account Private Key for Deployment Required';
  const deploymentGuidanceMessage = useMemo(() => {
    if (deploymentMode === 'mocked') {
      return [
        'Status: READY',
        `Mocked Deployment: "${deploymentTokenName}" is ready for deployment.`,
        'Contract Public Key: (pending)',
        `Contract Name: ${deploymentTokenName}`,
        `Network: ${deploymentChainName} (${deploymentChainId})`,
        '',
        'Set toggle radio button to Blockchain for real deployment execution',
      ].join('\n');
    }
    return [
      'Status: READY',
      `Blockchain Deployment: "${deploymentTokenName}" is ready for deployment.`,
      'Contract Public Key: (pending)',
      `Contract Name: ${deploymentTokenName}`,
      `Network: ${deploymentChainName} (${deploymentChainId})`,
      '',
      'Press Deploy to execute blockchain deployment',
    ].join('\n');
  }, [deploymentChainId, deploymentChainName, deploymentMode, deploymentTokenName]);
  const deploymentPathDisplayValue =
    deploymentMode === 'mocked' ? 'Mocking Deployment' : localSourceDeploymentPath;
  const deploymentVersionStatusMatch = deploymentStatus.match(/^(.+?)( set for deployment\.)$/);
  const deploymentScaffoldStatusMatch = deploymentStatus.match(
    /^Status: (\d+)\r?\nMocked Deployment: ([\s\S]*?)\r?\nContract Public Key: (.+)\r?\nContract Name: (.+)\r?\nNetwork: (.+)\r?\n\r?\nSet toggle radio button to Blockchain for real deployment execution$/,
  );
  const deploymentMockingStatusMatch = deploymentStatus.match(
    /^Status: (.+)\r?\nMocked Deployment: "([^"]+)" is ready for deployment\.\r?\nContract Public Key: (.+)\r?\nContract Name: (.+)\r?\nNetwork: (.+)\r?\n\r?\nSet toggle radio button to Blockchain for real deployment execution$/,
  );
  const deploymentReadyStatusMatch = deploymentStatus.match(
    /^Status: (.+)\r?\nBlockchain Deployment: "([^"]+)" is ready for deployment\.\r?\nContract Public Key: (.+)\r?\nContract Name: (.+)\r?\nNetwork: (.+)\r?\n\r?\nPress Deploy to execute blockchain deployment$/,
  );
  const deploymentErrorStatusMatch = deploymentStatus.match(/^(\*Error:)(.*)$/);
  const deploymentEmptyKeyStatusMatch = deploymentStatus.match(
    /^(\*Error:)( Empty Account Private Key for deploymnet token ")([^"]+)(")$/,
  );
  const deploymentInvalidKeyStatusMatch = deploymentStatus.match(
    /^(\*Error:)( Invalid Account Private Key for deploymnet token ")([^"]+)(")$/,
  );

  const isVersionFormatValid = (value: string) => VERSION_FORMAT_REGEX.test(value.trim());

  const selectedVersion = useMemo(() => {
    const trimmed = versionInput.trim();
    if (!trimmed) return managerSettings.selectedVersion || '0.0.1';
    return isVersionFormatValid(trimmed) ? trimmed : managerSettings.selectedVersion || '0.0.1';
  }, [managerSettings.selectedVersion, versionInput]);

  const sanitizeVersionInput = (value: string) =>
    value
      .replace(/[^0-9.]/g, '')
      .replace(/\.{2,}/g, '.');
  const adjustDeploymentDecimals = (direction: 1 | -1) => {
    const current = Number.parseInt(String(deploymentDecimals || '18'), 10);
    const safeCurrent = Number.isFinite(current) ? current : 18;
    const next = clampDeploymentDecimals(safeCurrent + direction);
    setDeploymentDecimals(String(next));
  };
  const handleDeploymentDecimalsInputChange = (nextValue: string) => {
    const digitsOnly = String(nextValue || '').replace(/[^0-9]/g, '').slice(0, 3);
    if (!digitsOnly) {
      setDeploymentDecimals('0');
      return;
    }
    const parsed = Number.parseInt(digitsOnly, 10);
    setDeploymentDecimals(String(clampDeploymentDecimals(Number.isFinite(parsed) ? parsed : 0)));
  };

  const handleDeploy = async () => {
    const normalizedName = deploymentName.trim() || 'Sponsor Coin';
    const normalizedVersion = deploymentVersion.trim();
    const normalizedSymbol = deploymentSymbol.trim() || 'SPCOIN';
    const normalizedDecimals = clampDeploymentDecimals(
      Number.parseInt(String(deploymentDecimals || '18'), 10) || 18,
    );
    const deploymentContractName = buildDeploymentTokenName(normalizedName, normalizedVersion);
    const normalizedPrivateKey = deploymentAccountPrivateKey.trim();
    const isValidPrivateKey = /^(0x)?[0-9a-fA-F]{64}$/.test(normalizedPrivateKey);

    if (!isValidPrivateKey) {
      setDeploymentStatus(
        normalizedPrivateKey
          ? '*Error: Invalid Account Private Key'
          : '*Error: Account Private Key is required for Deployment.',
      );
      setDeploymentStatusIsError(true);
      setDeploymentFlashError(true);
      return;
    }

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
      console.log('[SpCoinAccessController][DeployResponse]', {
        status: response.status,
        response: data,
      });
      if (!response.ok || !data.ok) {
        const message = data.message || 'Deployment request failed.';
        setDeploymentStatus(`*Error: Status ${response.status}: ${message}`);
        setDeploymentStatusIsError(true);
        setDeploymentFlashError(true);
        return;
      }
      const contractPublicKey = String(data.deploymentPublicKey || '');
      const statusMessage =
        data.message ||
        `Deployment scaffold prepared for "${deploymentContractName}". Server-side deployment automation is not connected yet.`;
      setDeploymentPublicKey(contractPublicKey);
      setDeploymentStatus(
        [
          `Status: ${response.status}`,
          `Mocked Deployment: ${statusMessage}`,
          `Contract Public Key: ${contractPublicKey || '(not returned)'}`,
          `Contract Name: ${deploymentContractName}`,
          `Network: ${deploymentChainName}`,
          '',
          'Set toggle radio button to Blockchain for real deployment execution',
        ].join('\n'),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown deployment request failure';
      setDeploymentStatus(`*Error: ${message}`);
      setDeploymentStatusIsError(true);
      setDeploymentFlashError(true);
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
    const nextValue = Math.max(0, (nextSegments[lastIndex] ?? 0) + direction);
    nextSegments[lastIndex] = nextValue;

    const nextVersion = nextSegments.join('.');
    setDeploymentStatusIsError(false);
    setDeploymentVersion(nextVersion);
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

  const adjustVersion = (direction: 1 | -1) => {
    const sanitized = sanitizeVersionInput(versionInput).replace(/^\.+|\.+$/g, '');
    const segments = sanitized
      .split('.')
      .filter(Boolean)
      .map((segment) => Number.parseInt(segment, 10))
      .filter((segment) => Number.isFinite(segment) && segment >= 0);

    const nextSegments = segments.length > 0 ? [...segments] : [0, 0, 0];
    const lastIndex = nextSegments.length - 1;
    const nextValue = Math.max(0, (nextSegments[lastIndex] ?? 0) + direction);
    nextSegments[lastIndex] = nextValue;

    const nextVersion = nextSegments.join('.');
    setVersionInput(nextVersion);
    persistManagerSettings({
      useLocalPackage: managerSettings.useLocalPackage,
      selectedVersion: nextVersion,
      selectedPackage,
    });
    setStatus(`Version set to ${nextVersion}`);
  };

  const persistManagerSettings = (next: {
    useLocalPackage: boolean;
    selectedVersion: string;
    selectedPackage: string;
  }) => {
    setSettings((prev) => ({
      ...prev,
      spCoinAccessManager: next,
    }));
  };

  const persistNpmSource = (nextSource: string) => {
    const fallback = managerSettings.useLocalPackage
      ? '/spCoinAccess'
      : '/node_modules/@sponsorcoin/spcoin-access-modules';
    const normalized = normalizeProjectRelativePath(nextSource, fallback);
    setSettings((prev) =>
      prev.NPM_Source === normalized
        ? prev
        : {
            ...prev,
            NPM_Source: normalized,
          },
    );
  };

  const applyResolvedVersion = (nextVersion: string) => {
    const normalized = String(nextVersion || '').trim();
    if (!normalized) return;
    setVersionInput(normalized);
    persistManagerSettings({
      useLocalPackage: managerSettings.useLocalPackage,
      selectedVersion: normalized,
      selectedPackage,
    });
  };

  useEffect(() => {
    const measure = () => {
      const header = document.querySelector('header');
      const footer = document.querySelector('footer');
      const headerHeight = header instanceof HTMLElement ? header.offsetHeight : 72;
      const footerHeight = footer instanceof HTMLElement ? footer.offsetHeight : 0;
      const next = Math.max(72, headerHeight + footerHeight);
      setChromeHeight(next);
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    validateLocalInstallSourceRoot(localInstallSourceRoot);
  }, []);

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

      persistManagerSettings({
        useLocalPackage: nextUseLocalPackage,
        selectedPackage: nextSelectedPackage,
        selectedVersion: nextSelectedVersion,
      });
      setSelectedPackage(nextSelectedPackage);
      setVersionInput(nextSelectedVersion);
      setSourceRoot(
        persisted.sourceRoot ||
          settings.NPM_Source ||
          (nextUseLocalPackage ? '/spCoinAccess' : '/node_modules/@sponsorcoin/spcoin-access-modules'),
      );
      setLocalInstallSourceRoot(persisted.localInstallSourceRoot || '/spCoinAccess');
      setDeploymentName(persisted.deploymentName || 'Sponsor Coin');
      setDeploymentSymbol(persisted.deploymentSymbol || 'SPCOIN');
      setDeploymentDecimals(persisted.deploymentDecimals || '18');
      setDeploymentVersion(persisted.deploymentVersion || '0.0.1');
      setDeploymentAccountPrivateKey(persisted.deploymentAccountPrivateKey || '');
      setDeploymentPublicKey(persisted.deploymentPublicKey || '');
      setDeploymentMode(persisted.deploymentMode || 'mocked');
      setLocalSourceDeploymentPath(persisted.localSourceDeploymentPath || DEFAULT_LOCAL_SOURCE_DEPLOYMENT_PATH);
    } catch {
      // Ignore invalid persisted state.
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

        if (packages.length === 0) {
          setStatus('No @sponsorcoin packages were found in node_modules.');
          return;
        }

        const nextSelected = packages.includes(selectedPackage) ? selectedPackage : packages[0];
        setSelectedPackage(nextSelected);
        persistManagerSettings({
          useLocalPackage: managerSettings.useLocalPackage,
          selectedVersion,
          selectedPackage: nextSelected,
        });
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
        const params = new URLSearchParams({
          packageName: selectedPackage,
          version: selectedVersion,
        });
        const response = await fetch(`/api/spCoin/access-manager?${params.toString()}`, {
          method: 'GET',
        });
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
    persistNpmSource(sourceRoot);
  }, [persistNpmSource, sourceRoot, managerSettings.useLocalPackage]);

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
      const normalizedLocalPath = normalizeProjectRelativePath(
        localInstallSourceRoot,
        '/spCoinAccess',
      );
      const isPathShapeValid = validateLocalInstallSourceRoot(normalizedLocalPath);
      if (!isPathShapeValid) {
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
    const nextSourcePath = nextUseLocalPackage
      ? '/spCoinAccess'
      : '/node_modules/@sponsorcoin/spcoin-access-modules';
    setSourceRoot(nextSourcePath);
    persistManagerSettings({
      useLocalPackage: nextUseLocalPackage,
      selectedVersion,
      selectedPackage,
    });
    setStatus(`Active package source set to ${nextSourcePath}.`);
  };

  const handleCloseAttempt = () => {
    if (!validateLocalInstallSourceRoot(localInstallSourceRoot)) {
      window.alert('Path Not found');
      return;
    }
    router.back();
  };

  const handleVersionPersist = () => {
    const trimmed = versionInput.trim();
    if (!isVersionFormatValid(trimmed)) {
      setStatus(VERSION_FORMAT_ERROR);
      return;
    }
    setVersionInput(trimmed);
    persistManagerSettings({
      useLocalPackage: managerSettings.useLocalPackage,
      selectedVersion: trimmed,
      selectedPackage,
    });
    setStatus(`Version set to ${trimmed}`);
  };

  const handleVersionInputChange = (nextValue: string) => {
    const sanitized = sanitizeVersionInput(nextValue);
    setVersionInput(sanitized);
    const trimmed = sanitized.trim();
    if (!isVersionFormatValid(trimmed)) {
      setStatus(VERSION_FORMAT_ERROR);
      return;
    }
    persistManagerSettings({
      useLocalPackage: managerSettings.useLocalPackage,
      selectedVersion: trimmed,
      selectedPackage,
    });
    setStatus(`Version set to ${trimmed}`);
  };

  const handlePackagePersist = (nextPackage: string) => {
    setSelectedPackage(nextPackage);
    persistManagerSettings({
      useLocalPackage: managerSettings.useLocalPackage,
      selectedVersion,
      selectedPackage: nextPackage,
    });
  };

  const triggerBlockedFlash = (target: 'download' | 'upload') => {
    setFlashTarget(target);
  };

  const runManagerAction = async (action: 'download' | 'upload') => {
    if (action === 'upload' && uploadBlocked) {
      triggerBlockedFlash('upload');
      return;
    }

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
      if (data.version) {
        applyResolvedVersion(data.version);
      }
      if (typeof data.downloadBlocked === 'boolean') {
        setDownloadBlocked(data.downloadBlocked);
      }
      if (typeof data.uploadBlocked === 'boolean') {
        setUploadBlocked(data.uploadBlocked);
      }
      if (response.ok && data.ok && action === 'download') {
        const defaultInstallSourceRoot = `/spCoinAccess/packages/${selectedPackage}`;
        setSourceRoot(
          normalizeProjectRelativePath(data.installSourceRoot || defaultInstallSourceRoot, defaultInstallSourceRoot),
        );
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

  return (
    <main
      className="relative box-border flex w-full flex-col overflow-hidden bg-[#0B1020] px-6 pt-6 text-white"
      style={{ height: `calc(100dvh - ${chromeHeight}px)` }}
    >
      <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center">
        <div />
        <h1 className="text-center text-2xl font-bold text-[#5981F3]">SpCoin Access Controller</h1>
        <div className="flex items-center justify-self-end gap-2">
          <CloseButton
            id="spCoinAccessManagerBackButton"
            closeCallback={handleCloseAttempt}
            title="Go Back"
            ariaLabel="Go Back"
            className="h-10 w-10 rounded-full bg-[#243056] text-3xl leading-none text-[#5981F3] flex items-center justify-center transition-colors hover:bg-[#5981F3] hover:text-[#243056]"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 w-full flex-col gap-6">
        <section className="min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full min-h-0 flex-1 overflow-hidden flex-col gap-6 md:flex-row">
            <div className="scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-2xl bg-[#192134] p-4">
              <div className="mb-4 flex items-center justify-center border-b border-slate-700 pb-3">
                <h2 className="text-center text-xl font-semibold text-[#8FA8FF]">NPM Access Controller</h2>
              </div>

              <div className={`${cardClass} scrollbar-hide flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-2`}>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-[#8FA8FF]">Node Package Manager</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#8FA8FF]">NPM Package</span>
                    <select
                      value={selectedPackage}
                      onChange={(event) => handlePackagePersist(event.target.value)}
                      className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-3 text-white outline-none transition-colors focus:border-[#8FA8FF]"
                    >
                      {availablePackages.length > 0 ? (
                        availablePackages.map((packageName) => (
                          <option key={packageName} value={packageName}>
                            {packageName}
                          </option>
                        ))
                      ) : (
                        <option value={selectedPackage}>{selectedPackage}</option>
                      )}
                    </select>
                  </label>

                  <label className="block">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="block text-sm font-semibold text-[#8FA8FF]">Version</span>
                      <div className="mr-[10px] flex items-center justify-end gap-4 text-sm">
                        <label className="flex items-center gap-2 text-[#8FA8FF]">
                          <input
                            type="radio"
                            name="package-source-mode"
                            value="local"
                            checked={managerSettings.useLocalPackage}
                            onChange={() => void handlePackageSourceModeChange('local')}
                            className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                          />
                          <span>Local</span>
                        </label>
                        <label className="flex items-center gap-2 text-[#8FA8FF]">
                          <input
                            type="radio"
                            name="package-source-mode"
                            value="node_modules"
                            checked={!managerSettings.useLocalPackage}
                            onChange={() => void handlePackageSourceModeChange('node_modules')}
                            className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                          />
                          <span>node_modules</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex items-stretch">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={versionInput}
                        onChange={(event) => handleVersionInputChange(event.target.value)}
                        onBlur={handleVersionPersist}
                        placeholder="0.0.1"
                        className="w-full rounded-l-xl rounded-r-none border border-[#31416F] bg-[#0B1020] px-4 py-3 text-white outline-none transition-colors focus:border-[#8FA8FF]"
                      />
                      <div className="flex w-[44px] flex-col">
                        <button
                          type="button"
                          onClick={() => adjustVersion(1)}
                          className="h-1/2 min-h-0 rounded-tr-xl border border-l-0 border-[#31416F] bg-[#0B1020] text-base font-bold leading-none text-[#8FA8FF] transition-colors hover:bg-green-500 hover:text-black"
                          title="Increment Version"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustVersion(-1)}
                          className="h-1/2 min-h-0 rounded-br-xl border border-l-0 border-t-0 border-[#31416F] bg-[#0B1020] text-base font-bold leading-none text-[#8FA8FF] transition-colors hover:bg-green-500 hover:text-black"
                          title="Decrement Version"
                        >
                          -
                        </button>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                    <span className="text-sm font-semibold text-[#8FA8FF]">Local Source Install Path</span>
                    <input
                      type="text"
                      value={localInstallSourceRoot}
                      onChange={(event) => {
                        setLocalInstallSourceRoot(event.target.value);
                        if (localInstallSourceRootError) {
                          validateLocalInstallSourceRoot(event.target.value);
                        }
                      }}
                      onBlur={(event) => {
                        const normalized = normalizeProjectRelativePath(event.target.value, '/spCoinAccess');
                        setLocalInstallSourceRoot(normalized);
                        if (!validateLocalInstallSourceRoot(normalized)) {
                          window.alert('Path Not found');
                        }
                      }}
                      className={`w-full rounded-xl border px-4 py-3 text-white outline-none transition-colors ${
                        localInstallSourceRootError
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-[#31416F] bg-[#0B1020] focus:border-[#8FA8FF]'
                      }`}
                      title="Enter local source install path"
                    />
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void runManagerAction('upload')}
                    disabled={Boolean(activeAction) || !selectedPackage}
                    title={uploadBlocked ? 'Current Version Exists on NPM' : 'Upload selected package to NPM'}
                    className={`rounded-xl px-4 py-3 font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      flashTarget === 'upload'
                        ? 'bg-red-500 hover:bg-red-400'
                        : uploadBlocked
                        ? 'bg-[#E5B94F] hover:bg-[#E5B94F]'
                        : 'bg-[#EBCA6A] hover:bg-[#F4D883]'
                    }`}
                  >
                    {activeAction === 'upload'
                      ? 'Working...'
                      : uploadBlocked
                      ? 'Upload Disabled'
                      : 'Upload To NPM Manager'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void runManagerAction('download')}
                    disabled={Boolean(activeAction) || !selectedPackage}
                    title={
                      downloadBlocked
                        ? 'Revert local package from backup archive'
                        : 'Download selected package from NPM'
                    }
                    className={`rounded-xl px-4 py-3 font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      flashTarget === 'download'
                        ? 'bg-red-500 hover:bg-red-400'
                        : downloadBlocked
                        ? 'bg-[#E5B94F] hover:bg-[#E5B94F]'
                        : 'bg-[#5981F3] hover:bg-[#7C9CFF]'
                    }`}
                  >
                    {activeAction === 'download'
                      ? 'Working...'
                      : downloadBlocked
                      ? `Revert Version ${selectedVersion}`
                      : 'Download From NPM Manager'}
                  </button>
                </div>
                <div>
                  <label className="mt-3 grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                    <span className="text-sm font-semibold text-[#8FA8FF]">Source Root</span>
                    <input
                      type="text"
                      value={sourceRoot}
                      onChange={(event) => setSourceRoot(event.target.value)}
                      onBlur={(event) =>
                        setSourceRoot(
                          normalizeProjectRelativePath(
                            event.target.value,
                            managerSettings.useLocalPackage
                              ? '/spCoinAccess'
                              : '/node_modules/@sponsorcoin/spcoin-access-modules',
                          ),
                        )
                      }
                      className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-3 text-white outline-none transition-colors focus:border-[#8FA8FF]"
                      title="Enter source root relative to the app location"
                    />
                  </label>
                </div>
                <div>
                  <span className="mb-2 block text-sm font-semibold text-[#8FA8FF]">Status</span>
                  <div className="rounded-xl border border-dashed border-[#31416F] bg-[#0B1020] p-4 text-sm text-slate-300">
                    {status.startsWith('Version set to ') ? (
                      <p className="leading-6">
                        Version set to{' '}
                        <span className="font-semibold text-green-400">{status.replace('Version set to ', '')}</span>
                      </p>
                    ) : status.startsWith('Success:') ? (
                      <p className="leading-6 text-white">
                        <span className="text-green-400">Success:</span>
                        <span>{status.replace(/^Success:\s*/, ' ')}</span>
                      </p>
                    ) : (
                      <p className="leading-6 text-white">{renderErrorWordInRed(status)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="scrollbar-hide flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-2xl bg-[#192134] p-4">
              <div className="mb-4 flex items-center justify-center border-b border-slate-700 pb-3">
                <h2 className="text-center text-xl font-semibold text-[#8FA8FF]">Contract Deployment Controller</h2>
              </div>

              <div className={`${cardClass} scrollbar-hide flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-2`}>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                  <div />
                  <h3 className="justify-self-center text-xl font-semibold text-[#8FA8FF]">Contract Deployment</h3>
                  <div />
                </div>

                <div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#8FA8FF]">Name</span>
                    <input
                      type="text"
                      value={deploymentName}
                      onChange={(event) => setDeploymentName(event.target.value)}
                      className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-3 text-white outline-none transition-colors focus:border-[#8FA8FF]"
                    />
                  </label>

                  <label className="block">
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="block text-sm font-semibold text-[#8FA8FF]">Symbol</span>
                <div className="mr-[10px] flex items-center justify-end gap-4 text-sm">
                        <label className="flex items-center gap-2 text-[#8FA8FF]">
                          <input
                            type="radio"
                            name="deployment-mode"
                            value="mocked"
                            checked={deploymentMode === 'mocked'}
                            onChange={() => setDeploymentMode('mocked')}
                            className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                          />
                          <span>Mocked</span>
                        </label>
                        <label className="flex items-center gap-2 text-[#8FA8FF]">
                          <input
                            type="radio"
                            name="deployment-mode"
                            value="blockcain"
                            checked={deploymentMode === 'blockcain'}
                            onChange={() => setDeploymentMode('blockcain')}
                            className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                          />
                          <span>Blockcain</span>
                        </label>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={deploymentSymbol}
                      onChange={(event) => setDeploymentSymbol(event.target.value)}
                      className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-3 text-white outline-none transition-colors focus:border-[#8FA8FF]"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-[auto_auto_minmax(260px,2fr)] md:items-end">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#8FA8FF]">Decimals</span>
                    <div className="flex items-stretch">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={3}
                        value={deploymentDecimals}
                        onChange={(event) => handleDeploymentDecimalsInputChange(event.target.value)}
                        className="w-[4ch] min-w-[4ch] rounded-l-xl rounded-r-none border border-[#31416F] bg-[#0B1020] px-2 py-3 text-white outline-none transition-colors focus:border-[#8FA8FF]"
                      />
                      <div className="flex w-[44px] flex-col">
                        <button
                          type="button"
                          onClick={() => adjustDeploymentDecimals(1)}
                          className="h-1/2 min-h-0 rounded-tr-xl border border-l-0 border-[#31416F] bg-[#0B1020] text-base font-bold leading-none text-[#8FA8FF] transition-colors hover:bg-green-500 hover:text-black"
                          title="Increment Decimals"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustDeploymentDecimals(-1)}
                          className="h-1/2 min-h-0 rounded-br-xl border border-l-0 border-t-0 border-[#31416F] bg-[#0B1020] text-base font-bold leading-none text-[#8FA8FF] transition-colors hover:bg-green-500 hover:text-black"
                          title="Decrement Decimals"
                        >
                          -
                        </button>
                      </div>
                    </div>
                  </label>

                  <label className="block">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="block text-sm font-semibold text-[#8FA8FF]">Version</span>
                    </div>
                    <div className="flex items-stretch">
                      <input
                        type="text"
                        inputMode="decimal"
                        maxLength={8}
                        value={deploymentVersion}
                        onChange={(event) => handleDeploymentVersionInputChange(event.target.value)}
                        placeholder="Add optional Version"
                        className="w-[8ch] min-w-[8ch] rounded-l-xl rounded-r-none border border-[#31416F] bg-[#0B1020] px-2 py-3 text-white outline-none transition-colors focus:border-[#8FA8FF]"
                      />
                      <div className="flex w-[44px] flex-col">
                        <button
                          type="button"
                          onClick={() => adjustDeploymentVersion(1)}
                          className="h-1/2 min-h-0 rounded-tr-xl border border-l-0 border-[#31416F] bg-[#0B1020] text-base font-bold leading-none text-[#8FA8FF] transition-colors hover:bg-green-500 hover:text-black"
                          title="Increment Contract Version"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustDeploymentVersion(-1)}
                          className="h-1/2 min-h-0 rounded-br-xl border border-l-0 border-t-0 border-[#31416F] bg-[#0B1020] text-base font-bold leading-none text-[#8FA8FF] transition-colors hover:bg-green-500 hover:text-black"
                          title="Decrement Contract Version"
                        >
                          -
                        </button>
                      </div>
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[#8FA8FF]">Local Source Deployment Path</span>
                    <input
                      type="text"
                      value={deploymentPathDisplayValue}
                      onChange={(event) => setLocalSourceDeploymentPath(event.target.value)}
                      readOnly={deploymentMode === 'mocked'}
                      className={`w-full rounded-xl border px-4 py-3 text-white outline-none transition-colors ${
                        deploymentMode === 'mocked'
                          ? 'border-[#31416F] bg-[#0B1020]/70'
                          : 'border-[#31416F] bg-[#0B1020] focus:border-[#8FA8FF]'
                      }`}
                      title="Enter local source deployment path"
                    />
                  </label>
                </div>

                <div className="flex gap-4">
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => void handleDeploy()}
                      className={`rounded-xl px-4 py-3 font-semibold text-black transition-colors ${
                        deploymentFlashError ? 'bg-red-500 hover:bg-red-400' : 'bg-[#EBCA6A] hover:bg-[#F4D883]'
                      }`}
                    >
                      Deploy
                    </button>
                  </div>

                  <label className="block flex-1">
                    <input
                      type="text"
                      value={deploymentAccountPrivateKey}
                      onChange={(event) => handleDeploymentPrivateKeyChange(event.target.value)}
                      onBlur={handleDeploymentPrivateKeyBlur}
                      placeholder={deploymentKeyRequiredMessage}
                      className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-3 text-white outline-none transition-colors focus:border-[#8FA8FF]"
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-4">
                  <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                    <span className="text-sm font-semibold text-[#8FA8FF]">{`${deploymentVersionPrefix} Public Key`}</span>
                      <input
                      type="text"
                      value={deploymentPublicKey}
                      readOnly
                      placeholder="Public Key, Returned from Deployment"
                      className="w-full rounded-xl border border-[#31416F] bg-[#0B1020] px-4 py-3 text-slate-300 outline-none"
                    />
                  </label>

                </div>

                <div>
                  <span className="mb-2 block text-sm font-semibold text-[#8FA8FF]">Status</span>
                  <div className="rounded-xl border border-dashed border-[#31416F] bg-[#0B1020] p-4 text-sm text-slate-300">
                    <p className="leading-6 text-white">
                      {!deploymentStatusIsError && deploymentVersionStatusMatch ? (
                        <>
                          <span className="font-semibold text-green-400">{deploymentVersionStatusMatch[1]}</span>
                          <span>{deploymentVersionStatusMatch[2]}</span>
                        </>
                      ) : !deploymentStatusIsError && deploymentScaffoldStatusMatch ? (
                        <>
                          <span>{`Status: ${deploymentScaffoldStatusMatch[1]}`}</span>
                          <br />
                          <span>{`Mocked Deployment: ${deploymentScaffoldStatusMatch[2]}`}</span>
                          <br />
                          <span>{`Contract Public Key: ${deploymentScaffoldStatusMatch[3]}`}</span>
                          <br />
                          <span>{`Contract Name: ${deploymentScaffoldStatusMatch[4]}`}</span>
                          <br />
                          <span>{`Network: ${deploymentScaffoldStatusMatch[5]}`}</span>
                          <br />
                          <br />
                          <span>Set toggle radio button to Blockchain for real deployment execution</span>
                        </>
                      ) : !deploymentStatusIsError && deploymentMockingStatusMatch ? (
                        <>
                          <span>{`Status: ${deploymentMockingStatusMatch[1]}`}</span>
                          <br />
                          <span>Mocked Deployment: "</span>
                          <span className="font-semibold text-green-400">{deploymentMockingStatusMatch[2]}</span>
                          <span>" is ready for deployment.</span>
                          <br />
                          <span>{`Contract Public Key: ${deploymentMockingStatusMatch[3]}`}</span>
                          <br />
                          <span>{`Contract Name: ${deploymentMockingStatusMatch[4]}`}</span>
                          <br />
                          <span>{`Network: ${deploymentMockingStatusMatch[5]}`}</span>
                          <br />
                          <br />
                          <span>Set toggle radio button to Blockchain for real deployment execution</span>
                        </>
                      ) : !deploymentStatusIsError && deploymentReadyStatusMatch ? (
                        <>
                          <span>{`Status: ${deploymentReadyStatusMatch[1]}`}</span>
                          <br />
                          <span>Blockchain Deployment: "</span>
                          <span className="font-semibold text-green-400">{deploymentReadyStatusMatch[2]}</span>
                          <span>" is ready for deployment.</span>
                          <br />
                          <span>{`Contract Public Key: ${deploymentReadyStatusMatch[3]}`}</span>
                          <br />
                          <span>{`Contract Name: ${deploymentReadyStatusMatch[4]}`}</span>
                          <br />
                          <span>{`Network: ${deploymentReadyStatusMatch[5]}`}</span>
                          <br />
                          <br />
                          <span>Press Deploy to execute blockchain deployment</span>
                        </>
                      ) : deploymentStatusIsError && deploymentEmptyKeyStatusMatch ? (
                        <>
                          <span>*</span>
                          <span className="text-red-400">Error:</span>
                          <span>{deploymentEmptyKeyStatusMatch[2]}</span>
                          <span className="font-semibold text-green-400">{deploymentEmptyKeyStatusMatch[3]}</span>
                          <span>{deploymentEmptyKeyStatusMatch[4]}</span>
                        </>
                      ) : deploymentStatusIsError && deploymentInvalidKeyStatusMatch ? (
                        <>
                          <span>*</span>
                          <span className="text-red-400">Error:</span>
                          <span>{deploymentInvalidKeyStatusMatch[2]}</span>
                          <span className="font-semibold text-green-400">{deploymentInvalidKeyStatusMatch[3]}</span>
                          <span>{deploymentInvalidKeyStatusMatch[4]}</span>
                        </>
                      ) : deploymentStatusIsError && deploymentErrorStatusMatch ? (
                        <>
                          <span>*</span>
                          <span className="text-red-400">Error:</span>
                          <span>{deploymentErrorStatusMatch[2]}</span>
                        </>
                      ) : (
                        deploymentStatus
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
