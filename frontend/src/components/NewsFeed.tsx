import { NewsArticle } from '../types';
import { ExternalLink, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface NewsFeedProps {
  news: NewsArticle[];
  title?: string;
  loading?: boolean;
}

export function NewsFeed({ news, title = "Market Pulse", loading = false }: NewsFeedProps) {
  if (loading) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold tracking-widest uppercase text-muted-foreground mb-4">{title}</h3>
            {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
            ))}
        </div>
    );
  }

  if (news.length === 0) {
    return (
        <div className="p-8 text-center glass-card rounded-[24px] border border-white/5">
            <p className="text-muted-foreground text-sm">No recent news found for your assets.</p>
        </div>
    );
  }

  return (
    <div className="space-y-4 flex flex-col h-full">
      <h3 className="text-sm font-bold tracking-widest uppercase text-muted-foreground mb-2">{title}</h3>
      
      <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
        {news.map((article, idx) => (
          <motion.a
            key={idx}
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="block p-4 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/20 transition-all group relative overflow-hidden"
          >
            <div className="flex justify-between items-start gap-4 mb-2">
                <span className="text-[10px] font-bold text-ios-blue uppercase tracking-widest bg-ios-blue/10 px-2 py-0.5 rounded-md border border-ios-blue/20">
                    {article.publisher}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                    <Clock className="h-3 w-3" />
                    {article.published.split(' ').slice(0, 4).join(' ')}
                </span>
            </div>
            
            <h4 className="text-sm font-bold text-white leading-snug group-hover:text-ios-blue transition-colors line-clamp-2 mb-2">
                {article.title}
            </h4>
            
            {article.ticker && (
                <span className="text-[9px] font-bold text-white/40 border border-white/10 px-1.5 py-0.5 rounded">
                    {article.ticker.replace('.NS', '')}
                </span>
            )}
            
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="h-3 w-3 text-white/40" />
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
