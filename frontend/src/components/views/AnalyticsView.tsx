import { useState, useEffect } from 'react';
import { Stock, DetailedAnalysis } from '../../types';
import { Quote, getAnalysis } from '../../services/api';
import { useAnalytics } from '../../hooks/useAnalytics';
import { PeerMatrix } from '../PeerMatrix';
import { TechnicalIndicators } from '../TechnicalIndicators';
import { AdvancedChart } from '../AdvancedChart';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Activity, TrendingUp, DollarSign, PieChart, BarChart2, X, Info, BarChart3, LineChart } from 'lucide-react';

interface AnalyticsViewProps {
  portfolio: Stock[];
  prices: Record<string, Quote>;
  onSelectStock?: (ticker: string) => void;
}

// Reusable Metric Card with Status Logic
const MetricCard = ({ title, value, status, suffix = '', icon: Icon, onClick }: any) => {
    const isGood = status === 'good';
    const isBad = status === 'bad';

    const colorClass = isGood 
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
        : isBad 
        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]' 
        : 'bg-slate-800/50 text-slate-300 border-white/5';

    return (
        <motion.div 
            whileHover={{ y: -4, scale: 1.02 }}
            onClick={onClick}
            className={`relative p-6 rounded-3xl border backdrop-blur-md cursor-pointer group transition-all duration-300 ${colorClass}`}
        >
            <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-2">
                    <Icon className="h-4 w-4" /> {title}
                </span>
                <div className={`h-2 w-2 rounded-full ${isGood ? 'bg-emerald-400 animate-pulse' : isBad ? 'bg-rose-400' : 'bg-slate-500'}`} />
            </div>
            
            <div className="text-3xl font-bold font-mono tracking-tighter tabular-nums text-white">
                {typeof value === 'number' ? value.toFixed(2) : value}{suffix}
            </div>
            
            <div className="mt-4 text-[10px] font-medium opacity-60 uppercase tracking-widest group-hover:opacity-100 transition-opacity">
                Tap for details
            </div>
        </motion.div>
    );
};

