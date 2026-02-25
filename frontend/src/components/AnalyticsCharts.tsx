import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Sector } from 'recharts';
import { Stock, StockAnalytics } from '../types';
import { Quote } from '../services/api';
import { formatINR, CHART_COLORS } from '../lib/utils';

interface AnalyticsProps {
  portfolio: Stock[];
  prices: Record<string, Quote>;
  analytics: Record<string, StockAnalytics>;
}

// Active Shape for Hover Effect
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;

  if (!payload) return <g />;

  return (
    <g>
      <text x={cx} y={cy} dy={-10} textAnchor="middle" fill="#94a3b8" fontSize={12}>
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={16} textAnchor="middle" fill="#f8fafc" fontSize={16} fontWeight="bold">
        {formatINR(value)}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 12}
        fill={fill}
        opacity={0.3}
      />
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-xl text-sm">
        <p className="font-semibold mb-1 text-popover-foreground">{payload[0].name}</p>
        <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Value:</span>
            <span className="font-mono font-medium text-emerald-400">{formatINR(payload[0].value)}</span>
        </div>
        {payload[0].payload.percent && (
            <div className="flex items-center justify-between gap-4 mt-1">
                <span className="text-muted-foreground">Share:</span>
                <span className="font-mono text-primary">{(payload[0].payload.percent).toFixed(1)}%</span>
            </div>
        )}
      </div>
    );
  }
  return null;
};

export function SectorPieChart({ portfolio, prices, analytics }: AnalyticsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const data = useMemo(() => {
    const sectors: Record<string, number> = {};
    let totalValue = 0;
    
    portfolio.forEach(stock => {
      const quote = prices[stock.ticker];
      const info = analytics[stock.ticker];
      const sector = info?.sector || 'Unknown';
      const value = stock.quantity * (quote?.price || stock.buyPrice);
      
      sectors[sector] = (sectors[sector] || 0) + value;
      totalValue += value;
    });

    return Object.entries(sectors)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [portfolio, prices, analytics]);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="h-[400px] w-full bg-card p-6 rounded-xl border border-border flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
            <h3 className="text-lg font-semibold">Sector Allocation</h3>
            <p className="text-xs text-muted-foreground">Exposure across industries</p>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={onPieEnter}
              stroke="none"
            >
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-muted-foreground border-t border-border pt-4">
         {data.slice(0, 6).map((entry, idx) => (
             <div key={entry.name} className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full shrink-0" style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                 <span className="truncate">{entry.name}</span>
                 <span className="ml-auto font-mono text-foreground">{((entry.value / data.reduce((a, b) => a + b.value, 0)) * 100).toFixed(0)}%</span>
             </div>
         ))}
      </div>
    </div>
  );
}

export function MarketCapChart({ portfolio, prices, analytics }: AnalyticsProps) {
    const data = useMemo(() => {
        let large = 0, mid = 0, small = 0;
        let total = 0;

        portfolio.forEach(stock => {
            const quote = prices[stock.ticker];
            const info = analytics[stock.ticker];
            const value = stock.quantity * (quote?.price || stock.buyPrice);
            
            // Market Cap logic (in Crores)
            const mCapCr = (info?.marketCap || 0) / 10000000;

            if (mCapCr > 20000) large += value;
            else if (mCapCr > 5000) mid += value;
            else small += value;
            total += value;
        });

        // Calculate percent for tooltip
        const getPercent = (val: number) => total > 0 ? (val/total)*100 : 0;

        return [
            { name: 'Large Cap', value: large, color: '#10b981', percent: getPercent(large) }, // Emerald
            { name: 'Mid Cap', value: mid, color: '#f59e0b', percent: getPercent(mid) },   // Amber
            { name: 'Small Cap', value: small, color: '#f43f5e', percent: getPercent(small) }, // Rose
        ].filter(d => d.value > 0); // Only show non-zero
    }, [portfolio, prices, analytics]);

    return (
        <div className="h-[400px] w-full bg-card p-6 rounded-xl border border-border flex flex-col">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Market Cap Mix</h3>
                    <p className="text-xs text-muted-foreground">Risk profile by company size</p>
                </div>
            </div>
            
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: 0, right: 0, top: 0, bottom: 0 }} barSize={32}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.4} />
                        <XAxis type="number" hide />
                        <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={100} 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 500 }} 
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsl(var(--muted))', opacity: 0.1}} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                             {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
