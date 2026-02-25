import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ChartStyle = 'glow' | 'line';
type SidebarBehavior = 'expanded' | 'collapsed';
type RefreshInterval = '15s' | '30s' | '1m' | 'manual';
type AccentColor = 'blue' | 'purple' | 'gold' | 'mint';

interface SettingsContextType {
  chartStyle: ChartStyle;
  sidebarBehavior: SidebarBehavior;
  isPrivacyMode: boolean;
  refreshInterval: RefreshInterval;
  accentColor: AccentColor;
  userName: string;
  avatarSeed: string;
  toggleChartStyle: () => void;
  toggleSidebarBehavior: () => void;
  togglePrivacyMode: () => void;
  setRefreshInterval: (val: RefreshInterval) => void;
  setAccentColor: (val: AccentColor) => void;
  setUserName: (val: string) => void;
  setAvatarSeed: (val: string) => void;
  clearAllData: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [chartStyle, setChartStyle] = useState<ChartStyle>(() => 
    (localStorage.getItem('stockpulse-chartStyle') as ChartStyle) || 'glow'
  );
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
  const [userName, setUserName] = useState(() => 
    localStorage.getItem('stockpulse-userName') || 'John Doe'
  );
  const [avatarSeed, setAvatarSeed] = useState(() => 
    localStorage.getItem('stockpulse-avatarSeed') || 'Felix'
  );

  useEffect(() => { localStorage.setItem('stockpulse-chartStyle', chartStyle); }, [chartStyle]);
  useEffect(() => { localStorage.setItem('stockpulse-sidebarBehavior', sidebarBehavior); }, [sidebarBehavior]);
  useEffect(() => { localStorage.setItem('stockpulse-privacyMode', isPrivacyMode.toString()); }, [isPrivacyMode]);
  useEffect(() => { localStorage.setItem('stockpulse-refreshInterval', refreshInterval); }, [refreshInterval]);
  useEffect(() => { localStorage.setItem('stockpulse-accentColor', accentColor); }, [accentColor]);
  useEffect(() => { localStorage.setItem('stockpulse-userName', userName); }, [userName]);
  useEffect(() => { localStorage.setItem('stockpulse-avatarSeed', avatarSeed); }, [avatarSeed]);

  const toggleChartStyle = () => setChartStyle(prev => prev === 'glow' ? 'line' : 'glow');
  const toggleSidebarBehavior = () => setSidebarBehavior(prev => prev === 'expanded' ? 'collapsed' : 'expanded');
  const togglePrivacyMode = () => setIsPrivacyMode(prev => !prev);
  
  const clearAllData = () => {
    if (confirm('Are you sure? This will delete all stocks and reset settings.')) {
        localStorage.clear();
        window.location.reload();
    }
  };

  return (
    <SettingsContext.Provider value={{ 
        chartStyle, sidebarBehavior, isPrivacyMode, refreshInterval, accentColor, userName, avatarSeed,
        toggleChartStyle, toggleSidebarBehavior, togglePrivacyMode, setRefreshInterval, setAccentColor, setUserName, setAvatarSeed, clearAllData 
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
