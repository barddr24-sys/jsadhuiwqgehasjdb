/**
 * Vietnamese Date Utilities
 * All date logic operates in Asia/Ho_Chi_Minh (UTC+7) timezone.
 */

export const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

/** Returns current date as Date object in Vietnam local time representation */
export function getNowVN(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: VN_TIMEZONE }));
}

/** Formats a Date to YYYY-MM-DD string */
export function formatDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Returns today's date in YYYY-MM-DD format (Vietnam timezone) */
export function getTodayVN(): string {
  return formatDateStr(getNowVN());
}

/** Parses YYYY-MM-DD to a local Date object (midnight, no timezone shift) */
export function parseDateStr(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/** Adds `days` to a YYYY-MM-DD date string, returns new YYYY-MM-DD */
export function addDays(dateStr: string, days: number): string {
  const d = parseDateStr(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateStr(d);
}

/** Returns true if dateStr is after today (Vietnam timezone) */
export function isFutureDate(dateStr: string): boolean {
  return dateStr > getTodayVN();
}

/** Returns true if dateStr equals today (Vietnam timezone) */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayVN();
}

/** Validates YYYY-MM-DD format and real calendar date validity */
export function isValidDateStr(dateStr: string): boolean {
  if (typeof dateStr !== 'string') return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12) return false;

  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return false;

  return true;
}

const VN_DAYS = [
  'CHỦ NHẬT',
  'THỨ HAI',
  'THỨ BA',
  'THỨ TƯ',
  'THỨ NĂM',
  'THỨ SÁU',
  'THỨ BẢY',
];

const VN_MONTHS = [
  'THÁNG 1',
  'THÁNG 2',
  'THÁNG 3',
  'THÁNG 4',
  'THÁNG 5',
  'THÁNG 6',
  'THÁNG 7',
  'THÁNG 8',
  'THÁNG 9',
  'THÁNG 10',
  'THÁNG 11',
  'THÁNG 12',
];

export const VN_DAY_NAMES = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
];

export function getDayOfWeekVN(dateStr: string): string {
  const d = parseDateStr(dateStr);
  return VN_DAY_NAMES[d.getDay()] || 'Thứ Tư';
}

export interface DisplayDate {
  dayOfWeek: string; // e.g. "THỨ TƯ"
  fullDate: string;  // e.g. "02 THÁNG 9, 2026"
  short: string;     // e.g. "02/09/2026"
}

/** Returns formatted display strings for a YYYY-MM-DD date */
export function formatDisplayDate(dateStr: string): DisplayDate {
  const d = parseDateStr(dateStr);
  const dayOfWeek = VN_DAYS[d.getDay()];
  const day = String(d.getDate()).padStart(2, '0');
  const month = VN_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  const monthNum = String(d.getMonth() + 1).padStart(2, '0');
  return {
    dayOfWeek,
    fullDate: `${day} ${month}, ${year}`,
    short: `${day}/${monthNum}/${year}`,
  };
}

/** Converts YYYY-MM-DD → DDMMYYYY (for minhngoc API) */
export function toDDMMYYYY(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}${month}${year}`;
}

/** Converts YYYY-MM-DD → DD-MM-YYYY */
export function toDDMMYYYYDash(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
}

/** Formats an ISO timestamp to Vietnamese local time string */
export function formatUpdatedAt(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    const vnTime = d.toLocaleString('vi-VN', {
      timeZone: VN_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
    });
    return `Cập nhật lúc ${vnTime}`;
  } catch {
    return 'Vừa cập nhật';
  }
}
