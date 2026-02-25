import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useSettings } from '../context/SettingsContext';

interface PerformanceChartProps {
  data: any[]; // Expect { date, value }
}

// Custom Tooltip (Obsidian Style)
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

export function PerformanceChart({ data }: PerformanceChartProps) {
  const { chartStyle } = useSettings();

  // Mock data if empty
  const chartData = data.length > 0 ? data : [
      { date: 'Mon', value: 10000 },
      { date: 'Tue', value: 12500 },
      { date: 'Wed', value: 11800 },
      { date: 'Thu', value: 14200 },
      { date: 'Fri', value: 13900 },
      { date: 'Sat', value: 15600 },
      { date: 'Sun', value: 16200 },
  ];

  return (
    <div className="h-[400px] w-full bg-[#0A0A0A] border border-white/5 rounded-[24px] p-6 shadow-2xl relative overflow-hidden group">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div>
            <h3 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Portfolio Performance</h3>
            <p className="text-xs text-muted-foreground/50 mt-1 font-mono">7_DAY_TREND</p>
        </div>
        <div className="flex gap-2">
            {['1D', '1W', '1M', '1Y', 'ALL'].map(period => (
                <button key={period} className={`px-3 py-1 text-[10px] font-bold rounded border border-transparent hover:border-white/10 hover:bg-white/5 transition-all ${period === '1W' ? 'text-white bg-white/5 border-white/10' : 'text-muted-foreground'}`}>
                    {period}
                </button>
            ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 w-full h-[300px] relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          {chartStyle === 'glow' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
              <XAxis dataKey="date" hide />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#fff', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
                animationDuration={1500}
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
              <XAxis dataKey="date" hide />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#fff', strokeWidth: 1 }} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#ffffff" 
                strokeWidth={2} 
                dot={{ r: 4, fill: '#000', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#fff' }}
                animationDuration={1500}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
}
