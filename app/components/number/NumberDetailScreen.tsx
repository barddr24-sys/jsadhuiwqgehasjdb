'use client';

import { useState, useTransition, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  calculateNumberDetail,
  normalizeNumber,
  type NumberDetailPeriod,
  type NumberDetailData,
} from '@/app/lib/number-detail-engine';
import type { HistoricalDrawRecord } from '@/app/lib/statistics-engine';
import { getDayOfWeekVN } from '@/app/lib/date-utils';
import type { HistorySummaryItemDTO, DrawResponseDTO } from '@/app/lib/services/xsmb-api.service';
import type { XSMBPrizes } from '@/app/lib/xsmb-types';

import NumberHero from './NumberHero';
import NumberPeriodSelector from './NumberPeriodSelector';
import NumberSummaryMetrics from './NumberSummaryMetrics';
import TodaySpecialState from './TodaySpecialState';
import FrequencySummary from './FrequencySummary';
import DailyHistory from './DailyHistory';
import ComparisonPeriodCard from './ComparisonPeriodCard';
import NumberSearchModal from './NumberSearchModal';
import { NumberSkeleton, NumberEmptyState, NumberErrorState } from './NumberStates';
import NumberStateSwitcherModal, { type NumberUiState } from './NumberStateSwitcherModal';

import MobileBottomNavigation, { type NavTabId } from '@/app/components/navigation/MobileBottomNavigation';
import Toast from '@/app/components/home/Toast';

interface NumberDetailScreenProps {
  initialNumber: string;
}

