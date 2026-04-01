// File: app/(menu)/(dynamic)/SpCoinAccessController/hooks/useSpCoinAccessController.ts
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BrowserProvider, ContractFactory, HDNodeWallet, type Signer } from 'ethers';
import { useAccount } from 'wagmi';
import type { WalletAccountSelectionValue } from '@/components/views/Buttons/WalletAccountSelection';
import { useEthersSigner } from '@/lib/hooks/useEthersSigner';
import { useSettings } from '@/lib/context/hooks/ExchangeContext/nested/useSettings';
import { useExchangeContext } from '@/lib/context/hooks';
import {
  defaultMissingImage,
  getAccountLogoURL,
  normalizeAddressForAssets,
} from '@/lib/context/helpers/assetHelpers';
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
import { SPCOIN_ABI_UPDATED_EVENT, SPCOIN_ABI_VERSION_STORAGE_KEY } from '../../SponsorCoinLab/jsonMethods/shared/spCoinAbi';

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

type AccountMetadata = {
  logoURL: string;
  name?: string;
  symbol?: string;
};

const HARDHAT_CHAIN_ID = 31337;
const HARDHAT_DEPLOYMENT_ACCOUNT_COUNT = 20;
const HARDHAT_DEFAULT_MNEMONIC = 'test test test test test test test test test test test junk';

const buildAccountMetadata = (
  account: Record<string, unknown> | null | undefined,
  fallbackLogoURL: string,
): AccountMetadata => {
  const next: AccountMetadata = {
    logoURL: fallbackLogoURL,
  };

  const name = String(account?.name || '').trim();
  const symbol = String(account?.symbol || '').trim();
  const logoURL = String(account?.logoURL || '').trim();

  if (name) next.name = name;
  if (symbol) next.symbol = symbol;
  if (logoURL) next.logoURL = logoURL;

  if (!account) {
    next.name = 'Account Not Found on Local';
    next.symbol = 'MISSING';
  }

  return next;
};

const loadAccountMetadata = async (address: string): Promise<AccountMetadata | undefined> => {
  const normalizedAddress = String(address || '').trim();
  if (!/^0[xX][a-fA-F0-9]{40}$/.test(normalizedAddress)) return undefined;

  const folder = normalizeAddressForAssets(normalizedAddress);
  const accountLogoURL = folder ? getAccountLogoURL(normalizedAddress) : defaultMissingImage;
  if (!folder) return buildAccountMetadata(null, defaultMissingImage);

  try {
    const response = await fetch(`/assets/accounts/${folder}/account.json`, {
      cache: 'no-store',
    });
    if (!response.ok) return buildAccountMetadata(null, accountLogoURL);
    const accountData = (await response.json()) as Record<string, unknown>;
    return buildAccountMetadata(accountData, accountLogoURL);
  } catch {
    return buildAccountMetadata(null, accountLogoURL);
  }
};

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
  downloadedVersion?: string;
  downloadBlocked?: boolean;
  uploadBlocked?: boolean;
  deploymentPublicKey?: string;
  deploymentAbi?: unknown[];
  deploymentBytecode?: string;
  deploymentConstructorArgs?: unknown[];
  deploymentChainId?: number;
  deploymentNetworkName?: string;
  mapAdded?: boolean;
  localPathExists?: boolean;
  contractDirExists?: boolean;
  tokenStatus?: 'NOT_FOUND' | 'DEPLOYED' | 'SERVER_INSTALLED';
};

const sanitizeNpmOtpInput = (value: string) => value.replace(/\D/g, '').slice(0, 6);

const parseManagerResponse = async (response: Response): Promise<ManagerResponse> => {
  const rawText = await response.text();
  if (!rawText.trim()) {
    return {
      ok: response.ok,
      message: response.ok ? '' : `Request failed with status ${response.status}.`,
    };
  }

  try {
    return JSON.parse(rawText) as ManagerResponse;
  } catch {
    return {
      ok: false,
      message: rawText.trim() || `Request failed with status ${response.status}.`,
    };
  }
};

type SpCoinAccessStorage = {
  useLocalPackage?: boolean;
  selectedPackage: string;
  selectedVersion: string;
  localInstallSourceRoot: string;
  deploymentName: string;
  deploymentSymbol?: string;
  deploymentDecimals?: string;
  deploymentVersion: string;
  deploymentSignerSource?: 'ec2-base' | 'metamask';
  deploymentSignerPublicKeyInput?: string;
  hardhatDeploymentAccountNumber?: number;
  deploymentAccountPrivateKey: string;
  deployedContractAddress?: string;
  deploymentPublicKey?: string;
  localSourceDeploymentPath: string;
};

type SpCoinContractMetaData = {
  owner: string;
  version: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSypply: string;
  inflationRate: number;
  recipientRateRange: [number, number];
  agentRateRange: [number, number];
};

function normalizeRateRangeTuple(value: unknown): [number, number] {
  if (Array.isArray(value)) {
    return [Number(value[0] ?? 0), Number(value[1] ?? 0)];
  }
  return [0, Number(value ?? 0)];
}

