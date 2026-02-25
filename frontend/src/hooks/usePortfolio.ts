import { useState, useEffect } from 'react';
import { Stock } from '../types';

const STORAGE_KEY = 'stockpulse-portfolio';

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<Stock[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
  }, [portfolio]);

  const addStock = (stock: Stock) => {
    setPortfolio(prev => {
        const existingIndex = prev.findIndex(p => p.ticker === stock.ticker);
        if (existingIndex >= 0) {
            // Aggregation logic for "Add More"
            const existing = prev[existingIndex];
            const newQty = existing.quantity + stock.quantity;
            const totalCost = (existing.quantity * existing.buyPrice) + (stock.quantity * stock.buyPrice);
            const newAvgPrice = totalCost / newQty;
            
            const updated = [...prev];
            updated[existingIndex] = {
                ...existing,
                quantity: newQty,
                buyPrice: newAvgPrice,
                notes: stock.notes ? `${existing.notes || ''}\n${stock.notes}` : existing.notes
            };
            return updated;
        }
        return [...prev, stock];
    });
  };

  const overrideStock = (stock: Stock) => {
      setPortfolio(prev => {
          const index = prev.findIndex(p => p.ticker === stock.ticker);
          if (index >= 0) {
              const updated = [...prev];
              updated[index] = stock;
              return updated;
          }
          return [...prev, stock];
      });
  }

  const removeStock = (ticker: string) => {
    setPortfolio(prev => prev.filter(s => s.ticker !== ticker));
  };
  
  return { portfolio, addStock, overrideStock, removeStock };
}
