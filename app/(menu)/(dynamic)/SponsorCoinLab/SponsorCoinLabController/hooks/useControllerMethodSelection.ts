'use client';

import { useCallback } from 'react';
import {
  ERC20_READ_OPTIONS,
  type Erc20ReadMethod,
} from '../../jsonMethods/erc20/read';
import {
  ERC20_WRITE_OPTIONS,
  type Erc20WriteMethod,
} from '../../jsonMethods/erc20/write';
import { normalizeSpCoinReadMethod, type SpCoinReadMethod } from '../../jsonMethods/spCoin/read';
import type { SpCoinWriteMethod } from '../../jsonMethods/spCoin/write';
import type { SerializationTestMethod } from '../../jsonMethods/serializationTests';
import type { LabScriptStep, MethodPanelMode } from '../../scriptBuilder/types';
import type { ControllerParamDef, MethodDefMap, MethodSelectionSource } from '../types';
import { buildDefaultAccountParams } from '../utils';

type Props = {
  methodPanelMode: MethodPanelMode;
  setMethodPanelMode: React.Dispatch<React.SetStateAction<MethodPanelMode>>;
  activeMethodPanelTab: 'erc20' | 'spcoin_rread' | 'spcoin_write' | 'serialization_tests' | 'todos' | 'admin_utils';
  auxMethodPanelTab: 'admin_utils' | null;
  setAuxMethodPanelTab: React.Dispatch<React.SetStateAction<'admin_utils' | null>>;
  setIsSpCoinTodoMode: React.Dispatch<React.SetStateAction<boolean>>;
  methodSelectionSource: MethodSelectionSource;
  setMethodSelectionSource: React.Dispatch<React.SetStateAction<MethodSelectionSource>>;
  editingScriptStepNumber: number | null;
  setEditingScriptStepNumber: React.Dispatch<React.SetStateAction<number | null>>;
  setSelectedScriptStepNumber: React.Dispatch<React.SetStateAction<number | null>>;
  selectedReadMethod: Erc20ReadMethod;
  setSelectedReadMethod: React.Dispatch<React.SetStateAction<Erc20ReadMethod>>;
  selectedWriteMethod: Erc20WriteMethod;
  setSelectedWriteMethod: React.Dispatch<React.SetStateAction<Erc20WriteMethod>>;
  selectedSpCoinReadMethod: SpCoinReadMethod;
  setSelectedSpCoinReadMethod: React.Dispatch<React.SetStateAction<SpCoinReadMethod>>;
  selectedSpCoinWriteMethod: SpCoinWriteMethod;
  setSelectedSpCoinWriteMethod: React.Dispatch<React.SetStateAction<SpCoinWriteMethod>>;
  selectedSerializationTestMethod: SerializationTestMethod;
  setSelectedSerializationTestMethod: React.Dispatch<React.SetStateAction<SerializationTestMethod>>;
  selectedWriteSenderAddress: string;
  defaultSponsorKey: string;
  defaultRecipientKey: string;
  defaultAgentKey: string;
  defaultRecipientRateKey: string;
  defaultAgentRateKey: string;
  effectiveRecipientRateRange: [number, number];
  effectiveAgentRateRange: [number, number];
  spCoinReadMethodDefs: MethodDefMap & Record<string, { params: ControllerParamDef[] }>;
  spCoinWriteMethodDefs: MethodDefMap & Record<string, { params: ControllerParamDef[] }>;
  serializationTestMethodDefs: MethodDefMap & Record<string, { params: ControllerParamDef[] }>;
  populateMethodParamsFromActiveAccounts: (params: ControllerParamDef[]) => string[];
  setSpReadParams: React.Dispatch<React.SetStateAction<string[]>>;
  setSpWriteParams: React.Dispatch<React.SetStateAction<string[]>>;
  setSerializationTestParams: React.Dispatch<React.SetStateAction<string[]>>;
  spCoinAdminReadOptions: SpCoinReadMethod[];
  spCoinAdminWriteOptions: SpCoinWriteMethod[];
  spCoinTodoWriteOptions: SpCoinWriteMethod[];
  utilityMethodOptions: SerializationTestMethod[];
  adminUtilityReadOptions: SerializationTestMethod[];
  adminUtilityWriteOptions: SerializationTestMethod[];
  runWithDiscardPrompt: (action: () => void | Promise<void>) => void;
  queueEditorBaselineReset: () => void;
  loadScriptStep: (step: LabScriptStep) => void;
  setScriptEditorKind: React.Dispatch<React.SetStateAction<'json' | 'javascript'>>;
};

