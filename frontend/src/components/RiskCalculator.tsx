import { useState, useEffect } from 'react';
import { getPositionSizeCalculation, getPortfolioRiskAnalysis } from '../services/api';
import { PositionSizeCalculation, PortfolioRiskAnalysis } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  Shield, 
  Target,
  Activity
} from 'lucide-react';

interface RiskCalculatorProps {
  ticker?: string;
  portfolioTickers?: string[];
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  prefix?: string;
  status?: 'good' | 'bad' | 'neutral';
  icon?: React.ComponentType<any>;
  description?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  prefix,
  status = 'neutral', 
  icon: Icon, 
  description 
}) => {
  const colorClass = status === 'good' 
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
    : status === 'bad' 
    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
    : 'bg-slate-800/50 text-slate-300 border-white/5';

  return (
    <div className={`p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 ${colorClass}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</h4>
          {subtitle && <p className="text-xs text-muted-foreground/70 mt-1">{subtitle}</p>}
        </div>
        {Icon && <Icon className="h-5 w-5 opacity-70" />}
      </div>
      
      <div className="text-2xl font-bold font-mono text-white">
        {prefix && <span className="text-lg opacity-70">{prefix}</span>}
        {typeof value === 'number' ? value.toFixed(2) : value}
      </div>
      
      {description && (
        <p className="text-xs text-muted-foreground mt-2 opacity-80">{description}</p>
      )}
    </div>
  );
};

export const RiskCalculator: React.FC<RiskCalculatorProps> = ({ 
  ticker = '', 
  portfolioTickers = [] 
}) => {
  // Position Sizing State
  const [positionData, setPositionData] = useState<PositionSizeCalculation | null>(null);
  const [positionLoading, setPositionLoading] = useState(false);
  const [positionError, setPositionError] = useState<string | null>(null);
  
  // Position Sizing Inputs
  const [accountSize, setAccountSize] = useState(100000);
  const [riskPerTrade, setRiskPerTrade] = useState(2.0);
  const [stopLossPct, setStopLossPct] = useState(5.0);
  const [selectedTicker, setSelectedTicker] = useState(ticker);

  // Portfolio Risk State
  const [portfolioRisk, setPortfolioRisk] = useState<PortfolioRiskAnalysis | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  // Fetch position size calculation
  useEffect(() => {
    if (selectedTicker) {
      fetchPositionSize();
    }
  }, [selectedTicker, accountSize, riskPerTrade, stopLossPct]);

  // Fetch portfolio risk analysis
  useEffect(() => {
    if (portfolioTickers.length > 0) {
      fetchPortfolioRisk();
    }
  }, [portfolioTickers]);

  const fetchPositionSize = async () => {
    setPositionLoading(true);
    setPositionError(null);
    
    try {
      const data = await getPositionSizeCalculation(
        selectedTicker, 
        accountSize, 
        riskPerTrade, 
        stopLossPct
      );
      setPositionData(data);
    } catch (err) {
      setPositionError('Failed to calculate position size');
      console.error('Error calculating position size:', err);
    } finally {
      setPositionLoading(false);
    }
  };

  const fetchPortfolioRisk = async () => {
    setPortfolioLoading(true);
    setPortfolioError(null);
    
    try {
      const data = await getPortfolioRiskAnalysis(portfolioTickers);
      setPortfolioRisk(data);
    } catch (err) {
      setPortfolioError('Failed to analyze portfolio risk');
      console.error('Error analyzing portfolio risk:', err);
    } finally {
      setPortfolioLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Position Sizing Calculator */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <Calculator className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Position Sizing Calculator</h2>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Account Size (₹)
            </label>
            <input
              type="number"
              value={accountSize}
              onChange={(e) => setAccountSize(Number(e.target.value))}
              className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-ios-blue/50 font-mono"
              placeholder="100000"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Risk per Trade (%)
            </label>
            <input
              type="number"
              value={riskPerTrade}
              onChange={(e) => setRiskPerTrade(Number(e.target.value))}
              step="0.1"
              min="0.1"
              max="10"
              className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-ios-blue/50 font-mono"
              placeholder="2.0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Stop Loss (%)
            </label>
            <input
              type="number"
              value={stopLossPct}
              onChange={(e) => setStopLossPct(Number(e.target.value))}
              step="0.1"
              min="0.1"
              max="50"
              className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-ios-blue/50 font-mono"
              placeholder="5.0"
            />
          </div>
        </div>

        {/* Ticker Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Stock Ticker
          </label>
          <input
            type="text"
            value={selectedTicker}
            onChange={(e) => setSelectedTicker(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-ios-blue/50 font-mono"
            placeholder="RELIANCE.NS"
          />
        </div>

        {positionLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="h-8 w-8 animate-spin text-ios-blue" />
              <span className="text-muted-foreground font-medium animate-pulse uppercase tracking-widest text-[10px]">
                Calculating Position Size...
              </span>
            </div>
          </div>
        )}

        {positionError && (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
              <p className="text-rose-400 font-medium">{positionError}</p>
              <button 
                onClick={fetchPositionSize}
                className="mt-4 px-4 py-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <AnimatePresence>
          {positionData && !positionLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Current Price */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{positionData.ticker}</h3>
                    <p className="text-sm text-muted-foreground">Current Market Price</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold font-mono text-white">
                      ₹{positionData.current_price.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ATR: ₹{positionData.atr.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Position Sizing Methods */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <MetricCard
                  title="Fixed Risk"
                  value={positionData.methods.fixed_risk.position_size}
                  subtitle="shares"
                  icon={Shield}
                  description={positionData.methods.fixed_risk.description}
                />
                
                <MetricCard
                  title="Kelly Criterion"
                  value={positionData.methods.kelly_criterion.position_size}
                  subtitle="shares"
                  icon={TrendingUp}
                  description={positionData.methods.kelly_criterion.description}
                />
                
                <MetricCard
                  title="Volatility Adjusted"
                  value={positionData.methods.volatility_adjusted.position_size}
                  subtitle="shares"
                  icon={Activity}
                  description={positionData.methods.volatility_adjusted.description}
                />
              </div>

              {/* Recommended Position */}
              <div className="bg-gradient-to-r from-ios-blue/20 to-purple-500/20 rounded-2xl p-6 border border-ios-blue/30">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="h-6 w-6 text-ios-blue" />
                  <h3 className="text-xl font-bold text-white">Recommended Position</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Shares</p>
                    <p className="text-2xl font-bold font-mono text-white">
                      {positionData.recommended.shares.toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Position Value</p>
                    <p className="text-2xl font-bold font-mono text-white">
                      ₹{positionData.recommended.value.toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Risk Amount</p>
                    <p className="text-2xl font-bold font-mono text-rose-400">
                      ₹{(accountSize * riskPerTrade / 100).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Portfolio Risk Analysis */}
      {portfolioTickers.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.2)]">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Portfolio Risk Analysis</h2>
          </div>

          {portfolioLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="flex flex-col items-center gap-4">
                <RefreshCw className="h-8 w-8 animate-spin text-ios-blue" />
                <span className="text-muted-foreground font-medium animate-pulse uppercase tracking-widest text-[10px]">
                  Analyzing Portfolio Risk...
                </span>
              </div>
            </div>
          )}

          {portfolioError && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
                <p className="text-rose-400 font-medium">{portfolioError}</p>
                <button 
                  onClick={fetchPortfolioRisk}
                  className="mt-4 px-4 py-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          <AnimatePresence>
            {portfolioRisk && !portfolioLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Individual Asset Risk */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Individual Asset Risk</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(portfolioRisk.individual_assets).map(([ticker, metrics]) => (
                      'error' in metrics ? (
                        <div key={ticker} className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                          <p className="text-rose-400 font-medium">{ticker}: {metrics.error}</p>
                        </div>
                      ) : (
                        <div key={ticker} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                          <h4 className="font-semibold text-white mb-3">{ticker}</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">VaR (95%):</span>
                              <span className="font-mono text-rose-400">₹{metrics.var_95.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Max Drawdown:</span>
                              <span className="font-mono text-rose-400">{(metrics.max_drawdown * 100).toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Volatility:</span>
                              <span className="font-mono text-yellow-400">{(metrics.volatility * 100).toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Sharpe Ratio:</span>
                              <span className="font-mono text-emerald-400">{metrics.sharpe_ratio.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                {/* Portfolio Level Metrics */}
                {portfolioRisk.portfolio_metrics && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Portfolio Level Risk</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <MetricCard
                        title="Portfolio VaR (95%)"
                        value={portfolioRisk.portfolio_metrics.var_95}
                        prefix="₹"
                        status="bad"
                        icon={AlertTriangle}
                        description="Maximum expected loss over 1 day with 95% confidence"
                      />
                      
                      <MetricCard
                        title="Portfolio VaR (99%)"
                        value={portfolioRisk.portfolio_metrics.var_99}
                        prefix="₹"
                        status="bad"
                        icon={AlertTriangle}
                        description="Maximum expected loss over 1 day with 99% confidence"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}
    </div>
  );
};
