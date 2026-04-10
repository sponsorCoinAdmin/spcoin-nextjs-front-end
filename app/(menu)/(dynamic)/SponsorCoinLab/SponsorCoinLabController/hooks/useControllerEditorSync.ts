import { useCallback, useEffect } from 'react';
import type {
  AddressFieldLabels,
  ControllerContractMetadata,
  ControllerExchangeContext,
  ControllerSetExchangeContext,
  ControllerParamDef,
} from '../types';
import { hasNonZeroRateRangeTuple, isDefinedNumber, isIntegerString, normalizeParamLabel } from '../utils';

type Params = {
  exchangeContext: ControllerExchangeContext;
  contractAddress: string;
  defaultSponsorKey: string;
  sponsorAccountAddress: string;
  recipientAccountAddress: string;
  agentAccountAddress: string;
  activeAccountAddress: string;
  sellTokenAmountRaw: string;
  buyTokenAmountRaw: string;
  previewTokenAmountRaw: string;
  methodPanelMode: string;
  activeReadLabels: AddressFieldLabels;
  activeWriteLabels: AddressFieldLabels;
  readAddressA: string;
  readAddressB: string;
  writeAddressA: string;
  writeAddressB: string;
  writeAmountRaw: string;
  selectedWriteSenderAddress: string;
  setExchangeContext: ControllerSetExchangeContext;
  syncRoleAccountToExchangeContext: (role: 'sponsor' | 'recipient' | 'agent', value: string) => void;
  syncEditorAddressFieldToExchangeContext: (label: string, value: string) => void;
};

