# StockPulse Technical Specification

## Project Map

```
Stock Dashboa4rd/
├── backend/
│   ├── main.py                    # FastAPI server with all endpoints
│   ├── requirements.txt           # Python dependencies
│   └── __pycache__/              # Python cache
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── views/            # Main view components
│   │   │   │   ├── HomeView.tsx
│   │   │   │   ├── PortfolioView.tsx
│   │   │   │   ├── AnalyticsView.tsx
│   │   │   │   ├── SettingsView.tsx
│   │   │   │   ├── StockDetail.tsx
│   │   │   │   └── PortfolioOverview.tsx
│   │   │   ├── AddStockModal.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── StockHistoryChart.tsx
│   │   │   ├── NewsFeed.tsx
│   │   │   ├── SentimentMeter.tsx
│   │   │   ├── AnalyticsCharts.tsx
│   │   │   ├── PortfolioTable.tsx
│   │   │   └── [other UI components]
│   │   ├── hooks/
│   │   │   ├── useDashboardData.ts
│   │   │   ├── usePortfolio.ts
│   │   │   ├── useAnalytics.ts
│   │   │   └── useDebounce.ts
│   │   ├── services/
│   │   │   └── api.ts            # API client
│   │   ├── context/
│   │   │   └── SettingsContext.tsx
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── types.ts              # TypeScript interfaces
│   │   ├── App.tsx               # Main app component
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── README.md
├── AGENTS.md
├── gps.md
└── spec.md
```

## GPS Routing: Feature File Mapping

### Stock Data & Quotes
- **Backend**: `backend/main.py` - Lines 169-241
  - `/quote/{ticker}` - Single stock quote
  - `/batch-quotes` - Multiple stock quotes
  - `/indices` - Nifty 50 & Sensex data
- **Frontend**: `frontend/src/services/api.ts` - Lines 41-45
- **UI Components**: `frontend/src/hooks/useDashboardData.ts`

### Stock Charts & History
- **Backend**: `backend/main.py` - Lines 372-415
  - `/history/{ticker}` - Historical price data
- **Frontend**: `frontend/src/services/api.ts` - Lines 58-61
- **UI Components**: `frontend/src/components/StockHistoryChart.tsx`

### Analytics & Technical Analysis
- **Backend**: `backend/main.py` - Lines 316-1505
  - `/analysis/{ticker}` - Fundamental & technical metrics
  - `/batch-analytics` - Multiple stock analytics
  - `/technical/{ticker}` - Advanced technical indicators (MACD, Bollinger, Stochastic, Williams %R, ADX, ATR)
  - `/support-resistance/{ticker}` - Support/resistance levels & Fibonacci retracements
  - `/pivot-points/{ticker}` - Pivot points (Classic, Woodie, Camarilla)
  - `/risk-analysis` - Portfolio risk analysis (VaR, drawdown, correlation)
  - `/correlation-matrix` - Asset correlation matrix
  - `/position-size/{ticker}` - Position sizing calculators (Kelly, volatility-adjusted)
  - `/valuation-models/{ticker}` - DCF, Graham Number, Peter Lynch valuations
  - `/advanced-fundamentals/{ticker}` - Comprehensive fundamental metrics
- **Frontend**: `frontend/src/services/api.ts` - Lines 80-127
- **UI Components**: 
  - `frontend/src/components/views/AnalyticsView.tsx` - Enhanced with tabbed interface
  - `frontend/src/components/AdvancedChart.tsx` - Professional charts with technical overlays
  - `frontend/src/components/TechnicalIndicators.tsx` - Advanced indicators dashboard
  - `frontend/src/components/RiskCalculator.tsx` - Position sizing & risk management
  - `frontend/src/components/CorrelationMatrix.tsx` - Risk correlation visualization
  - `frontend/src/components/AnalyticsCharts.tsx` - Existing portfolio analytics charts

### Portfolio Management
- **Frontend**: `frontend/src/hooks/usePortfolio.ts`
- **UI Components**: 
  - `frontend/src/components/views/PortfolioView.tsx`
  - `frontend/src/components/AddStockModal.tsx`
  - `frontend/src/components/PortfolioTable.tsx`

### News & Sentiment Analysis
- **Backend**: `backend/main.py` - Lines 73-133 (functions exist but no endpoints)
- **Frontend**: `frontend/src/services/api.ts` - Lines 68-76
- **UI Components**: 
  - `frontend/src/components/NewsFeed.tsx` - News display component
  - `frontend/src/components/SentimentMeter.tsx` - Sentiment visualization

### Risk Management & Portfolio Analysis
- **Backend**: `backend/main.py` - Lines 843-1121, 1122-1215
  - `/risk-analysis` - Portfolio risk analysis (VaR, drawdown, correlation)
  - `/correlation-matrix` - Asset correlation matrix
  - `/position-size/{ticker}` - Position sizing calculators (Kelly, volatility-adjusted)
