import { useSettings } from '../../context/SettingsContext';
import { motion } from 'framer-motion';
import { Shield, Palette, CloudRain } from 'lucide-react';

export function SettingsView() {
  const { 
      isPrivacyMode, refreshInterval, accentColor,
      togglePrivacyMode, setRefreshInterval, setAccentColor, clearAllData 
  } = useSettings();

  const sections: any[] = [
    {
      title: 'Appearance',
      icon: Palette,
      items: [
        {
          id: 'privacy',
          name: 'Privacy Mode (Incognito)',
          description: 'Hide absolute ₹ values and show only percentages.',
          value: isPrivacyMode ? 'Active' : 'Disabled',
          type: 'toggle',
          action: togglePrivacyMode
        },
        {
          id: 'accent',
          name: 'Accent Color',
          description: 'Choose the primary theme color for the terminal.',
          value: accentColor.charAt(0).toUpperCase() + accentColor.slice(1),
          type: 'select',
          options: ['blue', 'purple', 'gold', 'mint'],
          action: (val: any) => setAccentColor(val)
        }
      ]
    },
    {
      title: 'System & Data',
      icon: Shield,
      items: [
        {
          id: 'refresh',
          name: 'Auto-Refresh Interval',
          description: 'Set how often market data updates in the background.',
          value: refreshInterval,
          type: 'select',
          options: ['15s', '30s', '1m', 'manual'],
          action: (val: any) => setRefreshInterval(val)
        },
        {
            id: 'export',
            name: 'Master Backup (JSON)',
            description: 'Download your entire app state to move to another device.',
            value: 'Export',
            type: 'button',
            action: () => {
                const data = JSON.stringify(localStorage);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `stockpulse_backup_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
            }
        },
        {
            id: 'wipe',
            name: 'Nuclear Reset',
            description: 'Permanently delete all local data and reset the app.',
            value: 'Wipe All',
            type: 'button',
            isDestructive: true,
            action: clearAllData
        }
      ]
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8 relative custom-scrollbar pb-24">
       <div className="max-w-[900px] mx-auto space-y-12">
           
           <div className="mb-8 border-b border-white/5 pb-6">
               <h1 className="text-4xl font-bold tracking-tight text-white mb-2 font-sf bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">Settings</h1>
               <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest bg-white/5 px-3 py-1 rounded-lg inline-block">Pro Terminal Control Center</p>
           </div>

           <div className="space-y-10">
               {sections.map((section, idx) => (
                   <motion.section 
                    key={section.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="space-y-5"
                   >
                       <div className="flex items-center gap-3 px-2">
                           <section.icon className="h-5 w-5 text-ios-blue" />
                           <h2 className="text-lg font-bold text-white tracking-tight">{section.title}</h2>
                       </div>

                       <div className="bg-[#0A0A0A]/60 backdrop-blur-2xl border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
                           {section.items.map((item: any, i: number) => (
                               <div 
                                key={item.id}
                                className={`flex flex-col md:flex-row md:items-center justify-between p-6 hover:bg-white/[0.02] transition-colors ${i !== section.items.length - 1 ? 'border-b border-white/5' : ''}`}
                               >
                                   <div className="space-y-1 mb-4 md:mb-0">
                                       <p className="font-bold text-white tracking-wide">{item.name}</p>
                                       <p className="text-xs text-muted-foreground max-w-md leading-relaxed">{item.description}</p>
                                   </div>
                                   
                                   <div className="flex items-center gap-3">
                                       {item.type === 'input' && (
                                           <input 
                                                type="text" 
                                                value={item.value} 
                                                onChange={item.onChange}
                                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-ios-blue/50 w-48 font-medium"
                                           />
                                       )}

                                       {item.type === 'toggle' && (
                                           <button 
                                                onClick={item.action}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all border ${item.value === 'Active' ? 'bg-ios-blue text-white border-ios-blue shadow-lg shadow-ios-blue/20' : 'bg-white/5 text-muted-foreground border-white/10'}`}
                                           >
                                               {item.value}
                                           </button>
                                       )}

                                       {item.type === 'select' && (
                                           <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                                               {item.options?.map((opt: string) => (
                                                   <button
                                                        key={opt}
                                                        onClick={() => item.action(opt)}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${item.value.toLowerCase() === opt ? 'bg-white text-black shadow-lg' : 'text-muted-foreground hover:text-white'}`}
                                                   >
                                                       {opt}
                                                   </button>
                                               ))}
                                           </div>
                                       )}

                                       {item.type === 'button' && (
                                           <button 
                                                onClick={item.action}
                                                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all border ${item.isDestructive ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20' : 'bg-white/10 text-white border-white/10 hover:bg-white/20'}`}
                                           >
                                               {item.value}
                                           </button>
                                       )}
                                   </div>
                               </div>
                           ))}
                       </div>
                   </motion.section>
               ))}
           </div>

           <div className="pt-20 pb-10 flex flex-col items-center gap-4 border-t border-white/5">
                <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 text-white/20">
                    <CloudRain className="h-6 w-6" />
                </div>
               <div className="text-center text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black opacity-30">
                   StockPulse India // Alpha_Rel_1.2
               </div>
           </div>
       </div>
    </div>
  );
}
