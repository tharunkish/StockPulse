import { useState, useEffect } from 'react';
import { Stock, StockAnalytics, NewsArticle, Sentiment } from '../../types';
import { Quote, getNews } from '../../services/api';
import { formatINR, formatCompactINR } from '../../lib/utils';
import { Edit2, Trash2, Briefcase, Info, MessageCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { StockHistoryChart } from '../StockHistoryChart';
import { NewsFeed } from '../NewsFeed';
import { SentimentMeter } from '../SentimentMeter';
import { motion } from 'framer-motion';

interface StockDetailProps {
  stock: Stock;
  quote?: Quote;
  analytics?: StockAnalytics;
  onEdit: () => void;
  onDelete: () => void;
}

export function StockDetail({ stock, quote, analytics, onEdit, onDelete }: StockDetailProps) {
  const [newsData, setNewsData] = useState<NewsArticle[]>([]);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [loadingNews, setLoadingNews] = useState(false);
  const { isPrivacyMode } = useSettings();

  useEffect(() => {
    if (stock.ticker) {
        setLoadingNews(true);
        getNews(stock.ticker)
            .then(res => {
                setNewsData(res.news);
                setSentiment(res.sentiment);
                setLoadingNews(false);
            })
            .catch(err => {
                console.error("News error:", err);
                setLoadingNews(false);
            });
    }
  }, [stock.ticker]);

  const currentPrice = quote?.price || stock.buyPrice;
  const currentValue = stock.quantity * currentPrice;
  const invested = stock.quantity * stock.buyPrice;
  const pl = currentValue - invested;
  const plPercent = invested > 0 ? (pl / invested) * 100 : 0;
  const isProfit = pl >= 0;

  const sentimentColor = sentiment?.label === 'Bullish' ? 'text-emerald-400' : sentiment?.label === 'Bearish' ? 'text-rose-400' : 'text-slate-400';
  const sentimentBg = sentiment?.label === 'Bullish' ? 'bg-emerald-500/10 border-emerald-500/20' : sentiment?.label === 'Bearish' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-white/5 border-white/10';
  const SentimentIcon = sentiment?.label === 'Bullish' ? CheckCircle : sentiment?.label === 'Bearish' ? AlertTriangle : Info;

  return (
    <div className="flex-1 overflow-y-auto p-8 relative custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-10 pb-20">
        
        {/* Header: Price & Ticker */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-white flex items-center gap-4 font-sf">
              {stock.ticker.replace('.NS', '').replace('.BO', '')}
              <span className="text-xs font-bold text-muted-foreground px-2 py-1 bg-white/5 rounded-lg border border-white/5 uppercase tracking-widest">NSE India</span>
            </h1>
            <p className="text-xl text-muted-foreground mt-2 font-medium">{analytics?.longName || 'Unknown Company'}</p>
          </div>
          
          <div className="text-right">
             <div className="text-5xl font-mono font-bold text-white tabular-nums tracking-tighter">
                {isPrivacyMode ? '••••••' : formatINR(currentPrice)}
             </div>
             <div className={`flex items-center justify-end gap-2 text-xl font-bold mt-1 ${quote?.change && quote.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPrivacyMode ? '•••' : (quote?.change && quote.change >= 0 ? '+' : '') + (isPrivacyMode ? '' : quote?.change?.toFixed(2))} 
                <span className="opacity-70">({quote?.percentChange?.toFixed(2)}%)</span>
             </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-3 border-b border-white/5 pb-10">
            <button onClick={onEdit} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold flex items-center gap-2 transition-all border border-white/10 shadow-lg active:scale-95">
                <Edit2 className="h-4 w-4" /> Edit Position
            </button>
            <button onClick={onDelete} className="px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold flex items-center gap-2 transition-all border border-rose-500/20 shadow-lg active:scale-95">
                <Trash2 className="h-4 w-4" /> Sell / Remove
            </button>
        </div>

        {/* Emotion Card (iOS Style Option B) */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-8 rounded-[32px] border backdrop-blur-2xl shadow-2xl relative overflow-hidden ${sentimentBg}`}
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-current opacity-[0.03] rounded-full blur-3xl -z-10" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                        <SentimentIcon className={`h-5 w-5 ${sentimentColor}`} />
                        <span className={`text-xs font-black uppercase tracking-[0.2em] ${sentimentColor}`}>Market Emotion: {sentiment?.label || 'Neutral'}</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight leading-tight">
                        {sentiment?.label === 'Bullish' ? 'Optimistic market signals ahead.' : sentiment?.label === 'Bearish' ? 'Headlines suggest market caution.' : 'Mixed market signals observed.'}
                    </h2>
                    <p className="text-muted-foreground font-medium max-w-2xl leading-relaxed">
                        {sentiment?.detail}
                    </p>
                </div>
                <div className="w-full md:w-64">
                    <SentimentMeter score={sentiment?.score || 0} label={sentiment?.label || 'Neutral'} />
                </div>
            </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Col: Charts & Position */}
            <div className="lg:col-span-2 space-y-10">
                {/* My Position Card */}
                <div className="bg-[#0A0A0A] border border-white/5 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-colors">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-ios-blue/5 rounded-full blur-3xl -z-10" />
                    
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-8 flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-ios-blue" /> Your Holdings
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-widest font-black">Quantity</p>
                            <p className="text-3xl font-mono font-bold text-white">{stock.quantity}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-widest font-black">Avg. Price</p>
                            <p className="text-3xl font-mono font-bold text-white">{isPrivacyMode ? '••••' : formatINR(stock.buyPrice)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-widest font-black">Current Value</p>
                            <p className="text-3xl font-mono font-bold text-white">{isPrivacyMode ? '••••' : formatINR(currentValue)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-widest font-black">Total P/L</p>
                            <div className={`text-3xl font-mono font-bold flex items-center gap-2 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isPrivacyMode ? '••••' : formatCompactINR(pl)}
                                <span className="text-[10px] bg-current/10 px-1.5 py-0.5 rounded-lg border border-current/20">
                                    {isProfit ? '+' : ''}{plPercent.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Price Performance Chart */}
                <div className="bg-[#0A0A0A] border border-white/5 rounded-[32px] p-8 flex flex-col relative overflow-hidden h-[450px] shadow-2xl group hover:border-white/10 transition-colors">
                    <StockHistoryChart ticker={stock.ticker} />
                </div>

                {/* Market Stats List */}
                <div className="bg-[#0A0A0A] border border-white/5 rounded-[32px] p-8 shadow-2xl group hover:border-white/10 transition-colors">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-8 flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-ios-blue" /> Terminal Insights
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        <div className="flex justify-between items-center py-4 border-b border-white/5">
                            <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Market Cap</span>
                            <span className="font-mono font-bold text-white text-lg">{formatCompactINR(analytics?.marketCap || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-4 border-b border-white/5">
                            <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Sector</span>
                            <span className="font-bold text-white text-lg">{analytics?.sector || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between items-center py-4 border-b border-white/5">
                            <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Beta</span>
                            <span className="font-mono font-bold text-white text-lg">{analytics?.beta?.toFixed(2) || '1.00'}</span>
                        </div>
                        <div className="flex justify-between items-center py-4 border-b border-white/5">
                            <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">52W Range</span>
                            <div className="text-right">
                                <span className="font-mono font-bold text-white block text-sm">{isPrivacyMode ? '••••' : `${formatINR(quote?.yearLow || 0)} - ${formatINR(quote?.yearHigh || 0)}`}</span>
                            </div>
                        </div>
                        <div className="md:col-span-2 pt-4">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                                <span>Day Low</span>
                                <span>Day High</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full relative overflow-hidden">
                                {quote && quote.dayHigh && quote.dayLow && (
                                    <div 
                                        className="absolute top-0 bottom-0 bg-ios-blue"
                                        style={{ 
                                            left: `${((quote.price - quote.dayLow) / (quote.dayHigh - quote.dayLow)) * 100}%`,
                                            width: '2px'
                                        }}
                                    />
                                )}
                            </div>
                            <div className="flex justify-between font-mono text-[10px] text-white/40 mt-1">
                                <span>{isPrivacyMode ? '••••' : formatINR(quote?.dayLow || 0)}</span>
                                <span>{isPrivacyMode ? '••••' : formatINR(quote?.dayHigh || 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Col: Related News */}
            <div className="lg:col-span-1 h-full">
                <div className="sticky top-24 h-[calc(100vh-12rem)]">
                    <NewsFeed news={newsData} loading={loadingNews} title="Related News" />
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
