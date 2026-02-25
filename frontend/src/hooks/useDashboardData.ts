import { useState, useEffect, useMemo } from 'react';
import { Stock, PortfolioSummary } from '../types';
import { getQuotes, Quote } from '../services/api';
import { useSettings } from '../context/SettingsContext';

export function useDashboardData(portfolio: Stock[]) {
  const [prices, setPrices] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshInterval } = useSettings();

  const fetchPrices = async () => {
    if (portfolio.length === 0) {
      setLoading(false);
      return;
    }
    
    try {
      const tickers = portfolio.map(s => s.ticker);
      const quotes = await getQuotes(tickers);
      const priceMap: Record<string, Quote> = {};
      quotes.forEach(q => {
        priceMap[q.symbol] = q;
      });
      setPrices(priceMap);
      setError(null);
    } catch (err) {
      setError('Failed to fetch prices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    
    if (refreshInterval === 'manual') return;

    const ms = refreshInterval === '15s' ? 15000 : refreshInterval === '30s' ? 30000 : 60000;
    const interval = setInterval(fetchPrices, ms);
    return () => clearInterval(interval);
  }, [portfolio, refreshInterval]); 

  const summary = useMemo(() => {
    const s: PortfolioSummary = {
      totalInvested: 0,
      currentValue: 0,
      totalPL: 0,
      totalPLPercent: 0,
      dayChange: 0,
      dayChangePercent: 0,
    };

    let totalDayChange = 0;

    portfolio.forEach(stock => {
      const quote = prices[stock.ticker];
      // Use last known price or buy price if fetch failed/pending
      const currentPrice = quote ? quote.price : stock.buyPrice; 
      const value = stock.quantity * currentPrice;
      const cost = stock.quantity * stock.buyPrice;
      
      s.totalInvested += cost;
      s.currentValue += value;
      
      if (quote) {
          const change = quote.change * stock.quantity;
          totalDayChange += change;
      }
    });

    s.totalPL = s.currentValue - s.totalInvested;
    s.totalPLPercent = s.totalInvested > 0 ? (s.totalPL / s.totalInvested) * 100 : 0;
    s.dayChange = totalDayChange;
    
    const previousValue = s.currentValue - s.dayChange;
    s.dayChangePercent = previousValue > 0 ? (s.dayChange / previousValue) * 100 : 0;

    return s;
  }, [portfolio, prices]);

  return { summary, prices, loading, error, refresh: fetchPrices };
}
