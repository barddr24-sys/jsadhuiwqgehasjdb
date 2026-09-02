import type { Metadata } from 'next';
import NumberDetailScreen from '@/app/components/number/NumberDetailScreen';
import { normalizeNumber } from '@/app/lib/number-detail-engine';

interface PageProps {
  params: Promise<{ number: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { number } = await params;
  const normalized = normalizeNumber(number);

  return {
    title: `Chi Tiết Số ${normalized} — Thống Kê XSMB Hôm Nay, 3 Ngày & 7 Ngày`,
    description: `Xem lịch sử xuất hiện, tần suất và chi tiết giải thưởng của số ${normalized} trong kết quả Xổ Số Miền Bắc (XSMB). Thống kê chính xác và cập nhật liên tục.`,
    openGraph: {
      title: `Chi Tiết Số ${normalized} — Thống Kê XSMB`,
      description: `Lịch sử xuất hiện và thống kê chi tiết của số ${normalized} trong kết quả XSMB.`,
    },
  };
}

/**
 * Screen 4 — XSMB Number Detail / Mobile-First Page Route
 * Route: /number/[number] (e.g. /number/23, /number/03, /number/99)
 */
export default async function NumberDetailPage({ params }: PageProps) {
  const { number } = await params;
  const normalized = normalizeNumber(number);

  return <NumberDetailScreen initialNumber={normalized} />;
}
