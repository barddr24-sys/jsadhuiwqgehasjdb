'use client';

import { useState, useTransition, useMemo, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  calculateLotoData,
  type LotoPeriod,
  type LotoDataResult,
} from '@/app/lib/loto-engine';
import type { HistoricalDrawRecord } from '@/app/lib/statistics-engine';
import { getDayOfWeekVN } from '@/app/lib/date-utils';
import type { HistorySummaryItemDTO, DrawResponseDTO } from '@/app/lib/services/xsmb-api.service';
import type { XSMBPrizes } from '@/app/lib/xsmb-types';

import LotoPeriodSelector from './LotoPeriodSelector';
import LotoDateContext from './LotoDateContext';
import LotoSummaryCard from './LotoSummaryCard';
import LotoTodaySection from './LotoTodaySection';
import LotoSearch from './LotoSearch';
import LotoFrequencyRanking from './LotoFrequencyRanking';
import LotoDigitSection from './LotoDigitSection';
import CompleteLotoGrid from './CompleteLotoGrid';
import {
  LotoSkeleton,
  LotoEmptyState,
  LotoUpdatingBanner,
  LotoErrorState,
} from './LotoStates';

import MobileBottomNavigation, { NavTabId } from '@/app/components/navigation/MobileBottomNavigation';
import Toast from '@/app/components/home/Toast';

export type LotoScreenUiState = 'ready' | 'loading' | 'empty' | 'partial' | 'error';