export function AnalyticsView({ portfolio, prices, onSelectStock }: AnalyticsViewProps) {
  const { analytics: batchAnalytics } = useAnalytics(portfolio);
  const [selectedTicker, setSelectedTicker] = useState<string>(portfolio.length > 0 ? portfolio[0].ticker : '');
  const [detailedData, setDetailedData] = useState<DetailedAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'chart' | 'technical' | 'peers'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: PieChart },
    { id: 'chart', label: 'Chart', icon: LineChart },
    { id: 'technical', label: 'Technical', icon: BarChart3 },
    { id: 'peers', label: 'Peers', icon: TrendingUp }
  ];

  useEffect(() => {
    if (selectedTicker) {
        setLoading(true);
        getAnalysis(selectedTicker)
            .then(data => {
                setDetailedData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch analysis", err);
                setLoading(false);
            });
    }
  }, [selectedTicker]);

  if (portfolio.length === 0) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <PieChart className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h2 className="text-xl font-bold text-white">No Assets Found</h2>
            <p className="text-muted-foreground max-w-xs mt-2">Add stocks to your portfolio to unlock fundamental and technical deep-dives.</p>
        </div>
    );
  }

  const f = detailedData?.fundamentals;
  const t = detailedData?.technicals;

  return (
    <div className="flex-1 overflow-y-auto p-8 relative custom-scrollbar">
       <div className="max-w-[1600px] mx-auto space-y-12 pb-20">
           
           {/* Header & Selector */}
           <div className="flex flex-col gap-6 mb-8 border-b border-white/5 pb-8">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                   <div>
                       <h1 className="text-4xl font-bold tracking-tight text-white mb-2 font-sf">Deep Dive</h1>
                       <div className="flex items-center gap-3">
                            <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest bg-white/5 px-3 py-1 rounded-lg inline-block">
                                {loading ? 'Refreshing Analytics...' : 'Advanced Technical Analysis'}
                            </p>
                            {selectedTicker && onSelectStock && (
                                <button 
                                    onClick={() => onSelectStock(selectedTicker)}
                                    className="text-xs font-bold text-ios-blue hover:text-white transition-colors flex items-center gap-1 bg-ios-blue/10 px-3 py-1 rounded-lg border border-ios-blue/20"
                                >
                                    <Info className="h-3 w-3" /> View Asset Profile
                                </button>
                            )}
                       </div>
                   </div>
                   
                   <div className="flex gap-4 items-center w-full md:w-auto">
                       <button 
                            onClick={() => {
                                if (selectedTicker) {
                                    setLoading(true);
                                    getAnalysis(selectedTicker)
                                        .then(data => {
                                            setDetailedData(data);
                                            setLoading(false);
                                        })
                                        .catch(() => setLoading(false));
                                }
                            }}
                            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all"
                            title="Refresh Analysis"
                       >
                           <Activity className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                       </button>

                       <div className="relative group flex-1 md:min-w-[320px]">
                           <select 
                                value={selectedTicker}
                                onChange={(e) => setSelectedTicker(e.target.value)}
                                className="w-full appearance-none bg-[#0A0A0A] border border-white/10 text-white py-4 pl-6 pr-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-ios-blue/50 font-bold text-lg cursor-pointer hover:bg-white/5 transition-colors shadow-2xl"
                           >
                               {portfolio.map(s => (
                                   <option key={s.ticker} value={s.ticker}>{s.ticker.replace('.NS', '').replace('.BO', '')}</option>
                               ))}
                           </select>
                           <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none group-hover:text-white transition-colors" />
                       </div>
                   </div>
               </div>

               {/* Tab Navigation */}
               <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
                   {tabs.map((tab) => {
                       const Icon = tab.icon;
                       return (
                           <button
                               key={tab.id}
                               onClick={() => setActiveTab(tab.id as any)}
                               className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                                   activeTab === tab.id
                                       ? 'bg-ios-blue text-white shadow-lg'
                                       : 'text-muted-foreground hover:text-white hover:bg-white/5'
                               }`}
                           >
                               <Icon className="h-4 w-4" />
                               {tab.label}
                           </button>
                       );
                   })}
               </div>
           </div>

           {loading && !detailedData ? (
               <div className="flex h-64 items-center justify-center">
                   <div className="flex flex-col items-center gap-4">
                       <Activity className="h-8 w-8 animate-spin text-ios-blue" />
                       <span className="text-muted-foreground font-medium animate-pulse uppercase tracking-widest text-[10px]">Crunching Data...</span>
                   </div>
               </div>
           ) : (
               <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   {/* Tab Content */}
                   <AnimatePresence mode="wait">
                       {activeTab === 'overview' && (
                           <motion.div
                               key="overview"
                               initial={{ opacity: 0, y: 20 }}
                               animate={{ opacity: 1, y: 0 }}
                               exit={{ opacity: 0, y: -20 }}
                               className="space-y-16"
                           >
                               {/* Fundamentals Section */}
                               <section>
                                   <div className="flex items-center gap-3 mb-8">
                                       <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                                           <PieChart className="h-6 w-6" />
                                       </div>
                                       <h2 className="text-2xl font-bold text-white tracking-tight">Fundamental Analysis</h2>
                                   </div>
                                   
                                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                       <MetricCard 
                                            title="P/E Ratio" 
                                            value={f?.peRatio || 0} 
                                            status={(f?.peRatio || 0) < 25 ? 'good' : (f?.peRatio || 0) > 40 ? 'bad' : 'neutral'} 
                                            icon={DollarSign}
                                            onClick={() => setSelectedMetric({ title: 'P/E Ratio', value: f?.peRatio, description: 'Price-to-Earnings ratio measures a company current share price relative to its earnings per share. Lower is often considered better value.' })}
                                       />
                                       <MetricCard 
                                            title="Div. Yield" 
                                            value={f?.dividendYield || 0} 
                                            suffix="%" 
                                            status={(f?.dividendYield || 0) > 2 ? 'good' : 'neutral'} 
                                            icon={TrendingUp}
                                            onClick={() => setSelectedMetric({ title: 'Dividend Yield', value: f?.dividendYield, suffix: '%', description: 'Percentage of share price paid out as dividends annually.' })}
                                       />
                                       <MetricCard 
                                            title="ROE" 
                                            value={f?.roe || 0} 
                                            suffix="%"
                                            status={(f?.roe || 0) > 15 ? 'good' : (f?.roe || 0) < 10 ? 'bad' : 'neutral'} 
                                            icon={BarChart2}
                                            onClick={() => setSelectedMetric({ title: 'Return on Equity', value: f?.roe, suffix: '%', description: 'Measure of financial performance calculated by dividing net income by shareholders equity.' })}
                                       />
                                       <MetricCard 
                                            title="P/B Ratio" 
                                            value={f?.pbRatio || 0} 
                                            status={(f?.pbRatio || 0) < 3 ? 'good' : (f?.pbRatio || 0) > 5 ? 'bad' : 'neutral'} 
                                            icon={DollarSign}
                                            onClick={() => setSelectedMetric({ title: 'P/B Ratio', value: f?.pbRatio, description: 'Price-to-Book ratio compares a company market value to its book value. Lower can indicate an undervalued stock.' })}
                                       />
                                       <MetricCard 
                                            title="EPS (TTM)" 
                                            value={f?.eps || 0} 
                                            status={(f?.eps || 0) > 0 ? 'good' : 'bad'} 
                                            icon={Activity}
                                            onClick={() => setSelectedMetric({ title: 'Earnings Per Share', value: f?.eps, description: 'The portion of a company profit allocated to each outstanding share of common stock.' })}
                                       />
                                   </div>
                               </section>

                               {/* Basic Technicals Section */}
                               <section>
                                   <div className="flex items-center gap-3 mb-8">
                                       <div className="h-10 w-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                                           <Activity className="h-6 w-6" />
                                       </div>
                                       <h2 className="text-2xl font-bold text-white tracking-tight">Basic Technicals</h2>
                                   </div>

                                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                       <MetricCard 
                                            title="RSI (14D)" 
                                            value={t?.rsi || 0} 
                                            status={(t?.rsi || 0) > 30 && (t?.rsi || 0) < 70 ? 'neutral' : 'bad'} 
                                            icon={Activity}
                                            onClick={() => setSelectedMetric({ title: 'RSI', value: t?.rsi, description: 'Relative Strength Index. < 30 is Oversold (Bullish), > 70 is Overbought (Bearish).' })}
                                       />
                                       <MetricCard 
                                            title="Price vs 50MA" 
                                            value={t?.priceVsSMA50 || 0} 
                                            suffix="%"
                                            status={(t?.priceVsSMA50 || 0) > 0 ? 'good' : 'bad'} 
                                            icon={TrendingUp}
                                            onClick={() => setSelectedMetric({ title: 'vs 50-Day Moving Average', value: t?.priceVsSMA50, suffix: '%', description: 'Percentage difference between current price and 50-day average. Positive is bullish.' })}
                                       />
                                       <MetricCard 
                                            title="Price vs 200MA" 
                                            value={t?.priceVsSMA200 || 0} 
                                            suffix="%"
                                            status={(t?.priceVsSMA200 || 0) > 0 ? 'good' : 'bad'} 
                                            icon={TrendingUp}
                                            onClick={() => setSelectedMetric({ title: 'vs 200-Day Moving Average', value: t?.priceVsSMA200, suffix: '%', description: 'Percentage difference between current price and 200-day average. Often used as a long-term trend indicator.' })}
                                       />
                                       <MetricCard 
                                            title="Beta" 
                                            value={batchAnalytics[selectedTicker]?.beta || 1.0} 
                                            status={(batchAnalytics[selectedTicker]?.beta || 1.0) < 1.2 ? 'good' : 'bad'} 
                                            icon={Activity}
                                            onClick={() => setSelectedMetric({ title: 'Volatility Beta', value: batchAnalytics[selectedTicker]?.beta, description: 'Measure of volatility relative to the benchmark index (Nifty 50).' })}
                                       />
                                   </div>
                               </section>
                           </motion.div>
                       )}

                       {activeTab === 'chart' && (
                           <motion.div
                               key="chart"
                               initial={{ opacity: 0, y: 20 }}
                               animate={{ opacity: 1, y: 0 }}
                               exit={{ opacity: 0, y: -20 }}
                               className="w-full"
                           >
                               <AdvancedChart 
                                   ticker={selectedTicker}
                                   showSupportResistance={true}
                                   showPivotPoints={true}
                                   height={500}
                               />
                           </motion.div>
                       )}

                       {activeTab === 'technical' && (
                           <motion.div
                               key="technical"
                               initial={{ opacity: 0, y: 20 }}
                               animate={{ opacity: 1, y: 0 }}
                               exit={{ opacity: 0, y: -20 }}
                           >
                               <TechnicalIndicators 
                                   ticker={selectedTicker}
                                   indicators={["macd", "bollinger", "rsi", "stoch", "williams", "adx", "atr"]}
                               />
                           </motion.div>
                       )}

                       {activeTab === 'peers' && (
                           <motion.div
                               key="peers"
                               initial={{ opacity: 0, y: 20 }}
                               animate={{ opacity: 1, y: 0 }}
                               exit={{ opacity: 0, y: -20 }}
                               className="pt-8 border-t border-white/5"
                           >
                               <PeerMatrix 
                                   currentTicker={selectedTicker}
                                   portfolio={portfolio}
                                   prices={prices}
                                   analytics={batchAnalytics}
                               />
                           </motion.div>
                       )}
                   </AnimatePresence>
               </div>
           )}
       </div>

       {/* Detail Overlay Modal */}
       <AnimatePresence>
           {selectedMetric && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                   <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedMetric(null)}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                   />
                   <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[32px] p-8 shadow-2xl"
                   >
                       <button 
                        onClick={() => setSelectedMetric(null)}
                        className="absolute right-6 top-6 p-2 rounded-full hover:bg-white/5 text-muted-foreground transition-colors"
                       >
                           <X className="h-5 w-5" />
                       </button>

                       <div className="flex items-center gap-4 mb-8">
                           <div className="h-12 w-12 rounded-2xl bg-ios-blue/20 text-ios-blue flex items-center justify-center">
                               <Info className="h-6 w-6" />
                           </div>
                           <div>
                               <h3 className="text-xl font-bold text-white uppercase tracking-tight">{selectedMetric.title}</h3>
                               <p className="text-sm text-muted-foreground">Detailed Metric Analysis</p>
                           </div>
                       </div>

                       <div className="space-y-6">
                           <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                               <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Current Value</p>
                               <p className="text-4xl font-bold font-mono text-white tabular-nums">
                                   {typeof selectedMetric.value === 'number' ? selectedMetric.value.toFixed(2) : selectedMetric.value}
                                   {selectedMetric.suffix}
                               </p>
                           </div>

                           <div className="space-y-2">
                               <p className="text-sm font-bold text-white">Description</p>
                               <p className="text-muted-foreground leading-relaxed">
                                   {selectedMetric.description}
                               </p>
                           </div>

                           <div className="pt-4 border-t border-white/5 flex gap-4">
                               <div className="flex-1 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                                   <p className="text-[10px] font-bold text-emerald-500 uppercase">Upside Signal</p>
                                   <p className="text-xs text-emerald-400/70 mt-1 font-medium italic">"Positive indicator for accumulation."</p>
                               </div>
                           </div>
                       </div>

                       <button 
                        onClick={() => setSelectedMetric(null)}
                        className="w-full mt-8 py-4 rounded-2xl bg-white text-black font-bold hover:bg-white/90 transition-all active:scale-95 shadow-xl"
                       >
                           Got it
                       </button>
                   </motion.div>
               </div>
           )}
       </AnimatePresence>
    </div>
  );
}
