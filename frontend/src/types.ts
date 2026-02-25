export interface Stock {
  ticker: string;
  quantity: number;
  buyPrice: number;
  buyDate: string; // ISO string
  notes?: string;
}

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalPL: number;
  totalPLPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

export interface StockAnalytics {
  symbol: string;
  sector: string;
  industry: string;
  beta: number;
  marketCap: number;
  longName: string;
}

export interface DetailedAnalysis {
  symbol: string;
  companyName: string;
  fundamentals: {
    peRatio: number;
    dividendYield: number;
    roe: number;
    debtToEquity: number;
    pbRatio: number;
    eps: number;
  };
  technicals: {
    rsi: number;
    sma50: number;
    sma200: number;
    priceVsSMA50: number;
    priceVsSMA200: number;
    high52: number;
    low52: number;
  };
}

// Advanced Technical Indicators
export interface MACD {
  macd: number;
  signal: number;
  histogram: number;
  trend: "bullish" | "bearish";
}

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
  position: "above_upper" | "below_lower" | "within_bands";
  bandwidth: number;
  percent_position: number;
}

export interface StochasticOscillator {
  k: number;
  d: number;
  signal: "overbought" | "oversold" | "bullish_crossover" | "bearish_crossover";
}

export interface WilliamsR {
  value: number;
  signal: "overbought" | "oversold" | "neutral";
}

export interface ADX {
  adx: number;
  di_plus: number;
  di_minus: number;
  trend_strength: "strong" | "moderate" | "weak";
  trend_direction: "uptrend" | "downtrend";
}

export interface ATR {
  value: number;
  percent: number;
  volatility: "high" | "moderate" | "low";
}

export interface SupportResistanceLevel {
  level: number;
  touches: number;
  strength: "strong" | "moderate";
}

export interface SupportResistance {
  resistance: SupportResistanceLevel[];
  support: SupportResistanceLevel[];
  current_position: {
    price: number;
    nearest_resistance: number | null;
    nearest_support: number | null;
  };
}

export interface FibonacciLevels {
  levels: {
    high: number;
    low: number;
    "0%": number;
    "23.6%": number;
    "38.2%": number;
    "50%": number;
    "61.8%": number;
    "78.6%": number;
    "100%": number;
  };
  current_price: number;
  closest_level: string | null;
  retracement_from_high: number;
  extension_from_low: number;
}

export interface PivotPoints {
  method: "classic" | "woodie" | "camarilla";
  pivot: number;
  resistance: {
    r1: number;
    r2: number;
    r3: number;
    r4?: number;
  };
  support: {
    s1: number;
    s2: number;
    s3: number;
    s4?: number;
  };
  current_price: number;
  position: "above_pivot" | "below_pivot";
}

export interface AdvancedTechnicalIndicators {
  macd?: MACD;
  bollinger?: BollingerBands;
  stochastic?: StochasticOscillator;
  williams_r?: WilliamsR;
  adx?: ADX;
  atr?: ATR;
  rsi?: { value: number };
}

export interface TechnicalAnalysisResponse {
  symbol: string;
  indicators: AdvancedTechnicalIndicators;
}

export interface SupportResistanceResponse {
  symbol: string;
  support_resistance: SupportResistance;
  fibonacci: FibonacciLevels;
}

// Risk Management Interfaces
export interface RiskMetrics {
  var_95: number;
  var_99: number;
  max_drawdown: number;
  volatility: number;
  beta: number;
  sharpe_ratio: number;
  data_points: number;
  error?: string;
}

export interface PortfolioRiskAnalysis {
  individual_assets: Record<string, RiskMetrics>;
  portfolio_metrics: {
    var_95: number;
    var_99: number;
    correlation_matrix: Record<string, Record<string, number>>;
  } | null;
}

export interface CorrelationMatrixResponse {
  tickers: string[];
  correlation_matrix: Record<string, Record<string, number>>;
}

export interface PositionSizeMethod {
  position_size: number;
  description: string;
}

export interface FixedRiskMethod extends PositionSizeMethod {
  risk_amount: number;
  stop_loss: number;
}

export interface KellyCriterionMethod extends PositionSizeMethod {
  kelly_fraction: number;
}

export interface VolatilityAdjustedMethod extends PositionSizeMethod {
  volatility: number;
}

export interface PositionSizeCalculation {
  ticker: string;
  current_price: number;
  account_size: number;
  atr: number;
  methods: {
    fixed_risk: FixedRiskMethod;
    kelly_criterion: KellyCriterionMethod;
    volatility_adjusted: VolatilityAdjustedMethod;
  };
  recommended: {
    shares: number;
    value: number;
    risk_percentage: number;
  };
}

export interface NewsArticle {
    title: string;
    publisher: string;
    link: string;
    published: string;
    summary?: string;
    ticker?: string;
}

export interface Sentiment {
    score: number;
    label: 'Bullish' | 'Bearish' | 'Neutral';
    detail: string;
}
