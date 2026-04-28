// File: app/(menu)/(dynamic)/SponsorCoinLab/components/SpCoinReadController.tsx
import React from 'react';
import AccountDropdownInput from './AccountDropdownInput';
import AccountSelection from './AccountSelection';
import {
  FALLBACK_CONTRACT_DIRECTORY_OPTIONS,
  getInitialContractDirectoryOptions,
  loadContractDirectoryOptions,
  normalizeContractDirectoryOptions,
  reconcileContractDirectoryParams,
  type ContractDirectoryOption,
} from './contractDirectoryOptions';
import DateTimeCalendarPopup from './DateTimeCalendarPopup';
import RateSliderRow from './RateSliderRow';
import { getMethodOptionColor } from './methodOptionColors';
import { NativeSelectChevron } from './SelectChevron';
import type { MethodDef } from '../jsonMethods/shared/types';
import { normalizeSpCoinReadMethod } from '../jsonMethods/spCoin/read';

const DATE_DIFF_UNITS = ['Years', 'Months', 'Weeks', 'Days', 'Hours', 'Minutes', 'Seconds'] as const;
const DATE_DIFF_DIVISORS: Record<(typeof DATE_DIFF_UNITS)[number], number> = {
  Years: 365 * 24 * 60 * 60,
  Months: 30 * 24 * 60 * 60,
  Weeks: 7 * 24 * 60 * 60,
  Days: 24 * 60 * 60,
  Hours: 60 * 60,
  Minutes: 60,
  Seconds: 1,
};
const DATE_DIFF_UNIT_LABELS: Record<(typeof DATE_DIFF_UNITS)[number], string> = {
  Years: 'YY',
  Months: 'MM',
  Weeks: 'W',
  Days: 'DD',
  Hours: 'hh',
  Minutes: 'mm',
  Seconds: 'ss',
};

function pad2(value: number | string) {
  return String(value).padStart(2, '0');
}

