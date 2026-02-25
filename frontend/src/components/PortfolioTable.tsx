import { Stock } from '../types';
import { Quote } from '../services/api';
import { Edit2, Trash2, ArrowRight } from 'lucide-react';
import { formatINR, formatCompactINR } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

interface PortfolioTableProps {
  portfolio: Stock[];
  prices: Record<string, Quote>;
  onEdit: (stock: Stock) => void;
  onDelete: (ticker: string) => void;
  onSelect?: (ticker: string) => void;
}

export function PortfolioTable({ portfolio, prices, onEdit, onDelete, onSelect }: PortfolioTableProps) {
  const { isPrivacyMode } = useSettings();

  return (
    <div className="rounded-[24px] border border-white/5 bg-[#0A0A0A] overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">Active Positions</h3>
          <button className="text-xs text-white font-mono hover:text-white/80 transition-colors flex items-center gap-1 border border-white/10 px-2 py-1 rounded">
              VIEW_ALL <ArrowRight className="h-3 w-3" />
          </button>
      </div>
      
      <div className="overflow-x-auto">
      <table className="w-full text-left font-mono text-sm">
        <thead className="bg-white/5 text-muted-foreground/60 font-medium uppercase text-xs tracking-wider">
          <tr>
            <th className="px-6 py-4 font-normal">Instrument</th>
            <th className="px-6 py-4 font-normal text-right">Quantity</th>
            <th className="px-6 py-4 font-normal text-right">Avg_Price</th>
            <th className="px-6 py-4 font-normal text-right">LTP</th>
            <th className="px-6 py-4 font-normal text-right">Value</th>
            <th className="px-6 py-4 font-normal text-right">P/L</th>
            <th className="px-6 py-4 font-normal text-right">...</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          <AnimatePresence>
          {portfolio.map((stock, idx) => {
            const quote = prices[stock.ticker];
            const currentPrice = quote?.price || stock.buyPrice;
            const currentValue = stock.quantity * currentPrice;
            const invested = stock.quantity * stock.buyPrice;
            const pl = currentValue - invested;
            const plPercent = invested > 0 ? (pl / invested) * 100 : 0;
            const isProfit = pl >= 0;

            return (
              <motion.tr 
                key={stock.ticker} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15, delay: idx * 0.03 }}
                onClick={() => onSelect && onSelect(stock.ticker)}
                className="group hover:bg-white/5 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-white/5 flex items-center justify-center text-[10px] font-bold text-muted-foreground group-hover:text-white border border-white/5">
                            {stock.ticker.substring(0, 2)}
                        </div>
                        <div>
                            <div className="font-bold text-white group-hover:text-emerald-400 transition-colors tracking-tight">{stock.ticker.replace('.NS', '')}</div>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 text-right text-muted-foreground group-hover:text-white transition-colors">{stock.quantity}</td>
                <td className="px-6 py-4 text-right text-muted-foreground group-hover:text-white transition-colors">{isPrivacyMode ? '••••' : formatINR(stock.buyPrice)}</td>
                <td className="px-6 py-4 text-right font-bold text-white">
                    {isPrivacyMode ? '••••' : (quote ? formatINR(quote.price) : <span className="animate-pulse bg-white/10 h-4 w-16 rounded inline-block" />)}
                </td>
                <td className="px-6 py-4 text-right font-bold text-white">{isPrivacyMode ? '••••' : formatINR(currentValue)}</td>
                <td className="px-6 py-4 text-right">
                   <div className={`inline-flex items-center gap-1.5 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPrivacyMode ? '••••' : formatCompactINR(pl)} 
                      <span className="text-[10px] opacity-70">({isProfit ? '+' : ''}{plPercent.toFixed(2)}%)</span>
                   </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(stock); }} className="p-1.5 hover:bg-white/10 rounded border border-transparent hover:border-white/10 text-muted-foreground hover:text-white transition-all">
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(stock.ticker); }} className="p-1.5 hover:bg-rose-500/10 rounded border border-transparent hover:border-rose-500/20 text-muted-foreground hover:text-rose-400 transition-all">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            );
          })}
          </AnimatePresence>
          {portfolio.length === 0 && (
              <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground/40 font-mono text-xs uppercase tracking-widest">
                      // No_Data //
                  </td>
              </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
