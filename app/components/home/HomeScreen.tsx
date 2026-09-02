'use client';

/**
 * HomeScreen — XSMB Main Screen
 *
 * Data source: MongoDB via REST API
 *   - GET /api/v1/xsmb/today              → today's draw
 *   - GET /api/v1/xsmb/results/:date      → specific date draw
 *   - GET /api/v1/xsmb/statistics?days=7  → 7-day 2-digit stats
 *   - GET /api/v1/xsmb/history?pageSize=5 → recent completed draws
 *
 * PRODUCTION RULE: This file MUST NOT import SAMPLE_* fixtures.
 * All data originates from MongoDB Atlas via the v1 API.
 */

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type {
  DrawLifecycleState,
  XSMBPrizes,
  StatPreviewItem,
  RecentResultSummary,
} from '@/app/lib/xsmb-types';
import { getTodayVN, isToday, getDayOfWeekVN } from '@/app/lib/date-utils';
import { getPrizeMilestones } from '@/app/lib/draw-status';
import type { DrawResponseDTO, StatisticsResponseDTO, HistorySummaryItemDTO } from '@/app/lib/services/xsmb-api.service';

import DateSelector from './DateSelector';
import DrawStatusCard from './DrawStatusCard';
import SpecialPrizeCard from './SpecialPrizeCard';
import QuickStatisticsCard from './QuickStatisticsCard';
import TodayResultSection from './TodayResultSection';
import RecentResultsPreview from './RecentResultsPreview';
import TwoDigitTable from './TwoDigitTable';
import Toast from './Toast';
import StateSwitcherModal from './StateSwitcherModal';

import MobileBottomNavigation, { NavTabId } from '@/app/components/navigation/MobileBottomNavigation';
import StatisticsSheet from '@/app/components/navigation/StatisticsSheet';
import LotoSheet from '@/app/components/navigation/LotoSheet';
import HistorySheet from '@/app/components/navigation/HistorySheet';

// ─── DTO → UI type mappers ────────────────────────────────────────────────────

/**
 * Maps the v1 API DrawResponseDTO to the XSMBPrizes shape used by UI components.
 * Returns null if results are empty (pre-draw / unavailable state).
 */
function mapResultsToPrizes(dto: DrawResponseDTO): XSMBPrizes | null {
  const r = dto.results;
  if (!r) return null;

  const prizes: XSMBPrizes = {
    dacBiet:  r.special      || [],
    giaiNhat: r.firstPrize   || [],
    giaiNhi:  r.secondPrize  || [],
    giaiBa:   r.thirdPrize   || [],
    giaiTu:   r.fourthPrize  || [],
    giaiNam:  r.fifthPrize   || [],
    giaiSau:  r.sixthPrize   || [],
    giaiBay:  r.seventhPrize || [],
  };

  // If every tier is empty, treat as no-data state
  const hasAny = Object.values(prizes).some(arr => arr.length > 0);
  return hasAny ? prizes : null;
}

/**
 * Maps MongoDB/API DrawStatus → UI DrawLifecycleState.
 */
function mapDrawStatus(apiStatus: string, date: string): DrawLifecycleState {
  switch (apiStatus) {
    case 'READY':     return 'COMPLETED';
    case 'PARTIAL':   return 'UPDATING';
    case 'UPDATING':  return 'UPDATING';
    case 'SCHEDULED': return isToday(date) ? 'SCHEDULED' : 'EMPTY';
    case 'DELAYED':   return 'DELAYED';
    case 'CONFLICT':  return 'ERROR';
    default:          return 'EMPTY';
  }
}

/**
 * Maps v1 statistics DTO items → StatPreviewItem[] for QuickStatisticsCard.
 */
function mapStats(dto: StatisticsResponseDTO): StatPreviewItem[] {
  return (dto.topNumbers || []).slice(0, 8).map(item => ({
    number: item.number,
    count: item.count,
  }));
}

/**
 * Maps v1 history DTO items → RecentResultSummary[] for RecentResultsPreview.
 */
