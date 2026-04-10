import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Contract, Signer } from 'ethers';
import type { Address } from 'viem';
import { hydrateAccountFromAddress, makeAccountFallback } from '@/lib/context/helpers/accountHydration';
import { STATUS, type spCoinAccount } from '@/lib/structure';
import { createSpCoinLibraryAccess, createSpCoinModuleAccess, type SpCoinContractAccess } from '../../jsonMethods/shared';
import type {
  ControllerExchangeContext,
  ControllerSetExchangeContext,
  ExecuteWriteConnected,
  SponsorCoinAccountRole,
  SponsorCoinManageContract,
  TransactionLike,
} from '../types';
import { isAddressLike, isIntegerString, normalizeAddressValue, normalizeParamLabel } from '../utils';

type Params = {
  exchangeContext: ControllerExchangeContext;
  setExchangeContext: ControllerSetExchangeContext;
  defaultSponsorKey: string;
  setDefaultSponsorKeyState: Dispatch<SetStateAction<string>>;
  defaultRecipientKey: string;
  setDefaultRecipientKeyState: Dispatch<SetStateAction<string>>;
  defaultAgentKey: string;
  setDefaultAgentKeyState: Dispatch<SetStateAction<string>>;
  selectedSponsorCoinAccountRole: SponsorCoinAccountRole;
  managedRoleAccountAddress: string;
  setManagedRoleAccountAddress: Dispatch<SetStateAction<string>>;
  managedRecipientKey: string;
  setManagedRecipientKey: Dispatch<SetStateAction<string>>;
  managedRecipientRateKey: string;
  setManagedRecipientRateKey: Dispatch<SetStateAction<string>>;
  selectedWriteSenderAccount?: { address?: string } | null;
  selectedWriteSenderAddress: string;
  effectiveConnectedAddress: string;
  ensureReadRunner: () => Promise<unknown>;
  requireContractAddress: () => string;
  executeWriteConnected: ExecuteWriteConnected;
  useLocalSpCoinAccessPackage: boolean;
  appendLog: (line: string) => void;
};

