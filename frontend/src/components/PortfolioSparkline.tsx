import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PortfolioSparklineProps {
  data: Array<{ date: string; value: number }>;
  currentValue: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black border border-white/10 p-2 rounded-lg shadow-xl">
        <p className="text-xs text-white">
          ₹{payload[0].value.toLocaleString('en-IN')}
        </p>
      </div>
    );
  }
  return null;
};

export function PortfolioSparkline({ data, currentValue }: PortfolioSparklineProps) {
  // Generate mock 7-day data if not provided
  const sparklineData = data.length > 0 ? data : [
    { date: 'Day 1', value: currentValue * 0.95 },
    { date: 'Day 2', value: currentValue * 0.98 },
    { date: 'Day 3', value: currentValue * 1.02 },
    { date: 'Day 4', value: currentValue * 0.99 },
    { date: 'Day 5', value: currentValue * 1.05 },
    { date: 'Day 6', value: currentValue * 1.03 },
    { date: 'Day 7', value: currentValue },
  ];

  const firstValue = sparklineData[0].value;
  const isPositive = currentValue >= firstValue;
  const changePercent = ((currentValue - firstValue) / firstValue) * 100;

  return (
    <div className="w-64 h-24 bg-[#0A0A0A]/60 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-rose-400" />
          )}
          <span className="text-xs font-medium text-muted-foreground">7-Day Performance</span>
        </div>
        <span className={`text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sparklineData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <XAxis dataKey="date" hide />
          <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={isPositive ? '#10b981' : '#f43f5e'}
            strokeWidth={2}
            dot={false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
