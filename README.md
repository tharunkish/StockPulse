# StockPulse India Dashboard 🇮🇳

A modern, local-first stock dashboard for tracking Indian (NSE/BSE) portfolios with real-time analytics and advanced technical indicators.

## ✨ Features

### 📊 **Portfolio Management**
- **Real-time Data**: Live stock prices via Yahoo Finance API
- **Portfolio Tracking**: Add/edit/remove positions with automatic P&L calculation
- **Import/Export**: CSV import/export for portfolio data
- **Multiple Assets**: Support for stocks, ETFs, and mutual funds

### 📈 **Advanced Analytics**
- **Technical Indicators**: MACD, RSI, Bollinger Bands, Stochastic, Williams %R, ADX, ATR
- **Charting**: Interactive charts with support/resistance levels and pivot points
- **Fundamental Analysis**: P/E ratio, dividend yield, ROE, P/B ratio, EPS
- **Risk Metrics**: Beta, volatility analysis, correlation matrix
- **Valuation Models**: DCF, Graham Number, Peter Lynch fair value

### 🎯 **Market Intelligence**
- **News Sentiment**: Real-time news with VADER sentiment analysis
- **Market Status**: NSE trading hours detection
- **Sector Analysis**: Industry-wise performance and allocation
- **Peer Comparison**: Stock performance vs sector peers

### 🎨 **User Experience**
- **Dark Mode**: Professional terminal-style interface
- **Responsive Design**: Mobile-friendly responsive layout
- **Customization**: Multiple accent colors and themes
- **Privacy-First**: All data stored locally in browser

## 🛠 Tech Stack

### **Frontend**
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for utility-first styling
- **Framer Motion** for smooth animations
- **Recharts** for interactive data visualization
- **Lucide React** for modern icons

### **Backend**
- **FastAPI** with Python 3.9+
- **yfinance** for Yahoo Finance data integration
- **pandas** for data manipulation
- **vaderSentiment** for news sentiment analysis
- **feedparser** for RSS news feeds
- **cachetools** for intelligent caching

### **Data Sources**
- **Yahoo Finance API** for real-time stock data
- **Google News RSS** for financial news aggregation
- **NSE/BSE** data with proper ticker formatting (.NS, .BO)

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ and npm
- Python 3.9+ and pip
- Git for version control

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/stockpulse-india-dashboard.git
   cd stockpulse-india-dashboard
   ```

2. **Backend Setup**
   ```bash
   # Create virtual environment
   python -m venv venv
   
   # Activate environment
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   
   # Install dependencies
   pip install -r backend/requirements.txt
   
   # Start backend server
   uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Frontend Setup**
   ```bash
   # Open new terminal
   cd frontend
   
   # Install dependencies
   npm install
   
   # Start development server
   npm run dev
   ```

4. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## 📁 Project Structure

```
Stock Dashboa4rd/
├── backend/                    # FastAPI backend
│   ├── main.py               # Main API server
│   └── requirements.txt       # Python dependencies
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/         # API client
│   │   ├── context/          # React context
│   │   └── types.ts         # TypeScript definitions
│   ├── package.json           # Node.js dependencies
│   └── vite.config.ts        # Vite configuration
├── README.md                 # This file
├── .gitignore               # Git ignore rules
└── gps.md                  # Feature mapping documentation
```

## ⚙️ Configuration

### **Environment Variables**
Create `.env` file in root:
```env
# Backend
API_HOST=0.0.0.0
API_PORT=8000

# Frontend
VITE_API_URL=http://localhost:8000
```

### **Supported Tickers**
- **NSE**: `RELIANCE.NS`, `TCS.NS`, `INFY.NS`
- **BSE**: `RELIANCE.BO`, `TCS.BO`, `INFY.BO`
- **Indices**: `^NSEI` (Nifty 50), `^BSESN` (Sensex)

## 📊 API Endpoints

### **Market Data**
- `GET /market-status` - NSE trading hours
- `GET /indices` - Nifty 50 & Sensex data
- `GET /quote/{ticker}` - Single stock quote
- `POST /batch-quotes` - Multiple stock quotes
- `GET /search/{query}` - Stock search

### **Analytics**
- `GET /analysis/{ticker}` - Fundamental & technical analysis
- `GET /technical/{ticker}` - Advanced technical indicators
- `GET /history/{ticker}` - Historical price data
- `GET /support-resistance/{ticker}` - S&R levels
- `GET /pivot-points/{ticker}` - Pivot points

### **News & Sentiment**
- `GET /news/{ticker}` - Stock-specific news
- `POST /portfolio-news` - Portfolio news aggregation

### **Risk Management**
- `POST /risk-analysis` - Portfolio risk metrics
- `GET /correlation-matrix` - Asset correlation
- `GET /position-size/{ticker}` - Position sizing calculator

## 📋 Features Status

| Feature | Status | Notes |
|----------|----------|---------|
| Portfolio Management | ✅ | Fully functional |
| Real-time Data | ✅ | Working with live updates |
| Technical Indicators | ✅ | All major indicators implemented |
| Interactive Charts | ✅ | Support/resistance, pivot points |
| News & Sentiment | ⚠️ | Backend endpoints need port fix |
| Risk Analytics | ✅ | VaR, correlation, position sizing |
| Settings & Customization | ✅ | Themes, privacy, data export |
| Mobile Responsive | ✅ | Works on all screen sizes |

## 🐛 Known Issues

1. **News API**: Port mismatch between frontend (8000) and backend
2. **Market Status**: May show incorrect status for extended hours
3. **Data Validation**: Limited input validation on API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Yahoo Finance](https://finance.yahoo.com/) for stock data API
- [VADER Sentiment](https://github.com/cjhutto/vaderSentiment) for sentiment analysis
- [Recharts](https://recharts.org/) for charting library
- [Tailwind CSS](https://tailwindcss.com/) for styling framework

---

**Built with ❤️ for Indian investors** 🇮🇳
