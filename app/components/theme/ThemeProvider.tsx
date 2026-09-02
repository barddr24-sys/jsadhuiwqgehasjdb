'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import SettingsModal from './SettingsModal';

export type ThemePreference = 'light' | 'dark' | 'system';
export type FontSizePreference = '100%' | '115%' | '130%';

interface ThemeContextType {
  theme: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemePreference) => void;
  fontSize: FontSizePreference;
  setFontSize: (fontSize: FontSizePreference) => void;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'theme_preference';
const FONT_SIZE_KEY = 'font_size_preference';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [fontSize, setFontSizeState] = useState<FontSizePreference>('100%');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Apply theme to DOM
  const applyTheme = useCallback((pref: ThemePreference) => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = pref === 'dark' || (pref === 'system' && systemDark);

    root.classList.remove('light', 'dark');
    root.classList.add(isDark ? 'dark' : 'light');
    root.setAttribute('data-theme', pref);
    setResolvedTheme(isDark ? 'dark' : 'light');
  }, []);

  // Apply font size to DOM
  const applyFontSize = useCallback((size: FontSizePreference) => {
    if (typeof window === 'undefined') return;
    document.documentElement.setAttribute('data-font-size', size);
  }, []);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_KEY) as ThemePreference | null;
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
        setThemeState(savedTheme);
        applyTheme(savedTheme);
      } else {
        applyTheme('system');
      }

      const savedFontSize = localStorage.getItem(FONT_SIZE_KEY) as FontSizePreference | null;
      if (savedFontSize === '100%' || savedFontSize === '115%' || savedFontSize === '130%') {
        setFontSizeState(savedFontSize);
        applyFontSize(savedFontSize);
      } else {
        applyFontSize('100%');
      }
    } catch {
      applyTheme('system');
      applyFontSize('100%');
    }
  }, [applyTheme, applyFontSize]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, applyTheme]);

  const setTheme = useCallback((newTheme: ThemePreference) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_KEY, newTheme);
    } catch {}
    applyTheme(newTheme);
  }, [applyTheme]);

  const setFontSize = useCallback((newFontSize: FontSizePreference) => {
    setFontSizeState(newFontSize);
    try {
      localStorage.setItem(FONT_SIZE_KEY, newFontSize);
    } catch {}
    applyFontSize(newFontSize);
  }, [applyFontSize]);

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        fontSize,
        setFontSize,
        isSettingsOpen,
        openSettings,
        closeSettings,
      }}
    >
      {children}
      <SettingsModal isOpen={isSettingsOpen} onClose={closeSettings} />
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
