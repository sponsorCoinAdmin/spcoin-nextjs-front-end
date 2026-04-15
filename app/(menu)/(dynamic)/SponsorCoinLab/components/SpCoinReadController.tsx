// File: app/(menu)/(dynamic)/SponsorCoinLab/components/SpCoinReadController.tsx
import React from 'react';
import AccountDropdownInput from './AccountDropdownInput';
import AccountSelection from './AccountSelection';
import BackdateCalendarPopup from './BackdateCalendarPopup';
import { getMethodOptionColor } from './methodOptionColors';
import type { MethodDef } from '../jsonMethods/shared/types';
import {
  CALENDAR_WEEK_DAYS,
  formatDateInput,
  formatDateTimeDisplay,
  useBackdateCalendar,
} from '../hooks/useBackdateCalendar';

type Props = {
  invalidFieldIds: string[];
  clearInvalidField: (fieldId: string) => void;
  markEditorAsUserEdited: () => void;
  showOnChainMethods: boolean;
  showOffChainMethods: boolean;
  writeTraceEnabled: boolean;
  toggleWriteTrace: () => void;
  hardhatAccounts: Array<{ address: string; privateKey?: string }>;
  hardhatAccountMetadata: Record<string, { name?: string; symbol?: string; logoURL: string }>;
  selectedSpCoinReadMethod: string;
  setSelectedSpCoinReadMethod: (value: string) => void;
  spCoinWorldReadOptions: string[];
  spCoinSenderReadOptions: string[];
  spCoinAdminReadOptions: string[];
  spCoinCompoundReadOptions: string[];
  spCoinReadMethodDefs: Record<string, MethodDef>;
  activeSpCoinReadDef: MethodDef;
  spReadParams: string[];
  setSpReadParams: React.Dispatch<React.SetStateAction<string[]>>;
  activeContractAddress: string;
  inputStyle: string;
  canRunSelectedSpCoinReadMethod: boolean;
  canAddCurrentMethodToScript: boolean;
  hasEditorScriptSelected: boolean;
  isAddToScriptBlockedByNoChanges: boolean;
  addToScriptButtonLabel: string;
  missingFieldIds: string[];
  runSelectedSpCoinReadMethod: () => void;
  addCurrentMethodToScript: () => void;
  hideMethodSelect?: boolean;
  hideActionButtons?: boolean;
  hideAddToScript?: boolean;
};

