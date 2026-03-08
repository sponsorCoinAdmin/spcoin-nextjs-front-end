// File: app/(menu)/(dynamic)/SponsorCoinLab/components/SpCoinWriteController.tsx
import React from 'react';
import BackdateCalendarPopup from './BackdateCalendarPopup';

type ParamDefLike = { label: string; placeholder: string; type: string };
type MethodDef = { title: string; params: ParamDefLike[]; executable?: boolean };

type Props = {
  hideUnexecutables: boolean;
  setHideUnexecutables: (value: boolean) => void;
  selectedSpCoinWriteMethod: string;
  setSelectedSpCoinWriteMethod: (value: string) => void;
  spCoinWriteOptions: string[];
  spCoinWriteMethodDefs: Record<string, MethodDef>;
  activeSpCoinWriteDef: MethodDef;
  spWriteParams: string[];
  updateSpWriteParamAtIndex: (idx: number, value: string) => void;
  inputStyle: string;
  buttonStyle: string;
  runSelectedSpCoinWriteMethod: () => void;
  formatDateTimeDisplay: (datePart: string, hours: string, minutes: string, seconds: string) => string;
  formatDateInput: (date: Date) => string;
  backdateHours: string;
  setBackdateHours: (value: string) => void;
  backdateMinutes: string;
  setBackdateMinutes: (value: string) => void;
  backdateSeconds: string;
  setBackdateSeconds: (value: string) => void;
  setBackdateYears: (value: string) => void;
  setBackdateMonths: (value: string) => void;
  setBackdateDays: (value: string) => void;
  backdatePopupParamIdx: number | null;
  setBackdatePopupParamIdx: (value: number | null) => void;
  shiftCalendarMonth: (delta: number) => void;
  calendarMonthOptions: Array<{ label: string; monthIndex: number }>;
  calendarViewMonth: number;
  setCalendarViewMonth: (value: number) => void;
  calendarYearOptions: number[];
  calendarViewYear: number;
  setCalendarViewYear: (value: number) => void;
  isViewingCurrentMonth: boolean;
  setHoverCalendarWarning: (value: string) => void;
  CALENDAR_WEEK_DAYS: string[];
  calendarDayCells: Array<{ day: number | null; key: string }>;
  isViewingFutureMonth: boolean;
  today: Date;
  selectedBackdateDate: Date | null;
  hoverCalendarWarning: string;
  maxBackdateYears: number;
  backdateYears: string;
  backdateMonths: string;
  backdateDays: string;
  applyBackdateBy: (yearsRaw: string, monthsRaw: string, daysRaw: string, targetIdx?: number | null) => void;
};

