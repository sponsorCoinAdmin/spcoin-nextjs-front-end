'use client';

import { useEffect, useRef } from 'react';
import type { MethodPanelMode } from '../../scriptBuilder/types';
import type { MethodSelectionSource } from '../types';
import type {
  AddressFieldLabels,
  ControllerContractMetadata,
  ControllerParamDef,
} from '../types';

type Props = {
  methodSelectionSource: MethodSelectionSource;
  editingScriptStepNumber: number | null;
  methodPanelMode: MethodPanelMode;
  selectedReadMethod: string;
  selectedWriteMethod: string;
  selectedSpCoinReadMethod: string;
  selectedSpCoinWriteMethod: string;
  selectedSerializationTestMethod: string;
  queueEditorBaselineReset: () => void;
  defaultSponsorKey: string;
  sponsorAccountAddress: string;
  activeAccountAddress: string;
  activeReadLabels: AddressFieldLabels;
  activeWriteLabels: AddressFieldLabels;
  activeSpCoinReadDef: { params: ControllerParamDef[] };
  activeSpCoinWriteDef: { params: ControllerParamDef[] };
  activeSerializationTestDef: { params: ControllerParamDef[] };
  buildErc20ReadEditorDefaults: (labels: AddressFieldLabels) => { addressA: string; addressB: string };
  buildErc20WriteEditorDefaults: (labels: AddressFieldLabels) => {
    senderAddress?: string;
    addressA: string;
    addressB: string;
    amount?: string;
  };
  buildScriptEditorParamValues: (
    params: ControllerParamDef[],
    metadata?: ControllerContractMetadata,
  ) => string[];
  resolveScriptEditorContractMetadata: (params: ControllerParamDef[]) => Promise<ControllerContractMetadata>;
  setReadAddressA: React.Dispatch<React.SetStateAction<string>>;
  setReadAddressB: React.Dispatch<React.SetStateAction<string>>;
  setSelectedWriteSenderAddress: React.Dispatch<React.SetStateAction<string>>;
  setWriteAddressA: React.Dispatch<React.SetStateAction<string>>;
  setWriteAddressB: React.Dispatch<React.SetStateAction<string>>;
  setWriteAmountRaw: React.Dispatch<React.SetStateAction<string>>;
  setSpReadParams: React.Dispatch<React.SetStateAction<string[]>>;
  setSpWriteParams: React.Dispatch<React.SetStateAction<string[]>>;
  setSerializationTestParams: React.Dispatch<React.SetStateAction<string[]>>;
};

