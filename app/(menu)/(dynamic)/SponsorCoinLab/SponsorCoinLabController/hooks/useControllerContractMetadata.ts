import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Address } from 'viem';
import { hydrateAccountFromAddress, makeAccountFallback } from '@/lib/context/helpers/accountHydration';
import {
  DEFAULT_AGENT_RATE_RANGE,
  DEFAULT_RECIPIENT_RATE_RANGE,
  normalizeSpCoinRateRange,
} from '@/lib/context/helpers/spCoinRateDefaults';
import { getBlockChainName } from '@/lib/context/helpers/NetworkHelpers';
import { STATUS, type spCoinAccount } from '@/lib/structure';
import { createSpCoinLibraryAccess } from '../../jsonMethods/shared';
import type { ConnectionMode } from '../../scriptBuilder/types';
import type {
  ControllerContractMetadata,
  ControllerExchangeContext,
  ControllerSetExchangeContext,
  ControllerSetSettings,
} from '../types';
import {
  SP_COIN_LAB_STORAGE_KEY,
  hasNonZeroRateRangeTuple,
  isAddressLike,
  isDefinedNumber,
  normalizeAddressValue,
  normalizeParamLabel,
} from '../utils';

type SponsorCoinVersionChoice = {
  id?: string;
  version?: string;
  chainId?: number;
  address?: string;
  deployer?: string;
  name?: string;
  symbol?: string;
};

type DisplayedSignerMetadata = {
  logoURL?: string;
  name?: string;
  symbol?: string;
};

type ValidationPopupOptions = {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
};

type Params = {
  exchangeContext: ControllerExchangeContext;
  setExchangeContext: ControllerSetExchangeContext;
  setSettings: ControllerSetSettings;
  mode: ConnectionMode;
  setMode: Dispatch<SetStateAction<ConnectionMode>>;
  connectedChainId: string;
  activeNetworkName: string;
  chainIdDisplayValue: string;
  contractAddress: string;
  setContractAddress: (value: string) => void;
  selectedSponsorCoinVersion: string;
  setSelectedSponsorCoinVersion: (value: string) => void;
  selectedSponsorCoinVersionEntry?: SponsorCoinVersionChoice | null;
  sponsorCoinVersionChoices: SponsorCoinVersionChoice[];
  displayedSignerAccountAddress: string;
  displayedSignerAccountMetadata: DisplayedSignerMetadata;
  selectedVersionSymbol: string;
  spCoinOwnerAccountAddress: string;
  ensureReadRunner: () => Promise<unknown>;
  requireContractAddress: () => string;
  appendLog: (line: string) => void;
  setStatus: (value: string) => void;
  showValidationPopup: (
    fieldIds: string[],
    labels: string[],
    message: string,
    options?: ValidationPopupOptions,
  ) => void;
  removedContractAddresses: string[];
  setRemovedContractAddresses: Dispatch<SetStateAction<string[]>>;
};

