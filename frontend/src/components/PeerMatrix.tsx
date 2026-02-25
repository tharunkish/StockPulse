import { Stock, StockAnalytics } from '../types';
import { Quote } from '../services/api';
import { formatINR, formatCompactINR } from '../lib/utils';
import { Info } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface PeerMatrixProps {
  currentTicker: string;
  portfolio: Stock[];
  prices: Record<string, Quote>;
  analytics: Record<string, StockAnalytics>;
}

export function PeerMatrix({ currentTicker, portfolio, prices, analytics }: PeerMatrixProps) {
  const { isPrivacyMode } = useSettings();
  const currentAsset = analytics[currentTicker];
  if (!currentAsset) return null;

  const currentSector = currentAsset.sector;
  
  // Find peers in the same sector from the portfolio
  const peers = portfolio.filter(s => 
    s.ticker !== currentTicker && 
    analytics[s.ticker]?.sector === currentSector
  );

  if (peers.length === 0) {
      return (
          <div className="p-8 text-center bg-white/5 rounded-[32px] border border-white/5">
              <p className="text-muted-foreground text-sm">No other holdings in the <span className="text-white font-bold">{currentSector}</span> sector to compare with.</p>
          </div>
      );
  }

  const allAssets = [portfolio.find(s => s.ticker === currentTicker)!, ...peers];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-ios-blue/20 text-ios-blue flex items-center justify-center">
              <Info className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Sector Peers</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Relative Valuation in {currentSector}</p>
          </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <table className="w-full text-left font-mono text-sm border-separate border-spacing-x-4 border-spacing-y-0">
          <thead>
            <tr className="text-muted-foreground/60 uppercase text-[10px] tracking-widest">
              <th className="pb-4">Asset</th>
              <th className="pb-4 text-right">LTP</th>
              <th className="pb-4 text-right">Beta</th>
              <th className="pb-4 text-right">Market Cap</th>
              <th className="pb-4 text-right">Portfolio %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {allAssets.map((stock) => {
              const info = analytics[stock!.ticker];
              const quote = prices[stock!.ticker];
              const isCurrent = stock!.ticker === currentTicker;
              
              // Calculate Portfolio weight
              const totalValue = portfolio.reduce((acc, s) => acc + (s.quantity * (prices[s.ticker]?.price || s.buyPrice)), 0);
              const assetValue = stock!.quantity * (quote?.price || stock!.buyPrice);
              const weight = (assetValue / totalValue) * 100;

              return (
                <tr key={stock!.ticker} className={`${isCurrent ? 'bg-ios-blue/10' : ''} group transition-colors`}>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                        {isCurrent && <div className="h-1.5 w-1.5 rounded-full bg-ios-blue shadow-[0_0_8px_#007AFF]" />}
                        <span className={`font-bold ${isCurrent ? 'text-ios-blue' : 'text-white'}`}>
                            {stock!.ticker.split('.')[0]}
                        </span>
                    </div>
                  </td>
                  <td className="py-4 text-right text-white font-bold">{isPrivacyMode ? '••••' : formatINR(quote?.price || 0)}</td>
                  <td className="py-4 text-right text-muted-foreground">{info?.beta?.toFixed(2) || '1.00'}</td>
                  <td className="py-4 text-right text-muted-foreground">{isPrivacyMode ? '••••' : formatCompactINR(info?.marketCap || 0)}</td>
                  <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-white/40" style={{ width: `${Math.min(weight * 2, 100)}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-white/60">{weight.toFixed(1)}%</span>
                      </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