- **Frontend**: `frontend/src/services/api.ts` - Lines 102-127
- **UI Components**: 
  - `frontend/src/components/RiskCalculator.tsx` - Position sizing & risk management
  - `frontend/src/components/CorrelationMatrix.tsx` - Risk correlation visualization

### Advanced Valuation & Fundamental Analysis
- **Backend**: `backend/main.py` - Lines 1216-1505
  - `/valuation-models/{ticker}` - DCF, Graham Number, Peter Lynch valuations
  - `/advanced-fundamentals/{ticker}` - Comprehensive fundamental metrics
- **Frontend**: `frontend/src/services/api.ts` - Lines 102-127
- **UI Components**: `frontend/src/components/views/AnalyticsView.tsx` - Enhanced with tabbed interface

### Enhanced Analytics Features
- **Advanced Technical Indicators**: MACD, Bollinger Bands, Stochastic, Williams %R, ADX, ATR
- **Professional Charting**: Multi-timeframe charts with support/resistance overlays
- **Risk Analytics**: VaR calculations, correlation matrices, portfolio risk metrics
- **Valuation Models**: DCF, Graham Number, Peter Lynch Fair Value
- **Quality Scoring**: Automated fundamental quality assessment
- **Position Sizing**: Kelly Criterion, volatility-adjusted, fixed risk methods
- **Diversification Analysis**: Portfolio correlation heatmaps and insights

### Search Functionality
- **Backend**: `backend/main.py` - Lines 269-314
  - `/search/{query}` - Ticker search
- **Frontend**: `frontend/src/services/api.ts` - Lines 53-56

### Market Status
- **Backend**: `backend/main.py` - Lines 35-67
  - `/market-status` - Market hours status
- **Frontend**: `frontend/src/services/api.ts` - Lines 31-34

## The Bridge: API Integration

### Backend API Routes (FastAPI)
```
GET  /                    # Health check
GET  /market-status       # Market hours status
GET  /indices            # Nifty 50 & Sensex
GET  /quote/{ticker}     # Single stock quote
POST /batch-quotes       # Multiple stock quotes
POST /batch-analytics    # Multiple stock analytics
GET  /search/{query}     # Search tickers
GET  /analysis/{ticker}  # Detailed analysis
GET  /history/{ticker}   # Historical data
```

### Frontend API Client (`frontend/src/services/api.ts`)
```typescript
// Core data fetching
getMarketStatus() → GET /market-status
getIndices() → GET /indices
getQuotes(tickers) → POST /batch-quotes
getBatchAnalytics(tickers) → POST /batch-analytics

// Stock detail operations
searchTicker(query) → GET /search/{query}
getHistory(ticker, timeframe) → GET /history/{ticker}
getAnalysis(ticker) → GET /analysis/{ticker}

// Missing endpoints (referenced but not implemented)
getNews(ticker) → GET /news/{ticker} [MISSING]
getPortfolioNews(tickers) → POST /portfolio-news [MISSING]
```

### Data Flow Architecture
1. **Real-time Updates**: `useDashboardData` hook polls `/batch-quotes` every 15-60s
2. **Portfolio State**: Managed locally in browser via `usePortfolio` hook
3. **Analytics**: Fetched on-demand via `/batch-analytics` for performance
4. **Charts**: Historical data fetched via `/history/{ticker}` with timeframe support

## Roadmap Gaps: Incomplete Features

### Critical Missing Backend Endpoints
1. **News API Endpoints** (Referenced in frontend but not implemented):
   - `GET /news/{ticker}` - Individual stock news
   - `POST /portfolio-news` - Portfolio-wide news aggregation

### Incomplete News/Sentiment Implementation
- **Backend**: News fetching functions exist (`fetch_google_news`, `analyze_sentiment`) but no API endpoints
- **Frontend**: News components exist but will fail due to missing endpoints
- **Impact**: NewsFeed and SentimentMeter components are non-functional

### Potential Enhancements Needed
1. **Error Handling**: Limited error recovery in API calls
2. **Caching Strategy**: Backend has TTL caches but frontend could benefit from smarter caching
3. **Data Validation**: No input validation on API endpoints
4. **Rate Limiting**: No protection against excessive API calls
5. **Authentication**: No user authentication system (privacy-first design)

### Architecture Strengths
- Clean separation between frontend/backend
- Comprehensive caching strategy in backend
- Modern React hooks-based state management
- TypeScript for type safety
- Responsive design with Tailwind CSS

### Technical Debt
- Hardcoded API URL in frontend (`http://localhost:8080`)
- Missing environment configuration
- No unit tests
- No deployment configuration

---

**Status**: Ready for review. The core functionality is complete with a solid foundation, but news features need backend endpoint implementation to be fully functional.
