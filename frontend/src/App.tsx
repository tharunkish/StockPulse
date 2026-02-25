import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HomeView } from './components/views/HomeView';
import { PortfolioView } from './components/views/PortfolioView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { SettingsView } from './components/views/SettingsView';
import { StockDetail } from './components/views/StockDetail';
import { AddStockModal } from './components/AddStockModal';
import { usePortfolio } from './hooks/usePortfolio';
import { useDashboardData } from './hooks/useDashboardData';
import { useSettings } from './context/SettingsContext';
import { useAnalytics } from './hooks/useAnalytics';
import { Stock } from './types';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  
  const { portfolio, addStock, overrideStock, removeStock } = usePortfolio();
  const { summary, prices, error, refresh } = useDashboardData(portfolio);
  const { sidebarBehavior, accentColor } = useSettings();
  const { analytics } = useAnalytics(portfolio);

  const accentColors: any = {
      blue: '217.2 91.2% 59.8%',
      purple: '270 70% 60%',
      gold: '45 100% 50%',
      mint: '160 80% 45%',
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--ios-blue', accentColors[accentColor] || accentColors.blue);
  }, [accentColor]);

  const isExpanded = sidebarBehavior === 'expanded';

  const handleEditStock = (stock: Stock) => {
      setEditingStock(stock);
      setIsAddModalOpen(true);
  };

  const handleSaveStock = (stock: Stock) => {
      if (editingStock) {
          overrideStock(stock);
      } else {
          addStock(stock);
      }
      refresh();
      setEditingStock(null);
  };

  const handleCloseModal = () => {
      setIsAddModalOpen(false);
      setEditingStock(null);
  };

  const handleImport = (stocks: Stock[]) => {
      stocks.forEach(s => addStock(s));
      refresh();
  };

  const selectedStockData = portfolio.find(s => s.ticker === selectedTicker);

  const handleTabChange = (tab: string) => {
      setActiveTab(tab);
      setSelectedTicker(null);
  };

  return (
    <div className="h-screen w-screen bg-background text-foreground font-sans overflow-hidden flex">
      {/* Dynamic Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-ios-blue/15 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-ios-indigo/15 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-ios-purple/5 blur-[100px]" />
      </div>

      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Main Content Area */}
      <div 
        style={{ marginLeft: isExpanded ? 260 : 80 }}
        className="flex-1 relative z-10 flex flex-col h-full bg-[#050505]/20 backdrop-blur-[2px] transition-[margin] duration-300"
      >
        <Header onSelectStock={setSelectedTicker} />
        
        {/* View Switcher with Page Transitions */}
        <AnimatePresence>
            {selectedTicker && selectedStockData ? (
                <motion.div
                    key="stock-detail"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 flex flex-col h-full overflow-hidden"
                >
                    <div className="flex-1 flex flex-col h-full relative">
                        <button 
                            onClick={() => setSelectedTicker(null)}
                            className="absolute top-8 left-8 z-50 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        </button>
                        <StockDetail 
                            stock={selectedStockData}
                            quote={prices[selectedTicker]}
                            analytics={analytics[selectedTicker]}
                            onEdit={() => handleEditStock(selectedStockData)}
                            onDelete={() => {
                                if (confirm(`Remove ${selectedTicker} from portfolio?`)) {
                                    removeStock(selectedTicker);
                                    setSelectedTicker(null);
                                }
                            }}
                        />
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="flex-1 flex flex-col h-full overflow-hidden"
                >
                    {activeTab === 'home' && (
                        <HomeView 
                            summary={summary} 
                            portfolio={portfolio} 
                            prices={prices} 
                            onSelectStock={setSelectedTicker}
                        />
                    )}

                    {activeTab === 'portfolio' && (
                        <PortfolioView 
                            portfolio={portfolio} 
                            prices={prices} 
                            onEdit={handleEditStock} 
                            onDelete={(ticker) => {
                                if (confirm(`Remove ${ticker} from portfolio?`)) {
                                    removeStock(ticker);
                                }
                            }} 
                            onAddStock={() => {
                                setEditingStock(null);
                                setIsAddModalOpen(true);
                            }}
                            onImport={handleImport}
                            onSelectStock={setSelectedTicker}
                        />
                    )}

                    {activeTab === 'analytics' && (
                        <AnalyticsView 
                            portfolio={portfolio} 
                            prices={prices} 
                            onSelectStock={setSelectedTicker}
                        />
                    )}

                    {activeTab === 'settings' && (
                        <SettingsView />
                    )}
                </motion.div>
            )}
        </AnimatePresence>

        {/* Global Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-rose-500/20 text-rose-400 px-6 py-3 rounded-2xl border border-rose-500/30 backdrop-blur-xl shadow-2xl flex items-center gap-3 z-[100]"
            >
              <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-bold tracking-tight">{error}</span>
              <button onClick={refresh} className="ml-4 text-xs bg-rose-500/20 px-2 py-1 rounded-lg border border-rose-500/20 hover:bg-rose-500/30 transition-colors">Retry</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AddStockModal 
        isOpen={isAddModalOpen} 
        onClose={handleCloseModal} 
        onSave={handleSaveStock}
        initialData={editingStock}
      />
    </div>
  );
}

export default App;
