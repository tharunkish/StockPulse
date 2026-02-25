import { useState, useEffect } from 'react';
import { 
  AdvancedTechnicalIndicators, 
  MACD, 
  BollingerBands, 
  StochasticOscillator, 
  WilliamsR, 
  ADX, 
  ATR 
} from '../types';
import { getAdvancedTechnicals } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Activity, 
  BarChart3, 
  Zap, 
  Target, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface TechnicalIndicatorsProps {
  ticker: string;
  indicators?: string[];
}

interface IndicatorCardProps {
  title: string;
  value: number | string;
  status: 'good' | 'bad' | 'neutral';
  icon: React.ComponentType<any>;
  description?: string;
  onClick?: () => void;
}

const IndicatorCard: React.FC<IndicatorCardProps> = ({ 
  title, 
  value, 
  status, 
  icon: Icon, 
  description, 
  onClick 
}) => {
  const colorClass = status === 'good' 
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
    : status === 'bad' 
    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
    : 'bg-slate-800/50 text-slate-300 border-white/5';

  return (
    <motion.div 
      whileHover={{ y: -2, scale: 1.02 }}
      onClick={onClick}
      className={`relative p-4 rounded-2xl border backdrop-blur-md cursor-pointer transition-all duration-300 ${colorClass}`}
    >
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-2">
          <Icon className="h-4 w-4" /> {title}
        </span>
        <div className={`h-2 w-2 rounded-full ${
          status === 'good' ? 'bg-emerald-400' : 
          status === 'bad' ? 'bg-rose-400' : 'bg-slate-500'
        }`} />
      </div>
      
      <div className="text-2xl font-bold font-mono tracking-tighter tabular-nums text-white">
        {typeof value === 'number' ? value.toFixed(2) : value}
      </div>
      
      {description && (
        <div className="mt-2 text-xs text-muted-foreground opacity-80">
          {description}
        </div>
      )}
    </motion.div>
  );
};