export default function NumberDetailScreen({ initialNumber }: NumberDetailScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read search params
  const fromParam = searchParams.get('from'); // 'home' | 'statistics' | 'loto' | 'history'
  const periodParam = searchParams.get('period'); // 'today' | '3days' | '7days'

  // Determine initial period based on context or param
  const getInitialPeriod = (): NumberDetailPeriod => {
    if (periodParam === 'today' || periodParam === '3days' || periodParam === '7days' ||
        periodParam === '30days' || periodParam === '90days') {
      return periodParam;
    }
    if (fromParam === 'statistics') return '7days';
    if (fromParam === 'loto') return 'today';
    return '7days';
  };

  const [currentNumber, setCurrentNumber] = useState<string>(() => normalizeNumber(initialNumber));
  const [period, setPeriod] = useState<NumberDetailPeriod>(getInitialPeriod);
  const [uiState, setUiState] = useState<NumberUiState>('loading');
  const [historicalDraws, setHistoricalDraws] = useState<HistoricalDrawRecord[]>([]);

  // Modals & Sheets
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  // Fetch real draws from API
  const fetchRealDraws = useCallback(async (signal?: AbortSignal) => {
    setUiState('loading');
    try {
      // 1. Fetch today's draw
      const todayRes = await fetch('/api/v1/xsmb/today', { cache: 'no-store', signal });
      let todayDraw: HistoricalDrawRecord | null = null;

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

      const combined = [...historyResolved];
      if (todayDraw && !combined.some((d) => d.date === todayDraw!.date)) {
        combined.unshift(todayDraw);
      }

      if (combined.length === 0) {
        setHistoricalDraws([]);
        setUiState('empty');
      } else {
        setHistoricalDraws(combined);
        setUiState('ready');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('[NumberDetailScreen] Fetch failed:', err);
      setUiState('error');
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchRealDraws(controller.signal);
    return () => controller.abort();
  }, [fetchRealDraws]);

  // Determine active tab for Bottom Nav
  const activeNavTab: NavTabId = useMemo(() => {
    if (fromParam === 'statistics') return 'statistics';
    if (fromParam === 'loto') return 'loto';
    if (fromParam === 'history') return 'history';
    return 'home';
  }, [fromParam]);

  // Compute source context label
  const sourceContextLabel = useMemo(() => {
    if (fromParam === 'statistics') {
      return period === '3days' ? 'Nguồn: Thống kê 3 ngày' : 'Nguồn: Thống kê 7 ngày';
    }
    if (fromParam === 'loto') {
      return period === 'today'
        ? 'Nguồn: Loto hôm nay'
        : period === '3days'
        ? 'Nguồn: Loto 3 ngày'
        : 'Nguồn: Loto 7 ngày';
    }
    if (fromParam === 'history') return 'Nguồn: Lịch sử kết quả';
    if (fromParam === 'home') return 'Nguồn: Trang chủ XSMB';
    return undefined;
  }, [fromParam, period]);

  // Compute number facts & historical records from real draws
  const numberData: NumberDetailData = useMemo(() => {
    return calculateNumberDetail(currentNumber, period, historicalDraws);
  }, [currentNumber, period, historicalDraws]);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2400);
  };

  // Copy to clipboard
  const handleCopyNumber = (num: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(num).catch(() => {});
    }
    showToast(`Đã sao chép số ${num}`);
  };

  // Period change
  const handlePeriodChange = (newPeriod: NumberDetailPeriod) => {
    if (newPeriod === period) return;
    startTransition(() => {
      setPeriod(newPeriod);
    });
  };

  // Number navigation (switch without reload + update URL)
  const handleNavigateNumber = (newNum: string) => {
    const normalized = normalizeNumber(newNum);
    if (normalized === currentNumber) return;
    startTransition(() => {
      setCurrentNumber(normalized);
      // Update browser URL seamlessly
      const queryStr = searchParams.toString();
      const newUrl = queryStr ? `/number/${normalized}?${queryStr}` : `/number/${normalized}`;
      window.history.replaceState(null, '', newUrl);
    });
  };

  // Back Button Navigation
  const handleBack = () => {
    if (fromParam === 'statistics') {
      router.push('/statistics');
    } else if (fromParam === 'loto') {
      router.push('/loto');
    } else if (fromParam === 'history') {
      const dateParam = searchParams.get('date');
      if (dateParam) {
        router.push(`/history/${dateParam}`);
      } else {
        router.push('/history');
      }
    } else {
      router.push('/');
    }
  };

  // Bottom Navigation Handler
  const handleTabChange = (tabId: NavTabId) => {
    if (tabId === 'home') {
      router.push('/');
    } else if (tabId === 'statistics') {
      router.push('/statistics');
    } else if (tabId === 'loto') {
      router.push('/loto');
    } else if (tabId === 'history') {
      router.push('/history');
    }
  };

  // View specific date result
  const handleSelectDateResult = (date: string) => {
    router.push(`/history/${date}`);
  };

  return (
    <div className="app-container">
      <main
        id="main-number-detail-content"
        className="main-scroll-area"
        style={{
          paddingTop: 8,
          paddingBottom: 'calc(var(--nav-h) + env(safe-area-inset-bottom, 16px) + 28px)',
        }}
      >
        {/* Back Button */}
        <div style={{ padding: '0 16px 8px', display: 'flex', alignItems: 'center' }}>
          <button
            id="btn-number-detail-back"
            onClick={handleBack}
            aria-label="Quay lại"
            className="touch-press"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              padding: '4px 0',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Quay lại</span>
          </button>
        </div>

        {/* 1. NUMBER HERO */}
        <NumberHero
          number={numberData.number}
          sourceContext={sourceContextLabel}
          head={numberData.head}
          tail={numberData.tail}
          inverseNumber={numberData.inverseNumber}
          previousNumber={numberData.previousNumber}
          nextNumber={numberData.nextNumber}
          onNavigateNumber={handleNavigateNumber}
          onCopyNumber={handleCopyNumber}
        />

        {/* 3. PERIOD SELECTOR ([ HÔM NAY ] [ 3 NGÀY ] [ 7 NGÀY ]) */}
        <NumberPeriodSelector
          selectedPeriod={period}
          onPeriodChange={handlePeriodChange}
        />

        {/* State Rendering */}
        {uiState === 'loading' && <NumberSkeleton />}

        {uiState === 'empty' && (
          <NumberEmptyState
            number={currentNumber}
            onRetry={() => fetchRealDraws()}
          />
        )}

        {uiState === 'error' && (
          <NumberErrorState onRetry={() => fetchRealDraws()} />
        )}

        {uiState === 'ready' && (
          <>
            {/* 4. PRIMARY STATISTICS (Exactly 3 Compact Metrics) */}
            <NumberSummaryMetrics
              period={period}
              totalOccurrences={numberData.totalOccurrences}
              latestAppearanceDate={numberData.latestAppearance?.shortDate || null}
              activeDaysCount={numberData.activeDaysCount}
              totalDaysInPeriod={numberData.totalDaysInPeriod}
            />

            {/* 5. TODAY SPECIAL STATE (Highlight if appeared today / neutral if not) */}
            <TodaySpecialState
              number={numberData.number}
              appearedToday={numberData.appearedToday}
              todayCount={numberData.todayCount}
              todayPrizes={numberData.todayPrizes}
              onViewTodayResult={() => router.push('/')}
            />

            {/* 6. FREQUENCY SUMMARY (Visual frequency bar + daily breakdown) */}
            <FrequencySummary
              number={numberData.number}
              period={period}
              totalOccurrences={numberData.totalOccurrences}
              frequencyList={numberData.frequencyList}
            />

            {/* 7. DAILY HISTORY (LỊCH SỬ XUẤT HIỆN) */}
            <DailyHistory
              number={numberData.number}
              period={period}
              dailyHistory={numberData.dailyHistory}
              onSelectDateResult={handleSelectDateResult}
            />

            {/* 8. 3-DAY VS 7-DAY COMPARISON CARD */}
            <ComparisonPeriodCard
              number={numberData.number}
              activePeriod={period}
              threeDaysSummary={numberData.threeDaysSummary}
              sevenDaysSummary={numberData.sevenDaysSummary}
              onSelectPeriod={handlePeriodChange}
            />
          </>
        )}
      </main>

      {/* 9. NUMBER SEARCH MODAL */}
      <NumberSearchModal
        isOpen={isSearchModalOpen}
        currentNumber={currentNumber}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectNumber={handleNavigateNumber}
      />

      {/* 10. FIXED BOTTOM NAVIGATION */}
      <MobileBottomNavigation
        activeTab={activeNavTab}
        onTabChange={handleTabChange}
      />

      {/* Toast Notification */}
      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />

      {/* State Switcher Dialog (Accessible from top right ⋮) */}
      <NumberStateSwitcherModal
        isOpen={isOptionsModalOpen}
        currentState={uiState}
        onClose={() => setIsOptionsModalOpen(false)}
        onSelectState={(st) => {
          setUiState(st);
          showToast(`Đã chuyển sang trạng thái: ${st}`);
        }}
      />
    </div>
  );
}
