import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type SidebarBehavior = 'expanded' | 'collapsed';
type RefreshInterval = '15s' | '30s' | '1m' | 'manual';
type AccentColor = 'blue' | 'purple' | 'gold' | 'mint';

interface SettingsContextType {
  sidebarBehavior: SidebarBehavior;
  isPrivacyMode: boolean;
  refreshInterval: RefreshInterval;
  accentColor: AccentColor;
  toggleSidebarBehavior: () => void;
  togglePrivacyMode: () => void;
  setRefreshInterval: (val: RefreshInterval) => void;
  setAccentColor: (val: AccentColor) => void;
  clearAllData: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [sidebarBehavior, setSidebarBehavior] = useState<SidebarBehavior>(() => 
    (localStorage.getItem('stockpulse-sidebarBehavior') as SidebarBehavior) || 'collapsed'
  );
  const [isPrivacyMode, setIsPrivacyMode] = useState(() => 
    localStorage.getItem('stockpulse-privacyMode') === 'true'
  );
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(() => 
    (localStorage.getItem('stockpulse-refreshInterval') as RefreshInterval) || '30s'
  );
  const [accentColor, setAccentColor] = useState<AccentColor>(() => 
    (localStorage.getItem('stockpulse-accentColor') as AccentColor) || 'blue'
  );

  useEffect(() => { localStorage.setItem('stockpulse-sidebarBehavior', sidebarBehavior); }, [sidebarBehavior]);
  useEffect(() => { localStorage.setItem('stockpulse-privacyMode', isPrivacyMode.toString()); }, [isPrivacyMode]);
  useEffect(() => { localStorage.setItem('stockpulse-refreshInterval', refreshInterval); }, [refreshInterval]);
  useEffect(() => { localStorage.setItem('stockpulse-accentColor', accentColor); }, [accentColor]);

  const toggleSidebarBehavior = () => setSidebarBehavior(prev => prev === 'expanded' ? 'collapsed' : 'expanded');
  const togglePrivacyMode = () => setIsPrivacyMode(prev => !prev);
  
  const clearAllData = () => {
    if (confirm('Are you sure? This will delete all stocks and reset settings.')) {
        // Clear portfolio data
        localStorage.removeItem('stockpulse-portfolio');
        
        // Reset settings to defaults
        localStorage.removeItem('stockpulse-sidebarBehavior');
        localStorage.removeItem('stockpulse-privacyMode');
        localStorage.removeItem('stockpulse-refreshInterval');
        localStorage.removeItem('stockpulse-accentColor');
        
        window.location.reload();
    }
  };

  return (
    <SettingsContext.Provider value={{ 
        sidebarBehavior, isPrivacyMode, refreshInterval, accentColor,
        toggleSidebarBehavior, togglePrivacyMode, setRefreshInterval, setAccentColor, clearAllData 
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
