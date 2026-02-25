import { PortfolioSummary, Stock } from '../../types';
import { Quote } from '../../services/api';
import { DashboardOverview } from '../DashboardOverview';
import { AllocationPie } from '../AllocationPie';
import { ReturnBarChart } from '../ReturnBarChart';
import { MarketCapChart } from '../AnalyticsCharts';
import { PerformanceChart } from '../PerformanceChart';
import { useAnalytics } from '../../hooks/useAnalytics';
import { motion } from 'framer-motion';

interface PortfolioOverviewProps {
  summary: PortfolioSummary;
  portfolio: Stock[];
  prices: Record<string, Quote>;
}

export function PortfolioOverview({ summary, portfolio, prices }: PortfolioOverviewProps) {
  const { analytics } = useAnalytics(portfolio);

  return (
    <div className="flex-1 overflow-y-auto p-8 relative custom-scrollbar">
       <div className="max-w-[1600px] mx-auto space-y-8">
           
           <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-4">
               <div>
                   <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Command Center</h1>
                   <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">Global_Market_Status: ONLINE</p>
               </div>
               <div className="text-right">
                   <p className="text-sm text-muted-foreground mb-1">Total Net Worth</p>
                   <p className="text-3xl font-bold font-mono text-white tabular-nums">
                       {summary.currentValue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                   </p>
               </div>
           </div>

           <DashboardOverview summary={summary} />

           {/* Hero Chart Section */}
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="w-full"
           >
               <PerformanceChart data={[]} />
           </motion.div>

           <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
               {/* Main Charts */}
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.2 }}
               >
                   <ReturnBarChart portfolio={portfolio} prices={prices} />
               </motion.div>
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.3 }}
               >
                   <AllocationPie portfolio={portfolio} prices={prices} />
               </motion.div>
           </div>
           
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                   <MarketCapChart portfolio={portfolio} prices={prices} analytics={analytics} />
                </motion.div>
           </div>
       </div>
    </div>
  );
}
