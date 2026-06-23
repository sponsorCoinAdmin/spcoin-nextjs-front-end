export type SpCoinWalletSource = 'metamask' | 'hardhat' | 'offline';
export type SpCoinNetworkSource = 'metamask' | 'directRpc' | 'stored';

export type SpCoinWalletAccountRole =
  | 'active'
  | 'sponsor'
  | 'recipient'
  | 'agent'
  | 'owner'
  | 'signer';

export type SpCoinWalletAccount = {
  address: string;
  privateKey?: string;
  label?: string;
  name?: string;
  symbol?: string;
  email?: string;
  website?: string;
  description?: string;
  logoURL?: string;
  source: SpCoinWalletSource;
};

export type SpCoinWalletSelectionRequest = {
  requestId: string;
  label: string;
  currentAddress?: string;
  allowedRoles?: SpCoinWalletAccountRole[];
  preferredSource?: SpCoinWalletSource;
  requirePrivateKeySigner?: boolean;
  onSelect?: (result: SpCoinWalletSelectionResult) => void;
};

export type SpCoinWalletSelectionResult = {
  address: string;
  source: SpCoinWalletSource;
  role?: SpCoinWalletAccountRole;
  label?: string;
};

export type SpCoinWalletSession = {
  walletSource: SpCoinWalletSource;
  networkSource: SpCoinNetworkSource;
  appChainId: number;
  walletChainId?: number;
  rpcChainId?: number;
  metamaskAuthorized: boolean;
  activeAccountAddress?: string;
  signerSource: SpCoinWalletSource;
  signerAddress?: string;
  signerAvailable: boolean;
};
