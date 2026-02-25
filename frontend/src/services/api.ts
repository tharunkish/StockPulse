import axios from 'axios';
import { 
  TechnicalAnalysisResponse, 
  SupportResistanceResponse, 
  PivotPoints,
  PortfolioRiskAnalysis,
  CorrelationMatrixResponse,
  PositionSizeCalculation
} from '../types';

const API_URL = 'http://localhost:8000';

export interface MarketStatus {
  isOpen: boolean;
  message: string;
}

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  percentChange: number;
  currency: string;
  dayHigh?: number;
  dayLow?: number;
  yearHigh?: number;
  yearLow?: number;
  marketCap?: number;
}

export interface IndexData {
    symbol: string;
    name: string;
    price: number;
    change: number;
    percentChange: number;
}

export const getMarketStatus = async (): Promise<MarketStatus> => {
  const response = await axios.get(`${API_URL}/market-status`);
  return response.data;
};

export const getIndices = async (): Promise<IndexData[]> => {
    const response = await axios.get(`${API_URL}/indices`);
    return response.data;
}

export const getQuotes = async (tickers: string[]): Promise<Quote[]> => {
  if (tickers.length === 0) return [];
  const response = await axios.post(`${API_URL}/batch-quotes`, tickers);
  return response.data;
};

export const getBatchAnalytics = async (tickers: string[]): Promise<any[]> => {
  if (tickers.length === 0) return [];
  const response = await axios.post(`${API_URL}/batch-analytics`, tickers);
  return response.data;
};

export const searchTicker = async (query: string) => {
  const response = await axios.get(`${API_URL}/search/${query}`);
  return response.data;
};

export const getHistory = async (ticker: string, timeframe: string = '1M') => {
    const response = await axios.get(`${API_URL}/history/${ticker}?timeframe=${timeframe}`);
    return response.data;
}

export const getAnalysis = async (ticker: string) => {
    const response = await axios.get(`${API_URL}/analysis/${ticker}`);
    return response.data;
}

export const getNews = async (ticker: string) => {
    const response = await axios.get(`${API_URL}/news/${ticker}`);
    return response.data;
}

export const getPortfolioNews = async (tickers: string[]) => {
    const response = await axios.post(`${API_URL}/portfolio-news`, tickers);
    return response.data;
}

// Advanced Technical Analysis API endpoints
export const getAdvancedTechnicals = async (ticker: string, indicators: string = "macd,bollinger,rsi,stoch"): Promise<TechnicalAnalysisResponse> => {
    const response = await axios.get(`${API_URL}/technical/${ticker}?indicators=${indicators}`);
    return response.data;
}

export const getSupportResistance = async (ticker: string): Promise<SupportResistanceResponse> => {
    const response = await axios.get(`${API_URL}/support-resistance/${ticker}`);
    return response.data;
}

export const getPivotPoints = async (ticker: string, method: string = "classic"): Promise<PivotPoints> => {
    const response = await axios.get(`${API_URL}/pivot-points/${ticker}?method=${method}`);
    return response.data;
}

// Risk Management API endpoints
export const getPortfolioRiskAnalysis = async (tickers: string[]): Promise<PortfolioRiskAnalysis> => {
    const response = await axios.post(`${API_URL}/risk-analysis`, tickers);
    return response.data;
}

export const getCorrelationMatrix = async (tickers: string[]): Promise<CorrelationMatrixResponse> => {
    const tickerString = tickers.join(',');
    const response = await axios.get(`${API_URL}/correlation-matrix?tickers=${tickerString}`);
    return response.data;
}

export const getPositionSizeCalculation = async (
    ticker: string, 
    accountSize: number = 100000,
    riskPerTrade: number = 2.0,
    stopLossPct: number = 5.0
): Promise<PositionSizeCalculation> => {
    const params = new URLSearchParams({
        account_size: accountSize.toString(),
        risk_per_trade: riskPerTrade.toString(),
        stop_loss_pct: stopLossPct.toString()
    });
    const response = await axios.get(`${API_URL}/position-size/${ticker}?${params}`);
    return response.data;
}
