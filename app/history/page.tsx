import { Suspense } from 'react';
import HistoryScreen from '@/app/components/history/HistoryScreen';
import { HistoryListSkeleton } from '@/app/components/history/HistoryStates';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lịch Sử XSMB — Kết Quả Xổ Số Miền Bắc Theo Ngày Chính Xác',
  description:
    'Tra cứu lịch sử kết quả Xổ Số Miền Bắc (XSMB) theo từng ngày. Xem lại đầy đủ 27 giải thưởng, Giải Đặc Biệt, Giải Nhất và phân tích số loto 2 số nhanh chóng, chuẩn xác.',
  openGraph: {
    title: 'Lịch Sử XSMB — Tra Cứu Kết Quả Xổ Số Miền Bắc',
    description: 'Xem lại kết quả XSMB theo từng ngày với đầy đủ 27 giải thưởng chính thức.',
  },
};

/**
 * Screen 5 — XSMB History & Result Detail / Mobile-First Page Route
 * Route: /history
 */
export default function HistoryPage() {
  return (
    <Suspense fallback={<HistoryListSkeleton />}>
      <HistoryScreen />
    </Suspense>
  );
}
