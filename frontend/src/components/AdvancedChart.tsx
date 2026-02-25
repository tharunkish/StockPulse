import { useState, useEffect, useMemo } from 'react';
import { 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ComposedChart,
  Bar
} from 'recharts';
import { getHistory } from '../services/api';
import { getSupportResistance, getPivotPoints } from '../services/api';
import { SupportResistanceResponse, PivotPoints } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  RefreshCw,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface ChartDataPoint {
  date: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

interface AdvancedChartProps {
  ticker: string;
  timeframe?: string;
  showSupportResistance?: boolean;
  showPivotPoints?: boolean;
  showVolume?: boolean;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-xl text-sm">
        <p className="font-semibold mb-2 text-popover-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <span className="text-muted-foreground flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }} 
              />
              {entry.name}:
            </span>
            <span className="font-mono font-medium" style={{ color: entry.color }}>
              {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const TimeframeSelector = ({ 
  timeframes, 
  selected, 
  onSelect 
}: { 
  timeframes: string[]; 
  selected: string; 
  onSelect: (tf: string) => void; 
}) => {
  return (
    <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
      {timeframes.map((tf) => (
        <button
          key={tf}
          onClick={() => onSelect(tf)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            selected === tf
              ? 'bg-ios-blue text-white shadow-lg'
              : 'text-muted-foreground hover:text-white hover:bg-white/5'
          }`}
        >
          {tf}
        </button>
      ))}
    </div>
  );
};

export const AdvancedChart: React.FC<AdvancedChartProps> = ({
  ticker,
  timeframe = '1M',
  showSupportResistance = true,
  showPivotPoints = true,
  showVolume = false,
  height = 400
}) => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [supportResistance, setSupportResistance] = useState<SupportResistanceResponse | null>(null);
  const [pivotPoints, setPivotPoints] = useState<PivotPoints | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const timeframes = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'];

  useEffect(() => {
    if (ticker) {
      fetchData();
    }
  }, [ticker, selectedTimeframe]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch historical data
      const historyData = await getHistory(ticker, selectedTimeframe);
      
      // Transform data for chart
      const chartData: ChartDataPoint[] = historyData.map((item: any) => ({
        date: item.date,
        price: item.price,
        close: item.price
      }));
      
      setData(chartData);

      // Fetch support/resistance and pivot points for longer timeframes
      if (['1M', '3M', '6M', '1Y', '5Y'].includes(selectedTimeframe)) {
        try {
          const [srData, pivotData] = await Promise.all([
            getSupportResistance(ticker),
            getPivotPoints(ticker)
          ]);
          setSupportResistance(srData);
          setPivotPoints(pivotData);
        } catch (err) {
          console.warn('Failed to fetch support/resistance data:', err);
        }
      }
    } catch (err) {
      setError('Failed to fetch chart data');
      console.error('Error fetching chart data:', err);
    } finally {
      setLoading(false);
    }
  };

  const chartDataWithIndicators = useMemo(() => {
    if (!data.length) return data;

    let enhancedData = [...data];

    // Add support/resistance lines
    if (supportResistance && showSupportResistance && supportResistance.support_resistance) {
      enhancedData = enhancedData.map(point => ({
        ...point,
        resistance1: supportResistance.support_resistance.resistance?.[0]?.level,
        resistance2: supportResistance.support_resistance.resistance?.[1]?.level,
        resistance3: supportResistance.support_resistance.resistance?.[2]?.level,
        support1: supportResistance.support_resistance.support?.[0]?.level,
        support2: supportResistance.support_resistance.support?.[1]?.level,
        support3: supportResistance.support_resistance.support?.[2]?.level,
      }));
    }

    // Add pivot points
    if (pivotPoints && showPivotPoints && pivotPoints.resistance && pivotPoints.support) {
      enhancedData = enhancedData.map(point => ({
        ...point,
        pivot: pivotPoints.pivot,
        pivotR1: pivotPoints.resistance?.r1,
        pivotR2: pivotPoints.resistance?.r2,
        pivotR3: pivotPoints.resistance?.r3,
        pivotS1: pivotPoints.support?.s1,
        pivotS2: pivotPoints.support?.s2,
        pivotS3: pivotPoints.support?.s3,
      }));
    }

    return enhancedData;
  }, [data, supportResistance, pivotPoints, showSupportResistance, showPivotPoints]);

  const currentPrice = data.length > 0 ? data[data.length - 1].price : 0;
  const priceChange = data.length > 1 ? currentPrice - data[0].price : 0;
  const priceChangePercent = data.length > 1 ? (priceChange / data[0].price) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-ios-blue" />
          <span className="text-muted-foreground font-medium animate-pulse uppercase tracking-widest text-[10px]">
            Loading Chart Data...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <Activity className="h-12 w-12 text-rose-400 mx-auto mb-4" />
          <p className="text-rose-400 font-medium">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No chart data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900 p-6 flex flex-col' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-white">{ticker}</h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-2xl font-bold font-mono text-white">
                ₹{currentPrice.toFixed(2)}
              </span>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                priceChange >= 0 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'bg-rose-500/10 text-rose-400'
              }`}>
                {priceChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <TimeframeSelector
            timeframes={timeframes}
            selected={selectedTimeframe}
            onSelect={setSelectedTimeframe}
          />
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <ResponsiveContainer width="100%" height={isFullscreen ? window.innerHeight - 200 : height}>
          <ComposedChart data={chartDataWithIndicators} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              domain={['dataMin - 5', 'dataMax + 5']}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Main price line */}
            <Line
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--ios-blue))"
              strokeWidth={2}
              dot={false}
              name="Price"
            />

            {/* Support/Resistance Lines */}
            {showSupportResistance && supportResistance && supportResistance.support_resistance && (
              <>
                {/* Resistance lines */}
                {supportResistance.support_resistance.resistance?.slice(0, 3).map((_level, index) => (
                  <Line
                    key={`resistance-${index}`}
                    type="monotone"
                    dataKey={`resistance${index + 1}`}
                    stroke="#ef4444"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                    opacity={0.7}
                    name={`Resistance ${index + 1}`}
                  />
                ))}
                
                {/* Support lines */}
                {supportResistance.support_resistance.support?.slice(0, 3).map((_level, index) => (
                  <Line
                    key={`support-${index}`}
                    type="monotone"
                    dataKey={`support${index + 1}`}
                    stroke="#10b981"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                    opacity={0.7}
                    name={`Support ${index + 1}`}
                  />
                ))}
              </>
            )}

            {/* Pivot Points */}
            {showPivotPoints && pivotPoints && pivotPoints.resistance && pivotPoints.support && (
              <>
                <Line
                  type="monotone"
                  dataKey="pivot"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="10 5"
                  dot={false}
                  opacity={0.8}
                  name="Pivot"
                />
                
                <Line
                  type="monotone"
                  dataKey="pivotR1"
                  stroke="#f59e0b"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                  opacity={0.6}
                  name="R1"
                />
                
                <Line
                  type="monotone"
                  dataKey="pivotS1"
                  stroke="#f59e0b"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                  opacity={0.6}
                  name="S1"
                />
              </>
            )}

            {/* Volume bars (if enabled) */}
            {showVolume && (
              <Bar
                dataKey="volume"
                fill="hsl(var(--muted))"
                opacity={0.3}
                name="Volume"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-ios-blue" />
          <span>Price</span>
        </div>
        
        {showSupportResistance && supportResistance && supportResistance.support_resistance && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-rose-500 border-t-2 border-dashed border-rose-500" />
              <span>Resistance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-emerald-500 border-t-2 border-dashed border-emerald-500" />
              <span>Support</span>
            </div>
          </>
        )}
        
        {showPivotPoints && pivotPoints && pivotPoints.resistance && pivotPoints.support && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-amber-500 border-t-2 border-dashed border-amber-500" />
              <span>Pivot Points</span>
            </div>
          </>
        )}
      </div>

      {/* Fullscreen close button */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="fixed top-6 right-6 p-3 rounded-full bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-all border border-rose-500/30 z-[60]"
        >
          <TrendingDown className="h-5 w-5 rotate-45" />
        </button>
      )}
    </div>
  );
};