export function useControllerMethodSelection({
  methodPanelMode,
  setMethodPanelMode,
  activeMethodPanelTab,
  auxMethodPanelTab,
  setAuxMethodPanelTab,
  setIsSpCoinTodoMode,
  methodSelectionSource,
  setMethodSelectionSource,
  editingScriptStepNumber,
  setEditingScriptStepNumber,
  setSelectedScriptStepNumber,
  selectedReadMethod,
  setSelectedReadMethod,
  selectedWriteMethod,
  setSelectedWriteMethod,
  selectedSpCoinReadMethod,
  setSelectedSpCoinReadMethod,
  selectedSpCoinWriteMethod,
  setSelectedSpCoinWriteMethod,
  selectedSerializationTestMethod,
  setSelectedSerializationTestMethod,
  selectedWriteSenderAddress,
  defaultSponsorKey,
  defaultRecipientKey,
  defaultAgentKey,
  defaultRecipientRateKey,
  defaultAgentRateKey,
  effectiveRecipientRateRange,
  effectiveAgentRateRange,
  spCoinReadMethodDefs,
  spCoinWriteMethodDefs,
  serializationTestMethodDefs,
  populateMethodParamsFromActiveAccounts,
  setSpReadParams,
  setSpWriteParams,
  setSerializationTestParams,
  spCoinAdminReadOptions,
  spCoinAdminWriteOptions,
  spCoinTodoWriteOptions,
  utilityMethodOptions,
  adminUtilityReadOptions,
  adminUtilityWriteOptions,
  runWithDiscardPrompt,
  queueEditorBaselineReset,
  loadScriptStep,
  setScriptEditorKind,
}: Props) {
  const resetToDropdownSelection = useCallback(() => {
    setMethodSelectionSource('dropdown');
    setEditingScriptStepNumber(null);
    setSelectedScriptStepNumber(null);
  }, [setMethodSelectionSource, setEditingScriptStepNumber, setSelectedScriptStepNumber]);

  const selectMethodByKind = useCallback(
    (kind: 'erc20Read' | 'erc20Write' | 'spCoinRead' | 'spCoinWrite' | 'serialization', value: string) => {
      if (!value) return;
      if (kind === 'erc20Read') {
        runWithDiscardPrompt(() => {
          resetToDropdownSelection();
          setAuxMethodPanelTab(null);
          setIsSpCoinTodoMode(false);
          setMethodPanelMode('ecr20_read');
          setSelectedReadMethod(value as Erc20ReadMethod);
        });
        return;
      }
      if (kind === 'erc20Write') {
        runWithDiscardPrompt(() => {
          resetToDropdownSelection();
          setAuxMethodPanelTab(null);
          setIsSpCoinTodoMode(false);
          setMethodPanelMode('erc20_write');
          setSelectedWriteMethod(value as Erc20WriteMethod);
        });
        return;
      }
      if (kind === 'spCoinRead') {
        runWithDiscardPrompt(() => {
          resetToDropdownSelection();
          setAuxMethodPanelTab(spCoinAdminReadOptions.includes(value as SpCoinReadMethod) ? 'admin_utils' : null);
          setIsSpCoinTodoMode(false);
          setMethodPanelMode('spcoin_rread');
          setSelectedSpCoinReadMethod(normalizeSpCoinReadMethod(value as SpCoinReadMethod));
          const nextDef = spCoinReadMethodDefs[value as SpCoinReadMethod];
          if (!nextDef) return;
          setSpReadParams(
            buildDefaultAccountParams(nextDef.params, {
              sender: selectedWriteSenderAddress,
              sponsor: defaultSponsorKey,
              recipient: defaultRecipientKey,
              agent: defaultAgentKey,
              recipientRate: String(defaultRecipientRateKey || effectiveRecipientRateRange[0]),
              agentRate: String(defaultAgentRateKey || effectiveAgentRateRange[0]),
            }),
          );
        });
        return;
      }
      if (kind === 'spCoinWrite') {
        runWithDiscardPrompt(() => {
          resetToDropdownSelection();
          setAuxMethodPanelTab(spCoinAdminWriteOptions.includes(value as SpCoinWriteMethod) ? 'admin_utils' : null);
          setIsSpCoinTodoMode(spCoinTodoWriteOptions.includes(value as SpCoinWriteMethod));
          setMethodPanelMode('spcoin_write');
          setSelectedSpCoinWriteMethod(value as SpCoinWriteMethod);
          const nextDef = spCoinWriteMethodDefs[value as SpCoinWriteMethod];
          if (!nextDef) return;
          setSpWriteParams(
            buildDefaultAccountParams(nextDef.params, {
              sender: selectedWriteSenderAddress,
              sponsor: defaultSponsorKey,
              recipient: defaultRecipientKey,
              agent: defaultAgentKey,
              recipientRate: String(defaultRecipientRateKey || effectiveRecipientRateRange[0]),
              agentRate: String(defaultAgentRateKey || effectiveAgentRateRange[0]),
            }),
          );
        });
        return;
      }
      runWithDiscardPrompt(() => {
        resetToDropdownSelection();
        setAuxMethodPanelTab('admin_utils');
        setIsSpCoinTodoMode(false);
        setMethodPanelMode('serialization_tests');
        setSelectedSerializationTestMethod(value as SerializationTestMethod);
        const nextDef = serializationTestMethodDefs[value as SerializationTestMethod];
        if (!nextDef) return;
        setSerializationTestParams(
          buildDefaultAccountParams(nextDef.params, {
            sender: selectedWriteSenderAddress,
            sponsor: defaultSponsorKey,
            recipient: defaultRecipientKey,
            agent: defaultAgentKey,
            recipientRate: String(defaultRecipientRateKey || effectiveRecipientRateRange[0]),
            agentRate: String(defaultAgentRateKey || effectiveAgentRateRange[0]),
            previousReleaseDir: 'spCoinAccess/contracts/spCoinOrig.BAK',
            latestReleaseDir: 'spCoinAccess/contracts/spCoin',
          }),
        );
      });
    },
    [
      defaultAgentKey,
      defaultAgentRateKey,
      defaultRecipientKey,
      defaultRecipientRateKey,
      defaultSponsorKey,
      effectiveAgentRateRange,
      effectiveRecipientRateRange,
      runWithDiscardPrompt,
      selectedWriteSenderAddress,
      serializationTestMethodDefs,
      setAuxMethodPanelTab,
      setIsSpCoinTodoMode,
      setMethodPanelMode,
      setSelectedReadMethod,
      setSelectedSerializationTestMethod,
      setSelectedSpCoinReadMethod,
      setSelectedSpCoinWriteMethod,
      setSelectedWriteMethod,
      setSerializationTestParams,
      setSpReadParams,
      setSpWriteParams,
      spCoinAdminReadOptions,
      spCoinAdminWriteOptions,
      spCoinReadMethodDefs,
      spCoinTodoWriteOptions,
      spCoinWriteMethodDefs,
      resetToDropdownSelection,
    ],
  );
  const editScriptStepFromBuilder = useCallback(
    (step: LabScriptStep) => {
      queueEditorBaselineReset();
      setScriptEditorKind('json');
      setAuxMethodPanelTab(
        (
          (step.panel === 'serialization_tests' && utilityMethodOptions.includes(step.method as SerializationTestMethod)) ||
          (step.panel === 'spcoin_rread' && spCoinAdminReadOptions.includes(step.method as SpCoinReadMethod)) ||
          (step.panel === 'spcoin_write' && spCoinAdminWriteOptions.includes(step.method as SpCoinWriteMethod))
        )
          ? 'admin_utils'
          : null,
      );
      setIsSpCoinTodoMode(
        step.panel === 'spcoin_write' && spCoinTodoWriteOptions.includes(step.method as SpCoinWriteMethod),
      );
      setMethodSelectionSource('script');
      setEditingScriptStepNumber(step.step);
      loadScriptStep(step);
    },
    [
      loadScriptStep,
      queueEditorBaselineReset,
      setScriptEditorKind,
      spCoinAdminReadOptions,
      spCoinAdminWriteOptions,
      utilityMethodOptions,
      spCoinTodoWriteOptions,
      setAuxMethodPanelTab,
      setIsSpCoinTodoMode,
      setMethodSelectionSource,
      setEditingScriptStepNumber,
    ],
  );

  const selectDropdownMethodPanelMode = useCallback(
    (value: MethodPanelMode) => {
      if (methodPanelMode === value) return;
      runWithDiscardPrompt(() => {
        setIsSpCoinTodoMode(false);
        resetToDropdownSelection();
        setMethodPanelMode(value);
      });
    },
    [methodPanelMode, runWithDiscardPrompt, setIsSpCoinTodoMode, resetToDropdownSelection, setMethodPanelMode],
  );

  const selectMethodPanelTab = useCallback(
    (value: MethodPanelMode | 'todos' | 'erc20' | 'admin_utils') => {
      if (value === 'admin_utils') {
        runWithDiscardPrompt(() => {
          setAuxMethodPanelTab('admin_utils');
          setIsSpCoinTodoMode(false);
          if (methodPanelMode === 'spcoin_rread' && spCoinAdminReadOptions.includes(selectedSpCoinReadMethod)) return;
          if (methodPanelMode === 'spcoin_write' && spCoinAdminWriteOptions.includes(selectedSpCoinWriteMethod)) return;
          if (methodPanelMode === 'serialization_tests' && utilityMethodOptions.includes(selectedSerializationTestMethod)) return;
          if (adminUtilityReadOptions[0]) {
            setMethodPanelMode('serialization_tests');
            setSelectedSerializationTestMethod(adminUtilityReadOptions[0]);
            return;
          }
          if (spCoinAdminReadOptions[0]) {
            setMethodPanelMode('spcoin_rread');
            setSelectedSpCoinReadMethod(spCoinAdminReadOptions[0]);
            return;
          }
          if (adminUtilityWriteOptions[0]) {
            setMethodPanelMode('serialization_tests');
            setSelectedSerializationTestMethod(adminUtilityWriteOptions[0]);
            return;
          }
          if (spCoinAdminWriteOptions[0]) {
            setMethodPanelMode('spcoin_write');
            setSelectedSpCoinWriteMethod(spCoinAdminWriteOptions[0]);
            return;
          }
          setMethodPanelMode('serialization_tests');
        });
        return;
      }
      if (auxMethodPanelTab) setAuxMethodPanelTab(null);
      if (value === 'todos') {
        if (activeMethodPanelTab === 'todos') return;
        runWithDiscardPrompt(() => {
          resetToDropdownSelection();
          setIsSpCoinTodoMode(true);
          setMethodPanelMode('spcoin_write');
        });
        return;
      }
      if (value === 'erc20') {
        if (activeMethodPanelTab === 'erc20') return;
        runWithDiscardPrompt(() => {
          setIsSpCoinTodoMode(false);
          resetToDropdownSelection();
          setMethodPanelMode(methodPanelMode === 'erc20_write' ? 'erc20_write' : 'ecr20_read');
        });
        return;
      }
      if (value === 'spcoin_write') {
        if (activeMethodPanelTab === 'spcoin_write') return;
        runWithDiscardPrompt(() => {
          resetToDropdownSelection();
          setIsSpCoinTodoMode(false);
          setMethodPanelMode('spcoin_write');
        });
        return;
      }
      selectDropdownMethodPanelMode(value);
    },
    [
      runWithDiscardPrompt,
      setAuxMethodPanelTab,
      setIsSpCoinTodoMode,
      methodPanelMode,
      spCoinAdminReadOptions,
      selectedSpCoinReadMethod,
      spCoinAdminWriteOptions,
      selectedSpCoinWriteMethod,
      utilityMethodOptions,
      selectedSerializationTestMethod,
      adminUtilityReadOptions,
      setMethodPanelMode,
      setSelectedSerializationTestMethod,
      setSelectedSpCoinReadMethod,
      adminUtilityWriteOptions,
      setSelectedSpCoinWriteMethod,
      auxMethodPanelTab,
      activeMethodPanelTab,
      resetToDropdownSelection,
      selectDropdownMethodPanelMode,
    ],
  );

  const selectDropdownReadMethod = useCallback(
    (value: Erc20ReadMethod) => {
      if (selectedReadMethod === value) return;
      runWithDiscardPrompt(() => {
        resetToDropdownSelection();
        setSelectedReadMethod(value);
      });
    },
    [selectedReadMethod, runWithDiscardPrompt, resetToDropdownSelection, setSelectedReadMethod],
  );

  const selectDropdownWriteMethod = useCallback(
    (value: Erc20WriteMethod) => {
      if (selectedWriteMethod === value) return;
      runWithDiscardPrompt(() => {
        resetToDropdownSelection();
        setSelectedWriteMethod(value);
      });
    },
    [selectedWriteMethod, runWithDiscardPrompt, resetToDropdownSelection, setSelectedWriteMethod],
  );

  const selectDropdownSpCoinReadMethod = useCallback(
    (value: SpCoinReadMethod) => {
      if (selectedSpCoinReadMethod === value) return;
      runWithDiscardPrompt(() => {
        resetToDropdownSelection();
        setSelectedSpCoinReadMethod(normalizeSpCoinReadMethod(value));
        if (methodSelectionSource === 'script' && editingScriptStepNumber !== null) return;
        const nextDef = spCoinReadMethodDefs[value];
        if (!nextDef) return;
        setSpReadParams(populateMethodParamsFromActiveAccounts(nextDef.params));
      });
    },
    [
      selectedSpCoinReadMethod,
      runWithDiscardPrompt,
      resetToDropdownSelection,
      setSelectedSpCoinReadMethod,
      methodSelectionSource,
      editingScriptStepNumber,
      spCoinReadMethodDefs,
      populateMethodParamsFromActiveAccounts,
      setSpReadParams,
    ],
  );

  const selectDropdownSpCoinWriteMethod = useCallback(
    (value: SpCoinWriteMethod) => {
      if (selectedSpCoinWriteMethod === value) return;
      runWithDiscardPrompt(() => {
        resetToDropdownSelection();
        setSelectedSpCoinWriteMethod(value);
        if (methodSelectionSource === 'script' && editingScriptStepNumber !== null) return;
        const nextDef = spCoinWriteMethodDefs[value];
        if (!nextDef) return;
        setSpWriteParams(populateMethodParamsFromActiveAccounts(nextDef.params));
      });
    },
    [
      selectedSpCoinWriteMethod,
      runWithDiscardPrompt,
      resetToDropdownSelection,
      setSelectedSpCoinWriteMethod,
      methodSelectionSource,
      editingScriptStepNumber,
      spCoinWriteMethodDefs,
      populateMethodParamsFromActiveAccounts,
      setSpWriteParams,
    ],
  );

  const selectDropdownSerializationTestMethod = useCallback(
    (value: SerializationTestMethod) => {
      if (selectedSerializationTestMethod === value) return;
      runWithDiscardPrompt(() => {
        resetToDropdownSelection();
        setSelectedSerializationTestMethod(value);
        if (methodSelectionSource === 'script' && editingScriptStepNumber !== null) return;
        const nextDef = serializationTestMethodDefs[value];
        if (!nextDef) return;
        setSerializationTestParams(
          nextDef.params.some((param) => {
            const label = String(param.label || '').trim().toLowerCase();
            return (
              label === 'previous release directory' ||
              label === 'latest release directory'
            );
          })
            ? buildDefaultAccountParams(nextDef.params, {
                sender: selectedWriteSenderAddress,
                sponsor: defaultSponsorKey,
                recipient: defaultRecipientKey,
                agent: defaultAgentKey,
                recipientRate: String(defaultRecipientRateKey || effectiveRecipientRateRange[0]),
                agentRate: String(defaultAgentRateKey || effectiveAgentRateRange[0]),
                previousReleaseDir: 'spCoinAccess/contracts/spCoinOrig.BAK',
                latestReleaseDir: 'spCoinAccess/contracts/spCoin',
              })
            : populateMethodParamsFromActiveAccounts(nextDef.params),
        );
      });
    },
    [
      selectedSerializationTestMethod,
      runWithDiscardPrompt,
      resetToDropdownSelection,
      setSelectedSerializationTestMethod,
      methodSelectionSource,
      editingScriptStepNumber,
      serializationTestMethodDefs,
      populateMethodParamsFromActiveAccounts,
      setSerializationTestParams,
      selectedWriteSenderAddress,
      defaultSponsorKey,
      defaultRecipientKey,
      defaultAgentKey,
      defaultRecipientRateKey,
      defaultAgentRateKey,
      effectiveRecipientRateRange,
      effectiveAgentRateRange,
    ],
  );

  const selectMappedJsonMethod = useCallback(
    (value: string) => {
      if (!value) return;
      if (activeMethodPanelTab === 'admin_utils') {
        if (
          spCoinAdminReadOptions.includes(value as SpCoinReadMethod) ||
          value === 'calculateStakingRewards'
        ) {
          runWithDiscardPrompt(() => {
            resetToDropdownSelection();
            setAuxMethodPanelTab('admin_utils');
            setIsSpCoinTodoMode(false);
            setMethodPanelMode('spcoin_rread');
            setSelectedSpCoinReadMethod(normalizeSpCoinReadMethod(value as SpCoinReadMethod));
            const nextDef = spCoinReadMethodDefs[value as SpCoinReadMethod];
            if (!nextDef) return;
            setSpReadParams(
              buildDefaultAccountParams(nextDef.params, {
                sender: selectedWriteSenderAddress,
                sponsor: defaultSponsorKey,
                recipient: defaultRecipientKey,
                agent: defaultAgentKey,
                recipientRate: String(defaultRecipientRateKey || effectiveRecipientRateRange[0]),
                agentRate: String(defaultAgentRateKey || effectiveAgentRateRange[0]),
              }),
            );
          });
          return;
        }
        if (spCoinAdminWriteOptions.includes(value as SpCoinWriteMethod)) {
        runWithDiscardPrompt(() => {
          resetToDropdownSelection();
          setAuxMethodPanelTab('admin_utils');
          setIsSpCoinTodoMode(false);
          setMethodPanelMode('spcoin_write');
          setSelectedSpCoinWriteMethod(value as SpCoinWriteMethod);
          const nextDef = spCoinWriteMethodDefs[value as SpCoinWriteMethod];
          if (!nextDef) return;
          setSpWriteParams(
              buildDefaultAccountParams(nextDef.params, {
                sender: selectedWriteSenderAddress,
                sponsor: defaultSponsorKey,
                recipient: defaultRecipientKey,
                agent: defaultAgentKey,
                recipientRate: String(defaultRecipientRateKey || effectiveRecipientRateRange[0]),
                agentRate: String(defaultAgentRateKey || effectiveAgentRateRange[0]),
              }),
            );
          });
          return;
        }
        if (
          adminUtilityReadOptions.includes(value as SerializationTestMethod) ||
          adminUtilityWriteOptions.includes(value as SerializationTestMethod)
        ) {
          runWithDiscardPrompt(() => {
            resetToDropdownSelection();
            setAuxMethodPanelTab('admin_utils');
            setIsSpCoinTodoMode(false);
            setMethodPanelMode('serialization_tests');
            setSelectedSerializationTestMethod(value as SerializationTestMethod);
            const nextDef = serializationTestMethodDefs[value as SerializationTestMethod];
            if (!nextDef) return;
            setSerializationTestParams(
              buildDefaultAccountParams(nextDef.params, {
                sender: selectedWriteSenderAddress,
                sponsor: defaultSponsorKey,
                recipient: defaultRecipientKey,
                agent: defaultAgentKey,
                recipientRate: String(defaultRecipientRateKey || effectiveRecipientRateRange[0]),
                agentRate: String(defaultAgentRateKey || effectiveAgentRateRange[0]),
                previousReleaseDir: 'spCoinAccess/contracts/spCoinOrig.BAK',
                latestReleaseDir: 'spCoinAccess/contracts/spCoin',
              }),
            );
          });
          return;
        }
        selectDropdownSerializationTestMethod(value as SerializationTestMethod);
        return;
      }
      if (activeMethodPanelTab === 'erc20') {
        if (ERC20_READ_OPTIONS.includes(value as Erc20ReadMethod)) {
          runWithDiscardPrompt(() => {
            resetToDropdownSelection();
            setIsSpCoinTodoMode(false);
            setMethodPanelMode('ecr20_read');
            setSelectedReadMethod(value as Erc20ReadMethod);
          });
          return;
        }
        if (ERC20_WRITE_OPTIONS.includes(value as Erc20WriteMethod)) {
          runWithDiscardPrompt(() => {
            resetToDropdownSelection();
            setIsSpCoinTodoMode(false);
            setMethodPanelMode('erc20_write');
            setSelectedWriteMethod(value as Erc20WriteMethod);
          });
        }
        return;
      }
      if (activeMethodPanelTab === 'spcoin_rread') {
        selectDropdownSpCoinReadMethod(value as SpCoinReadMethod);
        return;
      }
      if (activeMethodPanelTab === 'spcoin_write') {
        selectDropdownSpCoinWriteMethod(value as SpCoinWriteMethod);
        return;
      }
      runWithDiscardPrompt(() => {
        resetToDropdownSelection();
        setIsSpCoinTodoMode(true);
        setMethodPanelMode('spcoin_write');
        setSelectedSpCoinWriteMethod(value as SpCoinWriteMethod);
      });
    },
    [
      activeMethodPanelTab,
      spCoinAdminReadOptions,
      runWithDiscardPrompt,
      resetToDropdownSelection,
      setAuxMethodPanelTab,
      setIsSpCoinTodoMode,
      setMethodPanelMode,
      setSelectedSpCoinReadMethod,
      spCoinReadMethodDefs,
      setSpReadParams,
      selectedWriteSenderAddress,
      defaultSponsorKey,
      defaultRecipientKey,
      defaultAgentKey,
      defaultRecipientRateKey,
      defaultAgentRateKey,
      effectiveRecipientRateRange,
      effectiveAgentRateRange,
      spCoinAdminWriteOptions,
      setSelectedSpCoinWriteMethod,
      spCoinWriteMethodDefs,
      setSpWriteParams,
      adminUtilityReadOptions,
      adminUtilityWriteOptions,
      setSelectedSerializationTestMethod,
      serializationTestMethodDefs,
      setSerializationTestParams,
      selectDropdownSerializationTestMethod,
      setSelectedReadMethod,
      setSelectedWriteMethod,
      selectDropdownSpCoinReadMethod,
    ],
  );

  return {
    editScriptStepFromBuilder,
    resetToDropdownSelection,
    selectDropdownMethodPanelMode,
    selectMethodPanelTab,
    selectMethodByKind,
    selectDropdownReadMethod,
    selectDropdownWriteMethod,
    selectDropdownSpCoinReadMethod,
    selectDropdownSpCoinWriteMethod,
    selectDropdownSerializationTestMethod,
    selectMappedJsonMethod,
  };
}
