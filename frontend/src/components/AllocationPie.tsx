import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { Stock } from '../types';
import { Quote } from '../services/api';
import { formatINR, CHART_COLORS } from '../lib/utils';

interface AllocationPieProps {
  portfolio: Stock[];
  prices: Record<string, Quote>;
  onSelect?: (ticker: string) => void;
}

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

export function AllocationPie({ portfolio, prices, onSelect }: AllocationPieProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const data = useMemo(() => {
    const rawData = portfolio.map((stock) => {
        const quote = prices[stock.ticker];
        const value = stock.quantity * (quote ? quote.price : stock.buyPrice);
        return { name: stock.ticker, value };
    }).sort((a, b) => b.value - a.value);

    // Group small holdings
    if (rawData.length > 6) {
        const top = rawData.slice(0, 5);
        const others = rawData.slice(5).reduce((acc, curr) => acc + curr.value, 0);
        return [...top, { name: 'Others', value: others }];
    }
    return rawData;
  }, [portfolio, prices]);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieClick = (data: any) => {
    if (onSelect && data.name !== 'Others') {
        onSelect(data.name);
    }
  };

  return (
    <div className="h-[400px] w-full bg-card p-6 rounded-xl border border-border flex flex-col">
      <div className="mb-2">
         <h3 className="text-lg font-semibold">Stock Allocation</h3>
         <p className="text-xs text-muted-foreground">Top holdings by value</p>
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
                innerRadius={80}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                onMouseEnter={onPieEnter}
                onClick={onPieClick}
                stroke="none"
                cursor="pointer"
            >
                {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
            </Pie>
            </PieChart>
        </ResponsiveContainer>
      </div>

       <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-muted-foreground border-t border-border pt-4">
         {data.map((entry, idx) => (
             <div 
                key={entry.name} 
                className={`flex items-center gap-2 ${entry.name !== 'Others' ? 'cursor-pointer hover:text-white' : ''}`}
                onClick={() => onPieClick(entry)}
             >
                 <div className="h-2 w-2 rounded-full shrink-0" style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                 <span className="truncate">{entry.name}</span>
                 <span className="ml-auto font-mono text-foreground">{((entry.value / data.reduce((a, b) => a + b.value, 0)) * 100).toFixed(0)}%</span>
             </div>
         ))}
      </div>
    </div>
  );
}
