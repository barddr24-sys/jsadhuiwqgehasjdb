'use client';

import { useState, useTransition, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getDayOfWeekVN, addDays, isFutureDate, isToday, toDDMMYYYYDash } from '@/app/lib/date-utils';
import type { HistoryUiState } from './HistoryStateSwitcherModal';
import type { DrawResponseDTO } from '@/app/lib/services/xsmb-api.service';
import type { XSMBPrizes, DrawLifecycleState } from '@/app/lib/xsmb-types';
import ResultSpecialHero from './ResultSpecialHero';
import ResultPrizeGroups from './ResultPrizeGroups';
import ResultDayNavigation from './ResultDayNavigation';
import NumberActionModal from './NumberActionModal';
import {
  ResultDetailSkeleton,
  HistoryErrorState,
  HistoryEmptyState,
  HistoryUpdatingBanner,
} from './HistoryStates';
import HistoryStateSwitcherModal from './HistoryStateSwitcherModal';
import Toast from '@/app/components/home/Toast';

interface ResultDetailViewProps {
  date: string;
  onBackToHistory?: () => void;
  onSelectDate?: (date: string) => void;
}

export default function ResultDetailView({
  date,
  onBackToHistory,
  onSelectDate,
}: ResultDetailViewProps) {
  const router = useRouter();
  const [uiState, setUiState] = useState<HistoryUiState>('loading');
  const [isStateSwitcherOpen, setIsStateSwitcherOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Real draw details from API
  const [prizes, setPrizes] = useState<XSMBPrizes | null>(null);
  const [specialPrize, setSpecialPrize] = useState<string | null>(null);
  const [specialTwoDigit, setSpecialTwoDigit] = useState<string | null>(null);
  const [status, setStatus] = useState<DrawLifecycleState>('COMPLETED');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  // Number inspection modal state
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [selectedPrizeLabel, setSelectedPrizeLabel] = useState<string | undefined>(undefined);
  const [isNumberModalOpen, setIsNumberModalOpen] = useState(false);

  const [, startTransition] = useTransition();

  const fetchDetail = useCallback(async (targetDate: string, signal?: AbortSignal) => {
    setUiState('loading');
    try {
      const res = await fetch(`/api/v1/xsmb/results/${targetDate}`, {
        cache: 'no-store',
        signal,
      });

      if (!res.ok) {
        if (res.status === 404) {
          setPrizes(null);
          setSpecialPrize(null);
          setSpecialTwoDigit(null);
          setUiState('empty');
          return;
        }
        throw new Error(`API returned ${res.status}`);
      }

      const json = await res.json();
      const dto: DrawResponseDTO = json.data;

      if (!dto || !dto.results) {
        setPrizes(null);
        setSpecialPrize(null);
        setSpecialTwoDigit(null);
        setUiState('empty');
        return;
      }

      const r = dto.results;
      const mappedPrizes: XSMBPrizes = {
        dacBiet: r.special || [],
        giaiNhat: r.firstPrize || [],
        giaiNhi: r.secondPrize || [],
        giaiBa: r.thirdPrize || [],
        giaiTu: r.fourthPrize || [],
        giaiNam: r.fifthPrize || [],
        giaiSau: r.sixthPrize || [],
        giaiBay: r.seventhPrize || [],
      };

      const hasPrizes = Object.values(mappedPrizes).some((arr) => arr.length > 0);
      if (!hasPrizes) {
        setPrizes(null);
        setSpecialPrize(null);
        setSpecialTwoDigit(null);
        setUiState('empty');
        return;
      }

      setPrizes(mappedPrizes);
      const sp = mappedPrizes.dacBiet[0] || null;
      setSpecialPrize(sp);
      setSpecialTwoDigit(sp && sp.length >= 2 ? sp.slice(-2) : null);

      if (dto.status === 'READY') {
        setStatus('COMPLETED');
        setUiState('ready');
      } else if (dto.status === 'UPDATING' || dto.status === 'PARTIAL') {
        setStatus('UPDATING');
        setUiState('partial');
      } else {
        setStatus('COMPLETED');
        setUiState('ready');
      }

      if (dto.updatedAt) {
        try {
          const d = new Date(dto.updatedAt);
          setUpdatedAt(
            d.toLocaleTimeString('vi-VN', {
              timeZone: 'Asia/Ho_Chi_Minh',
              hour: '2-digit',
              minute: '2-digit',
            })
          );
        } catch {
          setUpdatedAt(null);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('[ResultDetailView] Fetch failed:', err);
      setUiState('error');
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchDetail(date, controller.signal);
    return () => controller.abort();
  }, [date, fetchDetail]);

  const [year, month, day] = date.split('-');
  const displayDate = `${day}/${month}/${year}`;
  const dayOfWeek = getDayOfWeekVN(date);
  const prevDate = addDays(date, -1);
  const nextCandidate = addDays(date, 1);
  const nextDate = isFutureDate(nextCandidate) ? null : nextCandidate;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2400);
  };

  const handleCopyNumber = (num: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(num).catch(() => {});
    }
    showToast(`Đã sao chép số ${num}`);
  };

  const handleShareSummary = () => {
    const summary = `XSMB ngày ${displayDate} (${dayOfWeek}):\nĐặc Biệt: ${specialPrize || '---'}\nGiải Nhất: ${prizes?.giaiNhat[0] || '---'}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(summary).catch(() => {});
    }
    showToast('Đã sao chép tóm tắt kết quả');
  };

  const handleInspectNumber = (num: string) => {
    const twoDigit = num.length >= 2 ? num.slice(-2) : num.padStart(2, '0');
    router.push(`/number/${twoDigit}?from=history&date=${date}`);
  };

  const handleNumberClick = (rawNumber: string, prizeLabel: string) => {
    setSelectedNumber(rawNumber);
    setSelectedPrizeLabel(prizeLabel);
    setIsNumberModalOpen(true);
  };

  const handleNavigateDate = (newDate: string) => {
    startTransition(() => {
      if (onSelectDate) {
        onSelectDate(newDate);
      } else {
        router.push(`/history/${newDate}`);
      }
    });
  };

  return (
    <div style={{ paddingBottom: 16 }}>
      {onBackToHistory && (
        <div style={{ padding: '8px 16px 4px', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={onBackToHistory}
            aria-label="Quay lại danh sách Lịch sử"
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
              padding: '6px 0',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Quay lại Lịch sử</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {uiState === 'loading' ? (
        <ResultDetailSkeleton />
      ) : uiState === 'error' ? (
        <HistoryErrorState onRetry={() => fetchDetail(date)} />
      ) : uiState === 'empty' || !prizes ? (
        <HistoryEmptyState
          onSelectAnotherDate={() => {
            if (onBackToHistory) onBackToHistory();
            else router.push('/history');
          }}
        />
      ) : (
        <>
          {/* Updating banner if in progress */}
          {uiState === 'partial' && <HistoryUpdatingBanner />}

          {/* Special Prize Hero */}
          <ResultSpecialHero
            number={specialPrize}
            displayDate={displayDate}
            dayOfWeek={dayOfWeek}
            isToday={isToday(date)}
            status={status}
            onCopy={handleCopyNumber}
            onInspectNumber={handleInspectNumber}
          />

          {/* Full Prize Matrix (8 Tiers) */}
          <ResultPrizeGroups
            prizes={prizes}
            status={status}
            onNumberClick={handleNumberClick}
          />

          {/* Adjacent Day Navigation Bar */}
          <ResultDayNavigation
            currentDate={date}
            displayDate={displayDate}
            previousDate={prevDate}
            nextDate={nextDate}
            previousShortDate={prevDate ? `${prevDate.split('-')[2]}/${prevDate.split('-')[1]}` : null}
            nextShortDate={nextDate ? `${nextDate.split('-')[2]}/${nextDate.split('-')[1]}` : null}
            onNavigateDate={handleNavigateDate}
          />
        </>
      )}

      {/* Number Inspection Modal */}
      <NumberActionModal
        isOpen={isNumberModalOpen}
        number={selectedNumber}
        prizeLabel={selectedPrizeLabel}
        dateStr={date}
        displayDate={displayDate}
        onClose={() => setIsNumberModalOpen(false)}
        onCopy={handleCopyNumber}
        onInspectNumber={handleInspectNumber}
      />

      {/* Toast Feedback */}
      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />

      {/* State Switcher Dialog */}
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
