import { useMemo } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { Stock } from '../types';
import { Quote } from '../services/api';
import { formatINR } from '../lib/utils';

interface PortfolioHeatmapProps {
  portfolio: Stock[];
  prices: Record<string, Quote>;
  onSelect?: (ticker: string) => void;
}

const CustomContent = (props: any) => {
  const { x, y, width, height, payload, name } = props;

  if (!payload || !payload.color) return null;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: payload.color,
          stroke: 'rgba(0,0,0,0.2)',
          strokeWidth: 2,
        }}
        rx={8}
        ry={8}
      />
      {width > 40 && height > 30 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#fff"
          fontSize={Math.min(width / 5, 14)}
          fontWeight="bold"
          className="pointer-events-none"
        >
          {name.split('.')[0]}
        </text>
      )}
    </g>
  );
};

const HeatmapTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-black border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
        <p className="text-xs text-muted-foreground font-mono mb-1">{data.name}</p>
        <div className="space-y-1">
            <div className="flex justify-between gap-4">
                <span className="text-muted-foreground text-[10px] uppercase">Value</span>
                <span className="font-bold text-white text-sm">{formatINR(data.value)}</span>
            </div>
            <div className="flex justify-between gap-4">
                <span className="text-muted-foreground text-[10px] uppercase">Perf</span>
                <span className={`font-bold text-sm ${data.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
                </span>
            </div>
        </div>
      </div>
    );
  }
  return null;
};

export function PortfolioHeatmap({ portfolio, prices, onSelect }: PortfolioHeatmapProps) {
  const data = useMemo(() => {
    return portfolio.map(stock => {
      const quote = prices[stock.ticker];
      const currentPrice = quote?.price || stock.buyPrice;
      const value = stock.quantity * currentPrice;
      const change = quote?.percentChange || 0;
      
      // Calculate color intensity based on performance
      // Cap at +/- 5% for color scaling
      const intensity = Math.min(Math.abs(change) / 5, 1);
      const color = change >= 0 
        ? `rgba(16, 185, 129, ${0.3 + intensity * 0.7})` // Emerald
        : `rgba(244, 63, 94, ${0.3 + intensity * 0.7})`; // Rose

      return {
        name: stock.ticker,
        value,
        change,
        color
      };
    }).sort((a, b) => b.value - a.value);
  }, [portfolio, prices]);

  if (data.length === 0) return null;

  return (
    <div className="h-[400px] w-full bg-[#0A0A0A] border border-white/5 rounded-[32px] p-8 shadow-2xl flex flex-col group hover:border-white/10 transition-colors">
      <div className="mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white">Portfolio Heatmap</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mt-1">Size = Value | Color = Performance</p>
          </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={data}
            dataKey="value"
            stroke="none"
            content={<CustomContent />}
            onClick={(node: any) => onSelect && onSelect(node.name)}
          >
            <Tooltip content={<HeatmapTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
