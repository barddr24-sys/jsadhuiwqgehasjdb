import { Suspense } from 'react';
import HistoryScreen from '@/app/components/history/HistoryScreen';
import { ResultDetailSkeleton } from '@/app/components/history/HistoryStates';
import { formatDisplayDate, isValidDateStr } from '@/app/lib/date-utils';
import type { Metadata } from 'next';

interface HistoryDatePageProps {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({ params }: HistoryDatePageProps): Promise<Metadata> {
  const { date } = await params;
  const dInfo = isValidDateStr(date) ? formatDisplayDate(date) : { short: date, dayOfWeek: '' };

  return {
    title: `Kết Quả XSMB Ngày ${dInfo.short} (${dInfo.dayOfWeek}) — Chi Tiết 27 Giải Thưởng`,
    description: `Xem chi tiết kết quả Xổ Số Miền Bắc ngày ${dInfo.short} (${dInfo.dayOfWeek}): Giải Đặc Biệt, Giải Nhất đến Giải Bảy và phân tích loto 2 số đầy đủ, chính xác nhất.`,
    openGraph: {
      title: `Kết Quả XSMB Ngày ${dInfo.short} (${dInfo.dayOfWeek})`,
      description: `Kết quả XSMB ngày ${dInfo.short} với đầy đủ 27 giải thưởng chính thức.`,
    },
  };
}

/**
 * Screen 5 (State B) — Direct Result Detail Route for a Specific Date
 * Route: /history/[date] (e.g. /history/2026-09-02)
 */
export default async function HistoryDatePage({ params }: HistoryDatePageProps) {
  const { date } = await params;
  return (
    <Suspense fallback={<ResultDetailSkeleton />}>
      <HistoryScreen initialDate={date} />
    </Suspense>
  );
}
