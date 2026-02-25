import { useState, useEffect, useMemo } from 'react';
import { getCorrelationMatrix } from '../services/api';
import { CorrelationMatrixResponse } from '../types';
import { motion } from 'framer-motion';
import { 
  Grid3X3, 
  RefreshCw, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Activity
} from 'lucide-react';

interface CorrelationMatrixProps {
  tickers: string[];
}

interface CorrelationCellProps {
  value: number;
  isDiagonal?: boolean;
}

const CorrelationCell: React.FC<CorrelationCellProps> = ({ value, isDiagonal = false }) => {
  const getColor = (correlation: number) => {
    if (isDiagonal) return 'bg-slate-700 text-slate-300';
    
    const abs = Math.abs(correlation);
    if (abs >= 0.8) return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    if (abs >= 0.6) return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    if (abs >= 0.4) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    if (abs >= 0.2) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  };

  const getTrendIcon = (correlation: number) => {
    if (isDiagonal) return null;
    if (correlation > 0.5) return <TrendingUp className="h-3 w-3" />;
    if (correlation < -0.5) return <TrendingDown className="h-3 w-3" />;
    return null;
  };

  return (
    <div 
      className={`aspect-square flex items-center justify-center text-xs font-mono font-medium border rounded-lg transition-all hover:scale-105 ${getColor(value)}`}
      title={`Correlation: ${value.toFixed(3)}`}
    >
      <div className="flex items-center gap-1">
        {getTrendIcon(value)}
        <span>{isDiagonal ? '1.00' : value.toFixed(2)}</span>
      </div>
    </div>
  );
};

