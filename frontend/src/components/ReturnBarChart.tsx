import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from 'recharts';
import { Stock } from '../types';
import { Quote } from '../services/api';

interface ReturnBarChartProps {
  portfolio: Stock[];
  prices: Record<string, Quote>;
  onSelect?: (ticker: string) => void;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isProfit = data.return >= 0;
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-xl text-sm">
        <p className="font-semibold mb-1 text-popover-foreground">{data.name}</p>
        <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Return:</span>
            <span className={`font-mono font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isProfit ? '+' : ''}{data.return.toFixed(2)}%
            </span>
        </div>
      </div>
    );
  }
  return null;
};

export function ReturnBarChart({ portfolio, prices, onSelect }: ReturnBarChartProps) {
  const data = portfolio.map((stock) => {
    const quote = prices[stock.ticker];
    const currentPrice = quote ? quote.price : stock.buyPrice;
    const invested = stock.quantity * stock.buyPrice;
    const currentValue = stock.quantity * currentPrice;
    const plPercent = invested > 0 ? ((currentValue - invested) / invested) * 100 : 0;
    
    return {
      name: stock.ticker,
      return: plPercent,
    };
  }).sort((a, b) => b.return - a.return);

  // Show max 12 items for clean layout
  const chartData = data.length > 12 ? data.slice(0, 12) : data;

  return (
    <div className="h-[400px] w-full bg-card p-6 rounded-xl border border-border flex flex-col">
      <div className="mb-6">
          <h3 className="text-lg font-semibold">Performance Ranking</h3>
          <p className="text-xs text-muted-foreground">Top winners & losers by %</p>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            barSize={20}
            onClick={(data) => {
                if (onSelect && data.activePayload) {
                    onSelect(data.activePayload[0].payload.name);
                }
            }}
            >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis type="number" hide domain={['auto', 'auto']} />
            <YAxis 
                dataKey="name" 
                type="category" 
                width={70} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 500 }} 
                axisLine={false}
                tickLine={false}
                style={{ cursor: 'pointer' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsl(var(--muted))', opacity: 0.1}} />
            <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.5} />
            <Bar dataKey="return" radius={[0, 4, 4, 0]} cursor="pointer">
                {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.return >= 0 ? '#10b981' : '#f43f5e'} />
                ))}
            </Bar>
            </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
