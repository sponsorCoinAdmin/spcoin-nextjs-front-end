// File: app/(menu)/(dynamic)/SponsorCoinLab/components/BackdateCalendarPopup.tsx
import React from 'react';
import DateTimeCalendarPopup from './DateTimeCalendarPopup';

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

  return (
    <DateTimeCalendarPopup
      isOpen={backdatePopupParamIdx !== null}
      title="Transaction Back Time"
      onClose={() => setBackdatePopupParamIdx(null)}
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
      calendarWeekDays={CALENDAR_WEEK_DAYS}
      calendarDayCells={calendarDayCells}
      isViewingFutureMonth={isViewingFutureMonth}
      today={today}
      selectedDate={selectedBackdateDate}
      hoverCalendarWarning={hoverCalendarWarning}
      selectedDateDisplay={
        backdatePopupParamIdx !== null && spWriteParams[backdatePopupParamIdx]
          ? formatDateTimeDisplay(
              spWriteParams[backdatePopupParamIdx],
              backdateHours,
              backdateMinutes,
              backdateSeconds,
            )
          : ''
      }
      onSelectDate={(cellDate) => {
        if (backdatePopupParamIdx === null) return;
        updateSpWriteParamAtIndex(backdatePopupParamIdx, formatDateInput(cellDate));
      }}
      onSetNow={() => {
        if (backdatePopupParamIdx === null) return;
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
      timeValues={{
        hours: backdateHours,
        minutes: backdateMinutes,
        seconds: backdateSeconds,
      }}
      setTimeValue={(part, value) => {
        if (part === 'hours') setBackdateHours(value);
        if (part === 'minutes') setBackdateMinutes(value);
        if (part === 'seconds') setBackdateSeconds(value);
      }}
      backdateYears={backdateYears}
      setBackdateYears={setBackdateYears}
      backdateMonths={backdateMonths}
      setBackdateMonths={setBackdateMonths}
      backdateDays={backdateDays}
      setBackdateDays={setBackdateDays}
      maxBackdateYears={maxBackdateYears}
      applyBackdateBy={(yearsRaw, monthsRaw, daysRaw) => applyBackdateBy(yearsRaw, monthsRaw, daysRaw)}
    />
  );
}
