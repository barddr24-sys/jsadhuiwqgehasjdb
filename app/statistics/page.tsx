import StatisticsScreen from '@/app/components/statistics/StatisticsScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thống Kê XSMB — Phân Tích & Thống Kê Xổ Số Miền Bắc 30 Ngày Thực Tế',
  description:
    'Không gian phân tích & thống kê chuyên sâu kết quả Xổ Số Miền Bắc (XSMB) từ dữ liệu thực tế MongoDB: bảng tần suất LOTO 00–99, thống kê  , chu kỳ khoảng cách, chuỗi về liên tiếp, cặp số cùng về, số đảo, đầu đuôi, chẵn lẻ và giải đặc biệt 2 số cuối.',
};

/**
 * Screen 2 — XSMB Statistics / Mobile-First Page Route
 */
export default function StatisticsPage() {
  return <StatisticsScreen />;
}
