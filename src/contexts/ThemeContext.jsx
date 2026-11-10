import React, { createContext, useContext, useState, useEffect } from 'react';

// Créer le contexte
const ThemeContext = createContext();

// Hook personnalisé pour utiliser le thème
// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Provider du thème
export const ThemeProvider = ({ children }) => {
  const [theme] = useState('dark');

  // Appliquer le thème au document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', 'dark');

    return () => document.documentElement.classList.remove('dark');
  }, [theme]);

  const value = {
    theme,
    toggleTheme: () => {},
    isDark: theme === 'dark',
    isLight: theme === 'light',
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