export function useSpCoinAccessController() {
  const router = useRouter();
  const { address: connectedWalletAddress, isConnected: isWalletConnected } = useAccount();
  const ethersSigner = useEthersSigner();
  const [settings, setSettings] = useSettings();
  const { exchangeContext } = useExchangeContext();
  const hasHydratedStorageRef = useRef(false);
  const [chromeHeight, setChromeHeight] = useState(72);
  const managerSettings = settings.spCoinAccessManager ?? {
    source: 'local' as const,
    activeNpmVersion: '0.0.1',
  };
  const [versionInput, setVersionInput] = useState(managerSettings.activeNpmVersion || '0.0.1');
  const [status, setStatus] = useState<string>(
    'Select a SponsorCoin package and version before running download or upload.',
  );
  const [availablePackages, setAvailablePackages] = useState<string[]>([]);
  const [selectedPackage, setSelectedPackage] = useState('@sponsorcoin/spcoin-access-modules');
  const [deploymentStatus, setDeploymentStatus] = useState(
    'Enter your private spCoin deployment values, then use Deploy once the server-side contract automation is connected.',
  );
  const [deploymentName, setDeploymentName] = useState('Sponsor Coin');
  const [deploymentSymbol, setDeploymentSymbol] = useState('SPCOIN');
  const [deploymentDecimals, setDeploymentDecimals] = useState('18');
  const [deploymentVersion, setDeploymentVersion] = useState('0.0.1');
  const [deploymentSignerSource, setDeploymentSignerSource] = useState<'ec2-base' | 'metamask'>('ec2-base');
  const [deploymentSignerPublicKeyInput, setDeploymentSignerPublicKeyInput] = useState('');
  const [hardhatDeploymentAccountNumber, setHardhatDeploymentAccountNumber] = useState(0);
  const [deploymentAccountPrivateKey, setDeploymentAccountPrivateKey] = useState('');
  const [localSourceDeploymentPath, setLocalSourceDeploymentPath] = useState(DEFAULT_LOCAL_SOURCE_DEPLOYMENT_PATH);
  const [deployedContractAddress, setDeployedContractAddress] = useState('');
  const [deploymentLogoPath, setDeploymentLogoPath] = useState('/public/assets/miscellaneous/spCoin.png');
  const [showDeploymentAccountDetails, setShowDeploymentAccountDetails] = useState(false);
  const [showDeployedSignerDetails, setShowDeployedSignerDetails] = useState(false);
  const [deploymentAccountMetadata, setDeploymentAccountMetadata] = useState<AccountMetadata>();
  const [deployedSignerMetadata, setDeployedSignerMetadata] = useState<AccountMetadata>();
  const [localInstallSourceRoot, setLocalInstallSourceRoot] = useState('/spCoinAccess');
  const [localInstallSourceRootError, setLocalInstallSourceRootError] = useState('');
  const [npmOtp, setNpmOtp] = useState('');
  const [downloadBlocked, setDownloadBlocked] = useState(false);
  const [uploadBlocked, setUploadBlocked] = useState(true);
  const [resolvedNpmVersion, setResolvedNpmVersion] = useState(managerSettings.activeNpmVersion || '0.0.1');
  const [localPackageVersion, setLocalPackageVersion] = useState(managerSettings.activeNpmVersion || '0.0.1');
  const [activeDownloadedVersion, setActiveDownloadedVersion] = useState('');
  const [flashTarget, setFlashTarget] = useState<'download' | 'upload' | null>(null);
  const [deploymentFlashError, setDeploymentFlashError] = useState(false);
  const [deploymentStatusIsError, setDeploymentStatusIsError] = useState(false);
  const [activeAction, setActiveAction] = useState<'download' | 'upload' | 'install' | null>(null);
  const [isGeneratingAbi, setIsGeneratingAbi] = useState(false);
  const [deploymentContractDirExists, setDeploymentContractDirExists] = useState(false);
  const [deploymentTokenStatus, setDeploymentTokenStatus] = useState<
    'NOT_FOUND' | 'DEPLOYED' | 'SERVER_INSTALLED'
  >('NOT_FOUND');
  const [deployUiState, setDeployUiState] = useState<'idle' | 'in_progress' | 'deployed'>('idle');
  const refreshDeploymentTokenStatus = async () => {
    const key = String(deployedContractAddress || '').trim();
    const chainId = effectiveDeploymentChainIdNumber;
    if (!/^0[xX][a-fA-F0-9]{40}$/.test(key)) {
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
      const data = await parseManagerResponse(response);
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
  const effectiveDeploymentChainIdNumber =
    deploymentSignerSource === 'ec2-base'
      ? HARDHAT_CHAIN_ID
      : Number.isFinite(rawDeploymentChainId) && rawDeploymentChainId > 0
      ? rawDeploymentChainId
      : 0;
  const deploymentChainName =
    deploymentSignerSource === 'ec2-base'
      ? 'HardHat BASE'
      : rawDeploymentChainId === HARDHAT_CHAIN_ID
      ? 'HardHat BASE'
      : String((exchangeContext as any)?.network?.name || 'Unknown');
  const deploymentChainId =
    effectiveDeploymentChainIdNumber > 0
      ? String(effectiveDeploymentChainIdNumber)
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
  const deploymentWalletSelection: WalletAccountSelectionValue = {
    source: deploymentSignerSource,
    accountNumber: hardhatDeploymentAccountNumber,
  };
  const handleDeploymentWalletSelectionChange = (nextSelection: WalletAccountSelectionValue) => {
    if (nextSelection.source !== deploymentSignerSource) {
      setDeploymentSignerSource(nextSelection.source);
    }
    if (nextSelection.accountNumber !== hardhatDeploymentAccountNumber) {
      setHardhatDeploymentAccountNumber(
        Math.max(
          0,
          Math.min(HARDHAT_DEPLOYMENT_ACCOUNT_COUNT - 1, Number(nextSelection.accountNumber) || 0),
        ),
      );
    }
  };
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
  const selectedHardhatDeploymentPublicKey = useMemo(() => {
    try {
      return HDNodeWallet.fromPhrase(
        HARDHAT_DEFAULT_MNEMONIC,
        undefined,
        `m/44'/60'/0'/0/${hardhatDeploymentAccountNumber}`,
      ).address;
    } catch {
      return '';
    }
  }, [hardhatDeploymentAccountNumber]);
  const selectedDeploymentSignerPublicKey =
    deploymentSignerSource === 'metamask'
      ? String(deploymentSignerPublicKeyInput || '').trim() || String(connectedWalletAddress || '').trim()
      : selectedHardhatDeploymentPublicKey;
  const deployedSignerAddress =
    deployedContractAddress && /^0[xX][a-fA-F0-9]{40}$/.test(String(selectedDeploymentSignerPublicKey || '').trim())
      ? String(selectedDeploymentSignerPublicKey || '').trim()
      : '';
  useEffect(() => {
    if (deploymentSignerSource !== 'metamask') return;
    if (String(deploymentSignerPublicKeyInput || '').trim()) return;
    if (!connectedWalletAddress) return;
    setDeploymentSignerPublicKeyInput(String(connectedWalletAddress).trim());
  }, [connectedWalletAddress, deploymentSignerPublicKeyInput, deploymentSignerSource]);
  useEffect(() => {
    let active = true;
    const run = async () => {
      const metadata = await loadAccountMetadata(selectedDeploymentSignerPublicKey);
      if (active) setDeploymentAccountMetadata(metadata);
    };
    void run();
    return () => {
      active = false;
    };
  }, [selectedDeploymentSignerPublicKey]);
  useEffect(() => {
    let active = true;
    const run = async () => {
      const metadata = await loadAccountMetadata(deployedSignerAddress);
      if (active) setDeployedSignerMetadata(metadata);
    };
    void run();
    return () => {
      active = false;
    };
  }, [deployedSignerAddress]);
  const existsInSpCoinDeploymentMap = useMemo(() => {
    const parsed = spCoinDeploymentMapRaw as SpCoinDeploymentFile;
    const chainIdKey = String(deploymentChainId || '').trim();
    const versionKey = String(deploymentVersion || '').trim() || '0';
    const contractAddressUpper = String(deployedContractAddress || '').trim().toUpperCase();
    if (!/^[0][xX][a-fA-F0-9]{40}$/.test(contractAddressUpper)) return false;
    const chainNode = parsed?.chainId?.[chainIdKey];
    if (!chainNode || typeof chainNode !== 'object') return false;
    if (deploymentSignerSource === 'metamask') {
      return Object.entries(chainNode).some(([nodeKey, nodeValue]) => {
        if (!nodeValue || typeof nodeValue !== 'object') return false;
        if (/^0x[a-fA-F0-9]{64}$/.test(String(nodeKey || '').trim())) {
          const versionNode = (nodeValue as Record<string, unknown>)[versionKey];
          if (!versionNode || typeof versionNode !== 'object') return false;
          return Object.keys(versionNode as Record<string, unknown>).some(
            (nodePublicKey) => String(nodePublicKey || '').trim().toUpperCase() === contractAddressUpper,
          );
        }
        if (String(nodeKey || '').trim() !== versionKey) return false;
        return Object.keys(nodeValue as Record<string, unknown>).some(
          (nodePublicKey) => String(nodePublicKey || '').trim().toUpperCase() === contractAddressUpper,
        );
      });
    }
    const signerKeyRaw = String(deploymentAccountPrivateKey || '').trim();
    const signerKeyLower = signerKeyRaw.toLowerCase();
    if (!/^0x[a-fA-F0-9]{64}$/.test(signerKeyLower)) return false;
    const signerNodeEntry = Object.entries(chainNode).find(
      ([nodeKey]) => String(nodeKey || '').trim().toLowerCase() === signerKeyLower,
    );
    if (!signerNodeEntry) return false;
    const signerNode = signerNodeEntry[1];
    if (!signerNode || typeof signerNode !== 'object') return false;
    const versionNode = (signerNode as Record<string, unknown>)[versionKey];
    if (!versionNode || typeof versionNode !== 'object') return false;
    return Object.keys(versionNode as Record<string, unknown>).some(
      (nodePublicKey) => String(nodePublicKey || '').trim().toUpperCase() === contractAddressUpper,
    );
  }, [deployedContractAddress, deploymentAccountPrivateKey, deploymentChainId, deploymentSignerSource, deploymentVersion]);
  const deployDisableReason = useMemo(() => {
    if (deploymentSignerSource === 'metamask' && !selectedDeploymentSignerPublicKey) {
      return 'METAMASK_NOT_CONNECTED';
    }
    if (deployUiState === 'in_progress') return 'DEPLOYMENT_IN_PROGRESS';
    if (deployUiState === 'deployed') return 'DEPLOYED';
    if (existsInSpCoinDeploymentMap) return 'DEPLOYED_IN_MAP';
    return 'ENABLED';
  }, [deployUiState, existsInSpCoinDeploymentMap, deploymentSignerSource, selectedDeploymentSignerPublicKey]);
  const deployButtonLabel =
    deployUiState === 'in_progress'
      ? 'Deployment In Progress'
      : deployUiState === 'deployed' || existsInSpCoinDeploymentMap
      ? 'Deployed'
      : 'Deploy';
  const isDeployedState = deployUiState === 'deployed' || existsInSpCoinDeploymentMap;
  const deployedContractAddressDisplay = isDeployedState ? deployedContractAddress : '';
  const deploymentGuidanceMessage = useMemo(() => {
    const contractAddress = String(deployedContractAddress || '').trim() || '(pending)';
    const deployLine =
      deployDisableReason === 'ENABLED'
        ? 'Deploy: ENABLED'
        : `Deploy: DISABLED (${deployDisableReason})`;
    const updateServerLine = 'Update Server: AUTO (runs after successful deploy)';
    return [
      'Status: READY',
      `Blockchain Deployment: "${deploymentTokenName}" is ready for deployment.`,
      `Contract Address: ${contractAddress}`,
      `Contract Name: ${deploymentTokenName}`,
      `Network: ${deploymentChainName} (${deploymentChainId})`,
      `Signer Source: ${deploymentSignerSource === 'metamask' ? 'MetaMask' : 'Hardhat Ec2-BASE'}`,
      `Signer Address: ${selectedDeploymentSignerPublicKey || '(pending)'}`,
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
    deployedContractAddress,
    deployedContractAddressDisplay,
    deploymentSignerSource,
    deploymentTokenStatus,
    deploymentTokenName,
    deployDisableReason,
    existsInSpCoinDeploymentMap,
    selectedDeploymentSignerPublicKey,
  ]);
  const deploymentPathDisplayValue = localSourceDeploymentPath;
  const selectedVersion = useMemo(() => {
    const trimmed = versionInput.trim();
    if (!trimmed) return managerSettings.activeNpmVersion || '0.0.1';
    return isVersionFormatValid(trimmed) ? trimmed : managerSettings.activeNpmVersion || '0.0.1';
  }, [managerSettings.activeNpmVersion, versionInput]);

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

    if (deploymentSignerSource === 'ec2-base' && !isValidPrivateKey) {
      setDeploymentStatus(normalizedPrivateKey ? '*Error: Invalid Account Private Key' : '*Error: Account Private Key is required for Deployment.');
      setDeploymentStatusIsError(true);
      setDeploymentFlashError(true);
      setDeployUiState('idle');
      return;
    }

    if (deploymentSignerSource === 'metamask') {
      const desiredMetaMaskAddress = String(selectedDeploymentSignerPublicKey || '').trim().toLowerCase();
      let activeMetaMaskAddress = String(connectedWalletAddress || '').trim();
      let activeEthersSigner: Signer | null = ethersSigner ?? null;

      const resolveMetaMaskSigner = async (): Promise<{ signer: Signer; address: string } | null> => {
        if (typeof window === 'undefined') return null;
        const ethereum = (window as Window & { ethereum?: { request?: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
        if (!ethereum?.request) return null;

        try {
          await ethereum.request({ method: 'eth_requestAccounts' });
          if (desiredMetaMaskAddress) {
            try {
              await ethereum.request({
                method: 'wallet_requestPermissions',
                params: [{ eth_accounts: {} }],
              });
            } catch {
              // If MetaMask declines the account-picker prompt we still re-check the active signer below.
            }
          }
          const provider = new BrowserProvider(ethereum as any);
          const signer = await provider.getSigner();
          const address = String(await signer.getAddress()).trim();
          return address ? { signer, address } : null;
        } catch {
          return null;
        }
      };

      if (
        !isWalletConnected ||
        !activeMetaMaskAddress ||
        !activeEthersSigner ||
        (desiredMetaMaskAddress && activeMetaMaskAddress.toLowerCase() !== desiredMetaMaskAddress)
      ) {
        setDeploymentStatus('Requesting MetaMask account access...');
        const resolvedMetaMaskSigner = await resolveMetaMaskSigner();
        if (resolvedMetaMaskSigner) {
          activeMetaMaskAddress = resolvedMetaMaskSigner.address;
          activeEthersSigner = resolvedMetaMaskSigner.signer;
          if (!String(deploymentSignerPublicKeyInput || '').trim()) {
            setDeploymentSignerPublicKeyInput(resolvedMetaMaskSigner.address);
          }
        }
      }

      if (!activeMetaMaskAddress || !activeEthersSigner) {
        setDeploymentStatus('*Error: Connect MetaMask before deploying.');
        setDeploymentStatusIsError(true);
        setDeploymentFlashError(true);
        setDeployUiState('idle');
        return;
      }
      if (desiredMetaMaskAddress && desiredMetaMaskAddress !== activeMetaMaskAddress.toLowerCase()) {
        setDeploymentStatus('*Error: Switch MetaMask to the deployment account address, then deploy again.');
        setDeploymentStatusIsError(true);
        setDeploymentFlashError(true);
        setDeployUiState('idle');
        return;
      }

      setDeployUiState('in_progress');
      setDeploymentStatusIsError(false);
      setDeploymentFlashError(false);
      setDeploymentStatus(`Deployment ${deploymentContractName} in Progress.`);
      try {
        const prepareResponse = await fetch('/api/spCoin/access-manager', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'prepareDeploy',
            deploymentChainId: effectiveDeploymentChainIdNumber,
            deploymentVersion: normalizedVersion,
          }),
        });
        const prepareData = await parseManagerResponse(prepareResponse);
        if (
          !prepareResponse.ok ||
          !prepareData.ok ||
          !Array.isArray(prepareData.deploymentAbi) ||
          !prepareData.deploymentBytecode
        ) {
          setDeploymentStatus(
            `*Error: Deployment ${deploymentContractName} failed: ${prepareData.message || 'Failed to prepare MetaMask deployment.'}`,
          );
          setDeploymentStatusIsError(true);
          setDeploymentFlashError(true);
          setDeployUiState('idle');
          return;
        }

        setDeploymentStatus(`Deployment ${deploymentContractName} in Progress. Awaiting MetaMask approval...`);
        const factory = new ContractFactory(
          prepareData.deploymentAbi as any[],
          String(prepareData.deploymentBytecode),
          activeEthersSigner,
        );
        const contract = await factory.deploy(
          ...(Array.isArray(prepareData.deploymentConstructorArgs)
            ? prepareData.deploymentConstructorArgs
            : []),
        );
        const deploymentTx = contract.deploymentTransaction();
        if (!deploymentTx) {
          throw new Error('Deployment transaction was not created.');
        }
        const receipt = await deploymentTx.wait();
        const contractPublicKey = String(await contract.getAddress());
        setDeployedContractAddress(contractPublicKey);

        const registerResponse = await fetch('/api/spCoin/access-manager', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'registerDeployment',
            deploymentName: normalizedName,
            deploymentVersion: normalizedVersion,
            deploymentSymbol: normalizedSymbol,
            deploymentDecimals: normalizedDecimals,
            deploymentPublicKey: contractPublicKey,
            deploymentSignerPublicKey: activeMetaMaskAddress,
            deploymentChainId: effectiveDeploymentChainIdNumber,
          }),
        });
        const registerData = await parseManagerResponse(registerResponse);
        if (!registerResponse.ok || !registerData.ok) {
          setDeploymentStatus(
            `*Error: Deployment ${deploymentContractName} failed during registration: ${registerData.message || 'Unknown deployment registration failure.'}`,
          );
          setDeploymentStatusIsError(true);
          setDeploymentFlashError(true);
          setDeployUiState('idle');
          return;
        }

        setDeploymentStatus(`Deployment ${deploymentContractName} complete. Updating server assets...`);
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
            deploymentChainId: effectiveDeploymentChainIdNumber,
          }),
        });
        const updateData = await parseManagerResponse(updateResponse);
        if (!updateResponse.ok || !updateData.ok) {
          setDeploymentStatus(
            `*Error: Deployment ${deploymentContractName} succeeded, but update server failed: ${updateData.message || 'Unknown update failure.'}`,
          );
          setDeploymentStatusIsError(true);
          setDeploymentFlashError(true);
          setDeployUiState('idle');
          return;
        }

        setDeploymentStatus(
          [
            `Status: ${String(receipt?.status ?? 'success')}`,
            `Deployment: Contract "${deploymentContractName}" deployed via MetaMask.`,
            String(registerData.message || 'Deployment registered.'),
            '',
            String(updateData.message || 'Server update completed.'),
            '',
            `Contract Address: ${contractPublicKey || '(not returned)'}`,
            `Signer Address: ${selectedDeploymentSignerPublicKey}`,
            `Network: ${prepareData.deploymentNetworkName || deploymentChainName}`,
            `Transaction Hash: ${String(receipt?.hash || deploymentTx.hash || '(unknown)')}`,
          ].join('\n'),
        );
        await refreshDeploymentTokenStatus();
        setDeployUiState('deployed');
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown MetaMask deployment failure';
        setDeploymentStatus(`*Error: Deployment ${deploymentContractName} failed: ${message}`);
        setDeploymentStatusIsError(true);
        setDeploymentFlashError(true);
        setDeployUiState('idle');
        return;
      }
    }

    setDeployUiState('in_progress');
    setDeploymentStatusIsError(false);
    setDeploymentFlashError(false);
    setDeploymentStatus(`Deployment ${deploymentContractName} in Progress.`);
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
          deploymentChainId: effectiveDeploymentChainIdNumber,
        }),
      });
      const data = await parseManagerResponse(response);
      if (!response.ok || !data.ok) {
        setDeploymentStatus(
          `*Error: Deployment ${deploymentContractName} failed: Status ${response.status}: ${data.message || 'Deployment request failed.'}`,
        );
        setDeploymentStatusIsError(true);
        setDeploymentFlashError(true);
        setDeployUiState('idle');
        return;
      }
      const contractPublicKey = String(data.deploymentPublicKey || '');
      const statusMessage =
        data.message ||
        `Deployment scaffold prepared for "${deploymentContractName}". Server-side deployment automation is not connected yet.`;
      setDeployedContractAddress(contractPublicKey);
      setDeploymentStatus(`Deployment ${deploymentContractName} complete. Updating server assets...`);
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
          deploymentChainId: effectiveDeploymentChainIdNumber,
        }),
      });
      const updateData = await parseManagerResponse(updateResponse);
      if (!updateResponse.ok || !updateData.ok) {
        setDeploymentStatus(
          `*Error: Deployment ${deploymentContractName} succeeded, but update server failed: ${updateData.message || 'Unknown update failure.'}`,
        );
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
          `Contract Address: ${contractPublicKey || '(not returned)'}`,
          `Contract Name: ${deploymentContractName}`,
          `Network: ${deploymentChainName}`,
        ].join('\n'),
      );
      await refreshDeploymentTokenStatus();
      setDeployUiState('deployed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown deployment request failure';
      setDeploymentStatus(`*Error: Deployment ${deploymentContractName} failed: ${message}`);
      setDeploymentStatusIsError(true);
      setDeploymentFlashError(true);
      setDeployUiState('idle');
    }
  };

  const handleGenerateAbi = async () => {
    if (isGeneratingAbi) return;
    setIsGeneratingAbi(true);
    setDeploymentStatusIsError(false);
    setDeploymentFlashError(false);
    setDeploymentStatus('Generating SPCoin ABI...');
    try {
      const response = await fetch('/api/spCoin/access-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateAbi',
          deploymentChainId: effectiveDeploymentChainIdNumber,
        }),
      });
      const data = await parseManagerResponse(response);
      if (!response.ok || !data.ok) {
        setDeploymentStatus(`*Error: ${data.message || 'Failed to generate SPCoin ABI.'}`);
        setDeploymentStatusIsError(true);
        setDeploymentFlashError(true);
        return;
      }
      if (typeof window !== 'undefined') {
        const version = String(Date.now());
        window.dispatchEvent(
          new CustomEvent(SPCOIN_ABI_UPDATED_EVENT, {
            detail: {
              abi: Array.isArray(data.deploymentAbi) ? data.deploymentAbi : undefined,
              version,
            },
          }),
        );
        window.localStorage.setItem(SPCOIN_ABI_VERSION_STORAGE_KEY, version);
      }
      setDeploymentStatus(String(data.message || 'SPCoin ABI generated.'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown ABI generation failure.';
      setDeploymentStatus(`*Error: ${message}`);
      setDeploymentStatusIsError(true);
      setDeploymentFlashError(true);
    } finally {
      setIsGeneratingAbi(false);
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
    const sanitized = sanitizeVersionInput(nextValue);
    const trimmed = String(sanitized || '').trim();
    setDeploymentVersion(sanitized);
    if (!trimmed) {
      setDeploymentStatusIsError(false);
      return;
    }
    if (!VERSION_FORMAT_REGEX.test(trimmed)) {
      setDeploymentStatus(VERSION_FORMAT_ERROR);
      setDeploymentStatusIsError(true);
      return;
    }
    setDeploymentStatusIsError(false);
  };

  const persistManagerSettings = (next: { source: 'local' | 'node'; activeNpmVersion: string }) => {
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
    persistManagerSettings({ source: managerSettings.source, activeNpmVersion: nextVersion });
    setStatus(`Version set to ${nextVersion}`);
  };

  const applyResolvedVersion = (nextVersion: string) => {
    const normalized = String(nextVersion || '').trim();
    if (!normalized) return;
    setVersionInput(normalized);
    persistManagerSettings({ source: managerSettings.source, activeNpmVersion: normalized });
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
      const currentContractAddressUpper = String(deployedContractAddress || '').trim().toUpperCase();
      const byPublicKey = deploymentMapEntries.find(
        (entry) => String(entry.publicKey || '').trim().toUpperCase() === currentContractAddressUpper,
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
    if (nextPublicKey && deployedContractAddress !== nextPublicKey) setDeployedContractAddress(nextPublicKey);
    if (deploymentSignerSource !== 'metamask' && resolvedPrivateKey && deploymentAccountPrivateKey !== resolvedPrivateKey) {
      setDeploymentAccountPrivateKey(resolvedPrivateKey);
    }
  }, [
    deploymentAccountPrivateKey,
    deploymentChainId,
    deploymentDecimals,
    deploymentMapEntries,
    deploymentName,
    deployedContractAddress,
    deploymentSignerSource,
    deploymentSymbol,
    deploymentVersion,
    hardhatDeploymentAccountNumber,
    hardhatDeploymentAccountOptions,
    selectedHardhatDeploymentAccount,
  ]);
  useEffect(() => {
    setDeployUiState('idle');
  }, [deploymentSignerSource, deploymentVersion, hardhatDeploymentAccountNumber]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(SPCOIN_ACCESS_STORAGE_KEY);
      if (!raw) {
        hasHydratedStorageRef.current = true;
        return;
      }
      const persisted = JSON.parse(raw) as Partial<SpCoinAccessStorage>;
      const nextSelectedPackage = persisted.selectedPackage || selectedPackage;
      const hydratedVersion = persisted.selectedVersion === 'latest' ? '0.0.1' : persisted.selectedVersion;
      const nextSelectedVersion = hydratedVersion || managerSettings.activeNpmVersion || selectedVersion;
      persistManagerSettings({ source: 'local', activeNpmVersion: nextSelectedVersion });
      setSelectedPackage(nextSelectedPackage);
      setVersionInput(nextSelectedVersion);
      setLocalInstallSourceRoot(persisted.localInstallSourceRoot || '/spCoinAccess');
      setDeploymentDecimals(persisted.deploymentDecimals || '18');
      setDeploymentVersion(persisted.deploymentVersion || '0.0.1');
      setDeploymentSignerSource(persisted.deploymentSignerSource === 'metamask' ? 'metamask' : 'ec2-base');
      setDeploymentSignerPublicKeyInput(String(persisted.deploymentSignerPublicKeyInput || '').trim());
      setHardhatDeploymentAccountNumber(
        Number.isInteger(persisted.hardhatDeploymentAccountNumber) &&
          Number(persisted.hardhatDeploymentAccountNumber) >= 0 &&
          Number(persisted.hardhatDeploymentAccountNumber) < HARDHAT_DEPLOYMENT_ACCOUNT_COUNT
          ? Number(persisted.hardhatDeploymentAccountNumber)
          : 0,
      );
      setDeploymentAccountPrivateKey(persisted.deploymentAccountPrivateKey || '');
      setDeployedContractAddress(persisted.deployedContractAddress || persisted.deploymentPublicKey || '');
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
        const data = await parseManagerResponse(response);
        const packages = Array.isArray(data.packages) ? data.packages : [];
        if (!active) return;
        setAvailablePackages(packages);
        if (packages.length === 0) return setStatus('No @sponsorcoin packages were found in node_modules.');
        const nextSelected = packages.includes(selectedPackage) ? selectedPackage : packages[0];
        setSelectedPackage(nextSelected);
        persistManagerSettings({ source: managerSettings.source, activeNpmVersion: selectedVersion });
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
        const data = await parseManagerResponse(response);
        if (!active) return;
        if (data.version) setResolvedNpmVersion(String(data.version).trim());
        if (typeof data.localVersion === 'string') setLocalPackageVersion(String(data.localVersion).trim());
        if (typeof data.downloadedVersion === 'string') {
          setActiveDownloadedVersion(String(data.downloadedVersion).trim());
        }
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
    if (deploymentSignerSource === 'metamask') {
      setDeploymentStatusIsError(false);
      setDeploymentFlashError(false);
      setDeploymentStatus(deploymentGuidanceMessage);
      return;
    }
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
  }, [deploymentAccountPrivateKey, deploymentGuidanceMessage, deploymentSignerSource]);

  useEffect(() => {
    let active = true;
    const checkDeploymentContractDir = async () => {
      const key = String(deployedContractAddress || '').trim();
      const chainId = effectiveDeploymentChainIdNumber;
      if (!/^0[xX][a-fA-F0-9]{40}$/.test(key)) {
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
        const data = await parseManagerResponse(response);
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
  }, [deployedContractAddress, effectiveDeploymentChainIdNumber]);

  useEffect(() => {
    let active = true;
    const hydrateExchangeSpCoinContract = async () => {
      const key = String(deployedContractAddress || '').trim();
      const chainId = effectiveDeploymentChainIdNumber;

      if (!/^0[xX][a-fA-F0-9]{40}$/.test(key)) return;
      if (!Number.isFinite(chainId) || chainId <= 0) return;

      setSettings((prev) => ({
        ...prev,
        spCoinContract: {
          owner: String(prev?.spCoinContract?.owner || '').trim(),
          version: String(prev?.spCoinContract?.version || deploymentVersion || '').trim(),
          name: String(prev?.spCoinContract?.name || deploymentName || '').trim(),
          symbol: String(prev?.spCoinContract?.symbol || deploymentSymbol || '').trim(),
          decimals: Number(prev?.spCoinContract?.decimals ?? Number(deploymentDecimals || 0)),
          totalSypply: String(prev?.spCoinContract?.totalSypply || '').trim(),
          inflationRate: Number(prev?.spCoinContract?.inflationRate ?? 0),
          recipientRateRange: normalizeRateRangeTuple(prev?.spCoinContract?.recipientRateRange),
          agentRateRange: normalizeRateRangeTuple(prev?.spCoinContract?.agentRateRange),
        },
      }));

      try {
        const params = new URLSearchParams({
          deploymentPublicKey: key,
          deploymentChainId: String(chainId),
          includeMetadata: 'true',
        });
        const response = await fetch(`/api/spCoin/access-manager?${params.toString()}`, { method: 'GET' });
        const data = await parseManagerResponse(response) as {
          ok?: boolean;
          spCoinMetaData?: SpCoinContractMetaData;
        };
        if (!active || !response.ok || !data.ok || !data.spCoinMetaData) return;

        setSettings((prev) => ({
          ...prev,
          spCoinContract: {
            owner: String(data.spCoinMetaData?.owner ?? '').trim(),
            version: String(data.spCoinMetaData?.version ?? '').trim(),
            name: String(data.spCoinMetaData?.name ?? '').trim(),
            symbol: String(data.spCoinMetaData?.symbol ?? '').trim(),
            decimals: Number(data.spCoinMetaData?.decimals ?? 0),
            totalSypply: String(data.spCoinMetaData?.totalSypply ?? '').trim(),
            inflationRate: Number(data.spCoinMetaData?.inflationRate ?? 0),
            recipientRateRange: normalizeRateRangeTuple(data.spCoinMetaData?.recipientRateRange),
            agentRateRange: normalizeRateRangeTuple(data.spCoinMetaData?.agentRateRange),
          },
        }));
      } catch {
        // Keep the seeded controller values when metadata fetch fails.
      }
    };
    void hydrateExchangeSpCoinContract();
    return () => {
      active = false;
    };
  }, [
    deployedContractAddress,
    deploymentDecimals,
    deploymentName,
    deploymentSymbol,
    deploymentVersion,
    exchangeContext,
    effectiveDeploymentChainIdNumber,
    setSettings,
  ]);

  useEffect(() => {
    if (!hasHydratedStorageRef.current || typeof window === 'undefined') return;
    const persisted: SpCoinAccessStorage = {
      useLocalPackage: managerSettings.source !== 'node',
      selectedPackage,
      selectedVersion,
      localInstallSourceRoot,
      deploymentName,
      deploymentSymbol,
      deploymentDecimals,
      deploymentVersion,
      deploymentSignerSource,
      deploymentSignerPublicKeyInput,
      hardhatDeploymentAccountNumber,
      deploymentAccountPrivateKey,
      deployedContractAddress,
      localSourceDeploymentPath,
    };
    window.localStorage.setItem(SPCOIN_ACCESS_STORAGE_KEY, JSON.stringify(persisted));
  }, [
    deploymentAccountPrivateKey,
    deploymentName,
    deploymentSymbol,
    deploymentDecimals,
    deployedContractAddress,
    deploymentSignerSource,
    deploymentSignerPublicKeyInput,
    localSourceDeploymentPath,
    deploymentVersion,
    hardhatDeploymentAccountNumber,
    localInstallSourceRoot,
    managerSettings.source,
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
    persistManagerSettings({ source: managerSettings.source, activeNpmVersion: trimmed });
    setStatus(`Version set to ${trimmed}`);
  };

  const handleVersionInputChange = (nextValue: string) => {
    const sanitized = sanitizeVersionInput(nextValue);
    setVersionInput(sanitized);
    const trimmed = sanitized.trim();
    if (!isVersionFormatValid(trimmed)) return setStatus(VERSION_FORMAT_ERROR);
    persistManagerSettings({ source: managerSettings.source, activeNpmVersion: trimmed });
    setStatus(`Version set to ${trimmed}`);
  };

  const handlePackagePersist = (nextPackage: string) => {
    setSelectedPackage(nextPackage);
    persistManagerSettings({ source: managerSettings.source, activeNpmVersion: selectedVersion });
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
      const data = await parseManagerResponse(response);
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
    if (deploymentSignerSource === 'metamask') return;
    setDeploymentAccountPrivateKey(nextValue);
    setDeployedContractAddress('');
    setDeployUiState('idle');
  };
  const handleDeploymentPrivateKeyBlur = () => {
    if (deploymentSignerSource === 'metamask') return;
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
    activeDownloadedVersion,
    downloadBlocked,
    flashTarget,
    selectedVersion,
    status,
    deploymentName,
    deploymentSymbol,
    deploymentDecimals,
    deploymentVersion,
    deploymentSignerSource,
    deploymentWalletSelection,
    hardhatDeploymentAccountNumber,
    selectedSignerAddress: selectedDeploymentSignerPublicKey,
    showDeploymentAccountDetails,
    setShowDeploymentAccountDetails,
    deploymentAccountMetadata,
    showDeployedSignerDetails,
    setShowDeployedSignerDetails,
    deployedSignerAddress,
    deployedSignerMetadata,
    canIncrementHardhatDeploymentAccountNumber,
    canDecrementHardhatDeploymentAccountNumber,
    deploymentChainName,
    deploymentChainId,
    deploymentPathDisplayValue,
    deploymentFlashError,
    deploymentPrivateKey: deploymentAccountPrivateKey,
    deploymentKeyRequiredMessage,
    deploymentVersionPrefix,
    deployedContractAddress,
    deployedContractAddressDisplay,
    deploymentLogoPath,
    deploymentStatus,
    deploymentStatusIsError,
    deploymentContractDirExists,
    deploymentTokenStatus,
    deployDisableReason,
    deployButtonLabel,
    isGeneratingAbi,
    handleCloseAttempt,
    handlePackagePersist,
    setLocalInstallSourceRoot,
    validateLocalInstallSourceRoot,
    setNpmOtp,
    handleVersionInputChange,
    handleVersionPersist,
    adjustVersion,
    runManagerAction,
    setDeploymentSignerSource,
    setDeploymentSignerAddressInput: setDeploymentSignerPublicKeyInput,
    handleDeploymentDecimalsInputChange,
    adjustDeploymentDecimals,
    handleDeploymentVersionInputChange,
    adjustDeploymentVersion,
    handleHardhatDeploymentAccountNumberChange,
    handleDeploymentWalletSelectionChange,
    adjustHardhatDeploymentAccountNumber,
    setLocalSourceDeploymentPath,
    handleDeploy,
    handleGenerateAbi,
    handleDeploymentPrivateKeyChange,
    handleDeploymentPrivateKeyBlur,
    setDeploymentLogoPath,
  };
}
