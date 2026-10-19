import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'LIGHT' | 'DARK' | 'SYSTEM';
export type ResolvedTheme = 'LIGHT' | 'DARK';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'dinedeck_theme';
const LEGACY_STORAGE_KEY = 'dinedeck_app_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved === 'LIGHT' || saved === 'DARK' || saved === 'SYSTEM') {
      return saved as ThemeMode;
    }
  } catch (e) {
    // fallback
  }
  return 'DARK';
}

function resolveSystemTheme(): ResolvedTheme {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'DARK' : 'LIGHT';
  }
  return 'DARK';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const initial = getInitialTheme();
    return initial === 'SYSTEM' ? resolveSystemTheme() : initial;
  });

  const applyToDom = useCallback((resolved: ResolvedTheme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;

    if (resolved === 'DARK') {
      root.classList.add('dark');
      root.classList.remove('light', 'light-mode');
      root.setAttribute('data-theme', 'dark');
      if (body) {
        body.classList.add('dark');
        body.classList.remove('light', 'light-mode');
      }
    } else {
      root.classList.add('light', 'light-mode');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      if (body) {
        body.classList.add('light', 'light-mode');
        body.classList.remove('dark');
      }
    }
  }, []);

  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        localStorage.setItem(LEGACY_STORAGE_KEY, newTheme);
      } catch (e) {}

      const resolved = newTheme === 'SYSTEM' ? resolveSystemTheme() : newTheme;
      setResolvedTheme(resolved);
      applyToDom(resolved);
      window.dispatchEvent(new CustomEvent('dinedeck_theme_change', { detail: { theme: newTheme, resolved } }));
    },
    [applyToDom]
  );

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'DARK' ? 'LIGHT' : 'DARK');
  }, [resolvedTheme, setTheme]);

  // Initial mount & sync with system changes
  useEffect(() => {
    const currentResolved = theme === 'SYSTEM' ? resolveSystemTheme() : theme;
    setResolvedTheme(currentResolved);
    applyToDom(currentResolved);

    const mediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const handleMediaChange = () => {
      const current = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY) || theme;
      if (current === 'SYSTEM') {
        const sysResolved = resolveSystemTheme();
        setResolvedTheme(sysResolved);
        applyToDom(sysResolved);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY || e.key === LEGACY_STORAGE_KEY) {
        const val = (e.newValue as ThemeMode) || 'DARK';
        setThemeState(val);
        const resolved = val === 'SYSTEM' ? resolveSystemTheme() : val;
        setResolvedTheme(resolved);
        applyToDom(resolved);
      }
    };

    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    }
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (mediaQuery?.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [theme, applyToDom]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        isDark: resolvedTheme === 'DARK',
        setTheme,
        toggleTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
