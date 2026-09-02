'use client';

import { useState, useTransition, useMemo, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTodayVN, getDayOfWeekVN } from '@/app/lib/date-utils';
import type { HistoryUiState } from './HistoryStateSwitcherModal';
import type { HistorySummaryItemDTO } from '@/app/lib/services/xsmb-api.service';
import type { HistoryItemSummary } from '@/app/lib/history-engine';
import HistoryDateSelector from './HistoryDateSelector';
import HistoryDateCard from './HistoryDateCard';
import ResultDetailView from './ResultDetailView';
import {
  HistoryListSkeleton,
  HistoryErrorState,
  HistoryEmptyState,
} from './HistoryStates';
import HistoryStateSwitcherModal from './HistoryStateSwitcherModal';
import MobileBottomNavigation, { type NavTabId } from '@/app/components/navigation/MobileBottomNavigation';
import Toast from '@/app/components/home/Toast';

interface HistoryScreenProps {
  initialDate?: string; // If provided via route `/history/[date]`, open State B directly
}

export default function HistoryScreen({ initialDate }: HistoryScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');

  // Active view: 'list' (State A) or 'detail' (State B)
  const [activeDate, setActiveDate] = useState<string | null>(initialDate || dateParam || null);
  const [activeTab, setActiveTab] = useState<NavTabId>('history');

  // Selected date for filter / search in History List
  const [selectedSearchDate, setSelectedSearchDate] = useState<string>(getTodayVN());
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  // Pagination state for History List
  const [pageSize, setPageSize] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [items, setItems] = useState<HistoryItemSummary[]>([]);

  // UI state for testing / demo
  const [uiState, setUiState] = useState<HistoryUiState>('loading');
  const [isStateSwitcherOpen, setIsStateSwitcherOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [, startTransition] = useTransition();
  const scrollPositionRef = useRef<number>(0);

  // Fetch real history list from API
  const fetchHistoryList = useCallback(async (size: number, signal?: AbortSignal) => {
    if (size === 10) setUiState('loading');
    try {
      const res = await fetch(`/api/v1/xsmb/history?page=1&pageSize=${size}`, {
        cache: 'no-store',
        signal,
      });

      if (!res.ok) {
        throw new Error(`History API returned ${res.status}`);
      }

      const json = await res.json();
      const rawItems: HistorySummaryItemDTO[] = json.data?.items || json.data || [];
      const pagination = json.data?.pagination;

      const mapped: HistoryItemSummary[] = rawItems.map((item) => {
        const [year, month, day] = item.date.split('-');
        const sp = item.special?.[0] || '';
        const spTail = sp.length >= 2 ? sp.slice(-2) : '';

        return {
          date: item.date,
          dayOfWeek: getDayOfWeekVN(item.date),
          displayDate: `${day}/${month}/${year}`,
          shortDate: `${day}/${month}`,
          isToday: item.date === getTodayVN(),
          specialPrize: sp,
          specialTwoDigit: spTail,
          firstPrize: item.firstPrize?.[0] || '',
          secondPrizes: item.secondPrize || [],
          thirdPrizesPreview: [],
          status: 'COMPLETED',
        };
      });

      setItems(mapped);
      setHasMore(pagination ? pagination.hasNextPage : rawItems.length >= size);
      setUiState(mapped.length === 0 ? 'empty' : 'ready');
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('[HistoryScreen] Fetch failed:', err);
      setUiState('error');
    } finally {
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchHistoryList(pageSize, controller.signal);
    return () => controller.abort();
  }, [fetchHistoryList, pageSize]);

  // Sync with initialDate if changed via route
  const prevInitialDateRef = useRef(initialDate);
  useEffect(() => {
    if (initialDate && initialDate !== prevInitialDateRef.current) {
      prevInitialDateRef.current = initialDate;
      setActiveDate(initialDate);
    }
  }, [initialDate]);

  // Toast feedback helper
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2400);
  };

  // Load more historical records
  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setPageSize((prev) => prev + 10);
  };

  // Handle selecting a date to view in Result Detail (State B)
  const handleSelectDateDetail = (dateStr: string) => {
    if (typeof window !== 'undefined') {
      scrollPositionRef.current = window.scrollY;
    }
    startTransition(() => {
      setActiveDate(dateStr);
    });
  };

  // Return to History List (State A) while restoring scroll position
  const handleBackToList = () => {
    startTransition(() => {
      setActiveDate(null);
    });
    setTimeout(() => {
      if (typeof window !== 'undefined' && scrollPositionRef.current > 0) {
        window.scrollTo({ top: scrollPositionRef.current, behavior: 'instant' });
      }
    }, 50);
  };

  // Filter/jump to a specific date from HistoryDateSelector
  const handleSelectFilterDate = (dateStr: string) => {
    setSelectedSearchDate(dateStr);
    handleSelectDateDetail(dateStr);
  };

  // Bottom navigation tab click
  const handleTabChange = (tabId: NavTabId) => {
    setActiveTab(tabId);
    if (tabId === 'home') {
      router.push('/');
    } else if (tabId === 'statistics') {
      router.push('/statistics');
    } else if (tabId === 'loto') {
      router.push('/loto');
    } else if (tabId === 'history') {
      if (activeDate) {
        handleBackToList();
      }
    }
  };

  // Inspect 2-digit tail from card
  const handleInspectTail = (tail: string, date: string) => {
    router.push(`/number/${tail}?from=history&date=${date}`);
  };

  return (
    <div className="app-container">
      {activeDate ? (
        // ─── STATE B: RESULT DETAIL ──────────────────────────────────────────
        <div className="main-scroll-area" style={{ paddingTop: 0 }}>
          <ResultDetailView
            date={activeDate}
            onBackToHistory={handleBackToList}
            onSelectDate={(newDate) => {
              setActiveDate(newDate);
            }}
          />
        </div>
      ) : (
        // ─── STATE A: HISTORY LIST ───────────────────────────────────────────
        <main id="main-content" className="main-scroll-area">
          {/* 1. Date Selector & Quick Filters */}
            <HistoryDateSelector
              selectedDate={selectedSearchDate}
              onSelectDate={handleSelectFilterDate}
              isOpen={isDateModalOpen}
              onClose={() => setIsDateModalOpen(false)}
              onOpenModal={() => setIsDateModalOpen(true)}
            />

            {/* Content Section Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 20px 8px',
              }}
            >
              <h2
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  margin: 0,
                }}
              >
                KẾT QUẢ GẦN ĐÂY
              </h2>

              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                }}
              >
                {items.length} kỳ quay
              </span>
            </div>

            {/* States Handling */}
            {uiState === 'loading' ? (
              <HistoryListSkeleton />
            ) : uiState === 'error' ? (
              <HistoryErrorState
                onRetry={() => {
                  fetchHistoryList(pageSize);
                  showToast('Đang tải lại dữ liệu...');
                }}
              />
            ) : uiState === 'empty' || items.length === 0 ? (
              <HistoryEmptyState
                onSelectAnotherDate={() => {
                  setSelectedSearchDate(getTodayVN());
                }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px' }}>
                {items.map((item) => (
                  <HistoryDateCard
                    key={item.date}
                    item={item}
                    onSelect={handleSelectDateDetail}
                    onInspectTail={handleInspectTail}
                  />
                ))}

                {/* Load More Button */}
                {hasMore && (
                  <div style={{ paddingTop: 8, paddingBottom: 16 }}>
                    <button
                      id="btn-history-load-more"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="touch-press"
                      style={{
                        width: '100%',
                        minHeight: 48,
                        borderRadius: 14,
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border-strong)',
                        color: 'var(--accent-primary)',
                        fontSize: 14,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        cursor: isLoadingMore ? 'wait' : 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      {isLoadingMore ? (
                        <span>Đang tải thêm kết quả...</span>
                      ) : (
                        <>
                          <span>Xem thêm kết quả cũ hơn</span>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
      )}

      {/* Fixed Bottom Navigation */}
      <MobileBottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Toast Feedback */}
      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />

      {/* State Switcher Modal */}
      <HistoryStateSwitcherModal
        isOpen={isStateSwitcherOpen}
        onClose={() => setIsStateSwitcherOpen(false)}
        currentState={uiState}
        onSelectState={(st) => {
          setUiState(st);
          showToast(`Đã chuyển sang trạng thái: ${st}`);
        }}
      />
    </div>
  );
}
