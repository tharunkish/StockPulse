import { motion } from 'framer-motion';

interface SentimentMeterProps {
  score: number; // -1 to 1
  label: string;
}

export function SentimentMeter({ score, label }: SentimentMeterProps) {
  // Map -1..1 to 0..100
  const percentage = ((score + 1) / 2) * 100;
  
  const getColor = () => {
    if (score > 0.15) return '#10b981'; // Bullish - Emerald
    if (score > 0.05) return '#22c55e'; // Slightly Bullish - Light Green
    if (score < -0.15) return '#f43f5e'; // Bearish - Rose
    if (score < -0.05) return '#f87171'; // Slightly Bearish - Light Rose
    return '#94a3b8'; // Neutral - Slate
  };

  const color = getColor();

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-end">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Market Sentiment</span>
          <span className="text-sm font-bold" style={{ color }}>{label.toUpperCase()}</span>
      </div>
      
      <div className="h-4 bg-white/5 rounded-full border border-white/5 relative overflow-hidden shadow-inner">
          {/* Center Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20 z-10" />
          
          {/* Progress Bar */}
          <motion.div 
            initial={{ width: '50%' }}
            animate={{ width: `${percentage}%` }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="h-full relative z-0"
            style={{ 
                background: `linear-gradient(90deg, transparent 0%, ${color} 100%)`,
                boxShadow: `0 0 15px ${color}44`
            }}
          />
      </div>
      
      <div className="flex justify-between text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">
          <span>BEARISH</span>
          <span>NEUTRAL</span>
          <span>BULLISH</span>
      </div>
    </div>
  );
}
