import { Stock } from '../types';
import { Quote } from '../services/api';
import { formatCompactINR } from '../lib/utils';
import { TrendingDown, Target, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

interface PerformanceInsightsProps {
  portfolio: Stock[];
  prices: Record<string, Quote>;
}

export function PerformanceInsights({ portfolio, prices }: PerformanceInsightsProps) {
  const { isPrivacyMode } = useSettings();
  if (portfolio.length === 0) return null;

  // Find Best and Worst performers by total P/L
  const performance = portfolio.map(stock => {
      const quote = prices[stock.ticker];
      const currentPrice = quote?.price || stock.buyPrice;
      const value = stock.quantity * currentPrice;
      const cost = stock.quantity * stock.buyPrice;
      const pl = value - cost;
      const dayChangePercent = quote?.percentChange || 0;
      
      return {
          ticker: stock.ticker,
          pl,
          dayChangePercent
      };
  });

  const best = [...performance].sort((a, b) => b.pl - a.pl)[0];
  const worst = [...performance].sort((a, b) => a.pl - b.pl)[0];
  const mover = [...performance].sort((a, b) => Math.abs(b.dayChangePercent) - Math.abs(a.dayChangePercent))[0];

  const cards = [
      {
          title: 'Star Performer',
          ticker: best.ticker,
          value: isPrivacyMode ? '••••' : formatCompactINR(best.pl),
          sub: 'Total Profit',
          icon: Target,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10'
      },
      {
          title: 'Biggest Laggard',
          ticker: worst.ticker,
          value: isPrivacyMode ? '••••' : formatCompactINR(worst.pl),
          sub: 'Total Loss',
          icon: TrendingDown,
          color: 'text-rose-400',
          bg: 'bg-rose-500/10'
      },
      {
          title: mover.dayChangePercent >= 0 ? 'Top Gainer (1D)' : 'Top Loser (1D)',
          ticker: mover.ticker,
          value: `${mover.dayChangePercent >= 0 ? '+' : ''}${mover.dayChangePercent.toFixed(2)}%`,
          sub: 'Day Change',
          icon: mover.dayChangePercent >= 0 ? TrendingUp : TrendingDown,
          color: mover.dayChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400',
          bg: mover.dayChangePercent >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'
      }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {cards.map((card, idx) => (
            <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 flex items-center gap-4 group hover:border-white/10 transition-colors shadow-xl"
            >
                <div className={`h-12 w-12 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center shrink-0`}>
                    <card.icon className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{card.title}</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-white font-bold">{card.ticker.split('.')[0]}</span>
                        <span className={`text-sm font-bold font-mono ${card.color}`}>{card.value}</span>
                    </div>
                </div>
            </motion.div>
        ))}
    </div>
  );
}
