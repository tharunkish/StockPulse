import { useState, useRef } from 'react';
import { Download, Upload, Loader2, AlertCircle } from 'lucide-react';
import { Stock } from '../types';

interface CSVExportProps {
  portfolio: Stock[];
}

export function CSVExport({ portfolio }: CSVExportProps) {
  const handleExport = () => {
    // Define headers
    const headers = ['Ticker', 'Quantity', 'Buy Price', 'Buy Date', 'Notes', 'Current Value'];
    
    // Convert data to CSV string
    const csvContent = [
      headers.join(','),
      ...portfolio.map(stock => {
        return [
          stock.ticker,
          stock.quantity,
          stock.buyPrice,
          stock.buyDate,
          `"${stock.notes || ''}"`, // Quote notes to handle commas
          // Current Value is dynamic, maybe skip or fetch? 
          // Keep it simple: Export what we store.
        ].join(',');
      })
    ].join('\n');

    // Create Blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `stockpulse_portfolio_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button 
      onClick={handleExport}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-card hover:bg-muted border border-border rounded-md transition-colors"
    >
      <Download className="h-4 w-4" /> Export CSV
    </button>
  );
}

interface CSVImportProps {
  onImport: (stocks: Stock[]) => void;
}

export function CSVImport({ onImport }: CSVImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        
        if (lines.length < 2) throw new Error("File is empty or invalid");

        const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
        
        // Basic mapping logic
        const map = {
            ticker: headers.findIndex(h => h.includes('ticker') || h.includes('symbol') || h.includes('instrument')),
            qty: headers.findIndex(h => h.includes('quant') || h.includes('qty') || h.includes('units')),
            price: headers.findIndex(h => h.includes('price') || h.includes('avg') || h.includes('cost') || h.includes('buy')),
            date: headers.findIndex(h => h.includes('date') || h.includes('time'))
        };

        if (map.ticker === -1 || map.qty === -1 || map.price === -1) {
            throw new Error("Could not identify Ticker, Quantity, or Price columns. Ensure headers are present.");
        }

        const newStocks: Stock[] = [];
        
        // Parse rows
        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
            if (row.length < 3) continue;

            let ticker = row[map.ticker];
            
            // Heuristic: Append .NS if no suffix and looks like Indian stock
            // This is risky, but user requested Indian focus.
            if (!ticker.includes('.')) {
                // If all numeric (BSE code), append .BO
                if (/^\d+$/.test(ticker)) {
                    ticker += ".BO";
                } else {
                    ticker += ".NS";
                }
            }

            const qty = parseFloat(row[map.qty]);
            const price = parseFloat(row[map.price]);
            const date = map.date !== -1 ? row[map.date] : new Date().toISOString().split('T')[0];

            if (ticker && !isNaN(qty) && !isNaN(price)) {
                newStocks.push({
                    ticker: ticker.toUpperCase(),
                    quantity: qty,
                    buyPrice: price,
                    buyDate: date,
                    notes: 'Imported via CSV'
                });
            }
        }

        if (newStocks.length === 0) throw new Error("No valid stocks found in file.");
        
        onImport(newStocks);
        e.target.value = ''; // Reset input
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="relative">
      <input 
        type="file" 
        accept=".csv" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-card hover:bg-muted border border-border rounded-md transition-colors"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Import CSV
      </button>
      {error && (
        <div className="absolute top-full mt-2 right-0 w-64 bg-destructive/10 text-destructive text-xs p-2 rounded border border-destructive/20 z-50 flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
        </div>
      )}
    </div>
  );
}