export function useControllerEditorHydration({
  methodSelectionSource,
  editingScriptStepNumber,
  methodPanelMode,
  selectedReadMethod,
  selectedWriteMethod,
  selectedSpCoinReadMethod,
  selectedSpCoinWriteMethod,
  selectedSerializationTestMethod,
  queueEditorBaselineReset,
  defaultSponsorKey,
  sponsorAccountAddress,
  activeAccountAddress,
  activeReadLabels,
  activeWriteLabels,
  activeSpCoinReadDef,
  activeSpCoinWriteDef,
  activeSerializationTestDef,
  buildErc20ReadEditorDefaults,
  buildErc20WriteEditorDefaults,
  buildScriptEditorParamValues,
  resolveScriptEditorContractMetadata,
  setReadAddressA,
  setReadAddressB,
  setSelectedWriteSenderAddress,
  setWriteAddressA,
  setWriteAddressB,
  setWriteAmountRaw,
  setSpReadParams,
  setSpWriteParams,
  setSerializationTestParams,
}: Props) {
  const dropdownHydrationKeyRef = useRef<string>('');

  useEffect(() => {
    if (methodSelectionSource !== 'dropdown' || editingScriptStepNumber !== null) return;
    const hydrationKey = JSON.stringify({
      methodPanelMode,
      selectedReadMethod,
      selectedWriteMethod,
      selectedSpCoinReadMethod,
      selectedSpCoinWriteMethod,
      selectedSerializationTestMethod,
      methodSelectionSource,
      editingScriptStepNumber,
    });
    if (dropdownHydrationKeyRef.current === hydrationKey) return;
    dropdownHydrationKeyRef.current = hydrationKey;
    let cancelled = false;

    const hydrateEditorFromExchangeContext = async () => {
      queueEditorBaselineReset();
      const senderAddress = defaultSponsorKey || sponsorAccountAddress || activeAccountAddress;
      if (methodPanelMode === 'ecr20_read') {
        const nextDefaults = buildErc20ReadEditorDefaults(activeReadLabels);
        setReadAddressA((prev) => (prev === nextDefaults.addressA ? prev : nextDefaults.addressA));
        setReadAddressB((prev) => (prev === nextDefaults.addressB ? prev : nextDefaults.addressB));
        return;
      }

      if (methodPanelMode === 'erc20_write') {
        const nextDefaults = buildErc20WriteEditorDefaults(activeWriteLabels);
        const nextSenderAddress = nextDefaults.senderAddress;
        if (nextSenderAddress) {
          setSelectedWriteSenderAddress((prev) =>
            prev === nextSenderAddress ? prev : nextSenderAddress,
          );
        }
        setWriteAddressA((prev) => (prev === nextDefaults.addressA ? prev : nextDefaults.addressA));
        setWriteAddressB((prev) => (prev === nextDefaults.addressB ? prev : nextDefaults.addressB));
        setWriteAmountRaw((prev) => {
          if (String(prev || '').trim()) return prev;
          return nextDefaults.amount || prev;
        });
        return;
      }

      if (methodPanelMode === 'spcoin_read') {
        setSpReadParams(buildScriptEditorParamValues(activeSpCoinReadDef.params));
        try {
          const nextMeta = await resolveScriptEditorContractMetadata(activeSpCoinReadDef.params);
          if (!cancelled) {
            queueEditorBaselineReset();
            setSpReadParams(buildScriptEditorParamValues(activeSpCoinReadDef.params, nextMeta));
          }
        } catch {
          // Keep the ExchangeContext-derived values when contract reads are unavailable.
        }
        return;
      }

      if (methodPanelMode === 'spcoin_write') {
        if (senderAddress) {
          setSelectedWriteSenderAddress(senderAddress);
        }
        setSpWriteParams(buildScriptEditorParamValues(activeSpCoinWriteDef.params));
        try {
          const nextMeta = await resolveScriptEditorContractMetadata(activeSpCoinWriteDef.params);
          if (!cancelled) {
            queueEditorBaselineReset();
            setSpWriteParams(buildScriptEditorParamValues(activeSpCoinWriteDef.params, nextMeta));
          }
        } catch {
          // Keep the ExchangeContext-derived values when contract reads are unavailable.
        }
        return;
      }

      if (methodPanelMode === 'serialization_tests') {
        setSerializationTestParams(buildScriptEditorParamValues(activeSerializationTestDef.params));
        try {
          const nextMeta = await resolveScriptEditorContractMetadata(activeSerializationTestDef.params);
          if (!cancelled) {
            queueEditorBaselineReset();
            setSerializationTestParams(buildScriptEditorParamValues(activeSerializationTestDef.params, nextMeta));
          }
        } catch {
          // Keep the ExchangeContext-derived values when contract reads are unavailable.
        }
      }
    };

    void hydrateEditorFromExchangeContext();
    return () => {
      cancelled = true;
    };
  }, [
    activeReadLabels,
    activeSerializationTestDef.params,
    activeSpCoinReadDef.params,
    activeSpCoinWriteDef.params,
    activeWriteLabels,
    activeAccountAddress,
    buildErc20ReadEditorDefaults,
    buildErc20WriteEditorDefaults,
    buildScriptEditorParamValues,
    defaultSponsorKey,
    editingScriptStepNumber,
    methodPanelMode,
    methodSelectionSource,
    queueEditorBaselineReset,
    resolveScriptEditorContractMetadata,
    selectedReadMethod,
    selectedSerializationTestMethod,
    selectedSpCoinReadMethod,
    selectedSpCoinWriteMethod,
    selectedWriteMethod,
    setReadAddressA,
    setReadAddressB,
    setSerializationTestParams,
    setSelectedWriteSenderAddress,
    setSpReadParams,
    setSpWriteParams,
    setWriteAddressA,
    setWriteAddressB,
    setWriteAmountRaw,
    sponsorAccountAddress,
  ]);
}
