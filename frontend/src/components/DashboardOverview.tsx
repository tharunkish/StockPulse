import { TrendingUp, TrendingDown, Wallet, Activity, Briefcase } from 'lucide-react';
import { PortfolioSummary } from '../types';
import { formatINR } from '../lib/utils';
import { motion } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

interface DashboardOverviewProps {
  summary: PortfolioSummary;
}

const Sparkline = ({ isPositive }: { isPositive: boolean }) => (
  <svg className="w-24 h-12 stroke-white/20 fill-none" viewBox="0 0 100 50" preserveAspectRatio="none">
    <path 
      d={isPositive 
        ? "M0 45 C20 45, 30 20, 50 25 C70 30, 80 5, 100 10" 
        : "M0 10 C20 10, 30 35, 50 30 C70 25, 80 45, 100 40"} 
      vectorEffect="non-scaling-stroke" 
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const StatCard = ({ title, value, change, icon: Icon, isCurrency = false, delay = 0, variant = "blue" }: any) => {
  const isPositive = change >= 0;
  const { isPrivacyMode } = useSettings();

  const variantStyles: any = {
      blue: "from-blue-500/10 to-blue-900/10 border-blue-500/20 shadow-blue-500/5",
      green: "from-emerald-500/10 to-emerald-900/10 border-emerald-500/20 shadow-emerald-500/5",
      red: "from-rose-500/10 to-rose-900/10 border-rose-500/20 shadow-rose-500/5",
      indigo: "from-indigo-500/10 to-indigo-900/10 border-indigo-500/20 shadow-indigo-500/5",
  };

  const glowStyles: any = {
      blue: "bg-blue-500",
      green: "bg-emerald-500",
      red: "bg-rose-500",
      indigo: "bg-indigo-500",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-[32px] p-6 bg-gradient-to-br ${variantStyles[variant]} backdrop-blur-xl border shadow-2xl group`}
    >
      {/* Dynamic Background Glow */}
      <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity ${glowStyles[variant]}`} />

      {/* Top Row: Title + Icon */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl bg-white/5 border border-white/10 text-white shadow-inner`}>
                <Icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/60">{title}</span>
        </div>
        
        {change !== 0 && (
             <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black font-mono border ${isPositive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {Math.abs(change).toFixed(2)}%
            </div>
        )}
      </div>

      {/* Middle Row: Big Number */}
      <div className="relative z-10 flex items-end justify-between">
        <div className="text-3xl font-black tracking-tighter tabular-nums text-white drop-shadow-lg">
            {isPrivacyMode ? '••••••' : (isCurrency ? formatINR(Number(value)) : value)}
        </div>
        
        <div className="absolute right-0 bottom-1 opacity-40 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-110">
            <Sparkline isPositive={isPositive} />
        </div>
      </div>
      
      {/* Bottom: Status */}
      <div className={`mt-3 text-[9px] font-black uppercase tracking-[0.2em] ${isPositive ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
          {isPositive ? 'Market Momentum High' : 'Market Pressure detected'}
      </div>
    </motion.div>
  );
};

export function DashboardOverview({ summary }: DashboardOverviewProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
      <StatCard
        title="Total Balance"
        value={summary.currentValue}
        change={summary.dayChangePercent}
        icon={Wallet}
        isCurrency
        delay={1}
        variant="indigo"
      />
      <StatCard
        title="Net Profit"
        value={summary.totalPL}
        change={summary.totalPLPercent}
        icon={Activity}
        isCurrency
        delay={2}
        variant={summary.totalPL >= 0 ? "green" : "red"}
      />
      <StatCard
        title="Day's Gain"
        value={summary.dayChange}
        change={summary.dayChangePercent}
        icon={TrendingUp}
        isCurrency
        delay={3}
        variant={summary.dayChange >= 0 ? "green" : "red"}
      />
       <StatCard
        title="Total Invested"
        value={summary.totalInvested}
        change={0}
        icon={Briefcase}
        isCurrency
        delay={4}
        variant="blue"
      />
    </div>
  );
}