export default function SpCoinWriteController(props: Props) {
  const {
    hideUnexecutables,
    setHideUnexecutables,
    selectedSpCoinWriteMethod,
    setSelectedSpCoinWriteMethod,
    spCoinWriteOptions,
    spCoinWriteMethodDefs,
    activeSpCoinWriteDef,
    spWriteParams,
    updateSpWriteParamAtIndex,
    inputStyle,
    buttonStyle,
    runSelectedSpCoinWriteMethod,
    formatDateTimeDisplay,
    formatDateInput,
    backdateHours,
    setBackdateHours,
    backdateMinutes,
    setBackdateMinutes,
    backdateSeconds,
    setBackdateSeconds,
    setBackdateYears,
    setBackdateMonths,
    setBackdateDays,
    backdatePopupParamIdx,
    setBackdatePopupParamIdx,
    shiftCalendarMonth,
    calendarMonthOptions,
    calendarViewMonth,
    setCalendarViewMonth,
    calendarYearOptions,
    calendarViewYear,
    setCalendarViewYear,
    isViewingCurrentMonth,
    setHoverCalendarWarning,
    CALENDAR_WEEK_DAYS,
    calendarDayCells,
    isViewingFutureMonth,
    today,
    selectedBackdateDate,
    hoverCalendarWarning,
    maxBackdateYears,
    backdateYears,
    backdateMonths,
    backdateDays,
    applyBackdateBy,
  } = props;

  return (
    <div className="mt-4 grid grid-cols-1 gap-3">
      <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#8FA8FF]">
        <input type="checkbox" checked={hideUnexecutables} onChange={(e) => setHideUnexecutables(e.target.checked)} />
        <span>Hide unexecutables</span>
      </label>
      <label className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
        <span className="text-sm font-semibold text-[#8FA8FF]">SpCoin Write Method</span>
        <select
          className="w-fit min-w-[18ch] rounded-lg border border-[#334155] bg-[#0E111B] px-3 py-2 text-sm text-white"
          value={selectedSpCoinWriteMethod}
          onChange={(e) => setSelectedSpCoinWriteMethod(e.target.value)}
        >
          {spCoinWriteOptions.map((name) => (
            <option
              key={`sp-write-${name}`}
              value={name}
              style={{ color: spCoinWriteMethodDefs[name].executable === false ? '#ef4444' : undefined }}
            >
              {name}
            </option>
          ))}
        </select>
      </label>
      {activeSpCoinWriteDef.params.map((param, idx) => (
        <label key={`sp-write-param-${param.label}-${idx}`} className="grid items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
          <span className="text-sm font-semibold text-[#8FA8FF]">{param.label}</span>
          {param.type === 'date' ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                className={`${inputStyle} cursor-pointer`}
                value={formatDateTimeDisplay(
                  spWriteParams[idx] || formatDateInput(new Date()),
                  backdateHours,
                  backdateMinutes,
                  backdateSeconds,
                )}
                onClick={() => {
                  if (!spWriteParams[idx]) {
                    const now = new Date();
                    updateSpWriteParamAtIndex(idx, formatDateInput(now));
                    setBackdateHours(String(now.getHours()));
                    setBackdateMinutes(String(now.getMinutes()));
                    setBackdateSeconds(String(now.getSeconds()));
                  }
                  setBackdateYears('0');
                  setBackdateMonths('0');
                  setBackdateDays('0');
                  setBackdatePopupParamIdx(idx);
                }}
                onFocus={() => {
                  if (!spWriteParams[idx]) {
                    const now = new Date();
                    updateSpWriteParamAtIndex(idx, formatDateInput(now));
                    setBackdateHours(String(now.getHours()));
                    setBackdateMinutes(String(now.getMinutes()));
                    setBackdateSeconds(String(now.getSeconds()));
                  }
                  setBackdateYears('0');
                  setBackdateMonths('0');
                  setBackdateDays('0');
                  setBackdatePopupParamIdx(idx);
                }}
              />
            </div>
          ) : (
            <input
              type="text"
              className={inputStyle}
              value={spWriteParams[idx] || ''}
              onChange={(e) => updateSpWriteParamAtIndex(idx, e.target.value)}
              placeholder={param.placeholder}
            />
          )}
        </label>
      ))}
      <BackdateCalendarPopup
        backdatePopupParamIdx={backdatePopupParamIdx}
        setBackdatePopupParamIdx={setBackdatePopupParamIdx}
        buttonStyle={buttonStyle}
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
        CALENDAR_WEEK_DAYS={CALENDAR_WEEK_DAYS}
        calendarDayCells={calendarDayCells}
        isViewingFutureMonth={isViewingFutureMonth}
        today={today}
        selectedBackdateDate={selectedBackdateDate}
        hoverCalendarWarning={hoverCalendarWarning}
        spWriteParams={spWriteParams}
        formatDateInput={formatDateInput}
        formatDateTimeDisplay={formatDateTimeDisplay}
        updateSpWriteParamAtIndex={updateSpWriteParamAtIndex}
        backdateHours={backdateHours}
        setBackdateHours={setBackdateHours}
        backdateMinutes={backdateMinutes}
        setBackdateMinutes={setBackdateMinutes}
        backdateSeconds={backdateSeconds}
        setBackdateSeconds={setBackdateSeconds}
        setBackdateYears={setBackdateYears}
        setBackdateMonths={setBackdateMonths}
        setBackdateDays={setBackdateDays}
        maxBackdateYears={maxBackdateYears}
        backdateYears={backdateYears}
        backdateMonths={backdateMonths}
        backdateDays={backdateDays}
        applyBackdateBy={applyBackdateBy}
      />
      <button type="button" className={buttonStyle} onClick={runSelectedSpCoinWriteMethod}>
        Execute {activeSpCoinWriteDef.title}
      </button>
    </div>
  );
}
