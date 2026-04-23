import React from 'react';
import AccountDropdownInput from './AccountDropdownInput';
import AccountSelection from './AccountSelection';
import { getMethodOptionColor } from './methodOptionColors';
import type { MethodDef } from '../jsonMethods/shared/types';

type Props = {
  invalidFieldIds: string[];
  clearInvalidField: (fieldId: string) => void;
  markEditorAsUserEdited: () => void;
  showOnChainMethods: boolean;
  showOffChainMethods: boolean;
  hardhatAccounts: Array<{ address: string; privateKey?: string }>;
  hardhatAccountMetadata: Record<string, { name?: string; symbol?: string; logoURL: string }>;
  selectedSerializationTestMethod: string;
  setSelectedSerializationTestMethod: (value: string) => void;
  serializationTestOptions: string[];
  serializationTestMethodDefs: Record<string, MethodDef>;
  activeSerializationTestDef: MethodDef;
  serializationTestParams: string[];
  setSerializationTestParams: React.Dispatch<React.SetStateAction<string[]>>;
  inputStyle: string;
  canRunSelectedSerializationTestMethod: boolean;
  canAddCurrentMethodToScript: boolean;
  hasEditorScriptSelected: boolean;
  isAddToScriptBlockedByNoChanges: boolean;
  addToScriptButtonLabel: string;
  missingFieldIds: string[];
  runSelectedSerializationTestMethod: () => void;
  addCurrentMethodToScript: () => void;
  hideMethodSelect?: boolean;
  hideActionButtons?: boolean;
  hideAddToScript?: boolean;
};

