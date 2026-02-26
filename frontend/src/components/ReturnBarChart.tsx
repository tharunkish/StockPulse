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
      <div className="bg-black border border-white/10 p-3 rounded-lg shadow-xl text-sm">
        <p className="font-semibold mb-1 text-white">{data.name}</p>
        <div className="flex items-center justify-between gap-4">
            <span className="text-white/60">Return:</span>
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
    <div className="h-[400px] w-full bg-[#0A0A0A]/80 backdrop-blur-xl p-6 rounded-[32px] border border-white/10 flex flex-col">
      <div className="mb-6">
          <h3 className="text-lg font-semibold text-white">Performance Ranking</h3>
          <p className="text-xs text-white/60">Top winners & losers by % return</p>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 60, left: 70, bottom: 0 }}
            barSize={24}
            onClick={(data) => {
                if (onSelect && data.activePayload) {
                    onSelect(data.activePayload[0].payload.name);
                }
            }}
            >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="white/5" opacity={0.3} />
            <XAxis 
                type="number" 
                tick={{ fill: 'white/60', fontSize: 10, fontWeight: 500 }} 
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
            />
            <YAxis 
                dataKey="name" 
                type="category" 
                width={70} 
                tick={{ fill: 'white/80', fontSize: 11, fontWeight: 600 }} 
                axisLine={false}
                tickLine={false}
                style={{ cursor: 'pointer' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{fill: 'white/10', opacity: 0.1}} />
            <ReferenceLine x={0} stroke="white/20" strokeWidth={1} />
            <Bar dataKey="return" radius={[0, 6, 6, 0]} cursor="pointer">
                {chartData.map((entry, index) => (
                <Cell 
                    key={`cell-${index}`} 
                    fill={entry.return >= 0 ? '#10b981' : '#f43f5e'} 
                    fillOpacity={index % 2 === 0 ? 1 : 0.8}
                />
                ))}
            </Bar>
            {/* Add percentage labels at the end of bars */}
            <Bar dataKey="return" radius={[0, 0, 0, 0]} cursor="pointer" fill="transparent">
                {chartData.map((entry, index) => (
                    <Cell key={`label-${index}`}>
                        <text 
                            x={entry.return >= 0 ? 5 : -5} 
                            y={index * (400 / chartData.length) + 20} 
                            fill={entry.return >= 0 ? '#10b981' : '#f43f5e'} 
                            fontSize={10} 
                            fontWeight={600}
                            textAnchor={entry.return >= 0 ? 'start' : 'end'}
                        >
                            {entry.return >= 0 ? '+' : ''}{entry.return.toFixed(1)}%
                        </text>
                    </Cell>
                ))}
            </Bar>
            </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
