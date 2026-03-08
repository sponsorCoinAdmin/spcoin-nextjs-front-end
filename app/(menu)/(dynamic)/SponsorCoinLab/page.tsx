// File: app/(menu)/(dynamic)/SponsorCoinLab/page.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserProvider, Contract, HDNodeWallet, JsonRpcProvider, Wallet } from 'ethers';
import type { Signer } from 'ethers';
import { useExchangeContext } from '@/lib/context/hooks';
import { getBlockChainName } from '@/lib/context/helpers/NetworkHelpers';

type ConnectionMode = 'metamask' | 'hardhat';

type HardhatAccountOption = {
  address: string;
  privateKey: string;
};

const HARDHAT_DEFAULT_MNEMONIC = 'test test test test test test test test test test test junk';
const HARDHAT_KEYS_STORAGE_KEY = 'spcoin_lab_hardhat_keys_v1';
const HARDHAT_CHAIN_ID_DEC = 31337;
const HARDHAT_CHAIN_ID_HEX = '0x7a69';
const HARDHAT_NETWORK_NAME = 'SponsorCoin HH BASE';

const SPCOIN_LAB_ABI = [
  'function getSerializedSPCoinHeader() view returns (string)',
  'function getAccountList() view returns (address[])',
  'function getSerializedAccountRecord(address _accountKey) view returns (string)',
  'function addAccountRecord(address _accountKey)',
  'function addRecipient(address _recipientKey)',
  'function transfer(address _to, uint256 _value) returns (bool)',
];

const cardStyle =
  'rounded-2xl border border-[#2B3A67] bg-[#11162A] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.25)]';
const buttonStyle =
  'rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-[0.45rem] text-sm text-white transition-colors hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-60';
const inputStyle =
  'w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white placeholder:text-slate-400';

function normalizeAddress(value: string) {
  return String(value || '').trim().toLowerCase();
}