export default function SerializationTestController(props: Props) {
  const {
    invalidFieldIds,
    clearInvalidField,
    markEditorAsUserEdited,
    showOffChainMethods,
    hardhatAccounts,
    hardhatAccountMetadata,
    selectedSerializationTestMethod,
    setSelectedSerializationTestMethod,
    serializationTestOptions,
    serializationTestMethodDefs,
    activeSerializationTestDef,
    serializationTestParams,
    setSerializationTestParams,
    inputStyle,
    canRunSelectedSerializationTestMethod,
    canAddCurrentMethodToScript,
    hasEditorScriptSelected,
    isAddToScriptBlockedByNoChanges,
    addToScriptButtonLabel,
    missingFieldIds,
    runSelectedSerializationTestMethod,
    addCurrentMethodToScript,
    hideMethodSelect = false,
    hideActionButtons = false,
    hideAddToScript = false,
  } = props;
  const [hoveredBlockedAction, setHoveredBlockedAction] = React.useState<'execute' | 'add' | null>(null);
  const [openAddressFields, setOpenAddressFields] = React.useState<Record<number, boolean>>({});
  const [contractDirectoryOptions, setContractDirectoryOptions] = React.useState<Array<{ value: string; label: string }>>([]);
  const activeHoverInvalidFieldIds = hoveredBlockedAction ? missingFieldIds : [];
  const invalidClass = (fieldId: string) =>
    invalidFieldIds.includes(fieldId) || activeHoverInvalidFieldIds.includes(fieldId)
      ? ' border-red-500 bg-red-950/40 focus:border-red-400'
      : '';
  const actionButtonClassName =
    'h-[36px] rounded px-4 py-[0.28rem] text-center font-bold text-black transition-colors bg-[#E5B94F] hover:bg-green-500';
  const getActionButtonClassName = (isEnabled: boolean, buttonKind: 'execute' | 'add') =>
    buttonKind === 'add' && isAddToScriptBlockedByNoChanges
      ? `h-[36px] rounded px-4 py-[0.28rem] text-center font-bold transition-colors ${
          hoveredBlockedAction === buttonKind ? 'cursor-not-allowed bg-red-600 text-white' : 'bg-[#E5B94F] text-black'
        }`
      : isEnabled
        ? actionButtonClassName
        : `h-[36px] rounded px-4 py-[0.28rem] text-center font-bold transition-colors ${
            hoveredBlockedAction === buttonKind ? 'bg-red-600 text-white' : 'bg-[#E5B94F] text-black hover:bg-[#d7ae45]'
          }`;
  const normalizeAccountValue = (value: string) => {
    const trimmed = String(value || '').trim();
    return /^0[xX][0-9a-fA-F]{40}$/.test(trimmed) ? `0x${trimmed.slice(2).toLowerCase()}` : trimmed;
  };
  const getMetadataForAddress = (address: string) =>
    hardhatAccountMetadata[String(address || '').trim().toLowerCase()];
  const formatAccountOptionLabel = (address: string, index: number) => {
    const metadata = getMetadataForAddress(address);
    const name = String(metadata?.name || '').trim() || 'Unnamed account';
    const symbol = String(metadata?.symbol || '').trim() || 'No symbol';
    return `Account ${index}, ${address}, ${name}(${symbol})`;
  };
  const accountOptions = React.useMemo(
    () =>
      hardhatAccounts.map((account, idx) => ({
        value: normalizeAccountValue(account.address),
        label: formatAccountOptionLabel(account.address, idx),
      })),
    [hardhatAccounts],
  );
  const ownerFundingAccountAddress = normalizeAccountValue(hardhatAccounts[0]?.address || '');
  const hhFundAccountOptions = React.useMemo(
    () => accountOptions.filter((option) => option.value !== ownerFundingAccountAddress),
    [accountOptions, ownerFundingAccountAddress],
  );
  const visibleSerializationOptions = React.useMemo(
    () => (showOffChainMethods ? serializationTestOptions : []),
    [serializationTestOptions, showOffChainMethods],
  );
  React.useEffect(() => {
    if (visibleSerializationOptions.length === 0) return;
    if (visibleSerializationOptions.includes(selectedSerializationTestMethod)) return;
    setSelectedSerializationTestMethod(visibleSerializationOptions[0]);
  }, [selectedSerializationTestMethod, setSelectedSerializationTestMethod, visibleSerializationOptions]);
  const hasVisibleSerializationMethods = visibleSerializationOptions.length > 0;
  const displayedSerializationMethod =
    hasVisibleSerializationMethods && visibleSerializationOptions.includes(selectedSerializationTestMethod)
      ? selectedSerializationTestMethod
      : '__no_methods__';
  const hhFundAllAccountsEnabled =
    selectedSerializationTestMethod === 'hhFundAccounts' &&
    ['true', '1'].includes(String(serializationTestParams[1] || '').trim().toLowerCase());
  React.useEffect(() => {
    let cancelled = false;

    const loadContractDirectoryOptions = async () => {
      try {
        const response = await fetch('/api/spCoin/contract-directories', { cache: 'no-store' });
        const payload = (await response.json()) as {
          ok?: boolean;
          directories?: Array<{ value?: string; label?: string }>;
        };
        if (!response.ok || payload?.ok === false) return;
        if (cancelled) return;
        setContractDirectoryOptions(
          Array.isArray(payload?.directories)
            ? payload.directories
                .map((entry) => ({
                  value: String(entry?.value || '').trim(),
                  label: String(entry?.label || '').trim() || String(entry?.value || '').trim(),
                }))
                .filter((entry) => entry.value.length > 0)
            : [],
        );
      } catch {
        if (!cancelled) setContractDirectoryOptions([]);
      }
    };

    void loadContractDirectoryOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (selectedSerializationTestMethod !== 'compareSpCoinContractSize') return;
    if (contractDirectoryOptions.length === 0) return;
    const validValues = new Set(contractDirectoryOptions.map((option) => option.value));
    setSerializationTestParams((prev) => {
      let changed = false;
      const next = [...prev];
      for (const idx of [0, 1]) {
        const current = String(next[idx] || '').trim();
        if (current && !validValues.has(current)) {
          next[idx] = '';
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [contractDirectoryOptions, selectedSerializationTestMethod, setSerializationTestParams]);

  return (/*  */
    <div className="grid grid-cols-1 gap-3">
      {!hideMethodSelect ? <div className="grid items-center gap-3 rounded-lg bg-green-100/10 px-3 py-2 md:grid-cols-[auto_minmax(0,1fr)]">
        <span className="text-sm font-semibold text-[#8FA8FF]">JSON Method</span>
        <div className="relative w-full min-w-0">
          <select
            aria-label="Serialization test JSON method"
            title="Serialization test JSON method"
            className="w-full min-w-0 appearance-none rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 pr-10 text-sm text-white"
            value={displayedSerializationMethod}
            onChange={(e) => setSelectedSerializationTestMethod(e.target.value)}
            disabled={!hasVisibleSerializationMethods}
          >
            {!hasVisibleSerializationMethods ? <option value="__no_methods__">No methods available</option> : null}
            {visibleSerializationOptions.map((name) => (
              <option
                key={`serialization-test-${name}`}
                value={name}
                style={{ color: getMethodOptionColor(name, serializationTestMethodDefs[name].executable) }}
              >
                {name}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-0 inline-flex w-9 items-center justify-center text-[#8FA8FF]">
            v
          </span>
        </div>
      </div> : null}
      <div id="JSON_METHOD" className="grid grid-cols-1 gap-3 rounded-lg border border-[#31416F] p-3">
        {!hasVisibleSerializationMethods ? <div className="text-sm text-slate-400">(no off-chain serialization methods match the current filter)</div> : null}
        {hasVisibleSerializationMethods ? activeSerializationTestDef.params.map((param, idx) => {
          if (
            selectedSerializationTestMethod === 'hhFundAccounts' &&
            param.label === 'Fund HH Account' &&
            hhFundAllAccountsEnabled
          ) {
            return null;
          }
          return (
          <div key={`serialization-test-param-${param.label}-${idx}`} className="grid grid-cols-1 gap-3">
          {param.type === 'bool' ? (
            selectedSerializationTestMethod === 'hhFundAccounts' && param.label === 'Fund All Hardhat Accounts' ? (
              <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                <span className="text-sm font-semibold text-[#8FA8FF]">Fund Hardhat Accounts</span>
                <div className="flex flex-wrap items-center gap-4 text-sm text-[#8FA8FF]">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="hhFundAccountsMode"
                      checked={['true', '1'].includes(String(serializationTestParams[idx] || '').trim().toLowerCase())}
                      onChange={() => {
                        markEditorAsUserEdited();
                        setSerializationTestParams((prev) => {
                          clearInvalidField(`serialization-test-param-${idx}`);
                          const next = [...prev];
                          next[idx] = 'true';
                          return next;
                        });
                      }}
                      className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                    />
                    <span>All Accounts</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="hhFundAccountsMode"
                      checked={!['true', '1'].includes(String(serializationTestParams[idx] || '').trim().toLowerCase())}
                      onChange={() => {
                        markEditorAsUserEdited();
                        setSerializationTestParams((prev) => {
                          clearInvalidField(`serialization-test-param-${idx}`);
                          const next = [...prev];
                          next[idx] = 'false';
                          return next;
                        });
                      }}
                      className="h-3.5 w-3.5 appearance-none rounded-full border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                    />
                    <span>Single Account</span>
                  </label>
                </div>
              </div>
            ) : (
              <label className="inline-flex items-center gap-3 text-sm font-semibold text-[#8FA8FF]">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-[#334155] bg-[#0E111B]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#8FA8FF]"
                    checked={['true', '1'].includes(String(serializationTestParams[idx] || '').trim().toLowerCase())}
                    onChange={(e) => {
                      markEditorAsUserEdited();
                      setSerializationTestParams((prev) => {
                        clearInvalidField(`serialization-test-param-${idx}`);
                        const next = [...prev];
                        next[idx] = e.target.checked ? 'true' : 'false';
                        return next;
                      });
                    }}
                  />
                </span>
                <span>{param.label}</span>
              </label>
            )
          ) : param.type === 'address' ? (
            selectedSerializationTestMethod === 'hhFundAccounts' && param.label === 'HH Funding Account' ? (
              <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                <span className="text-sm font-semibold text-[#8FA8FF]">{param.label}</span>
                <input
                  data-field-id={`serialization-test-param-${idx}`}
                  className="w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-slate-400"
                  value={ownerFundingAccountAddress}
                  readOnly
                  disabled
                />
              </label>
            ) : (
            <AccountSelection
              label={param.label}
              title={`Toggle ${param.label}`}
              isOpen={Boolean(openAddressFields[idx])}
              onToggle={() => setOpenAddressFields((prev) => ({ ...prev, [idx]: !prev[idx] }))}
              control={
                <AccountDropdownInput
                  dataFieldId={`serialization-test-param-${idx}`}
                  className={`w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white${invalidClass(`serialization-test-param-${idx}`)}`}
                  value={serializationTestParams[idx] || ''}
                  onChange={(value) => {
                    markEditorAsUserEdited();
                    setSerializationTestParams((prev) => {
                      clearInvalidField(`serialization-test-param-${idx}`);
                      const next = [...prev];
                      next[idx] = normalizeAccountValue(value);
                      return next;
                    });
                  }}
                  placeholder="Select account"
                  options={
                    selectedSerializationTestMethod === 'hhFundAccounts' && param.label === 'Fund HH Account'
                      ? hhFundAccountOptions
                      : accountOptions
                  }
                />
              }
              metadata={getMetadataForAddress(serializationTestParams[idx] || '')}
            />
            )
          ) : param.type === 'date' ? (
            <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <span className="text-sm font-semibold text-[#8FA8FF]">{param.label}</span>
              <input
                type="date"
                data-field-id={`serialization-test-param-${idx}`}
                className={`${inputStyle}${invalidClass(`serialization-test-param-${idx}`)}`}
                value={serializationTestParams[idx] || ''}
                onChange={(e) => {
                  markEditorAsUserEdited();
                  setSerializationTestParams((prev) => {
                    clearInvalidField(`serialization-test-param-${idx}`);
                    const next = [...prev];
                    next[idx] = e.target.value;
                    return next;
                  });
                }}
                placeholder={param.placeholder}
              />
            </label>
          ) : selectedSerializationTestMethod === 'compareSpCoinContractSize' &&
            ['Previous Release Directory', 'Latest Release Directory'].includes(param.label) ? (
            <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <span className="text-sm font-semibold text-[#8FA8FF]">{param.label}</span>
              <div className="relative w-full min-w-0">
                <select
                  data-field-id={`serialization-test-param-${idx}`}
                  className={`${inputStyle} appearance-none pr-10${invalidClass(`serialization-test-param-${idx}`)}`}
                  value={
                    contractDirectoryOptions.some((option) => option.value === String(serializationTestParams[idx] || '').trim())
                      ? serializationTestParams[idx] || ''
                      : ''
                  }
                  onChange={(e) => {
                    markEditorAsUserEdited();
                    setSerializationTestParams((prev) => {
                      clearInvalidField(`serialization-test-param-${idx}`);
                      const next = [...prev];
                      next[idx] = e.target.value;
                      return next;
                    });
                  }}
                >
                  <option value="" disabled>
                    Select contract directory
                  </option>
                  {contractDirectoryOptions.map((option) => (
                    <option key={`serialization-contract-dir-${param.label}-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-0 inline-flex w-9 items-center justify-center text-[#8FA8FF]">
                  v
                </span>
              </div>
            </label>
          ) : (
            <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <span className="text-sm font-semibold text-[#8FA8FF]">{param.label}</span>
              <input
                data-field-id={`serialization-test-param-${idx}`}
                className={`${inputStyle}${invalidClass(`serialization-test-param-${idx}`)}`}
                value={serializationTestParams[idx] || ''}
                onChange={(e) => {
                  markEditorAsUserEdited();
                  setSerializationTestParams((prev) => {
                    clearInvalidField(`serialization-test-param-${idx}`);
                    const next = [...prev];
                    next[idx] = e.target.value;
                    return next;
                  });
                }}
                placeholder={param.placeholder}
              />
            </label>
          )}
          </div>
        );
        }) : null}
      </div>
      {!hideActionButtons ? <div className="mt-3 flex gap-2">
        <button
          type="button"
          className={`${getActionButtonClassName(canRunSelectedSerializationTestMethod, 'execute')} min-w-[50%] shrink-0`}
          onClick={() => void runSelectedSerializationTestMethod()}
          disabled={!hasVisibleSerializationMethods}
          onMouseEnter={() => {
            if (!canRunSelectedSerializationTestMethod) setHoveredBlockedAction('execute');
          }}
          onMouseLeave={() => setHoveredBlockedAction(null)}
        >
          {!canRunSelectedSerializationTestMethod && hoveredBlockedAction === 'execute'
            ? 'Missing Parameters'
            : `Run ${activeSerializationTestDef.title}`}
        </button>
        {!hideAddToScript ? (
          <button
            type="button"
            className={`${getActionButtonClassName(canAddCurrentMethodToScript, 'add')} min-w-0 flex-1`}
            onClick={() => {
              if (isAddToScriptBlockedByNoChanges) return;
              addCurrentMethodToScript();
            }}
            disabled={!hasVisibleSerializationMethods}
            onMouseEnter={() => {
              if (!canAddCurrentMethodToScript || isAddToScriptBlockedByNoChanges) setHoveredBlockedAction('add');
            }}
            onMouseLeave={() => setHoveredBlockedAction(null)}
            title={!hasEditorScriptSelected ? 'Create a Script in the Editor Editor' : undefined}
          >
            {isAddToScriptBlockedByNoChanges
              ? hoveredBlockedAction === 'add'
                ? 'No Update Changes'
                : addToScriptButtonLabel
              : !hasEditorScriptSelected && hoveredBlockedAction === 'add'
                ? 'No Editor Script'
                : !canAddCurrentMethodToScript && hoveredBlockedAction === 'add'
                  ? 'Missing Parameters'
                  : addToScriptButtonLabel}
          </button>
        ) : null}
      </div> : null}
    </div>
  );
}