export function useControllerAccounts({
  exchangeContext,
  setExchangeContext,
  defaultSponsorKey,
  setDefaultSponsorKeyState,
  defaultRecipientKey,
  setDefaultRecipientKeyState,
  defaultAgentKey,
  setDefaultAgentKeyState,
  selectedSponsorCoinAccountRole,
  managedRoleAccountAddress,
  setManagedRoleAccountAddress,
  managedRecipientKey,
  setManagedRecipientKey,
  managedRecipientRateKey,
  setManagedRecipientRateKey,
  selectedWriteSenderAccount,
  selectedWriteSenderAddress,
  effectiveConnectedAddress,
  ensureReadRunner,
  requireContractAddress,
  executeWriteConnected,
  useLocalSpCoinAccessPackage,
  appendLog,
}: Params) {
  const [managedRecipientRateKeyOptions, setManagedRecipientRateKeyOptions] = useState<string[]>([]);
  const [managedRecipientRateKeyHelpText, setManagedRecipientRateKeyHelpText] = useState('');
  const [sponsorCoinAccountManagementStatus, setSponsorCoinAccountManagementStatus] = useState('');
  const accountSyncRequestRef = useRef({
    sponsor: 0,
    recipient: 0,
    agent: 0,
  });

  const sponsorAccountAddress = normalizeAddressValue(
    String(exchangeContext?.accounts?.sponsorAccount?.address ?? ''),
  );
  const recipientAccountAddress = normalizeAddressValue(
    String(exchangeContext?.accounts?.recipientAccount?.address ?? ''),
  );
  const agentAccountAddress = normalizeAddressValue(
    String(exchangeContext?.accounts?.agentAccount?.address ?? ''),
  );
  const activeAccountAddress = normalizeAddressValue(
    String(exchangeContext?.accounts?.activeAccount?.address ?? ''),
  );
  const spCoinOwnerAccountAddress = normalizeAddressValue(
    String(exchangeContext?.accounts?.spCoinOwnerAccount?.address ?? ''),
  );

  const syncRoleAccountToExchangeContext = useCallback(
    (role: SponsorCoinAccountRole, nextValue: string) => {
      const normalized = normalizeAddressValue(nextValue);
      const currentAccount =
        role === 'sponsor'
          ? exchangeContext?.accounts?.sponsorAccount
          : role === 'recipient'
          ? exchangeContext?.accounts?.recipientAccount
          : exchangeContext?.accounts?.agentAccount;
      const currentAddress = normalizeAddressValue(String(currentAccount?.address ?? ''));
      if (normalized === currentAddress) return;

      const accountField =
        role === 'sponsor'
          ? 'sponsorAccount'
          : role === 'recipient'
          ? 'recipientAccount'
          : 'agentAccount';

      if (!normalized) {
        setExchangeContext(
          (prev) => {
            if (!prev.accounts?.[accountField]) return prev;
            return {
              ...prev,
              accounts: {
                ...prev.accounts,
                [accountField]: undefined,
              },
            };
          },
          `SponsorCoinLab:${role}:clearAccount`,
        );
        return;
      }

      if (!isAddressLike(normalized)) return;

      const requestId = ++accountSyncRequestRef.current[role];
      const preservedBalance =
        currentAddress === normalized && typeof currentAccount?.balance === 'bigint'
          ? currentAccount.balance
          : undefined;

      void (async () => {
        let nextAccount: spCoinAccount;
        try {
          nextAccount = await hydrateAccountFromAddress(normalized as Address, {
            balance: preservedBalance,
          });
        } catch {
          nextAccount = makeAccountFallback(
            normalized as Address,
            STATUS.MESSAGE_ERROR,
            `Account ${normalized} metadata could not be loaded`,
            preservedBalance,
          );
        }

        if (accountSyncRequestRef.current[role] !== requestId) return;

        setExchangeContext(
          (prev) => {
            const prevAccount = prev.accounts?.[accountField];
            const prevAddress = normalizeAddressValue(String(prevAccount?.address ?? ''));
            if (
              prevAddress === normalized &&
              prevAccount?.name === nextAccount.name &&
              prevAccount?.symbol === nextAccount.symbol &&
              prevAccount?.logoURL === nextAccount.logoURL &&
              prevAccount?.description === nextAccount.description &&
              prevAccount?.website === nextAccount.website &&
              prevAccount?.type === nextAccount.type &&
              prevAccount?.status === nextAccount.status &&
              prevAccount?.balance === nextAccount.balance
            ) {
              return prev;
            }
            return {
              ...prev,
              accounts: {
                ...prev.accounts,
                [accountField]: nextAccount,
              },
            };
          },
          `SponsorCoinLab:${role}:setAccount`,
        );
      })();
    },
    [
      exchangeContext?.accounts?.agentAccount,
      exchangeContext?.accounts?.recipientAccount,
      exchangeContext?.accounts?.sponsorAccount,
      setExchangeContext,
    ],
  );

  const setDefaultSponsorKey = useCallback(
    (value: string) => {
      const normalized = normalizeAddressValue(value);
      setDefaultSponsorKeyState(normalized);
      syncRoleAccountToExchangeContext('sponsor', normalized);
    },
    [setDefaultSponsorKeyState, syncRoleAccountToExchangeContext],
  );

  const setDefaultRecipientKey = useCallback(
    (value: string) => {
      const normalized = normalizeAddressValue(value);
      setDefaultRecipientKeyState(normalized);
      syncRoleAccountToExchangeContext('recipient', normalized);
    },
    [setDefaultRecipientKeyState, syncRoleAccountToExchangeContext],
  );

  const setDefaultAgentKey = useCallback(
    (value: string) => {
      const normalized = normalizeAddressValue(value);
      setDefaultAgentKeyState(normalized);
      syncRoleAccountToExchangeContext('agent', normalized);
    },
    [setDefaultAgentKeyState, syncRoleAccountToExchangeContext],
  );

  useEffect(() => {
    if (defaultSponsorKey !== sponsorAccountAddress) {
      setDefaultSponsorKeyState(sponsorAccountAddress);
    }
  }, [defaultSponsorKey, setDefaultSponsorKeyState, sponsorAccountAddress]);

  useEffect(() => {
    if (defaultRecipientKey !== recipientAccountAddress) {
      setDefaultRecipientKeyState(recipientAccountAddress);
    }
  }, [defaultRecipientKey, recipientAccountAddress, setDefaultRecipientKeyState]);

  useEffect(() => {
    if (defaultAgentKey !== agentAccountAddress) {
      setDefaultAgentKeyState(agentAccountAddress);
    }
  }, [agentAccountAddress, defaultAgentKey, setDefaultAgentKeyState]);

  const syncEditorAddressFieldToExchangeContext = useCallback(
    (label: string, value: string) => {
      const normalizedLabel = normalizeParamLabel(label);
      if (
        normalizedLabel === 'owner address' ||
        normalizedLabel === 'from address' ||
        normalizedLabel === 'sponsor key' ||
        normalizedLabel === 'sponsor account'
      ) {
        syncRoleAccountToExchangeContext('sponsor', value);
        return;
      }
      if (
        normalizedLabel === 'to address' ||
        normalizedLabel === 'recipient address' ||
        normalizedLabel === 'recipient key' ||
        normalizedLabel === 'recipient account'
      ) {
        syncRoleAccountToExchangeContext('recipient', value);
        return;
      }
      if (
        normalizedLabel === 'spender address' ||
        normalizedLabel === 'agent key' ||
        normalizedLabel === 'agent account' ||
        normalizedLabel === 'account agent key'
      ) {
        syncRoleAccountToExchangeContext('agent', value);
      }
    },
    [syncRoleAccountToExchangeContext],
  );

  const sponsorCoinAccountManagementValidation = useMemo(() => {
    const accountAddress = normalizeAddressValue(managedRoleAccountAddress);
    if (!accountAddress) return { tone: 'neutral' as const, message: '' };
    if (!isAddressLike(accountAddress)) {
      return { tone: 'invalid' as const, message: 'Invalid account address.' };
    }
    if (selectedSponsorCoinAccountRole !== 'agent') {
      return { tone: 'valid' as const, message: 'Ready' };
    }

    const recipientKey = normalizeAddressValue(managedRecipientKey);
    if (!recipientKey) return { tone: 'neutral' as const, message: 'Recipient Key required.' };
    if (!isAddressLike(recipientKey)) {
      return { tone: 'invalid' as const, message: 'Invalid recipient address.' };
    }
    if (!String(managedRecipientRateKey || '').trim()) {
      return { tone: 'neutral' as const, message: 'Recipient Rate Key required.' };
    }
    if (!isIntegerString(managedRecipientRateKey)) {
      return { tone: 'invalid' as const, message: 'Recipient Rate Key must be an integer.' };
    }
    return { tone: 'valid' as const, message: 'Ready' };
  }, [managedRecipientKey, managedRecipientRateKey, managedRoleAccountAddress, selectedSponsorCoinAccountRole]);

  useEffect(() => {
    let cancelled = false;

    const loadManagedRecipientRateKeyOptions = async () => {
      if (selectedSponsorCoinAccountRole !== 'agent') {
        if (!cancelled) {
          setManagedRecipientRateKeyOptions([]);
          setManagedRecipientRateKeyHelpText('');
        }
        return;
      }

      const sponsorKey = normalizeAddressValue(selectedWriteSenderAccount?.address || selectedWriteSenderAddress || effectiveConnectedAddress);
      const recipientKey = normalizeAddressValue(managedRecipientKey);
      if (!isAddressLike(sponsorKey) || !isAddressLike(recipientKey)) {
        if (!cancelled) {
          setManagedRecipientRateKeyOptions([]);
          setManagedRecipientRateKeyHelpText('Select msg.sender and Recipient first to load Recipient Rate Keys.');
        }
        return;
      }

      try {
        const target = requireContractAddress();
        const runner = await ensureReadRunner();
        const access = createSpCoinLibraryAccess(target, runner);
        const rates = (await (access.contract as SpCoinContractAccess).getRecipientRateList?.(sponsorKey, recipientKey)) ?? [];
        if (!cancelled) {
          const nextOptions = rates.map((value) => String(value));
          setManagedRecipientRateKeyOptions(nextOptions);
          setManagedRecipientRateKeyHelpText(
            nextOptions.length > 0
              ? 'Select a Recipient Rate Key from the contract list.'
              : 'No Recipient Rate Keys found for this sponsor/recipient pair.',
          );
        }
      } catch {
        if (!cancelled) {
          setManagedRecipientRateKeyOptions([]);
          setManagedRecipientRateKeyHelpText('Unable to load Recipient Rate Keys from the active contract.');
        }
      }
    };

    void loadManagedRecipientRateKeyOptions();
    return () => {
      cancelled = true;
    };
  }, [
    effectiveConnectedAddress,
    ensureReadRunner,
    managedRecipientKey,
    requireContractAddress,
    selectedSponsorCoinAccountRole,
    selectedWriteSenderAccount?.address,
    selectedWriteSenderAddress,
  ]);

  const handleSponsorCoinAccountAction = useCallback(
    async (action: 'add' | 'delete') => {
      if (sponsorCoinAccountManagementValidation.tone !== 'valid') {
        setSponsorCoinAccountManagementStatus(sponsorCoinAccountManagementValidation.message);
        return;
      }

      const accountAddress = normalizeAddressValue(managedRoleAccountAddress);
      const recipientKey = normalizeAddressValue(managedRecipientKey);
      const recipientRateKey = String(managedRecipientRateKey || '').trim();
      const hardhatSenderAddress = selectedWriteSenderAccount?.address || selectedWriteSenderAddress;
      const accessSource = useLocalSpCoinAccessPackage ? 'local' : 'node_modules';
      const label = `${action}:${selectedSponsorCoinAccountRole}:${accountAddress}`;

      try {
        const tx = await executeWriteConnected<TransactionLike>(
          label,
          async (contract, signer) => {
            const access = createSpCoinModuleAccess(contract as Contract, signer as Signer | undefined, accessSource);
            const baseContract = access.contract as SponsorCoinManageContract;
            const connectedContract = (typeof baseContract.connect === 'function'
              ? (baseContract.connect(signer as Signer) as SponsorCoinManageContract)
              : baseContract) as SponsorCoinManageContract;

            if (action === 'add') {
              if (selectedSponsorCoinAccountRole === 'sponsor') {
                throw new Error(
                  'Sponsors are created through sponsor-recipient or sponsor-recipient-agent relationships. Use addAccountRecipient or addAgents instead.',
                );
              }
              if (selectedSponsorCoinAccountRole === 'recipient') {
                if (typeof connectedContract.addRecipient !== 'function') {
                  throw new Error('addRecipient is not available on the current SpCoin contract access path.');
                }
                return connectedContract.addRecipient(accountAddress) as Promise<TransactionLike>;
              }
              if (typeof connectedContract.addAgent !== 'function') {
                throw new Error('addAgent is not available on the current SpCoin contract access path.');
              }
              return connectedContract.addAgent(
                recipientKey,
                recipientRateKey,
                accountAddress,
              ) as Promise<TransactionLike>;
            }

            if (typeof connectedContract.deleteAccountRecord !== 'function') {
              throw new Error('deleteAccountRecord is not available on the current SpCoin contract access path.');
            }
            return connectedContract.deleteAccountRecord(accountAddress) as Promise<TransactionLike>;
          },
          hardhatSenderAddress,
        );

        if (!tx || typeof tx.wait !== 'function') {
          throw new Error(`${label} did not return a transaction response.`);
        }
        const receipt = await tx.wait();
        appendLog(
          `${action} ${selectedSponsorCoinAccountRole} mined: ${String(receipt?.hash || tx.hash || '(no hash)')}`,
        );
        setSponsorCoinAccountManagementStatus(
          `${action === 'add' ? 'Added' : 'Deleted'} ${selectedSponsorCoinAccountRole} ${accountAddress}.`,
        );
        setManagedRoleAccountAddress('');
        if (selectedSponsorCoinAccountRole === 'agent') {
          setManagedRecipientKey('');
          setManagedRecipientRateKey('');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : `Failed to ${action} ${selectedSponsorCoinAccountRole}.`;
        setSponsorCoinAccountManagementStatus(message);
        appendLog(`${action} ${selectedSponsorCoinAccountRole} failed: ${message}`);
      }
    },
    [
      appendLog,
      executeWriteConnected,
      managedRecipientKey,
      managedRecipientRateKey,
      managedRoleAccountAddress,
      selectedSponsorCoinAccountRole,
      selectedWriteSenderAccount?.address,
      selectedWriteSenderAddress,
      sponsorCoinAccountManagementValidation.message,
      sponsorCoinAccountManagementValidation.tone,
      useLocalSpCoinAccessPackage,
      setManagedRecipientKey,
      setManagedRecipientRateKey,
      setManagedRoleAccountAddress,
    ],
  );

  return {
    sponsorAccountAddress,
    recipientAccountAddress,
    agentAccountAddress,
    activeAccountAddress,
    spCoinOwnerAccountAddress,
    setDefaultSponsorKey,
    setDefaultRecipientKey,
    setDefaultAgentKey,
    syncRoleAccountToExchangeContext,
    syncEditorAddressFieldToExchangeContext,
    managedRecipientRateKeyOptions,
    managedRecipientRateKeyHelpText,
    sponsorCoinAccountManagementValidation,
    sponsorCoinAccountManagementStatus,
    setSponsorCoinAccountManagementStatus,
    handleSponsorCoinAccountAction,
  };
}