function mapHistory(items: HistorySummaryItemDTO[]): RecentResultSummary[] {
  return items.map(item => {
    const dayOfWeek = getDayOfWeekVN(item.date);
    const [year, month, day] = item.date.split('-');
    return {
      date: item.date,
      dayOfWeek,
      displayDate: `${day}/${month}/${year}`,
      shortDate: `${day}/${month}`,
      specialPrize: item.special?.[0] || '—',
      twoDigit: item.special?.[0]?.slice(-2) || '—',
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>(getTodayVN());
  const [activeTab, setActiveTab] = useState<NavTabId>('home');

  // Live status from real API
  const [currentStatus, setCurrentStatus] = useState<DrawLifecycleState>('SCHEDULED');
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Real data — no fixture defaults
  const [prizes, setPrizes] = useState<XSMBPrizes | null>(null);
  const [specialNum, setSpecialNum] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>('—');
  const [stats7Day, setStats7Day] = useState<StatPreviewItem[]>([]);
  const [recentResults, setRecentResults] = useState<RecentResultSummary[]>([]);

  // Dev-only state switcher (does not affect production data)
  const [simulatedState, setSimulatedState] = useState<DrawLifecycleState | null>(null);
  const displayStatus: DrawLifecycleState = simulatedState ?? currentStatus;

  // Modals & Feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isStateSwitcherOpen, setIsStateSwitcherOpen] = useState(false);
  const [isStatsSheetOpen, setIsStatsSheetOpen] = useState(false);
  const [isLotoSheetOpen, setIsLotoSheetOpen] = useState(false);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
  const [, startTransition] = useTransition();

  // ─── Fetch draw result from v1 API ────────────────────────────────────────
  const fetchDraw = useCallback(async (date: string, signal: AbortSignal) => {
    setIsLoading(true);
    setFetchError(null);

    try {
      const endpoint = isToday(date)
        ? '/api/v1/xsmb/today'
        : `/api/v1/xsmb/results/${date}`;

      const res = await fetch(endpoint, {
        cache: 'no-store',
        signal,
      });

      if (!res.ok) {
        if (res.status === 404) {
          // No data yet for this date — not an error, just empty state
          setPrizes(null);
          setSpecialNum(null);
          setUpdatedAt('—');
          setCurrentStatus(isToday(date) ? 'SCHEDULED' : 'EMPTY');
          return;
        }
        throw new Error(`API returned ${res.status}`);
      }

      const json = await res.json();
      const dto: DrawResponseDTO = json.data;

      const mappedPrizes = mapResultsToPrizes(dto);
      const mappedStatus = mapDrawStatus(dto.status, date);

      setPrizes(mappedPrizes);
      setSpecialNum(mappedPrizes?.dacBiet?.[0] ?? null);
      setCurrentStatus(mappedStatus);

      // Format updatedAt for display
      if (dto.updatedAt) {
        try {
          const d = new Date(dto.updatedAt);
          const hhmm = d.toLocaleTimeString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            hour: '2-digit',
            minute: '2-digit',
          });
          setUpdatedAt(hhmm);
        } catch {
          setUpdatedAt('—');
        }
      } else {
        setUpdatedAt('—');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('[HomeScreen] Draw fetch failed:', err instanceof Error ? err.message : err);
      setFetchError('Không thể tải dữ liệu. Vui lòng thử lại.');
      setCurrentStatus('ERROR');
      setPrizes(null);
      setSpecialNum(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Fetch 7-day statistics from v1 API ───────────────────────────────────
  const fetchStats = useCallback(async (signal: AbortSignal) => {
    try {
      const res = await fetch('/api/v1/xsmb/statistics?days=7', {
        cache: 'no-store',
        signal,
      });
      if (!res.ok) return;
      const json = await res.json();
      const dto: StatisticsResponseDTO = json.data;
      setStats7Day(mapStats(dto));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      // Stats fetch failure is non-critical — leave empty
    }
  }, []);

  // ─── Fetch recent history from v1 API ─────────────────────────────────────
  const fetchHistory = useCallback(async (signal: AbortSignal) => {
    try {
      const res = await fetch('/api/v1/xsmb/history?pageSize=5', {
        cache: 'no-store',
        signal,
      });
      if (!res.ok) return;
      const json = await res.json();
      const items: HistorySummaryItemDTO[] = json.data || [];
      setRecentResults(mapHistory(items));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      // History fetch failure is non-critical — leave empty
    }
  }, []);

  // ─── Initial data load ────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    fetchDraw(selectedDate, controller.signal);
    // Stats and history only need to load on initial mount
    if (selectedDate === getTodayVN()) {
      fetchStats(controller.signal);
      fetchHistory(controller.signal);
    }
    return () => controller.abort();
  }, [selectedDate, fetchDraw, fetchStats, fetchHistory]);

  // ─── Auto-refresh during draw time (18:15 – 18:35 VN) ────────────────────
  useEffect(() => {
    if (!isToday(selectedDate)) return;
    if (currentStatus !== 'UPDATING' && currentStatus !== 'SCHEDULED' && currentStatus !== 'DRAWING') return;

    const interval = setInterval(() => {
      const controller = new AbortController();
      fetchDraw(selectedDate, controller.signal);
    }, 20_000); // poll every 20s during active draw

    return () => clearInterval(interval);
  }, [selectedDate, currentStatus, fetchDraw]);

  // ─── Toast helper ─────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(prev => (prev === msg ? null : prev));
    }, 2400);
  };

  // ─── Copy to clipboard ────────────────────────────────────────────────────
  const handleCopy = (num: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(num).catch(() => {});
    }
    showToast(`Đã sao chép số ${num}`);
  };

  // ─── Date navigation ──────────────────────────────────────────────────────
  const handleDateChange = (newDate: string) => {
    startTransition(() => {
      setSelectedDate(newDate);
      setSimulatedState(null); // clear dev override on date change
    });
  };

  // ─── Bottom navigation ────────────────────────────────────────────────────
  const handleTabChange = (tabId: NavTabId) => {
    setActiveTab(tabId);
    if (tabId === 'statistics') router.push('/statistics');
    else if (tabId === 'loto') router.push('/loto');
    else if (tabId === 'history') router.push('/history');
  };

  // ─── Countdown finished ───────────────────────────────────────────────────
  const handleCountdownComplete = () => {
    setCurrentStatus('DRAWING');
    showToast('Bắt đầu giờ quay thưởng XSMB lúc 18:15');
  };

  // ─── Dev state switcher (does not write fake data) ────────────────────────
  const handleSelectSimulatedState = (st: DrawLifecycleState) => {
    setSimulatedState(st);
    showToast(`Trạng thái hiển thị: ${st}`);
  };

  // ─── Inspect number navigation ────────────────────────────────────────────
  const handleInspectNumber = (n: string) => {
    const twoDigit = n.slice(-2);
    router.push(`/number/${twoDigit}?from=home`);
  };

  const milestones = getPrizeMilestones(prizes);

  return (
    <div className="app-container">
      <main id="main-content" className="main-scroll-area">
        {/* 1. DATE SELECTOR */}
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />

        {/* Loading / error state */}
        {isLoading && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '12px 0', fontSize: 13 }}>
            Đang tải dữ liệu…
          </p>
        )}
        {!isLoading && fetchError && (
          <p style={{ textAlign: 'center', color: 'var(--prize-accent)', padding: '8px 16px', fontSize: 13 }}>
            {fetchError}
          </p>
        )}

        {/* 3. DRAW STATUS CARD */}
        <DrawStatusCard
          status={displayStatus}
          updatedAt={updatedAt}
          milestones={milestones}
          onCountdownComplete={handleCountdownComplete}
        />

        {/* 4. SPECIAL PRIZE CARD */}
        <SpecialPrizeCard
          number={specialNum}
          status={displayStatus}
          onCopy={handleCopy}
          onInspectNumber={handleInspectNumber}
        />

        {/* 5. QUICK 7-DAY STATISTICS */}
        <QuickStatisticsCard
          stats={stats7Day}
          onViewStats={() => router.push('/statistics')}
          onInspectNumber={handleInspectNumber}
        />

        {/* 6. TODAY'S RESULTS */}
        <TodayResultSection
          prizes={prizes}
          status={displayStatus}
          onInspectNumber={handleInspectNumber}
        />

        {/* 7. RECENT RESULTS PREVIEW */}
        <RecentResultsPreview
          recentResults={recentResults}
          onSelectDate={handleDateChange}
          onViewAllHistory={() => router.push('/history')}
        />

        {/* 8. LAST TWO-DIGIT RESULTS TABLE */}
        <TwoDigitTable
          onInspectNumber={handleInspectNumber}
        />
      </main>

      {/* 8. FIXED BOTTOM NAVIGATION */}
      <MobileBottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Toast Feedback */}
      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />

      {/* Dev State Switcher — does not inject fake data into production path */}
      <StateSwitcherModal
        isOpen={isStateSwitcherOpen}
        onClose={() => setIsStateSwitcherOpen(false)}
        currentState={displayStatus}
        onSelectState={handleSelectSimulatedState}
      />

      {/* Bottom Sheet Modals */}
      <StatisticsSheet
        isOpen={isStatsSheetOpen}
        onClose={() => { setIsStatsSheetOpen(false); setActiveTab('home'); }}
        onInspectNumber={handleInspectNumber}
      />

      <LotoSheet
        isOpen={isLotoSheetOpen}
        onClose={() => { setIsLotoSheetOpen(false); setActiveTab('home'); }}
        prizes={prizes}
        onInspectNumber={handleInspectNumber}
      />

      <HistorySheet
        isOpen={isHistorySheetOpen}
        onClose={() => { setIsHistorySheetOpen(false); setActiveTab('home'); }}
        recentResults={recentResults}
        onSelectDate={handleDateChange}
      />
    </div>
  );
}
