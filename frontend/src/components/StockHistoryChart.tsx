import { useState, useEffect } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useSettings } from '../context/SettingsContext';
import { getHistory } from '../services/api';
import { Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StockHistoryChartProps {
  ticker: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
        <p className="text-xs text-muted-foreground font-mono mb-1">{label}</p>
        <p className="text-lg font-bold text-white font-mono tabular-nums">
          {payload[0].value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
        </p>
      </div>
    );
  }
  return null;
};

const TIMEFRAMES = ['1D', '1W', '1M', '1Y', '5Y'];

export function StockHistoryChart({ ticker }: StockHistoryChartProps) {
  const { chartStyle } = useSettings();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('1M');

  useEffect(() => {
    if (!ticker) return;
    
    let isMounted = true;
    const fetchHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const hist = await getHistory(ticker, timeframe);
            if (isMounted) {
                setData(hist);
            }
        } catch (err: any) {
            if (isMounted) {
                console.error("Error fetching history:", err);
                setError("Failed to load historical data.");
            }
        } finally {
            if (isMounted) setLoading(false);
        }
    };
    
    fetchHistory();
    
    return () => { isMounted = false; };
  }, [ticker, timeframe]);

  // Determine chart color based on performance over the period
  const isPositive = data.length >= 2 ? data[data.length - 1].price >= data[0].price : true;
  const strokeColor = isPositive ? "#10b981" : "#f43f5e"; // Emerald or Rose
  const glowId = `glow-${ticker}-${timeframe}`;

  return (
    <div className="w-full h-full flex flex-col relative group">
      {/* Header: Timeframe Selection */}
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h3 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Price History</h3>
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            {TIMEFRAMES.map(tf => (
                <button 
                    key={tf} 
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${timeframe === tf ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}
                >
                    {tf}
                </button>
            ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 w-full min-h-0 relative z-10">
        <AnimatePresence mode="wait">
            {loading && data.length === 0 ? (
                <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground"
                >
                    <Loader2 className="h-6 w-6 animate-spin mb-2 text-ios-blue" />
                    <span className="text-xs uppercase tracking-widest font-bold">Loading Data...</span>
                </motion.div>
            ) : error ? (
                 <motion.div 
                    key="error"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-rose-400/80"
                >
                    <AlertCircle className="h-6 w-6 mb-2" />
                    <span className="text-xs uppercase tracking-widest font-bold">{error}</span>
                </motion.div>
            ) : data.length === 0 ? (
                <motion.div 
                    key="nodata"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center text-muted-foreground/50 text-xs font-mono uppercase"
                >
                    // No_Data_Available //
                </motion.div>
            ) : (
                <motion.div
                    key="chart"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="h-full w-full"
                >
                    <ResponsiveContainer width="100%" height="100%">
                    {chartStyle === 'glow' ? (
                        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id={glowId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                        <XAxis dataKey="date" hide />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area 
                            type="monotone" 
                            dataKey="price" 
                            stroke={strokeColor} 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill={`url(#${glowId})`} 
                            animationDuration={1000}
                        />
                        </AreaChart>
                    ) : (
                        <LineChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                        <XAxis dataKey="date" hide />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }} />
                        <Line 
                            type="monotone" 
                            dataKey="price" 
                            stroke={strokeColor} 
                            strokeWidth={2} 
                            dot={false}
                            activeDot={{ r: 4, fill: '#fff', stroke: strokeColor, strokeWidth: 2 }}
                            animationDuration={1000}
                        />
                        </LineChart>
                    )}
                    </ResponsiveContainer>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
