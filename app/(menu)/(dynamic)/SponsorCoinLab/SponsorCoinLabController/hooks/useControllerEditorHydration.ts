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
    const hydrateEditorFromExchangeContext = () => {
      queueEditorBaselineReset();
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

      // SponsorCoin/utility params should only pull from Active Sponsor Coin Accounts
      // when the user explicitly changes the dropdown selection, not on refresh.
      if (
        methodPanelMode === 'spcoin_rread' ||
        methodPanelMode === 'spcoin_write' ||
        methodPanelMode === 'serialization_tests'
      ) {
        return;
      }
    };

    hydrateEditorFromExchangeContext();
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