export default function SpCoinReadController(props: Props) {
  const {
    invalidFieldIds,
    clearInvalidField,
    markEditorAsUserEdited,
    showOnChainMethods,
    showOffChainMethods,
    hardhatAccounts,
    hardhatAccountMetadata,
    selectedSpCoinReadMethod,
    setSelectedSpCoinReadMethod,
    spCoinWorldReadOptions,
    spCoinSenderReadOptions,
    spCoinAdminReadOptions,
    spCoinCompoundReadOptions,
    spCoinReadMethodDefs,
    activeSpCoinReadDef,
    spReadParams,
    setSpReadParams,
    activeContractAddress,
    inputStyle,
    canRunSelectedSpCoinReadMethod,
    canAddCurrentMethodToScript,
    hasEditorScriptSelected,
    isAddToScriptBlockedByNoChanges,
    addToScriptButtonLabel,
    missingFieldIds,
    runSelectedSpCoinReadMethod,
    addCurrentMethodToScript,
    hideMethodSelect = false,
    hideActionButtons = false,
    hideAddToScript = false,
  } = props;
  const [hoveredBlockedAction, setHoveredBlockedAction] = React.useState<'execute' | 'add' | null>(null);
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
  const isCalculateStakingRewards = selectedSpCoinReadMethod === 'calculateStakingRewards';
  const calculateRewardsDateParamIndexes = React.useMemo(
    () =>
      activeSpCoinReadDef.params
        .map((param, idx) => (param.type === 'date' ? idx : -1))
        .filter((idx) => idx >= 0),
    [activeSpCoinReadDef.params],
  );
  const updateSpReadParamAtIndex = React.useCallback(
    (idx: number, value: string) => {
      setSpReadParams((prev) => {
        const next = [...prev];
        next[idx] = value;
        clearInvalidField(`spcoin-read-param-${idx}`);
        return next;
      });
    },
    [clearInvalidField, setSpReadParams],
  );
  const backdateCalendar = useBackdateCalendar({
    activeWriteParams: activeSpCoinReadDef.params,
    spWriteParams: spReadParams,
    updateSpWriteParamAtIndex: updateSpReadParamAtIndex,
  });
  const normalizeRewardsRateValue = (value: string) => {
    const parsed = Number(String(value || '').replace(/,/g, '').trim());
    if (!Number.isFinite(parsed)) return 1;
    return Math.min(Math.max(Math.trunc(parsed), 1), 100);
  };
  React.useEffect(() => {
    if (!isCalculateStakingRewards) return;
    setSpReadParams((prev) => {
      const next = [...prev];
      let changed = false;
      const today = formatDateInput(new Date());
      calculateRewardsDateParamIndexes.forEach((idx) => {
        if (!next[idx]) {
          next[idx] = today;
          changed = true;
        }
      });
      const rateIdx = activeSpCoinReadDef.params.findIndex((param) => param.label === 'Rate');
      if (rateIdx >= 0 && !next[rateIdx]) {
        next[rateIdx] = '1';
        changed = true;
      }
      const stakedIdx = activeSpCoinReadDef.params.findIndex((param) => param.label === 'Staked SP Coins');
      if (stakedIdx >= 0 && !next[stakedIdx]) {
        next[stakedIdx] = '1';
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [activeSpCoinReadDef.params, calculateRewardsDateParamIndexes, isCalculateStakingRewards, setSpReadParams]);
  const normalizeAccountValue = (value: string) => {
    const trimmed = String(value || '').trim();
    return /^0[xX][0-9a-fA-F]{40}$/.test(trimmed) ? `0x${trimmed.slice(2).toLowerCase()}` : trimmed;
  };
  const [openAddressFields, setOpenAddressFields] = React.useState<Record<number, boolean>>({});
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
  const visibleWorldReadOptions = React.useMemo(
    () => (showOnChainMethods ? spCoinWorldReadOptions : []),
    [showOnChainMethods, spCoinWorldReadOptions],
  );
  const visibleSenderReadOptions = React.useMemo(
    () => (showOnChainMethods ? spCoinSenderReadOptions : []),
    [showOnChainMethods, spCoinSenderReadOptions],
  );
  const visibleAdminReadOptions = React.useMemo(
    () => (showOnChainMethods ? spCoinAdminReadOptions : []),
    [showOnChainMethods, spCoinAdminReadOptions],
  );
  const visibleCompoundReadOptions = React.useMemo(
    () => (showOffChainMethods ? spCoinCompoundReadOptions : []),
    [showOffChainMethods, spCoinCompoundReadOptions],
  );
  const visibleReadMethods = React.useMemo(
    () => [
      ...visibleWorldReadOptions,
      ...visibleSenderReadOptions,
      ...visibleAdminReadOptions,
      ...visibleCompoundReadOptions,
    ],
    [visibleAdminReadOptions, visibleCompoundReadOptions, visibleSenderReadOptions, visibleWorldReadOptions],
  );
  React.useEffect(() => {
    if (visibleReadMethods.length === 0) return;
    if (visibleReadMethods.includes(selectedSpCoinReadMethod)) return;
    setSelectedSpCoinReadMethod(visibleReadMethods[0]);
  }, [selectedSpCoinReadMethod, setSelectedSpCoinReadMethod, visibleReadMethods]);
  React.useEffect(() => {
    activeSpCoinReadDef.params.forEach((param, idx) => {
      if (param.type !== 'contract_address') return;
      const nextValue = String(activeContractAddress || '').trim();
      if (String(spReadParams[idx] || '').trim() === nextValue) return;
      setSpReadParams((prev) => {
        const next = [...prev];
        next[idx] = nextValue;
        return next;
      });
    });
  }, [activeContractAddress, activeSpCoinReadDef.params, setSpReadParams, spReadParams]);
  const hasVisibleReadMethods = visibleReadMethods.length > 0;
  const displayedReadMethod =
    hasVisibleReadMethods && visibleReadMethods.includes(selectedSpCoinReadMethod)
      ? selectedSpCoinReadMethod
      : '__no_methods__';

  return (
    <div className="grid grid-cols-1 gap-3">
      {!hideMethodSelect ? <div className="grid items-center gap-3 rounded-lg bg-green-100/10 px-3 py-2 md:grid-cols-[auto_minmax(0,1fr)]">
        <span className="text-sm font-semibold text-[#8FA8FF]">JSON Method</span>
        <div className="relative w-full min-w-0">
          <select
            className="w-full min-w-0 appearance-none rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 pr-10 text-sm text-white"
            value={displayedReadMethod}
            onChange={(e) => setSelectedSpCoinReadMethod(e.target.value)}
            disabled={!hasVisibleReadMethods}
          >
          {!hasVisibleReadMethods ? <option value="__no_methods__">No methods available</option> : null}
          <option
            key="sp-read-world-divider"
            value="__world-divider__"
            disabled
            style={{ backgroundColor: '#E5B94F', color: '#111827', fontWeight: '700', textAlign: 'center' }}
          >
            ---- World Access ----
          </option>
          {visibleWorldReadOptions.map((name) => (
            <option
              key={`sp-read-${name}`}
              value={name}
              style={{ color: getMethodOptionColor(name, spCoinReadMethodDefs[name].executable) }}
            >
              {spCoinReadMethodDefs[name]?.title || name}
            </option>
          ))}
          {visibleSenderReadOptions.length > 0 ? (
            <React.Fragment>
              <option
                key="sp-read-sender-divider"
                value="__sender-divider__"
                disabled
                style={{ backgroundColor: '#E5B94F', color: '#111827', fontWeight: '700', textAlign: 'center' }}
              >
                ---- Sender Access ----
              </option>
              {visibleSenderReadOptions.map((name) => (
                <option
                  key={`sp-read-sender-${name}`}
                  value={name}
                  style={{ color: getMethodOptionColor(name, spCoinReadMethodDefs[name].executable) }}
                >
                  {spCoinReadMethodDefs[name]?.title || name}
                </option>
              ))}
            </React.Fragment>
          ) : null}
          {visibleAdminReadOptions.length > 0 ? (
            <React.Fragment>
              <option
                key="sp-read-admin-divider"
                value="__admin-divider__"
                disabled
                style={{ backgroundColor: '#E5B94F', color: '#111827', fontWeight: '700', textAlign: 'center' }}
              >
                ---- Admin Access ----
              </option>
              {visibleAdminReadOptions.map((name) => (
                <option
                  key={`sp-read-admin-${name}`}
                  value={name}
                  style={{ color: getMethodOptionColor(name, spCoinReadMethodDefs[name].executable) }}
                >
                  {spCoinReadMethodDefs[name]?.title || name}
                </option>
              ))}
            </React.Fragment>
          ) : null}
          {visibleCompoundReadOptions.length > 0 ? (
            <React.Fragment>
              <option
                key="sp-read-compound-divider"
                value="__compound-divider__"
                disabled
                style={{
                  backgroundColor: '#E5B94F',
                  color: '#111827',
                  fontWeight: '700',
                  textAlign: 'center',
                }}
              >
                ---- Off-Chain Structured Reads ----
              </option>,
              {visibleCompoundReadOptions.map((name) => (
                <option
                  key={`sp-read-compound-${name}`}
                  value={name}
                  style={{ color: getMethodOptionColor(name, spCoinReadMethodDefs[name].executable) }}
                >
                  {spCoinReadMethodDefs[name]?.title || name}
                </option>
              ))}
            </React.Fragment>
          ) : null}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-0 inline-flex w-9 items-center justify-center text-[#8FA8FF]">
            v
          </span>
        </div>
      </div> : null}
      <div id="JSON_METHOD" className="grid grid-cols-1 gap-3 rounded-lg border border-[#31416F] p-3">
        {!hasVisibleReadMethods ? <div className="text-sm text-slate-400">(no SpCoin read methods match the current filter)</div> : null}
        {hasVisibleReadMethods ? activeSpCoinReadDef.params.map((param, idx) => (
          <div key={`sp-read-param-${param.label}-${idx}`} className="grid grid-cols-1 gap-3">
          {param.type === 'address' ? (
            <AccountSelection
              label={param.label}
              title={`Toggle ${param.label}`}
              isOpen={Boolean(openAddressFields[idx])}
              onToggle={() => setOpenAddressFields((prev) => ({ ...prev, [idx]: !prev[idx] }))}
              control={
                <AccountDropdownInput
                  dataFieldId={`spcoin-read-param-${idx}`}
                  className={`w-full rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white${invalidClass(`spcoin-read-param-${idx}`)}`}
                  value={spReadParams[idx] || ''}
                  onChange={(value) => {
                    markEditorAsUserEdited();
                    setSpReadParams((prev) => {
                      clearInvalidField(`spcoin-read-param-${idx}`);
                      const next = [...prev];
                      next[idx] = normalizeAccountValue(value);
                      return next;
                    });
                  }}
                  placeholder="Select account"
                  options={accountOptions}
                />
              }
              metadata={getMetadataForAddress(spReadParams[idx] || '')}
            />
          ) : param.type === 'contract_address' ? (
            <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <span className="text-sm font-semibold text-[#8FA8FF]">{param.label}</span>
              <input
                data-field-id={`spcoin-read-param-${idx}`}
                className={`${inputStyle}${invalidClass(`spcoin-read-param-${idx}`)}`}
                value={activeContractAddress || spReadParams[idx] || ''}
                readOnly
                disabled
                placeholder={param.placeholder}
              />
            </label>
          ) : param.type === 'date' ? (
            <div className="grid items-center gap-3 rounded-lg bg-green-100/10 px-3 py-2 md:grid-cols-[auto_minmax(0,1fr)]">
              <span className="text-sm font-semibold text-[#8FA8FF]">{param.label}</span>
              <input
                type="text"
                readOnly
                data-field-id={`spcoin-read-param-${idx}`}
                className={`${inputStyle} cursor-pointer${invalidClass(`spcoin-read-param-${idx}`)}`}
                value={formatDateTimeDisplay(
                  spReadParams[idx] || formatDateInput(new Date()),
                  backdateCalendar.backdateHours,
                  backdateCalendar.backdateMinutes,
                  backdateCalendar.backdateSeconds,
                )}
                onClick={() => {
                  markEditorAsUserEdited();
                  backdateCalendar.openBackdatePickerAt(idx);
                }}
                onFocus={() => {
                  markEditorAsUserEdited();
                  backdateCalendar.openBackdatePickerAt(idx);
                }}
                placeholder={param.placeholder}
              />
            </div>
          ) : isCalculateStakingRewards && param.label === 'Rate' ? (
            <div className="grid gap-3">
              <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
                <span className="text-sm font-semibold text-[#8FA8FF]">{param.label}</span>
                <input
                  type="range"
                  data-field-id={`spcoin-read-param-${idx}`}
                  title="Adjust Rate"
                  className={`h-[1px] w-full cursor-pointer appearance-none rounded-none border-0 bg-white outline-none${invalidClass(`spcoin-read-param-${idx}`)}`}
                  min={1}
                  max={100}
                  step={1}
                  value={normalizeRewardsRateValue(spReadParams[idx] || '1')}
                  onChange={(e) => {
                    markEditorAsUserEdited();
                    updateSpReadParamAtIndex(idx, e.target.value);
                  }}
                />
                <div className="inline-flex min-w-[110px] items-center justify-center rounded-full bg-[#243056] px-3 py-1 text-sm font-bold text-white">
                  {`Rate: ${normalizeRewardsRateValue(spReadParams[idx] || '1')}%`}
                </div>
              </div>
            </div>
          ) : (
            <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <span className="text-sm font-semibold text-[#8FA8FF]">{param.label}</span>
              <input
                data-field-id={`spcoin-read-param-${idx}`}
                className={`${inputStyle}${invalidClass(`spcoin-read-param-${idx}`)}`}
                value={spReadParams[idx] || ''}
                onChange={(e) => {
                  markEditorAsUserEdited();
                  updateSpReadParamAtIndex(idx, e.target.value);
                }}
                placeholder={param.placeholder}
              />
            </label>
          )}
          </div>
        )) : null}
      </div>
      <BackdateCalendarPopup
        backdatePopupParamIdx={backdateCalendar.backdatePopupParamIdx}
        setBackdatePopupParamIdx={backdateCalendar.setBackdatePopupParamIdx}
        buttonStyle="rounded-lg border border-[#334155] bg-[#0E111B] px-4 py-2 text-sm font-semibold text-white hover:border-[#8FA8FF]"
        inputStyle={inputStyle}
        shiftCalendarMonth={backdateCalendar.shiftCalendarMonth}
        calendarMonthOptions={backdateCalendar.calendarMonthOptions}
        calendarViewMonth={backdateCalendar.calendarViewMonth}
        setCalendarViewMonth={backdateCalendar.setCalendarViewMonth}
        calendarYearOptions={backdateCalendar.calendarYearOptions}
        calendarViewYear={backdateCalendar.calendarViewYear}
        setCalendarViewYear={backdateCalendar.setCalendarViewYear}
        isViewingCurrentMonth={backdateCalendar.isViewingCurrentMonth}
        setHoverCalendarWarning={backdateCalendar.setHoverCalendarWarning}
        CALENDAR_WEEK_DAYS={CALENDAR_WEEK_DAYS}
        calendarDayCells={backdateCalendar.calendarDayCells}
        isViewingFutureMonth={backdateCalendar.isViewingFutureMonth}
        today={backdateCalendar.today}
        selectedBackdateDate={backdateCalendar.selectedBackdateDate}
        hoverCalendarWarning={backdateCalendar.hoverCalendarWarning}
        spWriteParams={spReadParams}
        formatDateInput={formatDateInput}
        formatDateTimeDisplay={formatDateTimeDisplay}
        updateSpWriteParamAtIndex={updateSpReadParamAtIndex}
        backdateHours={backdateCalendar.backdateHours}
        setBackdateHours={backdateCalendar.setBackdateHours}
        backdateMinutes={backdateCalendar.backdateMinutes}
        setBackdateMinutes={backdateCalendar.setBackdateMinutes}
        backdateSeconds={backdateCalendar.backdateSeconds}
        setBackdateSeconds={backdateCalendar.setBackdateSeconds}
        setBackdateYears={backdateCalendar.setBackdateYears}
        setBackdateMonths={backdateCalendar.setBackdateMonths}
        setBackdateDays={backdateCalendar.setBackdateDays}
        maxBackdateYears={backdateCalendar.maxBackdateYears}
        backdateYears={backdateCalendar.backdateYears}
        backdateMonths={backdateCalendar.backdateMonths}
        backdateDays={backdateCalendar.backdateDays}
        applyBackdateBy={backdateCalendar.applyBackdateBy}
      />
      {!hideActionButtons ? <div className="mt-3 flex gap-2">
        <button
          type="button"
          className={`${getActionButtonClassName(canRunSelectedSpCoinReadMethod, 'execute')} min-w-[50%] shrink-0`}
          onClick={() => void runSelectedSpCoinReadMethod()}
          disabled={!hasVisibleReadMethods}
          onMouseEnter={() => {
            if (!canRunSelectedSpCoinReadMethod) setHoveredBlockedAction('execute');
          }}
          onMouseLeave={() => setHoveredBlockedAction(null)}
        >
          {!canRunSelectedSpCoinReadMethod && hoveredBlockedAction === 'execute'
            ? 'Missing Parameters'
            : `Run ${activeSpCoinReadDef.title}`}
        </button>
        {!hideAddToScript ? (
          <button
            type="button"
            className={`${getActionButtonClassName(canAddCurrentMethodToScript, 'add')} min-w-0 flex-1`}
            onClick={() => {
              if (isAddToScriptBlockedByNoChanges) return;
              addCurrentMethodToScript();
            }}
            disabled={!hasVisibleReadMethods}
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