function formatDateTimeValue(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

function parseDateTimeValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(String(value || '').trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const hours = Number(match[4]);
  const minutes = Number(match[5]);
  const seconds = Number(match[6]);
  const date = new Date(year, month, day, hours, minutes, seconds, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day ||
    date.getHours() !== hours ||
    date.getMinutes() !== minutes ||
    date.getSeconds() !== seconds
  ) {
    return null;
  }
  return date;
}

function formatDecimal(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(6).replace(/\.?0+$/, '');
}

function parseSelectedUnits(unitRaw: string) {
  const rawUnits = String(unitRaw || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return DATE_DIFF_UNITS.filter((unit) => rawUnits.includes(unit));
}

function formatSegmentValue(value: number, pad: boolean) {
  const prefix = value < 0 ? '-' : '';
  const absolute = Math.abs(value);
  const formatted = formatDecimal(absolute);
  if (!pad) return `${prefix}${formatted}`;
  const [whole, fraction] = formatted.split('.');
  return `${prefix}${pad2(whole)}${fraction ? `.${fraction}` : ''}`;
}

function formatDateDifferenceValue(fromRaw: string, toRaw: string, unitRaw: string) {
  const fromDate = parseDateTimeValue(fromRaw);
  const toDate = parseDateTimeValue(toRaw);
  if (!fromDate || !toDate) return '';
  const diffSeconds = (toDate.getTime() - fromDate.getTime()) / 1000;
  const selectedUnits = parseSelectedUnits(unitRaw);
  if (selectedUnits.length === 0) return '';
  if (selectedUnits.length === 1) {
    const unit = selectedUnits[0];
    return `${DATE_DIFF_UNIT_LABELS[unit]}: ${formatDecimal(diffSeconds / DATE_DIFF_DIVISORS[unit])}`;
  }
  let remaining = Math.abs(diffSeconds);
  const values = selectedUnits.map((unit, index) => {
    const divisor = DATE_DIFF_DIVISORS[unit];
    if (index === selectedUnits.length - 1) {
      const value = remaining / divisor;
      return formatSegmentValue(index === 0 && diffSeconds < 0 ? -value : value, index > 0);
    }
    const value = Math.floor(remaining / divisor);
    remaining -= value * divisor;
    return formatSegmentValue(index === 0 && diffSeconds < 0 ? -value : value, index > 0);
  });
  return `${selectedUnits.map((unit) => DATE_DIFF_UNIT_LABELS[unit]).join(':')}: ${values.join(':')}`;
}

function getBackdatedDate(base: Date, years: number, months: number, days: number): Date {
  const result = new Date(base);
  result.setFullYear(result.getFullYear() - years);
  result.setMonth(result.getMonth() - months);
  result.setDate(result.getDate() - days);
  return result;
}

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
  initialContractDirectoryOptions?: ContractDirectoryOption[];
  recipientRateKeyOptions: string[];
  agentRateKeyOptions: string[];
  recipientRateKeyHelpText: string;
  agentRateKeyHelpText: string;
  recipientRateRange?: [number, number];
  agentRateRange?: [number, number];
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
  allowAdminReadMethods?: boolean;
};

function dedupeReadMethodNamesByTitle(values: string[], defs: Record<string, MethodDef>) {
  const seenTitles = new Set<string>();
  return values.filter((name) => {
    const title = String(defs[name]?.title || name);
    if (seenTitles.has(title)) return false;
    seenTitles.add(title);
    return true;
  });
}

function hasEquivalentReadMethod(values: string[], methodName: string) {
  const normalizedMethod = normalizeSpCoinReadMethod(methodName);
  return values.some((value) => normalizeSpCoinReadMethod(value) === normalizedMethod);
}

function getVisibleReadMethodValue(values: string[], methodName: string) {
  const normalizedMethod = normalizeSpCoinReadMethod(methodName);
  return values.find((value) => normalizeSpCoinReadMethod(value) === normalizedMethod) || '';
}

const BLOCKED_SPCOIN_READ_TITLES = new Set([
  'creationTime',
  'version',
  'getMasterAccountElement',
  'getMasterAccountCount',
  'getMasterAccountKeys',
]);

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
    initialContractDirectoryOptions = [],
    recipientRateKeyOptions,
    agentRateKeyOptions,
    recipientRateKeyHelpText,
    agentRateKeyHelpText,
    recipientRateRange,
    agentRateRange,
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
    allowAdminReadMethods = false,
  } = props;
  const [hoveredBlockedAction, setHoveredBlockedAction] = React.useState<'execute' | 'add' | null>(null);
  const [dateTimePopupParamIdx, setDateTimePopupParamIdx] = React.useState<number | null>(null);
  const [hoverCalendarWarning, setHoverCalendarWarning] = React.useState('');
  const [popupBackdateYears, setPopupBackdateYears] = React.useState('0');
  const [popupBackdateMonths, setPopupBackdateMonths] = React.useState('0');
  const [popupBackdateDays, setPopupBackdateDays] = React.useState('0');
  const [recipientRateValue, setRecipientRateValue] = React.useState(() => {
    const fallback = String(Array.isArray(recipientRateRange) ? Number(recipientRateRange[0]) : 0);
    return spReadParams.find((value) => String(value || '').trim()) || fallback;
  });
  const [agentRateValue, setAgentRateValue] = React.useState(() => {
    const fallback = String(Array.isArray(agentRateRange) ? Number(agentRateRange[0]) : 0);
    return spReadParams.find((value) => String(value || '').trim()) || fallback;
  });
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
  const [openAddressFields, setOpenAddressFields] = React.useState<Record<number, boolean>>({});
  const normalizedInitialContractDirectoryOptions = normalizeContractDirectoryOptions(initialContractDirectoryOptions);
  const hasInitialContractDirectoryOptions = normalizedInitialContractDirectoryOptions.length > 0;
  const [contractDirectoryOptions, setContractDirectoryOptions] = React.useState<ContractDirectoryOption[]>(
    () =>
      hasInitialContractDirectoryOptions
        ? normalizedInitialContractDirectoryOptions
        : getInitialContractDirectoryOptions(FALLBACK_CONTRACT_DIRECTORY_OPTIONS),
  );
  const today = React.useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);
  const [calendarViewYear, setCalendarViewYear] = React.useState(today.getFullYear());
  const [calendarViewMonth, setCalendarViewMonth] = React.useState(today.getMonth());
  React.useEffect(() => {
    const nextRecipientRate = spReadParams.find((value, idx) => {
      const label = activeSpCoinReadDef.params[idx]?.label;
      return ['Recipient Rate Key', 'Recipient Rate'].includes(label || '') && String(value || '').trim();
    });
    if (nextRecipientRate) {
      setRecipientRateValue(String(nextRecipientRate));
      return;
    }
    if (Array.isArray(recipientRateRange)) setRecipientRateValue(String(recipientRateRange[0]));
  }, [activeSpCoinReadDef.params, recipientRateRange, spReadParams]);
  React.useEffect(() => {
    const nextAgentRate = spReadParams.find((value, idx) => {
      const label = activeSpCoinReadDef.params[idx]?.label;
      return ['Agent Rate Key', 'Agent Rate'].includes(label || '') && String(value || '').trim();
    });
    if (nextAgentRate) {
      setAgentRateValue(String(nextAgentRate));
      return;
    }
    if (Array.isArray(agentRateRange)) setAgentRateValue(String(agentRateRange[0]));
  }, [activeSpCoinReadDef.params, agentRateRange, spReadParams]);
  const popupSelectedDate = React.useMemo(
    () => (dateTimePopupParamIdx === null ? null : parseDateTimeValue(spReadParams[dateTimePopupParamIdx] || '')),
    [dateTimePopupParamIdx, spReadParams],
  );
  React.useEffect(() => {
    if (!popupSelectedDate) return;
    setCalendarViewYear(popupSelectedDate.getFullYear());
    setCalendarViewMonth(popupSelectedDate.getMonth());
  }, [popupSelectedDate]);
  React.useEffect(() => {
    if (dateTimePopupParamIdx === null) return;
    setPopupBackdateYears('0');
    setPopupBackdateMonths('0');
    setPopupBackdateDays('0');
  }, [dateTimePopupParamIdx]);
  const calendarMonthOptions = React.useMemo(() => {
    const monthLabels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const maxMonthIndex = calendarViewYear === today.getFullYear() ? today.getMonth() : 11;
    return monthLabels.map((label, monthIndex) => ({ label, monthIndex })).filter((entry) => entry.monthIndex <= maxMonthIndex);
  }, [calendarViewYear, today]);
  const calendarYearOptions = React.useMemo(() => {
    const years: number[] = [];
    for (let y = today.getFullYear(); y >= today.getFullYear() - 11; y--) years.push(y);
    return years;
  }, [today]);
  const calendarDayCells = React.useMemo(() => {
    const firstDayIndex = new Date(calendarViewYear, calendarViewMonth, 1).getDay();
    const daysInMonth = new Date(calendarViewYear, calendarViewMonth + 1, 0).getDate();
    const cells: Array<{ day: number | null; key: string }> = [];
    for (let i = 0; i < firstDayIndex; i++) cells.push({ day: null, key: `pad-${i}` });
    for (let day = 1; day <= daysInMonth; day++) cells.push({ day, key: `day-${day}` });
    while (cells.length % 7 !== 0) cells.push({ day: null, key: `tail-${cells.length}` });
    return cells;
  }, [calendarViewMonth, calendarViewYear]);
  const isViewingCurrentMonth = calendarViewYear === today.getFullYear() && calendarViewMonth === today.getMonth();
  const isViewingFutureMonth =
    calendarViewYear > today.getFullYear() ||
    (calendarViewYear === today.getFullYear() && calendarViewMonth > today.getMonth());
  const shiftCalendarMonth = (delta: number) => {
    const next = new Date(calendarViewYear, calendarViewMonth + delta, 1);
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    if (next.getTime() > currentMonthStart.getTime()) return;
    setCalendarViewYear(next.getFullYear());
    setCalendarViewMonth(next.getMonth());
  };
  const applyPopupBackdateBy = (yearsRaw: string, monthsRaw: string, daysRaw: string) => {
    if (dateTimePopupParamIdx === null) return;
    const base = new Date();
    const backdated = getBackdatedDate(base, Number(yearsRaw || '0'), Number(monthsRaw || '0'), Number(daysRaw || '0'));
    markEditorAsUserEdited();
    setSpReadParams((prev) => {
      const next = [...prev];
      const existing = parseDateTimeValue(next[dateTimePopupParamIdx] || '') || new Date();
      backdated.setHours(existing.getHours(), existing.getMinutes(), existing.getSeconds(), 0);
      clearInvalidField(`spcoin-read-param-${dateTimePopupParamIdx}`);
      next[dateTimePopupParamIdx] = formatDateTimeValue(backdated);
      return next;
    });
    setCalendarViewYear(backdated.getFullYear());
    setCalendarViewMonth(backdated.getMonth());
  };
  const dateDifferenceValue = React.useMemo(
    () =>
      selectedSpCoinReadMethod === 'calcDataTimeDiff'
        ? formatDateDifferenceValue(spReadParams[0] || '', spReadParams[1] || '', spReadParams[2] || 'Seconds')
        : '',
    [selectedSpCoinReadMethod, spReadParams],
  );
  const selectedDateDifferenceUnits = React.useMemo(
    () => parseSelectedUnits(spReadParams[2] || 'Seconds'),
    [spReadParams],
  );
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
    () =>
      dedupeReadMethodNamesByTitle(showOnChainMethods ? spCoinWorldReadOptions : [], spCoinReadMethodDefs),
    [showOnChainMethods, spCoinReadMethodDefs, spCoinWorldReadOptions],
  );
  const visibleSenderReadOptions = React.useMemo(
    () =>
      dedupeReadMethodNamesByTitle(showOnChainMethods ? spCoinSenderReadOptions : [], spCoinReadMethodDefs),
    [showOnChainMethods, spCoinReadMethodDefs, spCoinSenderReadOptions],
  );
  const visibleAdminReadOptions = React.useMemo(
    () =>
      dedupeReadMethodNamesByTitle(
        showOnChainMethods
          ? spCoinAdminReadOptions.filter(
              (name) => name !== 'calculateStakingRewards' && name !== 'calcDataTimeDiff',
            )
          : [],
        spCoinReadMethodDefs,
      ),
    [showOnChainMethods, spCoinAdminReadOptions, spCoinReadMethodDefs],
  );
  React.useEffect(() => {
    if (hasInitialContractDirectoryOptions) return;
    let cancelled = false;

    void loadContractDirectoryOptions().then((nextOptions) => {
      if (!cancelled && nextOptions.length > 0) setContractDirectoryOptions(nextOptions);
    });
    return () => {
      cancelled = true;
    };
  }, [hasInitialContractDirectoryOptions]);

  React.useLayoutEffect(() => {
    if (selectedSpCoinReadMethod !== 'compareSpCoinContractSize') return;
    setSpReadParams((prev) => {
      const { changed, next } = reconcileContractDirectoryParams(prev, contractDirectoryOptions);
      return changed ? next : prev;
    });
  }, [contractDirectoryOptions, selectedSpCoinReadMethod, setSpReadParams]);
  const rawAdminReadOptions = React.useMemo(
    () =>
      showOnChainMethods
        ? spCoinAdminReadOptions.filter((name) => name !== 'calculateStakingRewards' && name !== 'calcDataTimeDiff')
        : [],
    [showOnChainMethods, spCoinAdminReadOptions],
  );
  const visibleAdminReadTitles = React.useMemo(
    () => new Set(visibleAdminReadOptions.map((name) => String(spCoinReadMethodDefs[name]?.title || name))),
    [spCoinReadMethodDefs, visibleAdminReadOptions],
  );
  const visibleCompoundReadOptions = React.useMemo(
    () =>
      dedupeReadMethodNamesByTitle(showOffChainMethods ? spCoinCompoundReadOptions : [], spCoinReadMethodDefs).filter(
        (name) => {
          const title = String(spCoinReadMethodDefs[name]?.title || name);
          return !visibleAdminReadTitles.has(title) && !BLOCKED_SPCOIN_READ_TITLES.has(title);
        },
      ),
    [showOffChainMethods, spCoinCompoundReadOptions, spCoinReadMethodDefs, visibleAdminReadTitles],
  );
  const visibleReadMethods = React.useMemo(
    () =>
      [...visibleWorldReadOptions, ...visibleSenderReadOptions, ...visibleCompoundReadOptions].filter(
        (name) => {
          const title = String(spCoinReadMethodDefs[name]?.title || name);
          return !visibleAdminReadTitles.has(title) && !BLOCKED_SPCOIN_READ_TITLES.has(title);
        },
      ),
    [
      spCoinReadMethodDefs,
      visibleAdminReadTitles,
      visibleCompoundReadOptions,
      visibleSenderReadOptions,
      visibleWorldReadOptions,
    ],
  );
  const selectableReadMethods = React.useMemo(() => {
    if (!allowAdminReadMethods) return visibleReadMethods;
    const selectedMethod =
      selectedSpCoinReadMethod && spCoinReadMethodDefs[selectedSpCoinReadMethod] ? [selectedSpCoinReadMethod] : [];
    return Array.from(new Set([...selectedMethod, ...rawAdminReadOptions, ...visibleReadMethods]));
  }, [allowAdminReadMethods, rawAdminReadOptions, selectedSpCoinReadMethod, spCoinReadMethodDefs, visibleReadMethods]);
  React.useEffect(() => {
    if (selectableReadMethods.length === 0) return;
    if (hasEquivalentReadMethod(selectableReadMethods, selectedSpCoinReadMethod)) return;
    setSelectedSpCoinReadMethod(selectableReadMethods[0]);
  }, [selectableReadMethods, selectedSpCoinReadMethod, setSelectedSpCoinReadMethod]);
  React.useEffect(() => {
    const nextValue = String(activeContractAddress || '').trim();
    if (!nextValue) return;
    setSpReadParams((prev) => {
      let changed = false;
      const next = [...prev];
      activeSpCoinReadDef.params.forEach((param, idx) => {
        if (param.type !== 'contract_address') return;
        if (String(next[idx] || '').trim()) return;
        next[idx] = nextValue;
        changed = true;
      });
      return changed ? next : prev;
    });
  }, [activeContractAddress, activeSpCoinReadDef.params, setSpReadParams]);
  React.useEffect(() => {
    if (selectedSpCoinReadMethod !== 'calcDataTimeDiff') return;
    setSpReadParams((prev) => {
      const next = [...prev];
      const now = new Date();
      const nowFormatted = formatDateTimeValue(now);
      if (!String(next[0] || '').trim()) next[0] = nowFormatted;
      if (!String(next[1] || '').trim()) next[1] = nowFormatted;
      if (!String(next[2] || '').trim()) next[2] = 'Seconds';
      return next;
    });
  }, [selectedSpCoinReadMethod, setSpReadParams]);
  const hasVisibleReadMethods = selectableReadMethods.length > 0;
  const displayedReadMethod =
    hasVisibleReadMethods
      ? getVisibleReadMethodValue(selectableReadMethods, selectedSpCoinReadMethod) || '__no_methods__'
      : '__no_methods__';

  return (
    <div className="grid grid-cols-1 gap-3">
      {!hideMethodSelect ? <div className="grid items-center gap-3 rounded-lg bg-green-100/10 px-3 py-2 md:grid-cols-[auto_minmax(0,1fr)]">
        <span className="text-sm font-semibold text-[#8FA8FF]">JSON Method</span>
        <div className="relative w-full min-w-0">
          <select
            className="peer w-full min-w-0 appearance-none rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 pr-10 text-sm text-white"
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
          <NativeSelectChevron />
        </div>
      </div> : null}
      <div id="JSON_METHOD" className="grid grid-cols-1 gap-3 rounded-lg border border-[#31416F] p-3">
        {!hasVisibleReadMethods ? <div className="text-sm text-slate-400">(no SpCoin read methods match the current filter)</div> : null}
        {hasVisibleReadMethods ? activeSpCoinReadDef.params.map((param, idx) => (
          <div key={`sp-read-param-${param.label}-${idx}`} className="grid grid-cols-1 gap-3">
          {selectedSpCoinReadMethod === 'calcDataTimeDiff' && (param.label === 'From Date/Time' || param.label === 'To Date/Time') ? (
            <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <span className="text-sm font-semibold text-[#8FA8FF]">{param.label}</span>
              <button
                type="button"
                data-field-id={`spcoin-read-param-${idx}`}
                className={`${inputStyle} text-left${invalidClass(`spcoin-read-param-${idx}`)}`}
                onClick={() => {
                  markEditorAsUserEdited();
                  setHoverCalendarWarning('');
                  setDateTimePopupParamIdx(idx);
                  setSpReadParams((prev) => {
                    const next = [...prev];
                    if (!String(next[idx] || '').trim()) next[idx] = formatDateTimeValue(new Date());
                    return next;
                  });
                }}
              >
                {spReadParams[idx] || param.placeholder}
              </button>
            </label>
          ) : selectedSpCoinReadMethod === 'calcDataTimeDiff' && param.label === 'Date Difference Unit' ? (
            <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <span />
              <div className="grid gap-3 text-sm text-[#8FA8FF]">
                <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#8FA8FF]/80">DATE:</span>
                  <div className="flex flex-wrap items-center gap-4">
                    {DATE_DIFF_UNITS.filter((unit) => ['Years', 'Months', 'Weeks', 'Days'].includes(unit)).map((unit) => (
                      <label key={`date-diff-unit-date-${unit}`} className="inline-flex items-center gap-2 text-white">
                        <input
                          type="checkbox"
                          checked={selectedDateDifferenceUnits.includes(unit)}
                          onChange={() => {
                            markEditorAsUserEdited();
                            setSpReadParams((prev) => {
                              clearInvalidField(`spcoin-read-param-${idx}`);
                              const next = [...prev];
                              const selected = parseSelectedUnits(next[idx] || '');
                              next[idx] = selected.includes(unit)
                                ? selected.filter((entry) => entry !== unit).join(',')
                                : DATE_DIFF_UNITS.filter((entry) => [...selected, unit].includes(entry)).join(',');
                              return next;
                            });
                          }}
                          className="h-4 w-4 appearance-none rounded-sm border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                        />
                        <span>{DATE_DIFF_UNIT_LABELS[unit]}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#8FA8FF]/80">TIME:</span>
                  <div className="flex flex-wrap items-center gap-4">
                    {DATE_DIFF_UNITS.filter((unit) => ['Hours', 'Minutes', 'Seconds'].includes(unit)).map((unit) => (
                      <label key={`date-diff-unit-time-${unit}`} className="inline-flex items-center gap-2 text-white">
                        <input
                          type="checkbox"
                          checked={selectedDateDifferenceUnits.includes(unit)}
                          onChange={() => {
                            markEditorAsUserEdited();
                            setSpReadParams((prev) => {
                              clearInvalidField(`spcoin-read-param-${idx}`);
                              const next = [...prev];
                              const selected = parseSelectedUnits(next[idx] || '');
                              next[idx] = selected.includes(unit)
                                ? selected.filter((entry) => entry !== unit).join(',')
                                : DATE_DIFF_UNITS.filter((entry) => [...selected, unit].includes(entry)).join(',');
                              return next;
                            });
                          }}
                          className="h-4 w-4 appearance-none rounded-sm border border-red-600 bg-red-600 checked:border-green-500 checked:bg-green-500"
                        />
                        <span>{DATE_DIFF_UNIT_LABELS[unit]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : param.type === 'address' ? (
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
                value={spReadParams[idx] || ''}
                onChange={(e) => {
                  markEditorAsUserEdited();
                  setSpReadParams((prev) => {
                    clearInvalidField(`spcoin-read-param-${idx}`);
                    const next = [...prev];
                    next[idx] = normalizeAccountValue(e.target.value);
                    return next;
                  });
                }}
                placeholder={param.placeholder}
              />
            </label>
          ) : ['Recipient Rate Key', 'Recipient Rate'].includes(param.label) ? (
            <RateSliderRow
              label="Recipient Rate"
              fieldId={`spcoin-read-param-${idx}`}
              invalid={
                invalidFieldIds.includes(`spcoin-read-param-${idx}`) ||
                activeHoverInvalidFieldIds.includes(`spcoin-read-param-${idx}`)
              }
              range={Array.isArray(recipientRateRange) ? recipientRateRange : [0, 100]}
              value={recipientRateValue}
              onChange={(nextValue) => {
                markEditorAsUserEdited();
                clearInvalidField(`spcoin-read-param-${idx}`);
                setRecipientRateValue(nextValue);
                setSpReadParams((prev) => {
                  const next = [...prev];
                  next[idx] = nextValue;
                  return next;
                });
              }}
              helpText={recipientRateKeyHelpText || (recipientRateKeyOptions.length ? `Available keys: ${recipientRateKeyOptions.join(', ')}` : '')}
            />
          ) : ['Agent Rate Key', 'Agent Rate'].includes(param.label) ? (
            <RateSliderRow
              label="Agent Rate"
              fieldId={`spcoin-read-param-${idx}`}
              invalid={
                invalidFieldIds.includes(`spcoin-read-param-${idx}`) ||
                activeHoverInvalidFieldIds.includes(`spcoin-read-param-${idx}`)
              }
              range={Array.isArray(agentRateRange) ? agentRateRange : [0, 100]}
              value={agentRateValue}
              onChange={(nextValue) => {
                markEditorAsUserEdited();
                clearInvalidField(`spcoin-read-param-${idx}`);
                setAgentRateValue(nextValue);
                setSpReadParams((prev) => {
                  const next = [...prev];
                  next[idx] = nextValue;
                  return next;
                });
              }}
              helpText={agentRateKeyHelpText || (agentRateKeyOptions.length ? `Available keys: ${agentRateKeyOptions.join(', ')}` : '')}
            />
          ) : selectedSpCoinReadMethod === 'compareSpCoinContractSize' &&
            ['Previous Release Directory', 'Latest Release Directory'].includes(param.label) ? (
            <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <span className="text-sm font-semibold text-[#8FA8FF]">{param.label}</span>
              <div className="relative w-full min-w-0">
                <select
                  data-field-id={`spcoin-read-param-${idx}`}
                  className={`${inputStyle} peer appearance-none pr-10${invalidClass(`spcoin-read-param-${idx}`)}`}
                  value={
                    contractDirectoryOptions.some((option) => option.value === String(spReadParams[idx] || '').trim())
                      ? spReadParams[idx] || ''
                      : ''
                  }
                  onChange={(e) => {
                    markEditorAsUserEdited();
                    setSpReadParams((prev) => {
                      clearInvalidField(`spcoin-read-param-${idx}`);
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
                    <option key={`spcoin-contract-dir-${param.label}-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <NativeSelectChevron />
              </div>
            </label>
          ) : (
            <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <span className="text-sm font-semibold text-[#8FA8FF]">{param.label}</span>
              <input
                data-field-id={`spcoin-read-param-${idx}`}
                className={`${inputStyle}${invalidClass(`spcoin-read-param-${idx}`)}`}
                value={spReadParams[idx] || ''}
                onChange={(e) => {
                  markEditorAsUserEdited();
                  setSpReadParams((prev) => {
                    clearInvalidField(`spcoin-read-param-${idx}`);
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
        )) : null}
        {hasVisibleReadMethods && selectedSpCoinReadMethod === 'calcDataTimeDiff' ? (
          <div className="grid grid-cols-1 gap-3">
            <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
              <span className="text-sm font-semibold text-[#8FA8FF]">Date Difference</span>
              <input className={`${inputStyle} text-slate-300`} value={dateDifferenceValue} readOnly />
            </label>
          </div>
        ) : null}
      </div>
      <DateTimeCalendarPopup
        isOpen={dateTimePopupParamIdx !== null}
        title={dateTimePopupParamIdx !== null ? activeSpCoinReadDef.params[dateTimePopupParamIdx]?.label || 'Select Date/Time' : 'Select Date/Time'}
        onClose={() => setDateTimePopupParamIdx(null)}
        buttonStyle="h-[36px] rounded px-4 py-[0.28rem] text-center font-bold text-black transition-colors bg-[#E5B94F] hover:bg-green-500"
        inputStyle={inputStyle}
        shiftCalendarMonth={shiftCalendarMonth}
        calendarMonthOptions={calendarMonthOptions}
        calendarViewMonth={calendarViewMonth}
        setCalendarViewMonth={setCalendarViewMonth}
        calendarYearOptions={calendarYearOptions}
        calendarViewYear={calendarViewYear}
        setCalendarViewYear={setCalendarViewYear}
        isViewingCurrentMonth={isViewingCurrentMonth}
        setHoverCalendarWarning={setHoverCalendarWarning}
        calendarDayCells={calendarDayCells}
        isViewingFutureMonth={isViewingFutureMonth}
        today={today}
        selectedDate={popupSelectedDate}
        hoverCalendarWarning={hoverCalendarWarning}
        selectedDateDisplay={dateTimePopupParamIdx !== null ? spReadParams[dateTimePopupParamIdx] || '' : ''}
        onSelectDate={(cellDate) => {
          if (dateTimePopupParamIdx === null) return;
          markEditorAsUserEdited();
          setSpReadParams((prev) => {
            const next = [...prev];
            const existing = parseDateTimeValue(next[dateTimePopupParamIdx] || '') || new Date();
            const updated = new Date(
              cellDate.getFullYear(),
              cellDate.getMonth(),
              cellDate.getDate(),
              existing.getHours(),
              existing.getMinutes(),
              existing.getSeconds(),
              0,
            );
            clearInvalidField(`spcoin-read-param-${dateTimePopupParamIdx}`);
            next[dateTimePopupParamIdx] = formatDateTimeValue(updated);
            return next;
          });
        }}
        onSetNow={() => {
          if (dateTimePopupParamIdx === null) return;
          const now = new Date();
          markEditorAsUserEdited();
          setSpReadParams((prev) => {
            const next = [...prev];
            clearInvalidField(`spcoin-read-param-${dateTimePopupParamIdx}`);
            next[dateTimePopupParamIdx] = formatDateTimeValue(now);
            return next;
          });
          setCalendarViewYear(now.getFullYear());
          setCalendarViewMonth(now.getMonth());
        }}
        timeValues={{
          hours: popupSelectedDate ? String(popupSelectedDate.getHours()) : String(new Date().getHours()),
          minutes: popupSelectedDate ? String(popupSelectedDate.getMinutes()) : String(new Date().getMinutes()),
          seconds: popupSelectedDate ? String(popupSelectedDate.getSeconds()) : String(new Date().getSeconds()),
        }}
        setTimeValue={(part, value) => {
          if (dateTimePopupParamIdx === null) return;
          markEditorAsUserEdited();
          setSpReadParams((prev) => {
            const next = [...prev];
            const base = parseDateTimeValue(next[dateTimePopupParamIdx] || '') || new Date();
            const updated = new Date(base);
            if (part === 'hours') updated.setHours(Number(value));
            if (part === 'minutes') updated.setMinutes(Number(value));
            if (part === 'seconds') updated.setSeconds(Number(value));
            clearInvalidField(`spcoin-read-param-${dateTimePopupParamIdx}`);
            next[dateTimePopupParamIdx] = formatDateTimeValue(updated);
            return next;
          });
        }}
        backdateYears={popupBackdateYears}
        setBackdateYears={setPopupBackdateYears}
        backdateMonths={popupBackdateMonths}
        setBackdateMonths={setPopupBackdateMonths}
        backdateDays={popupBackdateDays}
        setBackdateDays={setPopupBackdateDays}
        maxBackdateYears={11}
        applyBackdateBy={applyPopupBackdateBy}
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