export default function LotoScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<LotoPeriod>('today');
  const [activeTab, setActiveTab] = useState<NavTabId>('loto');
  const [uiState, setUiState] = useState<LotoScreenUiState>('loading');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [historicalDraws, setHistoricalDraws] = useState<HistoricalDrawRecord[]>([]);

  const [, startTransition] = useTransition();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch real draws from API
  const fetchLotoDraws = useCallback(async (signal?: AbortSignal) => {
    setUiState('loading');
    try {
      // 1. Fetch today's draw
      const todayRes = await fetch('/api/v1/xsmb/today', { cache: 'no-store', signal });
      let todayDraw: HistoricalDrawRecord | null = null;
      let isTodayPartial = false;

      if (todayRes.ok) {
        const todayJson = await todayRes.json();
        const dto: DrawResponseDTO = todayJson.data;
        if (dto.results) {
          const p: XSMBPrizes = {
            dacBiet: dto.results.special || [],
            giaiNhat: dto.results.firstPrize || [],
            giaiNhi: dto.results.secondPrize || [],
            giaiBa: dto.results.thirdPrize || [],
            giaiTu: dto.results.fourthPrize || [],
            giaiNam: dto.results.fifthPrize || [],
            giaiSau: dto.results.sixthPrize || [],
            giaiBay: dto.results.seventhPrize || [],
          };
          const [year, month, day] = dto.date.split('-');
          todayDraw = {
            date: dto.date,
            dayOfWeek: getDayOfWeekVN(dto.date),
            shortDate: `${day}/${month}`,
            prizes: p,
          };
          if (dto.status === 'UPDATING' || dto.status === 'PARTIAL') {
            isTodayPartial = true;
          }
        }
      }

      // 2. Fetch recent historical draws for 3-day / 7-day computations
      const historyRes = await fetch('/api/v1/xsmb/history?pageSize=90', { cache: 'no-store', signal });
      let historyItems: HistorySummaryItemDTO[] = [];
      if (historyRes.ok) {
        const historyJson = await historyRes.json();
        historyItems = historyJson.data?.items || historyJson.data || [];
      }

      const drawPromises = historyItems.map(async (item) => {
        if (todayDraw && item.date === todayDraw.date) return todayDraw;
        try {
          const detailRes = await fetch(`/api/v1/xsmb/results/${item.date}`, { cache: 'no-store', signal });
          if (!detailRes.ok) return null;
          const detailJson = await detailRes.json();
          const dto: DrawResponseDTO = detailJson.data;
          const r = dto.results;
          if (!r) return null;

          const p: XSMBPrizes = {
            dacBiet: r.special || [],
            giaiNhat: r.firstPrize || [],
            giaiNhi: r.secondPrize || [],
            giaiBa: r.thirdPrize || [],
            giaiTu: r.fourthPrize || [],
            giaiNam: r.fifthPrize || [],
            giaiSau: r.sixthPrize || [],
            giaiBay: r.seventhPrize || [],
          };
          const [year, month, day] = item.date.split('-');
          return {
            date: item.date,
            dayOfWeek: getDayOfWeekVN(item.date),
            shortDate: `${day}/${month}`,
            prizes: p,
          } as HistoricalDrawRecord;
        } catch {
          return null;
        }
      });

      const historyResolved = (await Promise.all(drawPromises)).filter(Boolean) as HistoricalDrawRecord[];

      // Combine todayDraw if not already first in list
      const combined = [...historyResolved];
      if (todayDraw && !combined.some((d) => d.date === todayDraw!.date)) {
        combined.unshift(todayDraw);
      }

      if (combined.length === 0) {
        setHistoricalDraws([]);
        setUiState('empty');
      } else {
        setHistoricalDraws(combined);
        setUiState(isTodayPartial ? 'partial' : 'ready');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('[LotoScreen] Fetch failed:', err);
      setUiState('error');
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchLotoDraws(controller.signal);
    return () => controller.abort();
  }, [fetchLotoDraws]);

  // Compute Loto Data based on period and real draws
  const lotoData: LotoDataResult = useMemo(() => {
    return calculateLotoData(period, undefined, uiState === 'partial', historicalDraws);
  }, [period, uiState, historicalDraws]);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2400);
  };

  // Period Switching (instant & smooth)
  const handlePeriodChange = (newPeriod: LotoPeriod) => {
    if (newPeriod === period) return;
    startTransition(() => {
      setPeriod(newPeriod);
    });
  };

  // Bottom Navigation Handler
  const handleTabChange = (tabId: NavTabId) => {
    if (tabId === 'home') {
      router.push('/');
    } else if (tabId === 'statistics') {
      router.push('/statistics');
    } else if (tabId === 'loto') {
      setActiveTab('loto');
    } else if (tabId === 'history') {
      router.push('/history');
    }
  };

  const handleSearchTrigger = () => {
    searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    searchInputRef.current?.focus();
  };

  const handleInspectNumber = (num: string) => {
    router.push(`/number/${num}?from=loto&period=${period}`);
  };

  return (
    <div className="app-container">
      <main
        id="main-loto-content"
        className="main-scroll-area"
        style={{
          paddingTop: 8,
          paddingBottom: 'calc(var(--nav-h) + env(safe-area-inset-bottom, 16px) + 24px)',
        }}
      >
        {/* 1. DATE / PERIOD SELECTOR ([ HÔM NAY ] [ 3 NGÀY ] [ 7 NGÀY ]) */}
        <LotoPeriodSelector
          selectedPeriod={period}
          onPeriodChange={handlePeriodChange}
        />

        {/* 3. DATE CONTEXT (Thứ Tư, 02/09/2026) */}
        <LotoDateContext
          period={period}
          dateDisplay={lotoData.dateDisplay}
        />

        {/* Partial State Banner (if draw is updating) */}
        {uiState === 'partial' && (
          <LotoUpdatingBanner currentCount={lotoData.totalOccurrences} />
        )}

        {/* Search Bar with auto-normalization & inline preview */}
        <LotoSearch
          inputRef={searchInputRef}
          onInspectNumber={handleInspectNumber}
        />

        {/* State Rendering */}
        {uiState === 'loading' && <LotoSkeleton />}

        {uiState === 'empty' && (
          <LotoEmptyState onRetry={() => fetchLotoDraws()} />
        )}

        {uiState === 'error' && (
          <LotoErrorState onRetry={() => fetchLotoDraws()} />
        )}

        {(uiState === 'ready' || uiState === 'partial') && (
          <>
            {/* 4. LOTO SUMMARY CARD (Tổng lượt, Số khác nhau, Top) */}
            <LotoSummaryCard
              period={period}
              totalOccurrences={lotoData.totalOccurrences}
              uniqueNumbersCount={lotoData.uniqueNumbersCount}
              topNumbers={lotoData.topNumbers}
              onInspectNumber={handleInspectNumber}
            />

            {/* 5. TODAY'S LOTO / PERIOD LOTO CHIPS (With duplicate badges 23 × 2) */}
            <LotoTodaySection
              period={period}
              lotoList={lotoData.lotoList}
              onInspectNumber={handleInspectNumber}
            />

            {/* 6. FREQUENCY / TOP NUMBERS (LOTO XUẤT HIỆN NHIỀU horizontal bars) */}
            <LotoFrequencyRanking
              period={period}
              topFrequent={lotoData.topFrequent}
              onInspectNumber={handleInspectNumber}
            />

            {/* 7. HEAD SECTION (ĐẦU 0-9 with summary bars & accordions) */}
            <LotoDigitSection
              type="head"
              groups={lotoData.heads}
              topSummary={lotoData.topHeads}
              onInspectNumber={handleInspectNumber}
            />

            {/* 8. TAIL SECTION (ĐUÔI 0-9 with summary bars & accordions) */}
            <LotoDigitSection
              type="tail"
              groups={lotoData.tails}
              topSummary={lotoData.topTails}
              onInspectNumber={handleInspectNumber}
            />

            {/* 9. COMPLETE 00–99 GRID (5-Column Mobile Grid) */}
            <CompleteLotoGrid
              period={period}
              grid={lotoData.grid}
              onInspectNumber={handleInspectNumber}
            />
          </>
        )}
      </main>

      {/* 11. FIXED BOTTOM NAVIGATION */}
      <MobileBottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Toast Feedback */}
      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />

      {/* State Switcher Dialog (Accessible from top right ⋮) */}
      {isOptionsModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="state-switcher-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setIsOptionsModalOpen(false)}
        >
          <div
            className="animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 360,
              backgroundColor: 'var(--surface)',
              borderRadius: 20,
              padding: '20px',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border)',
            }}
          >
            <h3
              id="state-switcher-title"
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: '0 0 4px',
              }}
            >
              Xem thử các trạng thái
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
              Chọn trạng thái hiển thị để kiểm tra giao diện loto:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { id: 'ready', label: '🟢 Đã có đầy đủ kết quả (Chuẩn)' },
                { id: 'partial', label: '🟡 Đang cập nhật (trực tiếp)' },
                { id: 'loading', label: '⏳ Đang tải (Skeleton loader)' },
                { id: 'empty', label: '⚪ Chưa có kết quả (Trống)' },
                { id: 'error', label: '🔴 Lỗi không thể tải dữ liệu' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    setUiState(st.id as LotoScreenUiState);
                    setIsOptionsModalOpen(false);
                    showToast(`Đã chuyển sang: ${st.label}`);
                  }}
                  className="touch-press"
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: uiState === st.id ? '1.5px solid var(--accent-primary)' : '1px solid var(--border)',
                    backgroundColor: uiState === st.id ? 'var(--accent-blue-bg)' : 'var(--surface-muted)',
                    color: uiState === st.id ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontSize: 13,
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsOptionsModalOpen(false)}
              className="touch-press"
              style={{
                width: '100%',
                marginTop: 16,
                padding: '10px 0',
                borderRadius: 10,
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
