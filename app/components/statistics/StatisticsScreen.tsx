'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import GlobalDateSelector from './GlobalDateSelector';
import StatisticsTabNavigation, { type StatisticsTabKey } from './StatisticsTabNavigation';
import OverviewTab from './tabs/OverviewTab';
import LotoTableTab from './tabs/LotoTableTab';
import GanTab from './tabs/GanTab';
import FrequencyStreakTab from './tabs/FrequencyStreakTab';
import TrendTab from './tabs/TrendTab';
import PairsTab from './tabs/PairsTab';
import SpecialPrizeTab from './tabs/SpecialPrizeTab';
import NumberSearchModal from './NumberSearchModal';
import ComparisonModeModal from './ComparisonModeModal';
import { StatisticsSkeleton, StatisticsEmptyState, StatisticsErrorState } from './StatisticsStates';
import MobileBottomNavigation, { NavTabId } from '@/app/components/navigation/MobileBottomNavigation';

interface StatisticsScreenProps {
  onNavigateHome?: () => void;
}

export default function StatisticsScreen({ onNavigateHome }: StatisticsScreenProps) {
  const router = useRouter();

  // Selected date range: 'today' | 'yesterday' | '3days' | '7days' | '14days' | '30days'
  const [selectedRange, setSelectedRange] = useState<string>('30days');
  const [activeTab, setActiveTab] = useState<StatisticsTabKey>('overview');
  const [bottomNavTab, setBottomNavTab] = useState<NavTabId>('statistics');

  // Modals state
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchedNumber, setSearchedNumber] = useState('27');
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Tab Data Cache in component state
  const [tabData, setTabData] = useState<{
    overview?: any;
    loto?: any;
    gan?: any;
    pairs?: any;
    special?: any;
  }>({});

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data progressively per active tab
  const fetchTabData = useCallback(
    async (tab: StatisticsTabKey, range: string, signal?: AbortSignal) => {
      setLoading(true);
      setError(null);

      try {
        let endpoint = '';
        if (tab === 'overview') {
          endpoint = `/api/v1/xsmb/statistics/overview?range=${range}`;
        } else if (tab === 'loto' || tab === 'frequency' || tab === 'trend') {
          endpoint = `/api/v1/xsmb/statistics/loto?range=${range}`;
        } else if (tab === 'gan') {
          endpoint = `/api/v1/xsmb/statistics/gan?range=${range}`;
        } else if (tab === 'pairs') {
          endpoint = `/api/v1/xsmb/statistics/pairs?range=${range}`;
        } else if (tab === 'special') {
          endpoint = `/api/v1/xsmb/statistics/special-last-two?range=${range}`;
        }

        const res = await fetch(endpoint, {
          cache: 'no-store',
          signal,
        });

        if (!res.ok) {
          throw new Error(`API error ${res.status}`);
        }

        const json = await res.json();
        const data = json.data;

        setTabData((prev) => ({
          ...prev,
          [tab === 'frequency' || tab === 'trend' ? 'loto' : tab]: data,
        }));
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('[StatisticsScreen] fetch error:', err);
        setError('Không thể tải dữ liệu thống kê. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Reload when range or tab changes
  useEffect(() => {
    const controller = new AbortController();
    fetchTabData(activeTab, selectedRange, controller.signal);
    return () => controller.abort();
  }, [activeTab, selectedRange, fetchTabData]);

  // Handlers
  const handleRangeChange = (newRange: string) => {
    if (newRange === selectedRange) return;
    setSelectedRange(newRange);
    setTabData({}); // Reset tab cache for new range
  };

  const handleInspectNumber = (num: string) => {
    setSearchedNumber(num);
    setSearchModalOpen(true);
  };

  const handleBackToHome = () => {
    if (onNavigateHome) onNavigateHome();
    else router.push('/');
  };

  const handleBottomNavChange = (tabId: NavTabId) => {
    if (tabId === 'home') handleBackToHome();
    else if (tabId === 'statistics') setBottomNavTab('statistics');
    else if (tabId === 'loto') router.push('/loto');
    else if (tabId === 'history') router.push('/history');
  };

  // Extract metadata from currently loaded data
  const currentLoadedData =
    activeTab === 'overview'
      ? tabData.overview
      : activeTab === 'special'
        ? tabData.special
        : activeTab === 'pairs'
          ? tabData.pairs
          : activeTab === 'gan'
            ? tabData.gan
            : tabData.loto;

  const dateRangeDisplay = currentLoadedData?.range?.dateRangeDisplay;
  const dateRangeFull = currentLoadedData?.range?.dateRangeFull;
  const completeness = currentLoadedData?.completeness;

  return (
    <div className="app-container">
      <main
        id="main-statistics-content"
        className="main-scroll-area px-3 sm:px-4 py-3"
        style={{
          paddingBottom: 'calc(var(--nav-h) + env(safe-area-inset-bottom, 16px) + 24px)',
        }}
      >
        {/* 1. GLOBAL DATE SELECTOR */}
        <GlobalDateSelector
          selectedRange={selectedRange}
          onSelectRange={handleRangeChange}
          dateRangeDisplay={dateRangeDisplay}
          dateRangeFull={dateRangeFull}
          completeness={completeness}
          disabled={loading}
        />

        {/* 3. SEGMENTED TAB NAVIGATION */}
        <StatisticsTabNavigation
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
        />

        {/* 4. STATE RENDERING */}
        {loading && !currentLoadedData ? (
          <StatisticsSkeleton />
        ) : error && !currentLoadedData ? (
          <StatisticsErrorState onRetry={() => fetchTabData(activeTab, selectedRange)} />
        ) : !currentLoadedData ? (
          <StatisticsEmptyState onRetry={() => fetchTabData(activeTab, selectedRange)} />
        ) : (
          <div className="animate-fadeIn">
            {/* TAB 1: TỔNG QUAN */}
            {activeTab === 'overview' && tabData.overview && (
              <OverviewTab
                data={tabData.overview}
                onInspectNumber={handleInspectNumber}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {/* TAB 2: LOTO 00–99 */}
            {activeTab === 'loto' && tabData.loto && (
              <LotoTableTab
                allNumbers={tabData.loto.allNumbers || []}
                onInspectNumber={handleInspectNumber}
              />
            )}

            {/* TAB 3: GAN & CHU KỲ */}
            {activeTab === 'gan' && tabData.gan && (
              <GanTab
                ganRanking={tabData.gan.ganRanking || []}
                intervals={tabData.gan.intervals || []}
                onInspectNumber={handleInspectNumber}
              />
            )}

            {/* TAB 4: TẦN SUẤT & LẶP */}
            {activeTab === 'frequency' && tabData.loto && (
              <FrequencyStreakTab
                allNumbers={tabData.loto.allNumbers || []}
                streaks={tabData.loto.streaks || []}
                onInspectNumber={handleInspectNumber}
              />
            )}

            {/* TAB 5: XU HƯỚNG */}
            {activeTab === 'trend' && tabData.loto && (
              <TrendTab
                allNumbers={tabData.loto.allNumbers || []}
                onInspectNumber={handleInspectNumber}
              />
            )}

            {/* TAB 6: CẶP SỐ & ĐẢO */}
            {activeTab === 'pairs' && tabData.pairs && (
              <PairsTab
                topPairs={tabData.pairs.topPairs || []}
                reversePairs={tabData.pairs.reversePairs || []}
                onInspectNumber={handleInspectNumber}
              />
            )}

            {/* TAB 7: ĐB 2 SỐ CUỐI */}
            {activeTab === 'special' && tabData.special && (
              <SpecialPrizeTab
                data={tabData.special}
                onInspectNumber={handleInspectNumber}
              />
            )}
          </div>
        )}
      </main>

      {/* 5. NUMBER SEARCH MODAL (00–99 Deep Lookup) */}
      <NumberSearchModal
        initialNumber={searchedNumber}
        selectedRange={selectedRange}
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectAnotherNumber={(num) => setSearchedNumber(num)}
      />

      {/* 6. COMPARISON MODE MODAL (Period A vs Period B) */}
      <ComparisonModeModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        onInspectNumber={handleInspectNumber}
      />

      {/* 7. BOTTOM NAVIGATION */}
      <MobileBottomNavigation
        activeTab={bottomNavTab}
        onTabChange={handleBottomNavChange}
      />
    </div>
  );
}