export default function SponsorCoinLabPage() {
  const { exchangeContext } = useExchangeContext();
  const [mode, setMode] = useState<ConnectionMode>('metamask');
  const [rpcUrl, setRpcUrl] = useState(
    'https://rpc.sponsorcoin.org/f5b4d4b4a2614a540189b979d068639c3fd44bbb1dfcdb5a',
  );
  const [mnemonic, setMnemonic] = useState(HARDHAT_DEFAULT_MNEMONIC);
  const [contractAddress, setContractAddress] = useState('');
  const [persistKeys] = useState(true);
  const [hardhatAccounts, setHardhatAccounts] = useState<HardhatAccountOption[]>([]);
  const [selectedHardhatIndex, setSelectedHardhatIndex] = useState(0);
  const [activeSigner, setActiveSigner] = useState<Signer | null>(null);
  const [connectedAddress, setConnectedAddress] = useState('');
  const [connectedChainId, setConnectedChainId] = useState('');
  const [connectedNetworkName, setConnectedNetworkName] = useState('');
  const [status, setStatus] = useState('Ready');
  const [logs, setLogs] = useState<string[]>(['[SponsorCoin Lab] Ready']);

  const [addAccountAddress, setAddAccountAddress] = useState('');
  const [addRecipientAddress, setAddRecipientAddress] = useState('');
  const [transferToAddress, setTransferToAddress] = useState('');
  const [transferAmountRaw, setTransferAmountRaw] = useState('');

  const appendLog = useCallback((line: string) => {
    const stamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${stamp}] ${line}`, ...prev].slice(0, 120));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(HARDHAT_KEYS_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as HardhatAccountOption[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setHardhatAccounts(parsed);
        setSelectedHardhatIndex(0);
      }
    } catch {
      // Ignore bad local cache.
    }
  }, []);

  useEffect(() => {
    if (!persistKeys) return;
    if (typeof window === 'undefined') return;
    if (hardhatAccounts.length === 0) return;
    window.localStorage.setItem(HARDHAT_KEYS_STORAGE_KEY, JSON.stringify(hardhatAccounts));
  }, [hardhatAccounts, persistKeys]);

  const selectedHardhatAccount = useMemo(
    () => hardhatAccounts[selectedHardhatIndex],
    [hardhatAccounts, selectedHardhatIndex],
  );
  const contextAddress = useMemo(() => {
    const active = exchangeContext?.accounts?.activeAccount as { address?: string } | undefined;
    return String(active?.address || '').trim();
  }, [exchangeContext?.accounts?.activeAccount]);
  const contextChainId = useMemo(() => {
    const raw = Number(exchangeContext?.network?.chainId);
    return Number.isFinite(raw) && raw > 0 ? String(raw) : '';
  }, [exchangeContext?.network?.chainId]);
  const contextNetworkName = useMemo(() => {
    return String((exchangeContext as any)?.network?.name || '').trim();
  }, [exchangeContext]);
  const effectiveConnectedAddress = connectedAddress || contextAddress;
  const effectiveConnectedChainId = useMemo(() => {
    if (mode === 'hardhat') return connectedChainId || '31337';
    return connectedChainId || contextChainId;
  }, [connectedChainId, contextChainId, mode]);
  const activeNetworkName = useMemo(() => {
    if (mode === 'hardhat') return HARDHAT_NETWORK_NAME;
    if (connectedNetworkName) return connectedNetworkName;
    const chainIdNum = Number(effectiveConnectedChainId);
    if (Number.isFinite(chainIdNum) && chainIdNum > 0) {
      const known = getBlockChainName(chainIdNum);
      if (known) return known;
    }
    if (contextNetworkName) return contextNetworkName;
    return '(unknown)';
  }, [connectedNetworkName, contextNetworkName, effectiveConnectedChainId, mode]);
  const shouldPromptHardhatBaseConnect =
    mode === 'metamask' && String(effectiveConnectedChainId || '') !== String(HARDHAT_CHAIN_ID_DEC);

  const syncMetaMaskState = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    const provider = new BrowserProvider(ethereum);
    const accounts = (await provider.send('eth_accounts', [])) as string[];
    const network = await provider.getNetwork();
    const chainIdNum = Number(network.chainId);
    const knownName = Number.isFinite(chainIdNum) ? getBlockChainName(chainIdNum) : undefined;
    const fallbackName = String((network as any)?.name || '').trim();

    setConnectedChainId(String(network.chainId));
    setConnectedNetworkName(knownName || fallbackName || '(unknown)');

    if (accounts.length > 0) {
      setConnectedAddress(accounts[0]);
      try {
        const signer = await provider.getSigner();
        setActiveSigner(signer);
      } catch {
        setActiveSigner(null);
      }
      return;
    }

    setConnectedAddress('');
    setActiveSigner(null);
  }, []);

  const syncHardhatState = useCallback(async () => {
    if (mode !== 'hardhat') return;
    if (!rpcUrl.trim()) return;

    try {
      const provider = new JsonRpcProvider(rpcUrl.trim());
      const network = await provider.getNetwork();

      setConnectedChainId(String(network.chainId || HARDHAT_CHAIN_ID_DEC));
      setConnectedNetworkName(HARDHAT_NETWORK_NAME);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Hardhat sync error.';
      appendLog(`Hardhat state sync failed: ${message}`);
    }
  }, [appendLog, mode, rpcUrl]);

  useEffect(() => {
    if (mode !== 'metamask') return;
    if (typeof window === 'undefined') return;
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    void syncMetaMaskState();

    const onChainChanged = (chainHex: string) => {
      const parsed = Number.parseInt(String(chainHex || '').trim(), 16);
      if (Number.isFinite(parsed) && parsed > 0) {
        setConnectedChainId(String(parsed));
        const known = getBlockChainName(parsed);
        if (known) setConnectedNetworkName(known);
      }
      void syncMetaMaskState();
    };

    const onAccountsChanged = (accounts: string[]) => {
      const next = Array.isArray(accounts) && accounts.length > 0 ? String(accounts[0]) : '';
      setConnectedAddress(next);
      void syncMetaMaskState();
    };

    if (typeof ethereum.on === 'function') {
      ethereum.on('chainChanged', onChainChanged);
      ethereum.on('accountsChanged', onAccountsChanged);
    }

    return () => {
      if (typeof ethereum.removeListener === 'function') {
        ethereum.removeListener('chainChanged', onChainChanged);
        ethereum.removeListener('accountsChanged', onAccountsChanged);
      }
    };
  }, [mode, syncMetaMaskState]);

  useEffect(() => {
    if (mode !== 'hardhat') return;
    void syncHardhatState();
  }, [mode, selectedHardhatIndex, syncHardhatState]);

  const requireContractAddress = useCallback(() => {
    const target = contractAddress.trim();
    if (!target) {
      throw new Error('Contract address is required.');
    }
    return target;
  }, [contractAddress]);

  const loadHardhatAccounts = useCallback(async () => {
    try {
      setStatus('Loading Hardhat accounts...');
      const provider = new JsonRpcProvider(rpcUrl.trim());
      const rpcAccounts = (await provider.send('eth_accounts', [])) as string[];

      const derivedByAddress = new Map<string, string>();
      for (let i = 0; i < 20; i++) {
        const path = `m/44'/60'/0'/0/${i}`;
        const wallet = HDNodeWallet.fromPhrase(mnemonic.trim(), undefined, path);
        derivedByAddress.set(normalizeAddress(wallet.address), wallet.privateKey);
      }

      const finalAccounts = rpcAccounts.map((addr, index) => {
        const byAddress = derivedByAddress.get(normalizeAddress(addr));
        if (byAddress) {
          return { address: addr, privateKey: byAddress };
        }
        const fallbackPath = `m/44'/60'/0'/0/${index}`;
        const fallbackWallet = HDNodeWallet.fromPhrase(mnemonic.trim(), undefined, fallbackPath);
        return { address: addr, privateKey: fallbackWallet.privateKey };
      });

      setHardhatAccounts(finalAccounts);
      setSelectedHardhatIndex(0);
      setStatus(`Loaded ${finalAccounts.length} Hardhat accounts.`);
      appendLog(`Loaded ${finalAccounts.length} Hardhat accounts from ${rpcUrl}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Hardhat account load error.';
      setStatus(`Hardhat load failed: ${message}`);
      appendLog(`Hardhat load failed: ${message}`);
    }
  }, [appendLog, mnemonic, rpcUrl]);

  const connectSigner = useCallback(async (): Promise<Signer> => {
    if (mode === 'metamask') {
      if (!window.ethereum) {
        throw new Error('MetaMask provider not found.');
      }
      const provider = new BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);

      try {
        await provider.send('wallet_switchEthereumChain', [{ chainId: HARDHAT_CHAIN_ID_HEX }]);
      } catch (switchError: any) {
        const code = Number(switchError?.code ?? switchError?.error?.code ?? 0);
        if (code !== 4902) throw switchError;
        await provider.send('wallet_addEthereumChain', [
          {
            chainId: HARDHAT_CHAIN_ID_HEX,
            chainName: HARDHAT_NETWORK_NAME,
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: [rpcUrl.trim()],
          },
        ]);
        await provider.send('wallet_switchEthereumChain', [{ chainId: HARDHAT_CHAIN_ID_HEX }]);
      }

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      const chainIdNum = Number(network.chainId);
      const knownName = Number.isFinite(chainIdNum) ? getBlockChainName(chainIdNum) : undefined;
      const fallbackName = String((network as any)?.name || '').trim();

      setActiveSigner(signer);
      setConnectedAddress(address);
      setConnectedChainId(String(network.chainId));
      setConnectedNetworkName(knownName || fallbackName || '(unknown)');
      setStatus(`Connected via MetaMask: ${address}`);
      appendLog(`Connected MetaMask signer ${address} on chain ${String(network.chainId)}.`);
      return signer;
    }

    if (!selectedHardhatAccount?.address || !selectedHardhatAccount.privateKey) {
      throw new Error('Select a Hardhat account with a private key.');
    }

    const provider = new JsonRpcProvider(rpcUrl.trim());
    const wallet = new Wallet(selectedHardhatAccount.privateKey, provider);
    const network = await provider.getNetwork();
    const address = await wallet.getAddress();

    setActiveSigner(wallet);
    setConnectedAddress(address);
    setConnectedChainId(String(network.chainId));
    setConnectedNetworkName(HARDHAT_NETWORK_NAME);
    setStatus(`Connected via Hardhat signer: ${address}`);
    appendLog(`Connected Hardhat signer ${address} on chain ${String(network.chainId)}.`);
    return wallet;
  }, [appendLog, mode, rpcUrl, selectedHardhatAccount]);

  const ensureReadRunner = useCallback(async () => {
    if (mode === 'hardhat') {
      const provider = new JsonRpcProvider(rpcUrl.trim());
      const network = await provider.getNetwork();
      setConnectedChainId(String(network.chainId || HARDHAT_CHAIN_ID_DEC));
      setConnectedNetworkName(HARDHAT_NETWORK_NAME);
      return provider;
    }
    if (!window.ethereum) {
      throw new Error('MetaMask provider not found.');
    }
    const provider = new BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    const chainIdNum = Number(network.chainId);
    const knownName = Number.isFinite(chainIdNum) ? getBlockChainName(chainIdNum) : undefined;
    const fallbackName = String((network as any)?.name || '').trim();
    setConnectedChainId(String(network.chainId));
    setConnectedNetworkName(knownName || fallbackName || '(unknown)');
    return provider;
  }, [mode, rpcUrl]);

  const isConnectionRetryableError = useCallback((error: unknown): boolean => {
    const message = String((error as any)?.message || '').toLowerCase();
    if (!message) return true;
    return (
      message.includes('missing signer') ||
      message.includes('missing provider') ||
      message.includes('connect') ||
      message.includes('not connected') ||
      message.includes('network') ||
      message.includes('account') ||
      message.includes('unauthorized') ||
      message.includes('unknown account')
    );
  }, []);

  const resolveHardhatAccount = useCallback(
    (accountKey?: string) => {
      const key = normalizeAddress(accountKey || '');
      if (!key) return selectedHardhatAccount;
      return hardhatAccounts.find((entry) => normalizeAddress(entry.address) === key) ?? selectedHardhatAccount;
    },
    [hardhatAccounts, selectedHardhatAccount],
  );

  const executeHHConnected = useCallback(
    async (
      accountKey: string | undefined,
      writeCall: (contract: Contract, signer: Signer) => Promise<any>,
    ) => {
      const target = requireContractAddress();
      const account = resolveHardhatAccount(accountKey);
      if (!account?.address || !account.privateKey) {
        throw new Error('Select a Hardhat account with a private key.');
      }

      const provider = new JsonRpcProvider(rpcUrl.trim());
      const network = await provider.getNetwork();
      const desired = normalizeAddress(account.address);

      const tryWithSigner = async (signer: Signer) => {
        const contract = new Contract(target, SPCOIN_LAB_ABI, signer);
        return writeCall(contract, signer);
      };

      try {
        if (!activeSigner) throw new Error('Missing signer.');
        const activeAddress = normalizeAddress(await activeSigner.getAddress());
        if (activeAddress !== desired) throw new Error('Signer account mismatch.');
        return await tryWithSigner(activeSigner);
      } catch (error) {
        if (!isConnectionRetryableError(error)) throw error;
        appendLog(`HH reconnect for ${account.address}; retrying write.`);
        const signer = new Wallet(account.privateKey, provider);
        const signerAddress = await signer.getAddress();
        setActiveSigner(signer);
        setConnectedAddress(signerAddress);
        setConnectedChainId(String(network.chainId || HARDHAT_CHAIN_ID_DEC));
        setConnectedNetworkName(HARDHAT_NETWORK_NAME);
        return await tryWithSigner(signer);
      }
    },
    [activeSigner, appendLog, isConnectionRetryableError, requireContractAddress, resolveHardhatAccount, rpcUrl],
  );

  const executeMetaMaskConnected = useCallback(
    async (writeCall: (contract: Contract, signer: Signer) => Promise<any>) => {
      const target = requireContractAddress();
      const runWithSigner = async (signer: Signer) => {
        const contract = new Contract(target, SPCOIN_LAB_ABI, signer);
        return writeCall(contract, signer);
      };
      try {
        if (!activeSigner) throw new Error('Missing signer.');
        return await runWithSigner(activeSigner);
      } catch (error) {
        if (!isConnectionRetryableError(error)) throw error;
        appendLog('MetaMask reconnect requested; retrying write.');
        const signer = await connectSigner();
        return await runWithSigner(signer);
      }
    },
    [activeSigner, appendLog, connectSigner, isConnectionRetryableError, requireContractAddress],
  );

  const executeWriteConnected = useCallback(
    async (
      label: string,
      writeCall: (contract: Contract, signer: Signer) => Promise<any>,
      accountKey?: string,
    ) => {
      if (mode === 'hardhat') return executeHHConnected(accountKey, writeCall);
      appendLog(`${label}: using MetaMask signer flow.`);
      return executeMetaMaskConnected(writeCall);
    },
    [appendLog, executeHHConnected, executeMetaMaskConnected, mode],
  );

  const connectHardhatBaseFromNetworkLabel = useCallback(async () => {
    if (!shouldPromptHardhatBaseConnect) return;
    if (!window.ethereum) {
      setStatus('MetaMask provider not found.');
      appendLog('MetaMask provider not found.');
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      try {
        await provider.send('wallet_switchEthereumChain', [{ chainId: HARDHAT_CHAIN_ID_HEX }]);
      } catch (switchError: any) {
        const code = Number(switchError?.code ?? switchError?.error?.code ?? 0);
        if (code !== 4902) throw switchError;
        await provider.send('wallet_addEthereumChain', [
          {
            chainId: HARDHAT_CHAIN_ID_HEX,
            chainName: HARDHAT_NETWORK_NAME,
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: [rpcUrl.trim()],
          },
        ]);
        await provider.send('wallet_switchEthereumChain', [{ chainId: HARDHAT_CHAIN_ID_HEX }]);
      }
      await syncMetaMaskState();
      setStatus(`Switched MetaMask to ${HARDHAT_NETWORK_NAME}.`);
      appendLog(`Switched MetaMask to ${HARDHAT_NETWORK_NAME} from Connected Network label.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown MetaMask switch error.';
      setStatus(`Switch failed: ${message}`);
      appendLog(`Switch to ${HARDHAT_NETWORK_NAME} failed: ${message}`);
    }
  }, [appendLog, rpcUrl, shouldPromptHardhatBaseConnect, syncMetaMaskState]);

  const runHeaderRead = useCallback(async () => {
    try {
      const target = requireContractAddress();
      const runner = await ensureReadRunner();
      const contract = new Contract(target, SPCOIN_LAB_ABI, runner);
      setStatus('Reading SponsorCoin header...');
      const result = (await contract.getSerializedSPCoinHeader()) as string;
      appendLog(`getSerializedSPCoinHeader -> ${result}`);
      setStatus('Header read complete.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown header read error.';
      setStatus(`Header read failed: ${message}`);
      appendLog(`Header read failed: ${message}`);
    }
  }, [appendLog, ensureReadRunner, requireContractAddress]);

  const runAccountListRead = useCallback(async () => {
    try {
      const target = requireContractAddress();
      const runner = await ensureReadRunner();
      const contract = new Contract(target, SPCOIN_LAB_ABI, runner);
      setStatus('Reading account list...');
      const list = (await contract.getAccountList()) as string[];
      appendLog(`getAccountList -> ${JSON.stringify(list)}`);
      setStatus(`Account read complete (${list.length} account(s)).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown account list read error.';
      setStatus(`Account list read failed: ${message}`);
      appendLog(`Account list read failed: ${message}`);
    }
  }, [appendLog, ensureReadRunner, requireContractAddress]);

  const runTreeDump = useCallback(async () => {
    try {
      const target = requireContractAddress();
      const runner = await ensureReadRunner();
      const contract = new Contract(target, SPCOIN_LAB_ABI, runner);
      setStatus('Building tree dump...');
      const list = (await contract.getAccountList()) as string[];
      if (list.length === 0) {
        appendLog('Tree dump skipped: no accounts available.');
        setStatus('Tree dump skipped (no accounts).');
        return;
      }
      const first = list[0];
      const tree = (await contract.getSerializedAccountRecord(first)) as string;
      appendLog(`getSerializedAccountRecord(${first}) -> ${tree}`);
      setStatus('Tree dump complete.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown tree dump error.';
      setStatus(`Tree dump failed: ${message}`);
      appendLog(`Tree dump failed: ${message}`);
    }
  }, [appendLog, ensureReadRunner, requireContractAddress]);

  const runAddAccountRecord = useCallback(async () => {
    try {
      const account = addAccountAddress.trim();
      if (!account) throw new Error('Account address is required.');
      setStatus(`Submitting addAccountRecord(${account})...`);
      const tx = await executeWriteConnected(
        'addAccountRecord',
        (contract) => contract.addAccountRecord(account),
        selectedHardhatAccount?.address,
      );
      appendLog(`addAccountRecord tx sent: ${String(tx?.hash || '(no hash)')}`);
      const receipt = await tx.wait();
      appendLog(`addAccountRecord mined: ${String(receipt?.hash || tx?.hash || '(no hash)')}`);
      setStatus('addAccountRecord complete.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown addAccountRecord error.';
      setStatus(`addAccountRecord failed: ${message}`);
      appendLog(`addAccountRecord failed: ${message}`);
    }
  }, [addAccountAddress, appendLog, executeWriteConnected, selectedHardhatAccount?.address]);

  const runAddRecipient = useCallback(async () => {
    try {
      const recipient = addRecipientAddress.trim();
      if (!recipient) throw new Error('Recipient address is required.');
      setStatus(`Submitting addRecipient(${recipient})...`);
      const tx = await executeWriteConnected(
        'addRecipient',
        (contract) => contract.addRecipient(recipient),
        selectedHardhatAccount?.address,
      );
      appendLog(`addRecipient tx sent: ${String(tx?.hash || '(no hash)')}`);
      const receipt = await tx.wait();
      appendLog(`addRecipient mined: ${String(receipt?.hash || tx?.hash || '(no hash)')}`);
      setStatus('addRecipient complete.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown addRecipient error.';
      setStatus(`addRecipient failed: ${message}`);
      appendLog(`addRecipient failed: ${message}`);
    }
  }, [addRecipientAddress, appendLog, executeWriteConnected, selectedHardhatAccount?.address]);

  const runTransfer = useCallback(async () => {
    try {
      const to = transferToAddress.trim();
      const amount = transferAmountRaw.trim();
      if (!to) throw new Error('Transfer to address is required.');
      if (!amount) throw new Error('Transfer amount is required.');
      setStatus(`Submitting transfer(${to}, ${amount})...`);
      const tx = await executeWriteConnected(
        'transfer',
        (contract) => contract.transfer(to, amount),
        selectedHardhatAccount?.address,
      );
      appendLog(`transfer tx sent: ${String(tx?.hash || '(no hash)')}`);
      const receipt = await tx.wait();
      appendLog(`transfer mined: ${String(receipt?.hash || tx?.hash || '(no hash)')}`);
      setStatus('transfer complete.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown transfer error.';
      setStatus(`transfer failed: ${message}`);
      appendLog(`transfer failed: ${message}`);
    }
  }, [appendLog, executeWriteConnected, selectedHardhatAccount?.address, transferAmountRaw, transferToAddress]);

  return (
    <main className="min-h-screen bg-[#090C16] p-6 text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <h2 className="text-center text-xl font-semibold text-[#8FA8FF]">SponsorCoin Lab</h2>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <article className={cardStyle}>
            <div className="mt-1 grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <h2 className="text-lg font-semibold text-[#5981F3]">Network Connection Mode</h2>
              <div className="justify-self-start md:justify-self-end">
                <select
                  className="w-fit min-w-[14ch] rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as ConnectionMode)}
                >
                  <option value="metamask">MetaMask</option>
                  <option value="hardhat">Hardhat Local</option>
                </select>
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
              <span
                className={`text-sm font-semibold ${
                  shouldPromptHardhatBaseConnect ? 'cursor-pointer text-[#F59E0B] hover:text-[#FACC15]' : 'text-[#8FA8FF]'
                }`}
                title={shouldPromptHardhatBaseConnect ? 'connect "Hardhat Base"' : undefined}
                onClick={shouldPromptHardhatBaseConnect ? () => void connectHardhatBaseFromNetworkLabel() : undefined}
              >
                Connected Network
              </span>
              <input
                type="text"
                value={activeNetworkName}
                readOnly
                className={inputStyle}
              />
              <label className="grid items-center gap-3 md:grid-cols-[auto_auto] md:justify-self-end">
                <span className="text-right text-sm font-semibold text-[#8FA8FF]">Chain Id</span>
                <input
                  type="text"
                  value={effectiveConnectedChainId || '(unknown)'}
                  readOnly
                  className={`${inputStyle} w-[9ch] min-w-[9ch] text-right`}
                />
              </label>
            </div>

            {mode === 'hardhat' && (
              <div className="mt-4 grid grid-cols-1 gap-3">
                <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="text-sm font-semibold text-[#8FA8FF]">Hardhat RPC URL</span>
                  <input
                    className={inputStyle}
                    value={rpcUrl}
                    onChange={(e) => setRpcUrl(e.target.value)}
                    placeholder="Hardhat RPC URL"
                  />
                </label>
                <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="text-sm font-semibold text-[#8FA8FF]">Hard Hat Seed Phrase</span>
                  <input
                    className={inputStyle}
                    value={mnemonic}
                    onChange={(e) => setMnemonic(e.target.value)}
                    placeholder="Hardhat mnemonic"
                  />
                </label>
                <div className="flex w-full items-center gap-2">
                  <button
                    type="button"
                    className={`${buttonStyle} text-[#8FA8FF] focus:text-black`}
                    onClick={loadHardhatAccounts}
                  >
                    Refresh Harhat Accounts
                  </button>
                  <select
                    className="w-[6ch] rounded-lg border border-[#334155] bg-[#0E111B] px-2 py-2 text-sm text-white"
                    value={String(selectedHardhatIndex)}
                    onChange={(e) => setSelectedHardhatIndex(Number.parseInt(e.target.value, 10) || 0)}
                  >
                    {Array.from({ length: 20 }).map((_, idx) => (
                      <option key={`hardhat-idx-${idx}`} value={String(idx)}>
                        {idx}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="text-sm font-semibold text-[#8FA8FF]">Public Signer Account</span>
                  <input
                    className={inputStyle}
                    readOnly
                    value={selectedHardhatAccount?.address || ''}
                    placeholder="Selected account address"
                  />
                </label>
                <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="text-sm font-semibold text-[#8FA8FF]">Private Key</span>
                  <input
                    className={inputStyle}
                    readOnly
                    value={selectedHardhatAccount?.privateKey || ''}
                    placeholder="Select Hardhat account to view private key"
                  />
                </label>
              </div>
            )}
            {mode !== 'hardhat' && (
              <div className="mt-4">
                <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="text-sm font-semibold text-[#8FA8FF]">Public Signer Account</span>
                  <input
                    className={inputStyle}
                    readOnly
                    value={effectiveConnectedAddress || ''}
                    placeholder="Selected account address"
                  />
                </label>
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3">
              <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                <span className="text-sm font-semibold text-[#8FA8FF]">SponsorCoin Contract Address</span>
                <input
                  className={inputStyle}
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  placeholder="SponsorCoin contract address"
                />
              </label>
              {status !== 'Ready' && (
                <div className="text-sm text-slate-300">
                  <div className="mb-2">Status: {status}</div>
                </div>
              )}
            </div>
          </article>

          <article className={cardStyle}>
            <h2 className="text-lg font-semibold text-[#5981F3]">Read / Tree Dump Tests</h2>
            <p className="mt-2 text-sm text-slate-200">
              Read methods are no-fee calls. Tree dump uses the first account from `getAccountList`.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className={buttonStyle} onClick={runHeaderRead}>
                Run Header Read
              </button>
              <button type="button" className={buttonStyle} onClick={runAccountListRead}>
                Run Account List Read
              </button>
              <button type="button" className={buttonStyle} onClick={runTreeDump}>
                Dump First Account Tree
              </button>
            </div>
          </article>

          <article className={cardStyle}>
            <h2 className="text-lg font-semibold text-[#5981F3]">Write Method Tests</h2>
            <p className="mt-2 text-sm text-slate-200">
              Uses connected signer. In Hardhat mode this bypasses MetaMask approval prompts.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                <span className="text-sm font-semibold text-[#8FA8FF]">addAccountRecord Address</span>
                <input
                  className={inputStyle}
                  value={addAccountAddress}
                  onChange={(e) => setAddAccountAddress(e.target.value)}
                  placeholder="addAccountRecord(address)"
                />
              </label>
              <button type="button" className={buttonStyle} onClick={runAddAccountRecord}>
                Test addAccountRecord
              </button>

              <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                <span className="text-sm font-semibold text-[#8FA8FF]">addRecipient Address</span>
                <input
                  className={inputStyle}
                  value={addRecipientAddress}
                  onChange={(e) => setAddRecipientAddress(e.target.value)}
                  placeholder="addRecipient(address)"
                />
              </label>
              <button type="button" className={buttonStyle} onClick={runAddRecipient}>
                Test addRecipient
              </button>

              <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                <span className="text-sm font-semibold text-[#8FA8FF]">transfer To Address</span>
                <input
                  className={inputStyle}
                  value={transferToAddress}
                  onChange={(e) => setTransferToAddress(e.target.value)}
                  placeholder="transfer(to)"
                />
              </label>
              <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                <span className="text-sm font-semibold text-[#8FA8FF]">transfer Amount (raw uint256)</span>
                <input
                  className={inputStyle}
                  value={transferAmountRaw}
                  onChange={(e) => setTransferAmountRaw(e.target.value)}
                  placeholder="transfer(amount raw uint256)"
                />
              </label>
              <button type="button" className={buttonStyle} onClick={runTransfer}>
                Test transfer
              </button>
            </div>
          </article>

          <article className={cardStyle}>
            <h2 className="text-lg font-semibold text-[#5981F3]">Execution Log</h2>
            <pre className="mt-4 h-72 overflow-auto rounded-lg border border-[#334155] bg-[#0B1220] p-3 text-xs text-slate-200">
              {logs.join('\n')}
            </pre>
          </article>
        </section>
      </section>
    </main>
  );
}
