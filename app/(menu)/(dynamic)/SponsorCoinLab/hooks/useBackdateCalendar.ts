// File: app/(menu)/(dynamic)/SponsorCoinLab/hooks/useBackdateCalendar.ts
import { useCallback, useEffect, useMemo, useState } from 'react';

type WriteParamLike = { type?: string };

type Args = {
  activeWriteParams: WriteParamLike[];
  spWriteParams: string[];
  updateSpWriteParamAtIndex: (idx: number, value: string) => void;
};

function pad2(value: number | string): string {
  return String(value).padStart(2, '0');
}

function getBackdatedDate(base: Date, years: number, months: number, days: number): Date {
  const result = new Date(base);
  result.setFullYear(result.getFullYear() - years);
  result.setMonth(result.getMonth() - months);
  result.setDate(result.getDate() - days);
  return result;
}

function calculateBackdateParts(fromDate: Date, toDate: Date): { years: number; months: number; days: number } {
  let fromYear = fromDate.getFullYear();
  let fromMonth = fromDate.getMonth() + 1;
  let fromDay = fromDate.getDate();

  const toYear = toDate.getFullYear();
  const toMonth = toDate.getMonth() + 1;
  const toDay = toDate.getDate();

  if (fromDay < toDay) {
    fromMonth -= 1;
    if (fromMonth <= 0) {
      fromMonth += 12;
      fromYear -= 1;
    }
    fromDay += new Date(fromYear, fromMonth, 0).getDate();
  }

  const days = fromDay - toDay;

  if (fromMonth < toMonth) {
    fromMonth += 12;
    fromYear -= 1;
  }

  const months = fromMonth - toMonth;
  const years = fromYear - toYear;

  return { years, months, days };
}

