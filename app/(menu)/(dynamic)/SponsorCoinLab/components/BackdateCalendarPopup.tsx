// File: app/(menu)/(dynamic)/SponsorCoinLab/components/BackdateCalendarPopup.tsx
import React from 'react';

type Props = {
  backdatePopupParamIdx: number | null;
  setBackdatePopupParamIdx: (value: number | null) => void;
  buttonStyle: string;
  inputStyle: string;
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
  spWriteParams: string[];
  formatDateInput: (date: Date) => string;
  formatDateTimeDisplay: (datePart: string, hours: string, minutes: string, seconds: string) => string;
  updateSpWriteParamAtIndex: (idx: number, value: string) => void;
  backdateHours: string;
  setBackdateHours: (value: string) => void;
  backdateMinutes: string;
  setBackdateMinutes: (value: string) => void;
  backdateSeconds: string;
  setBackdateSeconds: (value: string) => void;
  setBackdateYears: (value: string) => void;
  setBackdateMonths: (value: string) => void;
  setBackdateDays: (value: string) => void;
  maxBackdateYears: number;
  backdateYears: string;
  backdateMonths: string;
  backdateDays: string;
  applyBackdateBy: (yearsRaw: string, monthsRaw: string, daysRaw: string, targetIdx?: number | null) => void;
};

