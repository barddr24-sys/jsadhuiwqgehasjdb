import LotoScreen from '@/app/components/loto/LotoScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Loto XSMB — Bảng Loto Miền Bắc Hôm Nay, 3 Ngày & 7 Ngày',
  description:
    'Tra cứu loto XSMB hôm nay nhanh chóng, chính xác. Xem loto xuất hiện nhiều, bảng loto theo đầu, loto theo đuôi, ma trận tần suất 00–99 và chi tiết từng con số.',
};

/**
 * Screen 3 — XSMB Loto / Mobile-First Page Route
 */
export default function LotoPage() {
  return <section className='mt-200px'>
    <LotoScreen />
  </section>;
}
