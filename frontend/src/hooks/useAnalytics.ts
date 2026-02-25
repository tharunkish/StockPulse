import { useState, useEffect } from 'react';
import { Stock, StockAnalytics } from '../types';
import { getBatchAnalytics } from '../services/api';

export function useAnalytics(portfolio: Stock[]) {
  const [data, setData] = useState<Record<string, StockAnalytics>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (portfolio.length === 0) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const tickers = portfolio.map(s => s.ticker);
        const results = await getBatchAnalytics(tickers);
        const analyticsMap: Record<string, StockAnalytics> = {};
        results.forEach(item => {
            analyticsMap[item.symbol] = item;
        });
        setData(analyticsMap);
      } catch (e) {
        console.error("Failed to fetch analytics", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [portfolio]);

  return { analytics: data, loading };
}
