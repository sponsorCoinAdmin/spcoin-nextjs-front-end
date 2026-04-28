import React from 'react';
import { NativeSelectChevron } from './SelectChevron';

const DEFAULT_WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Props = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
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
  calendarDayCells: Array<{ day: number | null; key: string }>;
  isViewingFutureMonth: boolean;
  today: Date;
  selectedDate: Date | null;
  hoverCalendarWarning: string;
  selectedDateDisplay: string;
  onSelectDate: (value: Date) => void;
  onSetNow: () => void;
  timeValues: {
    hours: string;
    minutes: string;
    seconds: string;
  };
  setTimeValue: (part: 'hours' | 'minutes' | 'seconds', value: string) => void;
  backdateYears: string;
  setBackdateYears: (value: string) => void;
  backdateMonths: string;
  setBackdateMonths: (value: string) => void;
  backdateDays: string;
  setBackdateDays: (value: string) => void;
  maxBackdateYears: number;
  applyBackdateBy: (yearsRaw: string, monthsRaw: string, daysRaw: string) => void;
  backdateLabel?: string;
  timeLabel?: string;
  selectedDateLabel?: string;
  calendarWeekDays?: string[];
};

function pad2(value: number | string) {
  return String(value).padStart(2, '0');
}

export default function DateTimeCalendarPopup(props: Props) {
  const {
    isOpen,
    title,
    onClose,
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
    calendarDayCells,
    isViewingFutureMonth,
    today,
    selectedDate,
    hoverCalendarWarning,
    selectedDateDisplay,
    onSelectDate,
    onSetNow,
    timeValues,
    setTimeValue,
    backdateYears,
    setBackdateYears,
    backdateMonths,
    setBackdateMonths,
    backdateDays,
    setBackdateDays,
    maxBackdateYears,
    applyBackdateBy,
    backdateLabel = 'Backdate By',
    timeLabel = 'Time',
    selectedDateLabel = 'Selected Date',
    calendarWeekDays = DEFAULT_WEEK_DAYS,
  } = props;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-xl border border-[#334155] bg-[#0B1220] p-4 shadow-2xl">
        <div className="relative mb-3 flex items-center justify-center">
          <h3 className="text-center text-base font-semibold text-[#8FA8FF]">{title}</h3>
          <button type="button" className={`absolute right-0 ${buttonStyle}`} onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mx-auto w-full max-w-[22rem] rounded-lg border border-slate-300 bg-slate-50 p-3 text-black">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" className={buttonStyle} onClick={() => shiftCalendarMonth(-1)}>
              Prev
            </button>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  className="peer appearance-none rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 pr-8 text-sm text-black"
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
                <NativeSelectChevron />
              </div>
              <div className="relative">
                <select
                  className="peer appearance-none rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 pr-8 text-sm text-black"
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
                <NativeSelectChevron />
              </div>
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
            {calendarWeekDays.map((day) => (
              <div key={`weekday-${day}`} className="py-1 font-semibold text-black">
                {day}
              </div>
            ))}
            {calendarDayCells.map((cell) => {
              if (!cell.day) {
                return <div key={cell.key} className="h-8 rounded-md border border-transparent" />;
              }
              const cellDate = new Date(calendarViewYear, calendarViewMonth, cell.day);
              const isFuture = isViewingFutureMonth || cellDate.getTime() > today.getTime();
              const highlightedDate = selectedDate || today;
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
                    onSelectDate(cellDate);
                  }}
                  aria-disabled={isFuture}
                  title={isFuture ? 'Future day is not selectable' : `Select ${cellDate.toDateString()}`}
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
              {selectedDateLabel}: {selectedDateDisplay || '(none)'}
            </div>
            <button type="button" className={buttonStyle} onClick={onSetNow}>
              Set Now
            </button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-center">
          <span className="text-sm font-semibold text-[#8FA8FF]">{backdateLabel}</span>
          <div className="relative min-w-0">
            <select
              className={`${inputStyle} peer appearance-none pr-10`}
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
                <option key={`popup-years-${value}`} value={String(value)}>
                  {value} Year{value === 1 ? '' : 's'}
                </option>
              ))}
            </select>
            <NativeSelectChevron />
          </div>
          <div className="relative min-w-0">
            <select
              className={`${inputStyle} peer appearance-none pr-10`}
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
                <option key={`popup-months-${value}`} value={String(value)}>
                  {value} Month{value === 1 ? '' : 's'}
                </option>
              ))}
            </select>
            <NativeSelectChevron />
          </div>
          <div className="relative min-w-0">
            <select
              className={`${inputStyle} peer appearance-none pr-10`}
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
                <option key={`popup-days-${i}`} value={String(i)}>
                  {i} Day{i === 1 ? '' : 's'}
                </option>
              ))}
            </select>
            <NativeSelectChevron />
          </div>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-center">
          <span className="text-sm font-semibold text-[#8FA8FF]">{timeLabel}</span>
          <div className="relative min-w-0">
            <select
              className={`${inputStyle} peer appearance-none pr-10`}
              value={timeValues.hours}
              onChange={(e) => setTimeValue('hours', e.target.value)}
              aria-label="Time hours"
              title="Time hours"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={`popup-hours-${i}`} value={String(i)}>
                  {pad2(i)} Hour
                </option>
              ))}
            </select>
            <NativeSelectChevron />
          </div>
          <div className="relative min-w-0">
            <select
              className={`${inputStyle} peer appearance-none pr-10`}
              value={timeValues.minutes}
              onChange={(e) => setTimeValue('minutes', e.target.value)}
              aria-label="Time minutes"
              title="Time minutes"
            >
              {Array.from({ length: 60 }, (_, i) => (
                <option key={`popup-minutes-${i}`} value={String(i)}>
                  {pad2(i)} Minute
                </option>
              ))}
            </select>
            <NativeSelectChevron />
          </div>
          <div className="relative min-w-0">
            <select
              className={`${inputStyle} peer appearance-none pr-10`}
              value={timeValues.seconds}
              onChange={(e) => setTimeValue('seconds', e.target.value)}
              aria-label="Time seconds"
              title="Time seconds"
            >
              {Array.from({ length: 60 }, (_, i) => (
                <option key={`popup-seconds-${i}`} value={String(i)}>
                  {pad2(i)} Second
                </option>
              ))}
            </select>
            <NativeSelectChevron />
          </div>
        </div>
      </div>
    </div>
  );
}
