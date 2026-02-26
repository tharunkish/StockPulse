import { useState, useEffect } from 'react';
import { PortfolioSummary, Stock, NewsArticle } from '../../types';
import { Quote, getPortfolioNews } from '../../services/api';
import { DashboardOverview } from '../DashboardOverview';
import { AllocationPie } from '../AllocationPie';
import { ReturnBarChart } from '../ReturnBarChart';
import { PerformanceInsights } from '../PerformanceInsights';
import { NewsFeed } from '../NewsFeed';
import { PortfolioSparkline } from '../PortfolioSparkline';
import { motion } from 'framer-motion';
import { Activity, Sparkles, TrendingUp } from 'lucide-react';

interface HomeViewProps {
  summary: PortfolioSummary;
  portfolio: Stock[];
  prices: Record<string, Quote>;
  onSelectStock: (ticker: string) => void;
}

export function HomeView({ summary, portfolio, prices, onSelectStock }: HomeViewProps) {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);

  useEffect(() => {
    if (portfolio.length > 0) {
        setLoadingNews(true);
        const tickers = portfolio.map(s => s.ticker);
        getPortfolioNews(tickers)
            .then(res => {
                setNews(res.news);
                setLoadingNews(false);
            })
            .catch(err => {
                console.error("Home news error:", err);
                setLoadingNews(false);
            });
    }
  }, [portfolio]);

  return (
    <div className="flex-1 overflow-y-auto p-8 relative custom-scrollbar pb-24">
       <div className="max-w-[1600px] mx-auto space-y-12">
           
           <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4 border-b border-white/5 pb-8 relative">
               <div className="absolute -left-20 -top-20 w-64 h-64 bg-ios-blue/10 rounded-full blur-[100px] pointer-events-none" />
               
               <div>
                   <div className="flex items-center gap-2 mb-2">
                       <Sparkles className="h-4 w-4 text-ios-blue animate-pulse" />
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-ios-blue">Live Analysis Engine</span>
                   </div>
                   <h1 className="text-6xl font-black tracking-tighter text-white font-sf bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">Overview</h1>
                   <p className="text-muted-foreground font-medium mt-2 max-w-md">Your real-time financial heartbeat, powered by Midnight Quant intelligence.</p>
               </div>

               <PortfolioSparkline 
                 data={[]} // Will generate mock data for now
                 currentValue={summary.currentValue}
               />
           </div>

           <DashboardOverview summary={summary} />

           <PerformanceInsights portfolio={portfolio} prices={prices} />

           <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
               {/* Allocation & Performance */}
               <div className="xl:col-span-2 space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <motion.div 
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: 0.2 }}
                         className="shadow-2xl rounded-[40px] overflow-hidden border border-white/5 bg-[#0A0A0A]/80 backdrop-blur-2xl hover:border-ios-blue/30 transition-all duration-500 group"
                       >
                           <AllocationPie portfolio={portfolio} prices={prices} onSelect={onSelectStock} />
                       </motion.div>
                       <motion.div 
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: 0.3 }}
                         className="shadow-2xl rounded-[40px] overflow-hidden border border-white/5 bg-[#0A0A0A]/80 backdrop-blur-2xl hover:border-ios-blue/30 transition-all duration-500 group"
                       >
                           <ReturnBarChart portfolio={portfolio} prices={prices} onSelect={onSelectStock} />
                       </motion.div>
                   </div>
                   
                   <div className="p-10 rounded-[40px] border border-white/5 bg-gradient-to-br from-ios-blue/5 to-transparent relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-96 h-96 bg-ios-blue/5 rounded-full blur-[100px] -z-10" />
                       <div className="flex flex-col md:flex-row items-center gap-8">
                           <div className="h-20 w-20 rounded-3xl bg-ios-blue/10 border border-ios-blue/20 flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                               <TrendingUp className="h-10 w-10 text-ios-blue" />
                           </div>
                           <div className="flex-1">
                               <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Market Momentum</h3>
                               <p className="text-muted-foreground leading-relaxed">Your portfolio is currently showing <span className="text-emerald-400 font-bold">Strong Accumulation</span> signals in the IT sector. Consider rebalancing if concentration exceeds 25%.</p>
                           </div>
                           <button className="px-8 py-3 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-ios-blue hover:text-white transition-all shadow-xl active:scale-95">View Strategy</button>
                       </div>
                   </div>
               </div>

               {/* Market Pulse Feed */}
               <div className="xl:col-span-1 h-full">
                   <div className="sticky top-8 h-[calc(100vh-10rem)]">
                        <NewsFeed news={news} loading={loadingNews} title="Portfolio Pulse" />
                   </div>
               </div>
           </div>
           
           {/* Empty State */}
           {portfolio.length === 0 && (
               <div className="text-center py-32 border-2 border-dashed border-white/5 rounded-[50px] bg-white/[0.01] backdrop-blur-md relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-b from-ios-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   <div className="h-24 w-24 rounded-[30px] bg-white/5 flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-2xl">
                       <Activity className="h-12 w-12 text-ios-blue" />
                   </div>
                   <h3 className="text-3xl font-black text-white mb-3 tracking-tight">Awaiting Assets</h3>
                   <p className="text-muted-foreground max-w-sm mx-auto font-medium">Initialize your Pro terminal by adding assets in the Portfolio tab to unlock real-time intelligence.</p>
               </div>
           )}
       </div>
    </div>
  );
}