export const TechnicalIndicators: React.FC<TechnicalIndicatorsProps> = ({ 
  ticker, 
  indicators = ["macd", "bollinger", "rsi", "stoch", "williams", "adx", "atr"] 
}) => {
  const [data, setData] = useState<AdvancedTechnicalIndicators | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndicator, setExpandedIndicator] = useState<string | null>(null);

  useEffect(() => {
    if (ticker) {
      fetchIndicators();
    }
  }, [ticker, indicators]);

  const fetchIndicators = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdvancedTechnicals(ticker, indicators.join(','));
      setData(response.indicators);
    } catch (err) {
      setError('Failed to fetch technical indicators');
      console.error('Error fetching technical indicators:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMACDStatus = (macd: MACD): 'good' | 'bad' | 'neutral' => {
    return macd.trend === 'bullish' ? 'good' : 'bad';
  };

  const getBollingerStatus = (bollinger: BollingerBands): 'good' | 'bad' | 'neutral' => {
    if (bollinger.position === 'below_lower') return 'good'; // Oversold
    if (bollinger.position === 'above_upper') return 'bad'; // Overbought
    return 'neutral';
  };

  const getStochasticStatus = (stoch: StochasticOscillator): 'good' | 'bad' | 'neutral' => {
    if (stoch.signal === 'oversold') return 'good';
    if (stoch.signal === 'overbought') return 'bad';
    return 'neutral';
  };

  const getWilliamsRStatus = (williams: WilliamsR): 'good' | 'bad' | 'neutral' => {
    if (williams.signal === 'oversold') return 'good';
    if (williams.signal === 'overbought') return 'bad';
    return 'neutral';
  };

  const getADXStatus = (adx: ADX): 'good' | 'bad' | 'neutral' => {
    if (adx.trend_strength === 'strong') return adx.trend_direction === 'uptrend' ? 'good' : 'bad';
    return 'neutral';
  };

  const getATRStatus = (atr: ATR): 'good' | 'bad' | 'neutral' => {
    return atr.volatility === 'high' ? 'bad' : atr.volatility === 'low' ? 'good' : 'neutral';
  };

  const getRSIStatus = (rsi: number): 'good' | 'bad' | 'neutral' => {
    if (rsi < 30) return 'good'; // Oversold
    if (rsi > 70) return 'bad'; // Overbought
    return 'neutral';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-ios-blue" />
          <span className="text-muted-foreground font-medium animate-pulse uppercase tracking-widest text-[10px]">
            Loading Technical Indicators...
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
            onClick={fetchIndicators}
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
          <p>No technical data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Technical Indicators</h3>
          <p className="text-sm text-muted-foreground">Advanced technical analysis signals</p>
        </div>
        <button 
          onClick={fetchIndicators}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all"
          title="Refresh Indicators"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* MACD */}
        {data.macd && (
          <IndicatorCard
            title="MACD"
            value={data.macd.histogram.toFixed(3)}
            status={getMACDStatus(data.macd)}
            icon={TrendingUp}
            description={`Trend: ${data.macd.trend}`}
            onClick={() => setExpandedIndicator(expandedIndicator === 'macd' ? null : 'macd')}
          />
        )}

        {/* Bollinger Bands */}
        {data.bollinger && (
          <IndicatorCard
            title="Bollinger Bands"
            value={`${data.bollinger.percent_position.toFixed(1)}%`}
            status={getBollingerStatus(data.bollinger)}
            icon={BarChart3}
            description={`Position: ${data.bollinger.position.replace('_', ' ')}`}
            onClick={() => setExpandedIndicator(expandedIndicator === 'bollinger' ? null : 'bollinger')}
          />
        )}

        {/* RSI */}
        {data.rsi && (
          <IndicatorCard
            title="RSI (14)"
            value={data.rsi.value}
            status={getRSIStatus(data.rsi.value)}
            icon={Activity}
            description={data.rsi.value < 30 ? 'Oversold' : data.rsi.value > 70 ? 'Overbought' : 'Neutral'}
            onClick={() => setExpandedIndicator(expandedIndicator === 'rsi' ? null : 'rsi')}
          />
        )}

        {/* Stochastic */}
        {data.stochastic && (
          <IndicatorCard
            title="Stochastic"
            value={`${data.stochastic.k.toFixed(1)}/${data.stochastic.d.toFixed(1)}`}
            status={getStochasticStatus(data.stochastic)}
            icon={Zap}
            description={`Signal: ${data.stochastic.signal.replace('_', ' ')}`}
            onClick={() => setExpandedIndicator(expandedIndicator === 'stochastic' ? null : 'stochastic')}
          />
        )}

        {/* Williams %R */}
        {data.williams_r && (
          <IndicatorCard
            title="Williams %R"
            value={data.williams_r.value.toFixed(1)}
            status={getWilliamsRStatus(data.williams_r)}
            icon={Target}
            description={`Signal: ${data.williams_r.signal}`}
            onClick={() => setExpandedIndicator(expandedIndicator === 'williams_r' ? null : 'williams_r')}
          />
        )}

        {/* ADX */}
        {data.adx && (
          <IndicatorCard
            title="ADX"
            value={data.adx.adx.toFixed(1)}
            status={getADXStatus(data.adx)}
            icon={TrendingUp}
            description={`${data.adx.trend_strength} ${data.adx.trend_direction}`}
            onClick={() => setExpandedIndicator(expandedIndicator === 'adx' ? null : 'adx')}
          />
        )}

        {/* ATR */}
        {data.atr && (
          <IndicatorCard
            title="ATR"
            value={`${data.atr.percent.toFixed(2)}%`}
            status={getATRStatus(data.atr)}
            icon={Activity}
            description={`${data.atr.volatility} volatility`}
            onClick={() => setExpandedIndicator(expandedIndicator === 'atr' ? null : 'atr')}
          />
        )}
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expandedIndicator && data[expandedIndicator as keyof AdvancedTechnicalIndicators] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-6 bg-white/5 rounded-2xl border border-white/10"
          >
            {expandedIndicator === 'macd' && data.macd && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" /> MACD Details
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">MACD Line:</span>
                    <span className="ml-2 font-mono text-white">{data.macd.macd.toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Signal Line:</span>
                    <span className="ml-2 font-mono text-white">{data.macd.signal.toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Histogram:</span>
                    <span className="ml-2 font-mono text-white">{data.macd.histogram.toFixed(4)}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  MACD shows the relationship between two moving averages of prices. 
                  {data.macd.trend === 'bullish' ? ' Bullish crossover detected.' : ' Bearish crossover detected.'}
                </p>
              </div>
            )}

            {expandedIndicator === 'bollinger' && data.bollinger && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" /> Bollinger Bands Details
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Upper Band:</span>
                    <span className="ml-2 font-mono text-white">₹{data.bollinger.upper.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Middle (SMA):</span>
                    <span className="ml-2 font-mono text-white">₹{data.bollinger.middle.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lower Band:</span>
                    <span className="ml-2 font-mono text-white">₹{data.bollinger.lower.toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Bandwidth (Volatility):</span>
                  <span className="ml-2 font-mono text-white">{data.bollinger.bandwidth.toFixed(2)}%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Bollinger Bands measure volatility and provide relative highs and lows. 
                  Price is currently {data.bollinger.position.replace('_', ' ')} the bands.
                </p>
              </div>
            )}

            {expandedIndicator === 'rsi' && data.rsi && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Activity className="h-5 w-5" /> RSI Details
                </h4>
                <div className="text-sm">
                  <span className="text-muted-foreground">Current RSI:</span>
                  <span className="ml-2 font-mono text-white">{data.rsi.value.toFixed(2)}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      data.rsi.value > 70 ? 'bg-rose-500' : 
                      data.rsi.value < 30 ? 'bg-emerald-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(Math.max(data.rsi.value, 0), 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  RSI measures the speed and magnitude of recent price changes. 
                  Values above 70 suggest overbought conditions, below 30 suggest oversold conditions.
                </p>
              </div>
            )}

            {expandedIndicator === 'stochastic' && data.stochastic && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Zap className="h-5 w-5" /> Stochastic Oscillator Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">%K:</span>
                    <span className="ml-2 font-mono text-white">{data.stochastic.k.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">%D:</span>
                    <span className="ml-2 font-mono text-white">{data.stochastic.d.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Stochastic oscillator compares a closing price to a range of prices over time. 
                  Current signal: {data.stochastic.signal.replace('_', ' ')}.
                </p>
              </div>
            )}

            {expandedIndicator === 'williams_r' && data.williams_r && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Target className="h-5 w-5" /> Williams %R Details
                </h4>
                <div className="text-sm">
                  <span className="text-muted-foreground">Williams %R:</span>
                  <span className="ml-2 font-mono text-white">{data.williams_r.value.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Williams %R is a momentum indicator that measures overbought and oversold levels. 
                  Readings between -20 and 0 are overbought, -80 to -100 are oversold.
                </p>
              </div>
            )}

            {expandedIndicator === 'adx' && data.adx && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" /> ADX Details
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">ADX:</span>
                    <span className="ml-2 font-mono text-white">{data.adx.adx.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">DI+:</span>
                    <span className="ml-2 font-mono text-white">{data.adx.di_plus.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">DI-:</span>
                    <span className="ml-2 font-mono text-white">{data.adx.di_minus.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  ADX measures trend strength. Values above 25 indicate a strong trend. 
                  Current trend: {data.adx.trend_strength} {data.adx.trend_direction}.
                </p>
              </div>
            )}

            {expandedIndicator === 'atr' && data.atr && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Activity className="h-5 w-5" /> ATR Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">ATR Value:</span>
                    <span className="ml-2 font-mono text-white">₹{data.atr.value.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ATR %:</span>
                    <span className="ml-2 font-mono text-white">{data.atr.percent.toFixed(2)}%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  ATR measures market volatility. 
                  Current volatility level: {data.atr.volatility}.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