export const CorrelationMatrix: React.FC<CorrelationMatrixProps> = ({ tickers }) => {
  const [data, setData] = useState<CorrelationMatrixResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tickers.length >= 2) {
      fetchCorrelationData();
    }
  }, [tickers]);

  const fetchCorrelationData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getCorrelationMatrix(tickers);
      setData(response);
    } catch (err) {
      setError('Failed to fetch correlation matrix');
      console.error('Error fetching correlation matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  const insights = useMemo(() => {
    if (!data) return [];

    const correlations: Array<{ticker1: string, ticker2: string, correlation: number}> = [];
    
    // Extract all non-diagonal correlations
    for (let i = 0; i < data.tickers.length; i++) {
      for (let j = i + 1; j < data.tickers.length; j++) {
        const ticker1 = data.tickers[i];
        const ticker2 = data.tickers[j];
        const correlation = data.correlation_matrix[ticker1][ticker2];
        
        correlations.push({ ticker1, ticker2, correlation });
      }
    }

    // Sort by absolute correlation value
    correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

    // Generate insights
    const insights = [];
    
    // Highest positive correlation
    const highestPositive = correlations.find(c => c.correlation > 0.5);
    if (highestPositive) {
      insights.push({
        type: 'high_positive',
        text: `${highestPositive.ticker1} and ${highestPositive.ticker2} show strong positive correlation (${highestPositive.correlation.toFixed(2)})`,
        level: 'warning'
      });
    }

    // Highest negative correlation
    const highestNegative = correlations.find(c => c.correlation < -0.5);
    if (highestNegative) {
      insights.push({
        type: 'high_negative',
        text: `${highestNegative.ticker1} and ${highestNegative.ticker2} show strong negative correlation (${highestNegative.correlation.toFixed(2)})`,
        level: 'info'
      });
    }

    // Low correlations (good for diversification)
    const lowCorrelations = correlations.filter(c => Math.abs(c.correlation) < 0.2);
    if (lowCorrelations.length > 0) {
      insights.push({
        type: 'diversification',
        text: `${lowCorrelations.length} pairs show low correlation, good for diversification`,
        level: 'success'
      });
    }

    return insights;
  }, [data]);

  if (tickers.length < 2) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <Grid3X3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>At least 2 stocks required for correlation analysis</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-ios-blue" />
          <span className="text-muted-foreground font-medium animate-pulse uppercase tracking-widest text-[10px]">
            Calculating Correlations...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
          <p className="text-rose-400 font-medium">{error}</p>
          <button 
            onClick={fetchCorrelationData}
            className="mt-4 px-4 py-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No correlation data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Correlation Matrix</h3>
          <p className="text-sm text-muted-foreground">Risk diversification analysis</p>
        </div>
        <button
          onClick={fetchCorrelationData}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Key Insights</h4>
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <motion.div
                key={insight.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg border ${
                  insight.level === 'warning' 
                    ? 'bg-orange-500/10 text-orange-300 border-orange-500/20'
                    : insight.level === 'success'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                }`}
              >
                <p className="text-sm">{insight.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Correlation Matrix */}
      <div className="bg-card rounded-2xl border border-border p-6 overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Header row */}
          <div className="grid grid-cols-5 gap-2 mb-2">
            <div className="text-xs text-muted-foreground font-medium">Assets</div>
            {data.tickers.map((ticker) => (
              <div 
                key={ticker} 
                className="text-xs text-muted-foreground font-medium text-center"
              >
                {ticker.replace('.NS', '').replace('.BO', '')}
              </div>
            ))}
          </div>

          {/* Matrix rows */}
          {data.tickers.map((rowTicker, rowIndex) => (
            <div key={rowTicker} className="grid grid-cols-5 gap-2 mb-2">
              <div className="text-xs text-muted-foreground font-medium flex items-center">
                {rowTicker.replace('.NS', '').replace('.BO', '')}
              </div>
              {data.tickers.map((colTicker, colIndex) => (
                <CorrelationCell
                  key={`${rowTicker}-${colTicker}`}
                  value={data.correlation_matrix[rowTicker][colTicker]}
                  isDiagonal={rowIndex === colIndex}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h4 className="text-sm font-semibold text-white mb-3">Correlation Strength</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-rose-500/20 border border-rose-500/30 rounded" />
            <span className="text-muted-foreground">Strong (±0.8+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500/20 border border-orange-500/30 rounded" />
            <span className="text-muted-foreground">High (±0.6)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500/20 border border-yellow-500/30 rounded" />
            <span className="text-muted-foreground">Moderate (±0.4)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500/20 border border-blue-500/30 rounded" />
            <span className="text-muted-foreground">Low (±0.2)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-500/20 border border-emerald-500/30 rounded" />
            <span className="text-muted-foreground">Very Low (±0.1)</span>
          </div>
        </div>
      </div>

      {/* Diversification Score */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-2xl p-6 border border-emerald-500/20">
        <h4 className="text-lg font-semibold text-white mb-4">Diversification Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Average Correlation</p>
            <p className="text-2xl font-bold font-mono text-white">
              {(() => {
                let sum = 0;
                let count = 0;
                for (let i = 0; i < data.tickers.length; i++) {
                  for (let j = i + 1; j < data.tickers.length; j++) {
                    sum += Math.abs(data.correlation_matrix[data.tickers[i]][data.tickers[j]]);
                    count++;
                  }
                }
                return count > 0 ? (sum / count).toFixed(3) : '0.00';
              })()}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-1">Diversification Score</p>
            <p className="text-2xl font-bold font-mono text-emerald-400">
              {(() => {
                let sum = 0;
                let count = 0;
                for (let i = 0; i < data.tickers.length; i++) {
                  for (let j = i + 1; j < data.tickers.length; j++) {
                    sum += Math.abs(data.correlation_matrix[data.tickers[i]][data.tickers[j]]);
                    count++;
                  }
                }
                const avgCorrelation = count > 0 ? sum / count : 0;
                const score = Math.max(0, Math.min(100, (1 - avgCorrelation) * 100));
                return score.toFixed(0);
              })()}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-1">Risk Level</p>
            <p className="text-2xl font-bold">
              {(() => {
                let sum = 0;
                let count = 0;
                for (let i = 0; i < data.tickers.length; i++) {
                  for (let j = i + 1; j < data.tickers.length; j++) {
                    sum += Math.abs(data.correlation_matrix[data.tickers[i]][data.tickers[j]]);
                    count++;
                  }
                }
                const avgCorrelation = count > 0 ? sum / count : 0;
                
                if (avgCorrelation > 0.7) return <span className="text-rose-400">High</span>;
                if (avgCorrelation > 0.4) return <span className="text-yellow-400">Medium</span>;
                return <span className="text-emerald-400">Low</span>;
              })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