export function useControllerEditorSync({
  exchangeContext,
  contractAddress,
  defaultSponsorKey,
  sponsorAccountAddress,
  recipientAccountAddress,
  agentAccountAddress,
  activeAccountAddress,
  sellTokenAmountRaw,
  buyTokenAmountRaw,
  previewTokenAmountRaw,
  methodPanelMode,
  activeReadLabels,
  activeWriteLabels,
  readAddressA,
  readAddressB,
  writeAddressA,
  writeAddressB,
  writeAmountRaw,
  selectedWriteSenderAddress,
  setExchangeContext,
  syncRoleAccountToExchangeContext,
  syncEditorAddressFieldToExchangeContext,
}: Params) {
  const buildScriptEditorParamValues = useCallback(
    (params: ControllerParamDef[], contractMeta?: ControllerContractMetadata) => {
      const currentMeta = exchangeContext?.settings?.spCoinContract;
      const resolvedMeta = {
        version:
          contractMeta?.version ?? (String(currentMeta?.version ?? '').trim() || undefined),
        inflationRate:
          contractMeta?.inflationRate ??
          (isDefinedNumber(currentMeta?.inflationRate) ? currentMeta.inflationRate : undefined),
        recipientRateRange:
          contractMeta?.recipientRateRange ??
          (hasNonZeroRateRangeTuple(currentMeta?.recipientRateRange)
            ? currentMeta.recipientRateRange
            : undefined),
        agentRateRange:
          contractMeta?.agentRateRange ??
          (hasNonZeroRateRangeTuple(currentMeta?.agentRateRange)
            ? currentMeta.agentRateRange
            : undefined),
      };
      const senderAddress = defaultSponsorKey || sponsorAccountAddress || activeAccountAddress;

      return params.map((param) => {
        const label = normalizeParamLabel(param.label);
        if (label === 'msg.sender') return senderAddress;
        if (label === 'sponsor key' || label === 'sponsor account') return sponsorAccountAddress;
        if (label === 'recipient key' || label === 'recipient account') return recipientAccountAddress;
        if (label === 'agent key' || label === 'agent account' || label === 'account agent key') {
          return agentAccountAddress;
        }
        if (label === 'account key' || label === 'source key') {
          return sponsorAccountAddress || activeAccountAddress;
        }
        if (label === 'new version') return resolvedMeta.version ?? '';
        if (label === 'new inflation rate') {
          return resolvedMeta.inflationRate !== undefined ? String(resolvedMeta.inflationRate) : '';
        }
        if (label === 'new lower recipient rate') {
          return resolvedMeta.recipientRateRange ? String(resolvedMeta.recipientRateRange[0]) : '';
        }
        if (label === 'new upper recipient rate') {
          return resolvedMeta.recipientRateRange ? String(resolvedMeta.recipientRateRange[1]) : '';
        }
        if (label === 'new lower agent rate') {
          return resolvedMeta.agentRateRange ? String(resolvedMeta.agentRateRange[0]) : '';
        }
        if (label === 'new upper agent rate') {
          return resolvedMeta.agentRateRange ? String(resolvedMeta.agentRateRange[1]) : '';
        }
        if (label === 'previous release directory') return 'spCoinAccess/contracts/spCoinOrig.BAK';
        if (label === 'latest release directory') return 'spCoinAccess/contracts/spCoin';
        if (label === 'contract address') return String(contractAddress || '').trim();
        return '';
      });
    },
    [
      activeAccountAddress,
      agentAccountAddress,
      contractAddress,
      defaultSponsorKey,
      exchangeContext?.settings?.spCoinContract,
      recipientAccountAddress,
      sponsorAccountAddress,
    ],
  );

  const buildErc20ReadEditorDefaults = useCallback(
    (labels: AddressFieldLabels) => {
      const senderAddress = defaultSponsorKey || sponsorAccountAddress || activeAccountAddress;
      const resolveByLabel = (label: string) => {
        const normalized = normalizeParamLabel(label);
        if (normalized === 'owner address' || normalized === 'from address') return senderAddress;
        if (normalized === 'to address' || normalized === 'recipient address' || normalized === 'recipient key') {
          return recipientAccountAddress;
        }
        if (normalized === 'spender address') return agentAccountAddress;
        return '';
      };
      return {
        addressA: resolveByLabel(labels.addressALabel),
        addressB: resolveByLabel(labels.addressBLabel),
      };
    },
    [
      activeAccountAddress,
      agentAccountAddress,
      defaultSponsorKey,
      recipientAccountAddress,
      sponsorAccountAddress,
    ],
  );

  const buildErc20WriteEditorDefaults = useCallback(
    (labels: AddressFieldLabels) => {
      const senderAddress = defaultSponsorKey || sponsorAccountAddress || activeAccountAddress;
      const resolveByLabel = (label: string) => {
        const normalized = normalizeParamLabel(label);
        if (normalized === 'from address' || normalized === 'owner address') return senderAddress;
        if (normalized === 'to address' || normalized === 'recipient address' || normalized === 'recipient key') {
          return recipientAccountAddress;
        }
        if (normalized === 'spender address') return agentAccountAddress;
        return '';
      };
      const amountValue = sellTokenAmountRaw || buyTokenAmountRaw || previewTokenAmountRaw;
      return {
        senderAddress,
        addressA: resolveByLabel(labels.addressALabel),
        addressB: resolveByLabel(labels.addressBLabel),
        amount: amountValue,
      };
    },
    [
      activeAccountAddress,
      agentAccountAddress,
      buyTokenAmountRaw,
      defaultSponsorKey,
      previewTokenAmountRaw,
      recipientAccountAddress,
      sellTokenAmountRaw,
      sponsorAccountAddress,
    ],
  );

  const syncEditorAmountToExchangeContext = useCallback(
    (value: string) => {
      const trimmed = String(value || '').trim();
      if (!trimmed) {
        setExchangeContext(
          (prev) => {
            const next = structuredClone(prev);
            if (!next.tradeData) return prev;
            if (next.tradeData.sellTokenContract?.amount !== undefined) {
              next.tradeData.sellTokenContract.amount = undefined;
              return next;
            }
            if (next.tradeData.buyTokenContract?.amount !== undefined) {
              next.tradeData.buyTokenContract.amount = undefined;
              return next;
            }
            if (next.tradeData.previewTokenContract?.amount !== undefined) {
              next.tradeData.previewTokenContract.amount = undefined;
              return next;
            }
            return prev;
          },
          'SponsorCoinLab:editorAmount:clear',
        );
        return;
      }
      if (!isIntegerString(trimmed)) return;
      const nextAmount = BigInt(trimmed);
      setExchangeContext(
        (prev) => {
          const next = structuredClone(prev);
          if (!next.tradeData) return prev;
          if (next.tradeData.sellTokenContract) {
            if (next.tradeData.sellTokenContract.amount === nextAmount) return prev;
            next.tradeData.sellTokenContract.amount = nextAmount;
            return next;
          }
          if (next.tradeData.buyTokenContract) {
            if (next.tradeData.buyTokenContract.amount === nextAmount) return prev;
            next.tradeData.buyTokenContract.amount = nextAmount;
            return next;
          }
          if (next.tradeData.previewTokenContract) {
            if (next.tradeData.previewTokenContract.amount === nextAmount) return prev;
            next.tradeData.previewTokenContract.amount = nextAmount;
            return next;
          }
          return prev;
        },
        'SponsorCoinLab:editorAmount:set',
      );
    },
    [setExchangeContext],
  );

  useEffect(() => {
    if (methodPanelMode !== 'ecr20_read') return;
    syncEditorAddressFieldToExchangeContext(activeReadLabels.addressALabel, readAddressA);
  }, [
    activeReadLabels.addressALabel,
    methodPanelMode,
    readAddressA,
    syncEditorAddressFieldToExchangeContext,
  ]);

  useEffect(() => {
    if (methodPanelMode !== 'ecr20_read') return;
    syncEditorAddressFieldToExchangeContext(activeReadLabels.addressBLabel, readAddressB);
  }, [
    activeReadLabels.addressBLabel,
    methodPanelMode,
    readAddressB,
    syncEditorAddressFieldToExchangeContext,
  ]);

  useEffect(() => {
    if (methodPanelMode !== 'erc20_write') return;
    syncRoleAccountToExchangeContext('sponsor', selectedWriteSenderAddress);
  }, [methodPanelMode, selectedWriteSenderAddress, syncRoleAccountToExchangeContext]);

  useEffect(() => {
    if (methodPanelMode !== 'erc20_write') return;
    syncEditorAddressFieldToExchangeContext(activeWriteLabels.addressALabel, writeAddressA);
  }, [
    activeWriteLabels.addressALabel,
    methodPanelMode,
    syncEditorAddressFieldToExchangeContext,
    writeAddressA,
  ]);

  useEffect(() => {
    if (methodPanelMode !== 'erc20_write') return;
    syncEditorAddressFieldToExchangeContext(activeWriteLabels.addressBLabel, writeAddressB);
  }, [
    activeWriteLabels.addressBLabel,
    methodPanelMode,
    syncEditorAddressFieldToExchangeContext,
    writeAddressB,
  ]);

  useEffect(() => {
    if (methodPanelMode !== 'erc20_write') return;
    syncEditorAmountToExchangeContext(writeAmountRaw);
  }, [methodPanelMode, syncEditorAmountToExchangeContext, writeAmountRaw]);

  return {
    buildScriptEditorParamValues,
    buildErc20ReadEditorDefaults,
    buildErc20WriteEditorDefaults,
  };
}