export default function BackdateCalendarPopup(props: Props) {
  const {
    backdatePopupParamIdx,
    setBackdatePopupParamIdx,
    buttonStyle,
    inputStyle,
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
    spWriteParams,
    formatDateInput,
    formatDateTimeDisplay,
    updateSpWriteParamAtIndex,
    backdateHours,
    setBackdateHours,
    backdateMinutes,
    setBackdateMinutes,
    backdateSeconds,
    setBackdateSeconds,
    setBackdateYears,
    setBackdateMonths,
    setBackdateDays,
    maxBackdateYears,
    backdateYears,
    backdateMonths,
    backdateDays,
    applyBackdateBy,
  } = props;

  if (backdatePopupParamIdx === null) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-xl border border-[#334155] bg-[#0B1220] p-4 shadow-2xl">
        <div className="relative mb-3 flex items-center justify-center">
          <h3 className="text-center text-base font-semibold text-[#8FA8FF]">Transaction Back Time</h3>
          <button type="button" className={`absolute right-0 ${buttonStyle}`} onClick={() => setBackdatePopupParamIdx(null)}>
            Close
          </button>
        </div>
        <div className="mx-auto w-full max-w-[22rem] rounded-lg border border-slate-300 bg-slate-50 p-3 text-black">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" className={buttonStyle} onClick={() => shiftCalendarMonth(-1)}>
              Prev
            </button>
            <div className="flex items-center gap-2">
              <select
                className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-sm text-black"
                value={calendarViewMonth}
                onChange={(e) => setCalendarViewMonth(Number(e.target.value))}
                aria-label="Calendar month"
                title="Calendar month"
              >
                {calendarMonthOptions.map((entry) => (
                  <option key={`calendar-month-${entry.monthIndex}`} value={entry.monthIndex}>
                    {entry.label}
                  </option>
                ))}
              </select>
              <select
                className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-sm text-black"
                value={calendarViewYear}
                onChange={(e) => setCalendarViewYear(Number(e.target.value))}
                aria-label="Calendar year"
                title="Calendar year"
              >
                {calendarYearOptions.map((year) => (
                  <option key={`calendar-year-${year}`} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className={`${
                buttonStyle
              } ${
                isViewingCurrentMonth
                  ? 'relative cursor-not-allowed border-slate-600 bg-slate-500 text-slate-100 hover:border-red-500 hover:bg-red-100 hover:text-red-600'
                  : ''
              }`}
              onClick={() => {
                if (isViewingCurrentMonth) return;
                shiftCalendarMonth(1);
              }}
              aria-disabled={isViewingCurrentMonth}
              title={isViewingCurrentMonth ? 'Future month is not selectable' : 'Go to next month'}
              onMouseEnter={() => {
                if (isViewingCurrentMonth) setHoverCalendarWarning('Future month is not selectable');
              }}
              onMouseLeave={() => setHoverCalendarWarning('')}
            >
              <span>Next</span>
              {isViewingCurrentMonth && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-base font-medium text-red-500/35">
                  X
                </span>
              )}
            </button>
          </div>
          <div className="grid grid-cols-7 gap-x-[0.025rem] gap-y-1 text-center text-xs text-black">
            {CALENDAR_WEEK_DAYS.map((day) => (
              <div key={`weekday-${day}`} className="py-1 font-semibold text-black">
                {day}
              </div>
            ))}
            {calendarDayCells.map((cell) => {
              if (!cell.day) {
                return <div key={cell.key} className="h-8 rounded-md border border-transparent" />;
              }
              const cellDate = new Date(calendarViewYear, calendarViewMonth, cell.day);
              const value = formatDateInput(cellDate);
              const isFuture = isViewingFutureMonth || cellDate.getTime() > today.getTime();
              const highlightedDate = selectedBackdateDate || today;
              const isSelected =
                highlightedDate.getFullYear() === cellDate.getFullYear() &&
                highlightedDate.getMonth() === cellDate.getMonth() &&
                highlightedDate.getDate() === cellDate.getDate();
              return (
                <button
                  key={cell.key}
                  type="button"
                  className={`h-7 rounded-md border text-xs font-bold transition-colors ${
                    isSelected
                      ? 'border-[#2563EB] bg-[#1D4ED8] text-white'
                      : isFuture
                      ? 'border-slate-600 bg-slate-500 text-slate-100 cursor-not-allowed hover:border-red-500 hover:bg-red-100 hover:text-red-600 hover:font-extrabold'
                      : 'border-slate-300 bg-slate-50 text-black hover:bg-green-300'
                  }`}
                  onClick={() => {
                    if (isFuture) return;
                    updateSpWriteParamAtIndex(backdatePopupParamIdx, value);
                  }}
                  aria-disabled={isFuture}
                  title={isFuture ? 'Future day is not selectable' : `Select ${value}`}
                  onMouseEnter={() => {
                    if (isFuture) setHoverCalendarWarning('Future day is not selectable');
                  }}
                  onMouseLeave={() => setHoverCalendarWarning('')}
                >
                  <span>{cell.day}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-1 min-h-[1.25rem] text-xs font-bold text-red-600">{hoverCalendarWarning}</div>
          <div className="mt-3 flex items-center justify-between gap-2 text-xs font-bold text-black">
            <div>
              Selected Date:{' '}
              {spWriteParams[backdatePopupParamIdx]
                ? formatDateTimeDisplay(
                    spWriteParams[backdatePopupParamIdx],
                    backdateHours,
                    backdateMinutes,
                    backdateSeconds,
                  )
                : '(none)'}
            </div>
            <button
              type="button"
              className={buttonStyle}
              onClick={() => {
                const now = new Date();
                updateSpWriteParamAtIndex(backdatePopupParamIdx, formatDateInput(now));
                setBackdateHours(String(now.getHours()));
                setBackdateMinutes(String(now.getMinutes()));
                setBackdateSeconds(String(now.getSeconds()));
                setBackdateYears('0');
                setBackdateMonths('0');
                setBackdateDays('0');
                setCalendarViewYear(now.getFullYear());
                setCalendarViewMonth(now.getMonth());
              }}
            >
              Set Now
            </button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-center">
          <span className="text-sm font-semibold text-[#8FA8FF]">Backdate By</span>
          <select
            className={inputStyle}
            value={backdateYears}
            onChange={(e) => {
              const years = e.target.value;
              setBackdateYears(years);
              applyBackdateBy(years, backdateMonths, backdateDays);
            }}
            aria-label="Backdate by years"
            title="Backdate by years"
          >
            {Array.from({ length: maxBackdateYears + 1 }, (_, i) => i).map((value) => (
              <option key={`backdate-years-${value}`} value={String(value)}>
                {value} Year{value === 1 ? '' : 's'}
              </option>
            ))}
          </select>
          <select
            className={inputStyle}
            value={backdateMonths}
            onChange={(e) => {
              const months = e.target.value;
              setBackdateMonths(months);
              applyBackdateBy(backdateYears, months, backdateDays);
            }}
            aria-label="Backdate by months"
            title="Backdate by months"
          >
            {Array.from({ length: 13 }, (_, i) => i).map((value) => (
              <option key={`backdate-months-${value}`} value={String(value)}>
                {value} Month{value === 1 ? '' : 's'}
              </option>
            ))}
          </select>
          <select
            className={inputStyle}
            value={backdateDays}
            onChange={(e) => {
              const days = e.target.value;
              setBackdateDays(days);
              applyBackdateBy(backdateYears, backdateMonths, days);
            }}
            aria-label="Backdate by days"
            title="Backdate by days"
          >
            {Array.from({ length: 32 }, (_, i) => (
              <option key={`backdate-days-${i}`} value={String(i)}>
                {i} Day{i === 1 ? '' : 's'}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-center">
          <span className="text-sm font-semibold text-[#8FA8FF]">Time</span>
          <select
            className={inputStyle}
            value={backdateHours}
            onChange={(e) => setBackdateHours(e.target.value)}
            aria-label="Backdate time hours"
            title="Backdate time hours"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={`backdate-hours-${i}`} value={String(i)}>
                {String(i).padStart(2, '0')} Hour
              </option>
            ))}
          </select>
          <select
            className={inputStyle}
            value={backdateMinutes}
            onChange={(e) => setBackdateMinutes(e.target.value)}
            aria-label="Backdate time minutes"
            title="Backdate time minutes"
          >
            {Array.from({ length: 60 }, (_, i) => (
              <option key={`backdate-minutes-${i}`} value={String(i)}>
                {String(i).padStart(2, '0')} Minute
              </option>
            ))}
          </select>
          <select
            className={inputStyle}
            value={backdateSeconds}
            onChange={(e) => setBackdateSeconds(e.target.value)}
            aria-label="Backdate time seconds"
            title="Backdate time seconds"
          >
            {Array.from({ length: 60 }, (_, i) => (
              <option key={`backdate-seconds-${i}`} value={String(i)}>
                {String(i).padStart(2, '0')} Second
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
