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

function getInitialTheme(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch {}
  return 'system';
}

function getInitialFontSize(): FontSizePreference {
  if (typeof window === 'undefined') return '100%';
  try {
    const saved = localStorage.getItem(FONT_SIZE_KEY);
    if (saved === '100%' || saved === '115%' || saved === '130%') return saved as FontSizePreference;
  } catch {}
  return '100%';
}

function getInitialResolvedTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch {}
  return 'light';
}

function applyThemeDOM(pref: ThemePreference) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = pref === 'dark' || (pref === 'system' && systemDark);

  root.classList.remove('light', 'dark');
  root.classList.add(isDark ? 'dark' : 'light');
  root.setAttribute('data-theme', pref);
}

function applyFontSizeDOM(size: FontSizePreference) {
  if (typeof window === 'undefined') return;
  document.documentElement.setAttribute('data-font-size', size);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(getInitialResolvedTheme);
  const [fontSize, setFontSizeState] = useState<FontSizePreference>(getInitialFontSize);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize DOM attributes on mount
  useEffect(() => {
    applyThemeDOM(theme);
    applyFontSizeDOM(fontSize);
  }, [theme, fontSize]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyThemeDOM('system');
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemePreference) => {
    setThemeState(newTheme);
    const isDark =
      newTheme === 'dark' ||
      (newTheme === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    setResolvedTheme(isDark ? 'dark' : 'light');
    try {
      localStorage.setItem(THEME_KEY, newTheme);
    } catch {}
    applyThemeDOM(newTheme);
  }, []);

  const setFontSize = useCallback((newFontSize: FontSizePreference) => {
    setFontSizeState(newFontSize);
    try {
      localStorage.setItem(FONT_SIZE_KEY, newFontSize);
    } catch {}
    applyFontSizeDOM(newFontSize);
  }, []);

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
