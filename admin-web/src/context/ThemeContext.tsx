import React, { createContext, useContext, useEffect } from 'react';

export type ThemeMode = 'LIGHT';
export type ResolvedTheme = 'LIGHT';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  setTheme: (mode?: any) => void;
  toggleTheme: () => void;
}

const defaultContextValue: ThemeContextType = {
  theme: 'LIGHT',
  resolvedTheme: 'LIGHT',
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {}
};

const ThemeContext = createContext<ThemeContextType>(defaultContextValue);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Enforce permanent Light Theme across the entire application
    try {
      localStorage.removeItem('dinedeck_theme');
      localStorage.removeItem('dinedeck_app_theme');
    } catch {}

    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const body = document.body;

      root.classList.remove('dark');
      root.classList.add('light', 'light-mode');
      root.setAttribute('data-theme', 'light');

      if (body) {
        body.classList.remove('dark');
        body.classList.add('light', 'light-mode');
      }
    }
  }, []);

  return (
    <ThemeContext.Provider value={defaultContextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  return useContext(ThemeContext);
};
