import { Stock } from '../../types';
import { Quote } from '../../services/api';
import { PortfolioTable } from '../PortfolioTable';
import { CSVExport, CSVImport } from '../CSVTools';
import { PlusCircle, ListFilter } from 'lucide-react';
import { motion } from 'framer-motion';

interface PortfolioViewProps {
  portfolio: Stock[];
  prices: Record<string, Quote>;
  onEdit: (stock: Stock) => void;
  onDelete: (ticker: string) => void;
  onAddStock: () => void;
  onImport: (stocks: Stock[]) => void;
  onSelectStock: (ticker: string) => void;
}

export function PortfolioView({ portfolio, prices, onEdit, onDelete, onAddStock, onImport, onSelectStock }: PortfolioViewProps) {
  return (
    <div className="flex-1 overflow-y-auto p-8 relative custom-scrollbar">
       <div className="max-w-[1600px] mx-auto space-y-8">
           
           <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-8 relative">
               <div className="absolute -left-20 -top-20 w-64 h-64 bg-ios-blue/10 rounded-full blur-[100px] pointer-events-none" />
               <div>
                   <h1 className="text-6xl font-black tracking-tighter text-white mb-2 font-sf bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">Inventory</h1>
                   <p className="text-muted-foreground font-medium mt-2 max-w-md">{portfolio.length} Assets currently under management.</p>
               </div>
               
               <div className="flex gap-4 items-center">
                   <div className="flex gap-2">
                       <CSVImport onImport={onImport} />
                       <CSVExport portfolio={portfolio} />
                   </div>
                   
                   <button 
                        onClick={onAddStock}
                        className="h-12 px-6 rounded-2xl bg-ios-blue hover:bg-ios-blue/90 text-white font-bold transition-all shadow-lg shadow-ios-blue/25 flex items-center gap-2 hover:scale-105 active:scale-95 border border-white/10"
                    >
                        <PlusCircle className="h-5 w-5" /> 
                        <span>Add Position</span>
                    </button>
               </div>
           </div>

           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="shadow-2xl rounded-[32px] overflow-hidden border border-white/5 bg-[#0A0A0A]"
           >
               {/* Filters Bar (Visual Only for now) */}
               <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md">
                   <div className="flex gap-2">
                       <button className="px-4 py-1.5 rounded-xl bg-white/10 text-white text-xs font-bold border border-white/10 hover:bg-white/20 transition-colors">All</button>
                       <button className="px-4 py-1.5 rounded-xl text-muted-foreground hover:text-white text-xs font-bold hover:bg-white/5 transition-colors">Stocks</button>
                       <button className="px-4 py-1.5 rounded-xl text-muted-foreground hover:text-white text-xs font-bold hover:bg-white/5 transition-colors">ETFs</button>
                   </div>
                   <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                       <ListFilter className="h-4 w-4" />
                       <span>Sort By: Value</span>
                   </div>
               </div>

               <PortfolioTable 
                   portfolio={portfolio} 
                   prices={prices} 
                   onEdit={onEdit} 
                   onDelete={onDelete} 
                   onSelect={onSelectStock}
               />
           </motion.div>
       </div>
    </div>
  );
}
