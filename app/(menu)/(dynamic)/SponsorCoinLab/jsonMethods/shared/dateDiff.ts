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

function formatDecimal(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(6).replace(/\.?0+$/, '');
}

function formatSegmentValue(value: number, pad: boolean) {
  const prefix = value < 0 ? '-' : '';
  const absolute = Math.abs(value);
  const formatted = formatDecimal(absolute);
  if (!pad) return `${prefix}${formatted}`;
  const [whole, fraction] = formatted.split('.');
  return `${prefix}${pad2(whole)}${fraction ? `.${fraction}` : ''}`;
}

function parseSelectedDateDiffUnits(unitRaw: string) {
  const rawUnits = String(unitRaw || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return DATE_DIFF_UNITS.filter((unit) => rawUnits.includes(unit));
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

function formatDateTimeValue(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(
    date.getMinutes(),
  )}:${pad2(date.getSeconds())}`;
}

function formatDateDifferenceValue(fromRaw: string, toRaw: string, unitRaw: string) {
  const fromDate = parseDateTimeValue(fromRaw);
  const toDate = parseDateTimeValue(toRaw);
  if (!fromDate || !toDate) return '';
  const diffSeconds = (toDate.getTime() - fromDate.getTime()) / 1000;
  const selectedUnits = parseSelectedDateDiffUnits(unitRaw);
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

export {
  DATE_DIFF_UNITS,
  DATE_DIFF_UNIT_LABELS,
  formatDateDifferenceValue,
  formatDateTimeValue,
  parseDateTimeValue,
  parseSelectedDateDiffUnits,
};
