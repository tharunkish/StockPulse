import { useState } from 'react';
import { LayoutDashboard, Wallet, PieChart, Settings, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { sidebarBehavior } = useSettings();
  const isExpanded = sidebarBehavior === 'expanded';
  const [isHovered, setIsHovered] = useState(false);
  const shouldExpand = isExpanded || isHovered;

  const links = [
    { name: 'Overview', icon: LayoutDashboard, id: 'home' },
    { name: 'Portfolio', icon: Wallet, id: 'portfolio' },
    { name: 'Analytics', icon: PieChart, id: 'analytics' },
    { name: 'Settings', icon: Settings, id: 'settings' },
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: shouldExpand ? 260 : 80 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-[#0A0A0A]/90 backdrop-blur-3xl border-r border-white/10 shadow-[10px_0_40px_rgba(0,0,0,0.5)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header / Logo */}
      <div className="h-24 flex items-center justify-center relative px-3">
        {/* Collapsed: Show Logo Icon */}
        <AnimatePresence>
          {!shouldExpand && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="h-12 w-12 rounded-2xl bg-gradient-to-br from-ios-blue to-ios-indigo flex items-center justify-center shadow-[0_0_20px_rgba(0,122,255,0.4)] text-white shrink-0"
            >
              <TrendingUp className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Expanded: Show Text Only */}
        <AnimatePresence>
          {shouldExpand && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.1 }}
              className="absolute overflow-hidden whitespace-nowrap"
            >
              <h1 className="text-2xl font-black tracking-tighter text-white font-sf">StockPulse</h1>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] opacity-50">PRO TERMINAL</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-8 flex flex-col gap-2 px-2">
        {links.map((link) => {
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              className={`relative flex items-center w-full h-14 rounded-xl border border-transparent transition-all duration-200 group ${
                isActive 
                  ? 'bg-ios-blue text-white shadow-lg shadow-ios-blue/40 border-ios-blue/50' 
                  : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white hover:border-white/20'
              } ${shouldExpand ? 'px-4 justify-start' : 'justify-center px-0'}`}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-full" />
              )}
              
              {/* Icon Container - Always centered */}
              <div className="flex items-center justify-center w-8 h-8 shrink-0">
                <link.icon className="w-6 h-6" strokeWidth={2} />
              </div>
              
              {/* Text label - only when expanded */}
              {shouldExpand && (
                <span className="ml-3 font-bold text-sm tracking-wide whitespace-nowrap">
                  {link.name}
                </span>
              )}
              
              {/* Tooltip for collapsed */}
              {!shouldExpand && !isActive && (
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-black/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-white/10 shadow-xl">
                  {link.name}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom decoration */}
      <div className="p-4">
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
      </div>
    </motion.aside>
  );
}