export function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateTimeDisplay(datePart: string, hours: string, minutes: string, seconds: string): string {
  return `${datePart} ${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

export function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
  return date;
}

export const CALENDAR_WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CALENDAR_MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function useBackdateCalendar(args: Args) {
  const { activeWriteParams, spWriteParams, updateSpWriteParamAtIndex } = args;
  const [backdatePopupParamIdx, setBackdatePopupParamIdx] = useState<number | null>(null);
  const [backdateYears, setBackdateYears] = useState('0');
  const [backdateMonths, setBackdateMonths] = useState('0');
  const [backdateDays, setBackdateDays] = useState('0');
  const [backdateHours, setBackdateHours] = useState(() => String(new Date().getHours()));
  const [backdateMinutes, setBackdateMinutes] = useState(() => String(new Date().getMinutes()));
  const [backdateSeconds, setBackdateSeconds] = useState(() => String(new Date().getSeconds()));
  const [hoverCalendarWarning, setHoverCalendarWarning] = useState('');
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [calendarViewYear, setCalendarViewYear] = useState(today.getFullYear());
  const [calendarViewMonth, setCalendarViewMonth] = useState(today.getMonth());

  useEffect(() => {
    if (backdatePopupParamIdx === null) return;
    const def = activeWriteParams[backdatePopupParamIdx];
    if (!def || def.type !== 'date') {
      setBackdatePopupParamIdx(null);
    }
  }, [activeWriteParams, backdatePopupParamIdx]);

  const openBackdatePickerAt = useCallback(
    (idx: number) => {
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
    },
    [spWriteParams, updateSpWriteParamAtIndex],
  );

  const applyBackdateBy = useCallback(
    (yearsRaw: string, monthsRaw: string, daysRaw: string, targetIdx: number | null = backdatePopupParamIdx) => {
      if (targetIdx === null) return;
      const years = Number(yearsRaw || '0');
      const months = Number(monthsRaw || '0');
      const days = Number(daysRaw || '0');
      const base = new Date();
      base.setHours(0, 0, 0, 0);
      const backdated = getBackdatedDate(base, years, months, days);
      updateSpWriteParamAtIndex(targetIdx, formatDateInput(backdated));
    },
    [backdatePopupParamIdx, updateSpWriteParamAtIndex],
  );

  const selectedBackdateDate = useMemo(() => {
    if (backdatePopupParamIdx === null) return null;
    return parseDateInput(spWriteParams[backdatePopupParamIdx] || '');
  }, [backdatePopupParamIdx, spWriteParams]);

  const isViewingCurrentMonth = useMemo(
    () => calendarViewYear === today.getFullYear() && calendarViewMonth === today.getMonth(),
    [calendarViewMonth, calendarViewYear, today],
  );
  const isViewingFutureMonth = useMemo(() => {
    if (calendarViewYear > today.getFullYear()) return true;
    if (calendarViewYear === today.getFullYear() && calendarViewMonth > today.getMonth()) return true;
    return false;
  }, [calendarViewMonth, calendarViewYear, today]);

  useEffect(() => {
    if (backdatePopupParamIdx === null) return;
    const base = selectedBackdateDate || today;
    setCalendarViewYear(base.getFullYear());
    setCalendarViewMonth(base.getMonth());
  }, [backdatePopupParamIdx, selectedBackdateDate, today]);

  useEffect(() => {
    if (!selectedBackdateDate) return;
    if (selectedBackdateDate.getTime() > today.getTime()) return;
    const diff = calculateBackdateParts(today, selectedBackdateDate);
    setBackdateYears(String(diff.years));
    setBackdateMonths(String(diff.months));
    setBackdateDays(String(diff.days));
  }, [selectedBackdateDate, today]);

  const minSelectableYear = useMemo(() => today.getFullYear() - 11, [today]);
  const maxBackdateYears = useMemo(() => Math.max(0, today.getFullYear() - 2015), [today]);
  const calendarYearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = today.getFullYear(); y >= minSelectableYear; y--) years.push(y);
    return years;
  }, [minSelectableYear, today]);
  const calendarMonthOptions = useMemo(() => {
    const maxMonthIndex = calendarViewYear === today.getFullYear() ? today.getMonth() : 11;
    return CALENDAR_MONTH_LABELS.map((label, monthIndex) => ({ label, monthIndex })).filter(
      (entry) => entry.monthIndex <= maxMonthIndex,
    );
  }, [calendarViewYear, today]);

  useEffect(() => {
    if (!calendarYearOptions.includes(calendarViewYear)) {
      setCalendarViewYear(today.getFullYear());
    }
  }, [calendarViewYear, calendarYearOptions, today]);
  useEffect(() => {
    const allowed = new Set(calendarMonthOptions.map((entry) => entry.monthIndex));
    if (!allowed.has(calendarViewMonth)) {
      const fallback = calendarMonthOptions[calendarMonthOptions.length - 1];
      if (fallback) setCalendarViewMonth(fallback.monthIndex);
    }
  }, [calendarMonthOptions, calendarViewMonth]);

  const calendarDayCells = useMemo(() => {
    const firstDayIndex = new Date(calendarViewYear, calendarViewMonth, 1).getDay();
    const daysInMonth = new Date(calendarViewYear, calendarViewMonth + 1, 0).getDate();
    const cells: Array<{ day: number | null; key: string }> = [];
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ day: null, key: `pad-${i}` });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ day, key: `day-${day}` });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, key: `tail-${cells.length}` });
    }
    return cells;
  }, [calendarViewMonth, calendarViewYear]);

  const shiftCalendarMonth = useCallback(
    (delta: number) => {
      const next = new Date(calendarViewYear, calendarViewMonth + delta, 1);
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      if (next.getTime() > currentMonthStart.getTime()) return;
      setCalendarViewYear(next.getFullYear());
      setCalendarViewMonth(next.getMonth());
    },
    [calendarViewMonth, calendarViewYear, today],
  );

  return {
    backdatePopupParamIdx,
    setBackdatePopupParamIdx,
    backdateYears,
    setBackdateYears,
    backdateMonths,
    setBackdateMonths,
    backdateDays,
    setBackdateDays,
    backdateHours,
    setBackdateHours,
    backdateMinutes,
    setBackdateMinutes,
    backdateSeconds,
    setBackdateSeconds,
    hoverCalendarWarning,
    setHoverCalendarWarning,
    today,
    calendarViewYear,
    setCalendarViewYear,
    calendarViewMonth,
    setCalendarViewMonth,
    selectedBackdateDate,
    isViewingCurrentMonth,
    isViewingFutureMonth,
    maxBackdateYears,
    calendarYearOptions,
    calendarMonthOptions,
    calendarDayCells,
    shiftCalendarMonth,
    applyBackdateBy,
    openBackdatePickerAt,
  };
}
