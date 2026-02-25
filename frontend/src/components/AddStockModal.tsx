import { useState, useEffect } from 'react';
import { X, Check, Loader2, Calendar, DollarSign, List, FileText } from 'lucide-react';
import { Stock } from '../types';
import { searchTicker, getQuotes } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { motion, AnimatePresence } from 'framer-motion';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stock: Stock) => void;
  initialData?: Stock | null;
}

export function AddStockModal({ isOpen, onClose, onSave, initialData }: AddStockModalProps) {
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  
  const debouncedTicker = useDebounce(ticker, 500);

  useEffect(() => {
    if (initialData) {
      setTicker(initialData.ticker);
      setQuantity(initialData.quantity.toString());
      setPrice(initialData.buyPrice.toString());
      setDate(initialData.buyDate || new Date().toISOString().split('T')[0]);
      setNotes(initialData.notes || '');
    } else {
      setTicker('');
      setQuantity('');
      setPrice('');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (!initialData && debouncedTicker.length > 2) {
      setLoading(true);
      searchTicker(debouncedTicker)
        .then(data => {
            setSuggestions(data);
            setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setSuggestions([]);
    }
  }, [debouncedTicker, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !quantity) return;
    
    let finalPrice = Number(price);

    if (!price) {
        setIsFetchingPrice(true);
        try {
            const quotes = await getQuotes([ticker]);
            if (quotes && quotes.length > 0 && quotes[0].price) {
                finalPrice = quotes[0].price;
            } else {
                // Fallback or error if price not found and field was empty
                console.error("LTP not found for", ticker);
                setIsFetchingPrice(false);
                return;
            }
        } catch (err) {
            console.error("Failed to fetch LTP:", err);
            setIsFetchingPrice(false);
            return;
        }
        setIsFetchingPrice(false);
    }
    
    onSave({
      ticker: ticker.toUpperCase(),
      quantity: Number(quantity),
      buyPrice: finalPrice,
      buyDate: date,
      notes
    });
    
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-card/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div>
                    <h2 className="text-lg font-bold tracking-tight text-white">{initialData ? 'Edit Position' : 'New Position'}</h2>
                    <p className="text-xs text-muted-foreground">Enter details to track performance</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-muted-foreground hover:text-white transition-colors">
                    <X className="h-5 w-5" />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Ticker Input */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">Asset Symbol</label>
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-ios-blue transition-colors">
                        <SearchIcon className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={ticker}
                      onChange={e => setTicker(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-ios-blue/50 focus:border-ios-blue/50 transition-all text-white placeholder:text-muted-foreground/40 font-mono"
                      placeholder="e.g. RELIANCE.NS"
                      required
                      disabled={!!initialData}
                    />
                    {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-ios-blue" />}
                </div>
                
                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <motion.ul 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-50 w-full bg-slate-900 border border-white/10 rounded-xl mt-2 shadow-xl max-h-48 overflow-y-auto custom-scrollbar"
                  >
                    {suggestions.map((s: any) => (
                      <li
                        key={s.symbol}
                        onClick={() => {
                            setTicker(s.symbol);
                            setSuggestions([]);
                        }}
                        className="px-4 py-3 hover:bg-ios-blue/20 cursor-pointer text-sm border-b border-white/5 last:border-0 flex items-center justify-between group"
                      >
                        <span className="font-bold font-mono text-white group-hover:text-ios-blue transition-colors">{s.symbol}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[150px]">{s.name}</span>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">Quantity</label>
                  <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-ios-blue transition-colors">
                          <List className="h-4 w-4" />
                      </div>
                      <input
                        type="number"
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-ios-blue/50 focus:border-ios-blue/50 transition-all text-white font-mono"
                        required
                      />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">Avg. Price</label>
                  <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-ios-blue transition-colors">
                          <DollarSign className="h-4 w-4" />
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-ios-blue/50 focus:border-ios-blue/50 transition-all text-white font-mono"
                        placeholder="Leave empty for LTP"
                      />
                  </div>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">Date Acquired</label>
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-ios-blue transition-colors">
                        <Calendar className="h-4 w-4" />
                    </div>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-ios-blue/50 focus:border-ios-blue/50 transition-all text-white font-mono"
                    />
                </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1">Investment Thesis</label>
                 <div className="relative group">
                    <div className="absolute left-3 top-4 text-muted-foreground group-focus-within:text-ios-blue transition-colors">
                        <FileText className="h-4 w-4" />
                    </div>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl h-24 focus:outline-none focus:ring-2 focus:ring-ios-blue/50 focus:border-ios-blue/50 transition-all text-white resize-none"
                        placeholder="Why did you buy this?"
                    />
                 </div>
              </div>
              
              <button
                type="submit"
                disabled={isFetchingPrice}
                className="w-full bg-ios-blue text-white py-4 rounded-xl font-bold hover:bg-ios-blue/90 disabled:opacity-50 transition-all shadow-lg shadow-ios-blue/20 flex items-center justify-center gap-2 mt-2 group"
              >
                {isFetchingPrice ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <>
                        {initialData ? 'Update Position' : 'Add to Portfolio'}
                        <Check className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Icon helper since I missed importing Search
function SearchIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    )
}
