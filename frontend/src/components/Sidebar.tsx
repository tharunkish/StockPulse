import { LayoutDashboard, Wallet, PieChart, Settings, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { sidebarBehavior } = useSettings();
  const isExpanded = sidebarBehavior === 'expanded';

  const links = [
    { name: 'Overview', icon: LayoutDashboard, id: 'home' },
    { name: 'Portfolio', icon: Wallet, id: 'portfolio' },
    { name: 'Analytics', icon: PieChart, id: 'analytics' },
    { name: 'Settings', icon: Settings, id: 'settings' },
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isExpanded ? 260 : 80 }}
      className="fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-white/5 backdrop-blur-3xl border-r border-white/10 transition-all duration-300 shadow-[10px_0_40px_rgba(0,0,0,0.4)]"
    >
      {/* Header / Logo */}
      <div className="h-24 flex items-center justify-center relative">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-ios-blue to-ios-indigo flex items-center justify-center shadow-[0_0_20px_rgba(0,122,255,0.4)] text-white">
            <TrendingUp className="h-6 w-6" />
        </div>
        
        <motion.div 
            initial={false}
            animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -20 }}
            className="absolute left-24 ml-2 overflow-hidden whitespace-nowrap"
        >
            <h1 className="text-xl font-black tracking-tighter text-white font-sf">StockPulse</h1>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] opacity-50">PRO TERMINAL</p>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-8 flex flex-col gap-3 px-4">
        {links.map((link) => {
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              className={`relative flex items-center ${isExpanded ? 'justify-start px-5' : 'justify-center'} h-14 rounded-2xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-ios-blue text-white shadow-lg shadow-ios-blue/40' 
                  : 'text-muted-foreground hover:bg-white/10 hover:text-white'
              }`}
            >
              <link.icon className={`h-6 w-6 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'group-hover:scale-110 transition-transform'}`} />
              
              {isExpanded && (
                <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="ml-4 font-bold text-sm tracking-wide"
                >
                    {link.name}
                </motion.span>
              )}
              
              {!isExpanded && (
                 <div className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/10 shadow-2xl">
                     {link.name}
                 </div>
              )}
            </button>
          );
        })}
      </nav>
    </motion.aside>
  );
}
