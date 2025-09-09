import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNotifications } from './NotificationContext';

export const SettingsContext = createContext({
  settings: {},
  updateSetting: () => {},
  resetSettings: () => {},
  applyTheme: () => {}
});

export const SettingsProvider = ({ children }) => {
  const { addNotification } = useNotifications();
  
  const [settings, setSettings] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'auto',
    autoRefresh: true,
    refreshInterval: 30,
    
    enableNotifications: true,
    soundEnabled: true,
    emailNotifications: false,
    orderStatusUpdates: true,
    milkProductionAlerts: true,
    systemMaintenanceAlerts: true,
    
    showTimestamps: true,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    compactMode: false,
    showAnimations: true,
    
    showProfileInfo: true,
    shareAnalytics: false,
    sessionTimeout: 30
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('dairyFarmSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prevSettings => ({ ...prevSettings, ...parsed }));
        
        if (parsed.theme) {
          applyTheme(parsed.theme);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  const updateSetting = (key, value) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      
      localStorage.setItem('dairyFarmSettings', JSON.stringify(newSettings));
      
      if (key === 'theme') {
        applyTheme(value);
      }
      
      if (key === 'enableNotifications' && !value) {
  
        newSettings.orderStatusUpdates = false;
        newSettings.milkProductionAlerts = false;
        newSettings.systemMaintenanceAlerts = false;
        newSettings.soundEnabled = false;
      }
      
      return newSettings;
    });
  };

  const resetSettings = () => {
    const defaultSettings = {
      theme: 'light',
      language: 'en',
      timezone: 'auto',
      autoRefresh: true,
      refreshInterval: 30,
      enableNotifications: true,
      soundEnabled: true,
      emailNotifications: false,
      orderStatusUpdates: true,
      milkProductionAlerts: true,
      systemMaintenanceAlerts: true,
      showTimestamps: true,
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      compactMode: false,
      showAnimations: true,
      showProfileInfo: true,
      shareAnalytics: false,
      sessionTimeout: 30
    };
    
    setSettings(defaultSettings);
    localStorage.setItem('dairyFarmSettings', JSON.stringify(defaultSettings));
    applyTheme(defaultSettings.theme);
    
    if (addNotification) {
      addNotification(
        'Settings Reset',
        'All settings have been reset to their default values',
        'system',
        'low'
      );
    }
  };

  const applyTheme = (theme) => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.style.setProperty('--background-color', '#1a1a1a');
      root.style.setProperty('--text-color', '#ffffff');
      root.style.setProperty('--card-background', '#2d2d2d');
      root.style.setProperty('--border-color', '#404040');
      root.style.setProperty('--header-background', '#1f1f1f');
      root.style.setProperty('--sidebar-background', '#262626');
      root.setAttribute('data-theme', 'dark');
    } else if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
      return;
    } else {
      root.style.setProperty('--background-color', '#ffffff');
      root.style.setProperty('--text-color', '#1f2937');
      root.style.setProperty('--card-background', '#ffffff');
      root.style.setProperty('--border-color', '#e5e7eb');
      root.style.setProperty('--header-background', '#ffffff');
      root.style.setProperty('--sidebar-background', '#f9fafb');
      root.setAttribute('data-theme', 'light');
    }
  };

  useEffect(() => {
    if (settings.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('auto');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  const formatDate = (date) => {
    const dateObj = new Date(date);
    switch (settings.dateFormat) {
      case 'MM/DD/YYYY':
        return dateObj.toLocaleDateString('en-US');
      case 'YYYY-MM-DD':
        return dateObj.toISOString().split('T')[0];
      default: 
        return dateObj.toLocaleDateString('en-GB');
    }
  };

  const formatTime = (date) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleTimeString('en-US', {
      hour12: settings.timeFormat === '12h',
      hour: '2-digit',
      minute: '2-digit',
      ...(settings.showTimestamps && { second: '2-digit' })
    });
  };

  const playNotificationSound = () => {
    if (settings.soundEnabled && settings.enableNotifications) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    }
  };

  const value = {
    settings,
    updateSetting,
    resetSettings,
    applyTheme,
    formatDate,
    formatTime,
    playNotificationSound
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};