export function useControllerContractMetadata({
  exchangeContext,
  setExchangeContext,
  setSettings,
  mode,
  setMode,
  connectedChainId,
  activeNetworkName,
  chainIdDisplayValue,
  contractAddress,
  setContractAddress,
  selectedSponsorCoinVersion,
  setSelectedSponsorCoinVersion,
  selectedSponsorCoinVersionEntry,
  sponsorCoinVersionChoices,
  displayedSignerAccountAddress,
  displayedSignerAccountMetadata,
  selectedVersionSymbol,
  spCoinOwnerAccountAddress,
  ensureReadRunner,
  requireContractAddress,
  appendLog,
  setStatus,
  showValidationPopup,
  removedContractAddresses,
  setRemovedContractAddresses,
}: Params) {
  const [hasPersistedNetworkMode, setHasPersistedNetworkMode] = useState<boolean | null>(null);
  const [isRemovingContractFromApp, setIsRemovingContractFromApp] = useState(false);
  const spCoinOwnerSyncRef = useRef({
    contractKey: '',
    requestId: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(SP_COIN_LAB_STORAGE_KEY);
      const saved = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
      const savedMode = typeof saved?.mode === 'string' ? saved.mode : '';
      setHasPersistedNetworkMode(savedMode === 'metamask' || savedMode === 'hardhat');
    } catch {
      setHasPersistedNetworkMode(false);
    }
  }, []);

  const selectedContractChainId = Number(selectedSponsorCoinVersionEntry?.chainId || 0);
  const modeSelectionChainId = Number(exchangeContext?.network?.chainId || connectedChainId || 0);
  const isHardhatContractSelected = selectedContractChainId === 31337;
  const isHardhatNetworkSelected = modeSelectionChainId === 31337;
  const allowContractNetworkModeSelection = isHardhatContractSelected || isHardhatNetworkSelected;

  useEffect(() => {
    if (hasPersistedNetworkMode !== false) return;
    setMode(isHardhatContractSelected || isHardhatNetworkSelected ? 'hardhat' : 'metamask');
  }, [hasPersistedNetworkMode, isHardhatContractSelected, isHardhatNetworkSelected, setMode]);

  useEffect(() => {
    if (!allowContractNetworkModeSelection || mode !== 'metamask') return;
    const connectedChainIdNumber = Number(connectedChainId || 0);
    if (
      (isHardhatContractSelected || isHardhatNetworkSelected) &&
      connectedChainIdNumber !== 31337
    ) {
      setMode('hardhat');
    }
  }, [
    allowContractNetworkModeSelection,
    connectedChainId,
    isHardhatContractSelected,
    isHardhatNetworkSelected,
    mode,
    setMode,
  ]);

  const activeContractChainIdDisplayValue =
    Number.isFinite(selectedContractChainId) && selectedContractChainId > 0
      ? String(selectedContractChainId)
      : chainIdDisplayValue;
  const activeContractChainIdDisplayWidthCh = Math.max(4, String(activeContractChainIdDisplayValue).length + 3);
  const activeContractNetworkName = useMemo(() => {
    if (Number.isFinite(selectedContractChainId) && selectedContractChainId > 0) {
      const known = getBlockChainName(selectedContractChainId);
      if (known) return known;
    }
    return activeNetworkName;
  }, [activeNetworkName, selectedContractChainId]);

  useEffect(() => {
    const contractKey = normalizeAddressValue(
      String(selectedSponsorCoinVersionEntry?.address || contractAddress || ''),
    );
    if (!contractKey) {
      spCoinOwnerSyncRef.current.contractKey = '';
      return;
    }
    if (spCoinOwnerSyncRef.current.contractKey === contractKey) return;

    const ownerAddress = normalizeAddressValue(
      String(selectedSponsorCoinVersionEntry?.deployer || displayedSignerAccountAddress || ''),
    );
    if (!ownerAddress || !isAddressLike(ownerAddress)) return;

    const requestId = ++spCoinOwnerSyncRef.current.requestId;
    const preservedBalance =
      spCoinOwnerAccountAddress === ownerAddress &&
      typeof exchangeContext?.accounts?.spCoinOwnerAccount?.balance === 'bigint'
        ? exchangeContext.accounts.spCoinOwnerAccount.balance
        : undefined;

    void (async () => {
      let nextAccount: spCoinAccount;
      try {
        nextAccount = await hydrateAccountFromAddress(ownerAddress as Address, {
          balance: preservedBalance,
        });
      } catch {
        nextAccount = makeAccountFallback(
          ownerAddress as Address,
          STATUS.MESSAGE_ERROR,
          `Account ${ownerAddress} metadata could not be loaded`,
          preservedBalance,
        );
      }

      if (spCoinOwnerSyncRef.current.requestId !== requestId) return;

      setExchangeContext(
        (prev) => {
          const prevAccount = prev.accounts?.spCoinOwnerAccount;
          const prevAddress = normalizeAddressValue(String(prevAccount?.address ?? ''));
          if (
            prevAddress === ownerAddress &&
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
              spCoinOwnerAccount: nextAccount,
            },
          };
        },
        'SponsorCoinLab:setSpCoinOwnerAccount',
      );

      spCoinOwnerSyncRef.current.contractKey = contractKey;
    })();
  }, [
    contractAddress,
    displayedSignerAccountAddress,
    exchangeContext?.accounts?.spCoinOwnerAccount?.balance,
    selectedSponsorCoinVersionEntry?.deployer,
    selectedSponsorCoinVersionEntry?.address,
    selectedSponsorCoinVersionEntry?.id,
    setExchangeContext,
    spCoinOwnerAccountAddress,
  ]);

  const displayedSpCoinOwnerAddress = selectedSponsorCoinVersionEntry
    ? normalizeAddressValue(
        String(selectedSponsorCoinVersionEntry?.deployer || spCoinOwnerAccountAddress || displayedSignerAccountAddress || ''),
      )
    : displayedSignerAccountAddress;

  const displayedSpCoinOwnerMetadata = useMemo(() => {
    const ownerAccount = exchangeContext?.accounts?.spCoinOwnerAccount;
    if (
      ownerAccount &&
      normalizeAddressValue(String(ownerAccount.address ?? '')) ===
        normalizeAddressValue(displayedSpCoinOwnerAddress)
    ) {
      return {
        logoURL: ownerAccount.logoURL,
        name: ownerAccount.name,
        symbol: ownerAccount.symbol,
      };
    }
    return displayedSignerAccountMetadata;
  }, [
    displayedSignerAccountMetadata,
    displayedSpCoinOwnerAddress,
    exchangeContext?.accounts?.spCoinOwnerAccount,
  ]);

  const resolveScriptEditorContractMetadata = useCallback(
    async (
      params: Array<{ label: string }>,
    ): Promise<{
      version?: string;
      inflationRate?: number;
      recipientRateRange?: [number, number];
      agentRateRange?: [number, number];
    }> => {
      const labels = new Set(params.map((param) => normalizeParamLabel(param.label)));
      const currentMeta = exchangeContext?.settings?.spCoinContract;
      const needsVersion = labels.has('new version') && !String(currentMeta?.version ?? '').trim();
      const needsInflationRate =
        labels.has('new inflation rate') && !isDefinedNumber(currentMeta?.inflationRate);
      const needsLowerRecipient =
        labels.has('new lower recipient rate') &&
        !isDefinedNumber(currentMeta?.recipientRateRange?.[0]);
      const needsUpperRecipient =
        labels.has('new upper recipient rate') &&
        !isDefinedNumber(currentMeta?.recipientRateRange?.[1]);
      const needsLowerAgent =
        labels.has('new lower agent rate') && !isDefinedNumber(currentMeta?.agentRateRange?.[0]);
      const needsUpperAgent =
        labels.has('new upper agent rate') && !isDefinedNumber(currentMeta?.agentRateRange?.[1]);

      if (
        !needsVersion &&
        !needsInflationRate &&
        !needsLowerRecipient &&
        !needsUpperRecipient &&
        !needsLowerAgent &&
        !needsUpperAgent
      ) {
        return {};
      }

      const target = requireContractAddress();
      const runner = await ensureReadRunner();
      const access = createSpCoinLibraryAccess(target, runner);
      const contract = access.contract as Record<string, unknown>;
      const read = (access.read ?? {}) as Record<string, unknown>;

      const callNoArgs = async (...names: string[]) => {
        for (const name of names) {
          const contractFn = contract[name];
          if (typeof contractFn === 'function') {
            try {
              return await (contractFn as () => Promise<unknown>)();
            } catch {
              // Try the next candidate.
            }
          }
          const readFn = read[name];
          if (typeof readFn === 'function') {
            try {
              return await (readFn as () => Promise<unknown>)();
            } catch {
              // Try the next candidate.
            }
          }
        }
        return undefined;
      };

    const nextMeta: ControllerContractMetadata = {};

      if (needsVersion) {
        const version = await callNoArgs('version', 'version');
        const normalized = String(version ?? '').trim();
        if (normalized) nextMeta.version = normalized;
      }

      if (needsInflationRate) {
        const inflationRate = await callNoArgs('getInflationRate', 'annualInflation');
        const normalized = Number(inflationRate);
        if (Number.isFinite(normalized)) nextMeta.inflationRate = normalized;
      }

      if (needsLowerRecipient || needsUpperRecipient) {
        const recipientRange = (await callNoArgs('getRecipientRateRange')) as Array<unknown>;
        const lower = needsLowerRecipient
          ? Number(recipientRange?.[0])
          : Number(currentMeta?.recipientRateRange?.[0]);
        const upper = needsUpperRecipient
          ? Number(recipientRange?.[1])
          : Number(currentMeta?.recipientRateRange?.[1]);
        if (Number.isFinite(lower) && Number.isFinite(upper)) {
          nextMeta.recipientRateRange = [lower, upper];
        }
      }

      if (needsLowerAgent || needsUpperAgent) {
        const agentRange = (await callNoArgs('getAgentRateRange')) as Array<unknown>;
        const lower = needsLowerAgent
          ? Number(agentRange?.[0])
          : Number(currentMeta?.agentRateRange?.[0]);
        const upper = needsUpperAgent
          ? Number(agentRange?.[1])
          : Number(currentMeta?.agentRateRange?.[1]);
        if (Number.isFinite(lower) && Number.isFinite(upper)) {
          nextMeta.agentRateRange = [lower, upper];
        }
      }

      if (
        nextMeta.version !== undefined ||
        nextMeta.inflationRate !== undefined ||
        nextMeta.recipientRateRange !== undefined ||
        nextMeta.agentRateRange !== undefined
      ) {
        setSettings((prev) => {
          const prevContract = prev?.spCoinContract;
          return {
            ...prev,
            spCoinContract: {
              owner: String(prevContract?.owner ?? '').trim(),
              version: nextMeta.version ?? String(prevContract?.version ?? '').trim(),
              name: String(prevContract?.name ?? '').trim(),
              symbol: String(prevContract?.symbol ?? '').trim(),
              decimals: Number(prevContract?.decimals ?? 0),
              totalSypply: String(prevContract?.totalSypply ?? '').trim(),
              inflationRate:
                nextMeta.inflationRate ??
                (isDefinedNumber(prevContract?.inflationRate) ? prevContract.inflationRate : 0),
              recipientRateRange:
                nextMeta.recipientRateRange ??
                normalizeSpCoinRateRange(
                  prevContract?.recipientRateRange,
                  DEFAULT_RECIPIENT_RATE_RANGE,
                ),
              agentRateRange:
                nextMeta.agentRateRange ??
                normalizeSpCoinRateRange(prevContract?.agentRateRange, DEFAULT_AGENT_RATE_RANGE),
            },
          };
        });
      }

      return nextMeta;
    },
    [ensureReadRunner, exchangeContext?.settings?.spCoinContract, requireContractAddress, setSettings],
  );

  const handleRemoveContractFromApp = useCallback(async () => {
    const activeAddress = String(contractAddress || '').trim();
    const activeChainId = Number(selectedSponsorCoinVersionEntry?.chainId || chainIdDisplayValue || 0);
    const activeName = String(selectedSponsorCoinVersionEntry?.name || '').trim() || 'Sponsor Coin';
    const activeSymbol = String(selectedVersionSymbol || '').trim() || 'SPCOIN';
    const fallbackChoice = sponsorCoinVersionChoices.find(
      (entry) => String(entry.address || '').trim().toLowerCase() !== activeAddress.toLowerCase(),
    );

    if (!/^0[xX][a-fA-F0-9]{40}$/.test(activeAddress)) {
      setStatus('Select a valid SponsorCoin contract before removing it from the app.');
      appendLog('Remove From App aborted: invalid contract address.');
      return;
    }
    if (!Number.isFinite(activeChainId) || activeChainId <= 0) {
      setStatus('Unable to determine the active network chain id for removal.');
      appendLog('Remove From App aborted: invalid active chain id.');
      return;
    }

    setIsRemovingContractFromApp(true);
    setStatus(`Removing ${activeName} ${activeSymbol} from app...`);
    appendLog(`Remove From App started for ${activeName} ${activeSymbol} (${activeAddress}).`);
    if (fallbackChoice) {
      setSelectedSponsorCoinVersion(String(fallbackChoice.id || ''));
      setContractAddress(String(fallbackChoice.address || ''));
      appendLog(
        `Switched active SponsorCoin contract to ${String(fallbackChoice.name || fallbackChoice.version || fallbackChoice.address)} before removal.`,
      );
    } else {
      setSelectedSponsorCoinVersion('');
      setContractAddress('');
    }

    try {
      const response = await fetch('/api/spCoin/access-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'removeDeployment',
          deploymentPublicKey: activeAddress,
          deploymentChainId: activeChainId,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };
      if (!response.ok || !data.ok) {
        throw new Error(String(data.message || 'Failed to remove SponsorCoin app entry.'));
      }

      appendLog(String(data.message || `Removed ${activeName} ${activeSymbol} from app.`));
      setRemovedContractAddresses((prev) =>
        prev.some((entry) => entry.toLowerCase() === activeAddress.toLowerCase()) ? prev : [...prev, activeAddress],
      );
      setStatus(`${activeName} ${activeSymbol} removed from app.`);
      if (typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem(SP_COIN_LAB_STORAGE_KEY);
          const saved = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
          window.localStorage.setItem(
            SP_COIN_LAB_STORAGE_KEY,
            JSON.stringify({
              ...saved,
              contractAddress: fallbackChoice?.address || '',
              selectedSponsorCoinVersion: fallbackChoice?.id || '',
            }),
          );
        } catch {
          // Ignore transient localStorage write failures.
        }
      }
      setIsRemovingContractFromApp(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown removal failure.';
      setStatus(`Remove From App failed: ${message}`);
      appendLog(`Remove From App failed: ${message}`);
      setIsRemovingContractFromApp(false);
    }
  }, [
    appendLog,
    chainIdDisplayValue,
    contractAddress,
    removedContractAddresses,
    selectedSponsorCoinVersionEntry?.chainId,
    selectedSponsorCoinVersionEntry?.name,
    sponsorCoinVersionChoices,
    setSelectedSponsorCoinVersion,
    selectedVersionSymbol,
    setContractAddress,
    setRemovedContractAddresses,
    setStatus,
  ]);

  const requestRemoveContractFromApp = useCallback(() => {
    const activeName = String(selectedSponsorCoinVersionEntry?.name || '').trim() || 'Sponsor Coin';
    const activeSymbol = String(selectedVersionSymbol || '').trim() || 'SPCOIN';
    const activeAddress = String(contractAddress || '').trim();

    showValidationPopup(
      [],
      [],
      `This will remove ${activeAddress} from the deployment map, remove matching token-list entries for the active network, and delete the contract asset directory from the app.`,
      {
        title: `Remove ${activeName} ${activeSymbol} From App`,
        confirmLabel: 'Remove',
        cancelLabel: 'Cancel',
        onConfirm: () => void handleRemoveContractFromApp(),
      },
    );
  }, [
    contractAddress,
    handleRemoveContractFromApp,
    selectedSponsorCoinVersionEntry?.name,
    selectedVersionSymbol,
    showValidationPopup,
  ]);

  const metadataChainId = Number(selectedSponsorCoinVersionEntry?.chainId || exchangeContext?.network?.chainId || 0);
  const selectedEntryVersion = String(selectedSponsorCoinVersionEntry?.version || '').trim();
  const selectedEntryName = String(selectedSponsorCoinVersionEntry?.name || '').trim();
  const selectedEntrySymbol = String(selectedSponsorCoinVersionEntry?.symbol || '').trim();

  useEffect(() => {
    let active = true;
    const chainId = metadataChainId;
    const activeContractAddress = String(contractAddress || '').trim();
    const selectedVersion = String(selectedEntryVersion || selectedSponsorCoinVersion || '').trim();

    if (!selectedVersion && !activeContractAddress) return;

    setSettings((prev) => ({
      ...prev,
      spCoinContract: {
        owner: String(prev?.spCoinContract?.owner ?? '').trim(),
        version: selectedVersion,
        name: String(selectedEntryName || (selectedVersion ? `Sponsor Coin V${selectedVersion}` : '')).trim(),
        symbol: String(selectedEntrySymbol || (selectedVersion ? `SPCOIN_V${selectedVersion}` : '')).trim(),
        decimals: Number(prev?.spCoinContract?.decimals ?? 18),
        totalSypply: String(prev?.spCoinContract?.totalSypply ?? '').trim(),
        inflationRate: Number(prev?.spCoinContract?.inflationRate ?? 0),
        recipientRateRange: normalizeSpCoinRateRange(
          prev?.spCoinContract?.recipientRateRange,
          DEFAULT_RECIPIENT_RATE_RANGE,
        ),
        agentRateRange: normalizeSpCoinRateRange(
          prev?.spCoinContract?.agentRateRange,
          DEFAULT_AGENT_RATE_RANGE,
        ),
      },
    }));

    const hydrate = async () => {
      if (!/^0[xX][a-fA-F0-9]{40}$/.test(activeContractAddress)) return;
      if (!Number.isFinite(chainId) || chainId <= 0) return;
      try {
        const params = new URLSearchParams({
          deploymentPublicKey: activeContractAddress,
          deploymentChainId: String(chainId),
          includeMetadata: 'true',
        });
        const response = await fetch(`/api/spCoin/access-manager?${params.toString()}`, { method: 'GET' });
        const data = (await response.json()) as {
          ok?: boolean;
          spCoinMetaData?: {
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
        };
        if (!active || !response.ok || !data.ok || !data.spCoinMetaData) return;
        const nextSpCoinContract = {
          owner: String(data.spCoinMetaData?.owner ?? '').trim(),
          version: String(data.spCoinMetaData?.version ?? '').trim(),
          name: String(data.spCoinMetaData?.name ?? '').trim(),
          symbol: String(data.spCoinMetaData?.symbol ?? '').trim(),
          decimals: Number(data.spCoinMetaData?.decimals ?? 0),
          totalSypply: String(data.spCoinMetaData?.totalSypply ?? '').trim(),
          inflationRate: Number(data.spCoinMetaData?.inflationRate ?? 0),
          recipientRateRange: normalizeSpCoinRateRange(
            data.spCoinMetaData?.recipientRateRange,
            DEFAULT_RECIPIENT_RATE_RANGE,
          ),
          agentRateRange: normalizeSpCoinRateRange(
            data.spCoinMetaData?.agentRateRange,
            DEFAULT_AGENT_RATE_RANGE,
          ),
        };
        setSettings((prev) => {
          const current = prev?.spCoinContract;
          if (
            current &&
            current.owner === nextSpCoinContract.owner &&
            current.version === nextSpCoinContract.version &&
            current.name === nextSpCoinContract.name &&
            current.symbol === nextSpCoinContract.symbol &&
            current.decimals === nextSpCoinContract.decimals &&
            current.totalSypply === nextSpCoinContract.totalSypply &&
            current.inflationRate === nextSpCoinContract.inflationRate &&
            current.recipientRateRange?.[0] === nextSpCoinContract.recipientRateRange[0] &&
            current.recipientRateRange?.[1] === nextSpCoinContract.recipientRateRange[1] &&
            current.agentRateRange?.[0] === nextSpCoinContract.agentRateRange[0] &&
            current.agentRateRange?.[1] === nextSpCoinContract.agentRateRange[1]
          ) {
            return prev;
          }
          return {
            ...prev,
            spCoinContract: nextSpCoinContract,
          };
        });
      } catch {
        // Keep the seeded SponsorCoinLab values when metadata fetch fails.
      }
    };

    void hydrate();
    return () => {
      active = false;
    };
  }, [
    contractAddress,
    metadataChainId,
    selectedSponsorCoinVersion,
    selectedEntryName,
    selectedEntrySymbol,
    selectedEntryVersion,
    setSettings,
  ]);

  const effectiveRecipientRateRange = hasNonZeroRateRangeTuple(exchangeContext?.settings?.spCoinContract?.recipientRateRange)
    ? exchangeContext.settings.spCoinContract.recipientRateRange
    : DEFAULT_RECIPIENT_RATE_RANGE;
  const effectiveAgentRateRange = hasNonZeroRateRangeTuple(exchangeContext?.settings?.spCoinContract?.agentRateRange)
    ? exchangeContext.settings.spCoinContract.agentRateRange
    : DEFAULT_AGENT_RATE_RANGE;

  return {
    allowContractNetworkModeSelection,
    activeContractChainIdDisplayValue,
    activeContractChainIdDisplayWidthCh,
    activeContractNetworkName,
    displayedSpCoinOwnerAddress,
    displayedSpCoinOwnerMetadata,
    resolveScriptEditorContractMetadata,
    isRemovingContractFromApp,
    requestRemoveContractFromApp,
    effectiveRecipientRateRange,
    effectiveAgentRateRange,
  };
}
