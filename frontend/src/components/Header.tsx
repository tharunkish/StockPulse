import { useEffect, useState } from 'react';
import { getIndices, getMarketStatus, MarketStatus, IndexData, searchTicker } from '../services/api';
import { Loader2, Search, Clock, Activity } from 'lucide-react';
import { formatCompactINR } from '../lib/utils';
import { useSettings } from '../context/SettingsContext';
import { useDebounce } from '../hooks/useDebounce';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
    onSelectStock?: (ticker: string) => void;
}

export function Header({ onSelectStock }: HeaderProps) {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [status, setStatus] = useState<MarketStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { chartStyle, toggleChartStyle } = useSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (debouncedQuery.length > 2) {
        setIsSearching(true);
        searchTicker(debouncedQuery)
            .then(res => {
                setSearchResults(res);
                setIsSearching(false);
            })
            .catch(() => setIsSearching(false));
    } else {
        setSearchResults([]);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mStatus, mIndices] = await Promise.all([
          getMarketStatus(),
          getIndices()
        ]);
        setStatus(mStatus);
        setIndices(mIndices);
      } catch (e) {
        console.error("Failed to fetch header data", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectResult = (ticker: string) => {
      if (onSelectStock) {
          onSelectStock(ticker);
      }
      setSearchQuery('');
      setSearchResults([]);
  };

  return (
    <header className="h-24 flex items-center justify-between px-10 border-b border-white/5 bg-[#050505]/40 backdrop-blur-3xl sticky top-0 z-40">
      
      {/* Center: Search Bar (Image 1 Style) */}
      <div className="flex-1 max-w-3xl mx-auto relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-ios-blue transition-colors" />
          </div>
          <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets, sectors, or insights..." 
              className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-muted-foreground/40 focus:bg-white/[0.08] focus:border-ios-blue/30 focus:outline-none focus:ring-0 transition-all shadow-2xl"
          />
          <AnimatePresence>
            {(searchResults.length > 0 || isSearching) && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-6 bg-[#0A0A0A]/90 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden max-h-[480px] overflow-y-auto z-[100]"
                >
                    {isSearching && (
                        <div className="p-8 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-ios-blue" />
                        </div>
                    )}
                    {searchResults.map((s) => (
                        <div 
                            key={s.symbol} 
                            onClick={() => handleSelectResult(s.symbol)}
                            className="p-5 hover:bg-white/5 cursor-pointer flex justify-between items-center border-b border-white/5 last:border-0 group/item"
                        >
                            <div className="flex flex-col">
                                <span className="font-bold text-white group-hover/item:text-ios-blue transition-colors">{s.symbol}</span>
                                <span className="text-xs text-muted-foreground">{s.name}</span>
                            </div>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-black group-hover/item:text-white/60 transition-colors">{s.type}</span>
                        </div>
                    ))}
                </motion.div>
            )}
          </AnimatePresence>
      </div>

      {/* Right: Market Status & Settings */}
      <div className="flex items-center gap-8 pl-10 border-l border-white/5 ml-10 h-12">
         {loading ? (
             <div className="flex items-center gap-3">
                <Loader2 className="animate-spin h-4 w-4 text-ios-blue" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Syncing</span>
             </div>
         ) : (
             <div className="flex flex-col items-end">
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                     <Clock className="h-3 w-3" />
                     {status?.isOpen ? <span className="text-emerald-400">Market Open</span> : <span className="text-rose-400">Closed</span>}
                 </div>
                 <div className="flex gap-6 text-sm font-mono mt-1 font-bold">
                     {indices.slice(0, 2).map(idx => (
                         <div key={idx.symbol} className="flex items-center gap-2">
                            <span className="text-white/40">{idx.name.split(' ')[0]}</span>
                            <span className={idx.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                {formatCompactINR(idx.price)}
                            </span>
                         </div>
                     ))}
                 </div>
             </div>
         )}
         
         <div className="flex items-center gap-4">
             <button 
                onClick={toggleChartStyle}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all border border-white/5 relative group"
             >
                 <Activity className="h-5 w-5" />
                 <div className="absolute -bottom-12 right-0 bg-black border border-white/10 px-3 py-1.5 text-[10px] font-bold rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-all transform translate-y-2 group-hover:translate-y-0 shadow-2xl">
                     {chartStyle === 'glow' ? 'Switch to Lines' : 'Switch to Glow'}
                 </div>
             </button>
             <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-ios-blue to-ios-purple p-[2px] shadow-lg">
                <div className="h-full w-full rounded-[14px] bg-black flex items-center justify-center text-[10px] font-black text-white">
                    IP
                </div>
             </div>
         </div>
      </div>
    </header>
  );
}
