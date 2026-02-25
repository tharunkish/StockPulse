import { useState, useEffect } from 'react';
import { Search, TrendingUp, Plus, MoreHorizontal } from 'lucide-react';
import { Stock } from '../types';
import { Quote, getHistory } from '../services/api';
import { formatINR } from '../lib/utils';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface WatchlistSidebarProps {
  portfolio: Stock[];
  prices: Record<string, Quote>;
  selectedTicker: string | null;
  onSelect: (ticker: string | null) => void;
  onAddStock: () => void;
}

const MiniSparkline = ({ ticker }: { ticker: string }) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchMiniHistory = async () => {
            setLoading(true);
            try {
                const hist = await getHistory(ticker, '1D');
                if (isMounted) setData(hist);
            } catch (e) {
                console.error("Sidebar hist error:", e);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchMiniHistory();
        return () => { isMounted = false; };
    }, [ticker]);

    if (loading || data.length < 2) return <div className="w-12 h-6 bg-white/5 rounded animate-pulse" />;

    const isPositive = data[data.length - 1].price >= data[0].price;
    const color = isPositive ? "#10b981" : "#f43f5e";

    return (
        <div className="w-12 h-6">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke={color} 
                        fill={color} 
                        fillOpacity={0.1} 
                        strokeWidth={1.5} 
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export function WatchlistSidebar({ portfolio, prices, selectedTicker, onSelect, onAddStock }: WatchlistSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPortfolio = portfolio.filter(stock => 
    stock.ticker.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-[380px] flex flex-col h-full bg-slate-950/50 border-r border-white/5 backdrop-blur-xl relative z-20">
      {/* Header Area */}
      <div className="p-4 pb-2 space-y-4">
        <div className="flex items-center justify-between px-2">
            <h1 
                onClick={() => onSelect(null)} 
                className="text-xl font-bold tracking-tight cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2"
            >
                <div className="h-8 w-8 rounded-lg bg-ios-blue text-white flex items-center justify-center shadow-lg shadow-ios-blue/20">
                    <TrendingUp className="h-5 w-5" />
                </div>
                StockPulse
            </h1>
            <button 
                onClick={onAddStock}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
                <Plus className="h-5 w-5" />
            </button>
        </div>

        <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-white transition-colors" />
            <input 
                type="text" 
                placeholder="Search holdings..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/5 focus:bg-white/10 focus:border-white/10 focus:outline-none focus:ring-0 text-sm transition-all"
            />
        </div>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 custom-scrollbar">
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex justify-between items-center">
            <span>My Assets</span>
            <span>{filteredPortfolio.length}</span>
        </div>
        
        {filteredPortfolio.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground/50">
                <p className="text-sm">No assets yet.</p>
                <p className="text-xs mt-1">Tap + to add.</p>
            </div>
        ) : (
            filteredPortfolio.map((stock) => {
                const quote = prices[stock.ticker];
                const currentPrice = quote?.price || stock.buyPrice;
                const change = quote?.percentChange || 0;
                const isSelected = selectedTicker === stock.ticker;
                const isPositive = change >= 0;

                return (
                    <motion.div
                        key={stock.ticker}
                        layoutId={stock.ticker}
                        onClick={() => onSelect(stock.ticker)}
                        className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent ${
                            isSelected 
                                ? 'bg-white/10 shadow-xl border-white/5' 
                                : 'hover:bg-white/5'
                        }`}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className={`font-bold font-mono tracking-tight ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                {stock.ticker.replace('.NS', '').replace('.BO', '')}
                            </span>
                            <div className="flex flex-col items-end">
                                <span className="font-medium font-mono text-sm text-slate-300">
                                    {formatINR(currentPrice)}
                                </span>
                                <MiniSparkline ticker={stock.ticker} />
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                             <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px]">{stock.quantity} Qty</span>
                             </div>
                             <div className={`flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${
                                 isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                             }`}>
                                 {isPositive ? '+' : ''}{change.toFixed(2)}%
                             </div>
                        </div>
                        
                        {/* Active Indicator Bar */}
                        {isSelected && (
                            <motion.div 
                                layoutId="active-bar"
                                className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-ios-blue"
                            />
                        )}
                    </motion.div>
                );
            })
        )}
      </div>

      {/* Footer / Account */}
      <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-ios-indigo to-ios-purple p-[1px]">
                  <div className="h-full w-full rounded-full bg-black flex items-center justify-center text-xs font-bold">
                      IP
                  </div>
              </div>
              <div className="flex-1">
                  <p className="text-sm font-medium text-white">Investor Pro</p>
                  <p className="text-xs text-muted-foreground">Premium Plan</p>
              </div>
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
          </div>
      </div>
    </div>
  );
}
