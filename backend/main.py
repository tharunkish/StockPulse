from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
from datetime import datetime, time
import pytz
from cachetools import cached, TTLCache
import feedparser
import urllib.parse
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import re
import numpy as np

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Caches
# Market status changes intraday, TTL 1 min
market_status_cache = TTLCache(maxsize=1, ttl=60)
# Quotes change intraday, TTL 30s
quotes_cache = TTLCache(maxsize=500, ttl=30)
# Analysis (fundamentals/technicals) don't change fast, TTL 1 hour
analysis_cache = TTLCache(maxsize=100, ttl=3600)
# History data TTL 5 mins for intraday, maybe longer for 1Y
history_cache = TTLCache(maxsize=500, ttl=300)


@cached(cache=market_status_cache)
def get_market_status():
    """
    Check if NSE is open.
    NSE Market hours: 09:15 to 15:30 IST, Mon-Fri.
    """
    ist = pytz.timezone("Asia/Kolkata")
    now = datetime.now(ist)

    # Check for weekends
    if now.weekday() >= 5:  # 5=Saturday, 6=Sunday
        return {"isOpen": False, "message": "Market Closed (Weekend)"}

    # Market hours
    market_open = time(9, 15)
    market_close = time(15, 30)
    current_time = now.time()

    if market_open <= current_time <= market_close:
        return {"isOpen": True, "message": "Market Open"}
    else:
        return {"isOpen": False, "message": "Market Closed"}


@app.get("/")
def read_root():
    return {"message": "StockPulse API is running"}


@app.get("/market-status")
def market_status():
    return get_market_status()


# News Cache (longer TTL as news doesn't change every second)
news_cache = TTLCache(maxsize=200, ttl=1800)


def fetch_google_news(query: str, limit: int = 10):
    """Internal helper to fetch news via RSS."""
    encoded_query = urllib.parse.quote(query)
    url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-IN&gl=IN&ceid=IN:en"
    feed = feedparser.parse(url)

    results = []
    for entry in feed.entries[:limit]:
        # Google News titles usually end with " - Publisher"
        title_parts = entry.title.rsplit(" - ", 1)
        headline = title_parts[0]
        publisher = title_parts[1] if len(title_parts) > 1 else "Unknown"

        results.append(
            {
                "title": headline,
                "publisher": publisher,
                "link": entry.link,
                "published": entry.published,
                "summary": re.sub("<[^<]+?>", "", getattr(entry, "summary", ""))[:200],
            }
        )
    return results


def analyze_sentiment(news_list):
    """Calculate average sentiment from headlines using VADER."""
    if not news_list:
        return {"score": 0, "label": "Neutral", "detail": "Insufficient data"}

    analyzer = SentimentIntensityAnalyzer()
    scores = []
    
    for item in news_list:
        # VADER returns compound score from -1 (most negative) to +1 (most positive)
        vs = analyzer.polarity_scores(item["title"])
        compound = vs["compound"]
        
        # Financial keyword adjustments for more accurate sentiment
        title_lower = item["title"].lower()
        
        # Strong negative financial keywords
        negative_keywords = ['fall', 'drop', 'crash', 'plunge', 'slump', 'decline', 'loss', 'sell-off', 'bearish', 'fraud', 'scandal', 'investigation', 'debt', 'bankruptcy']
        # Strong positive financial keywords  
        positive_keywords = ['surge', 'rally', 'jump', 'soar', 'bullish', 'profit', 'gain', 'dividend', 'buyback', 'merger', 'acquisition', 'growth', 'beat', 'record']
        
        # Apply keyword weighting
        keyword_adjustment = 0
        for keyword in negative_keywords:
            if keyword in title_lower:
                keyword_adjustment -= 0.15
        for keyword in positive_keywords:
            if keyword in title_lower:
                keyword_adjustment += 0.10
        
        # Apply market-specific adjustments
        # Fear Bias: Market reacts 2-3x harder to bad news than good news (financial psychology)
        if compound < 0:
            amplified = compound * 2.2  # Stronger fear amplification
        else:
            amplified = compound * 1.1  # Minimal positive amplification
        
        # Add keyword adjustment
        final_score = amplified + keyword_adjustment
        
        scores.append(max(-1, min(1, final_score)))

    avg_score = sum(scores) / len(scores)

    # VADER thresholds (stricter for financial sentiment analysis)
    if avg_score > 0.15:
        label = "Bullish"
        detail = "Strong positive sentiment with clear accumulation signals."
    elif avg_score < -0.15:
        label = "Bearish"
        detail = "Significant negative sentiment. Distribution pressure detected."
    elif avg_score > 0.05:
        label = "Slightly Bullish"
        detail = "Mildly positive sentiment with cautious optimism."
    elif avg_score < -0.05:
        label = "Slightly Bearish"
        detail = "Mildly negative sentiment with some caution."
    else:
        label = "Neutral"
        detail = "Mixed news flow. No strong directional bias detected."

    return {"score": avg_score, "label": label, "detail": detail}


@app.get("/indices")
@cached(cache=quotes_cache)
def get_indices():
    """Fetch Nifty 50 and Sensex data."""
    tickers = [("^NSEI", "Nifty 50"), ("^BSESN", "Sensex")]
    indices = []

    for symbol, name in tickers:
        try:
            t = yf.Ticker(symbol)
            info = t.fast_info

            price = info.last_price
            prev_close = info.previous_close
            change = price - prev_close
            p_change = (change / prev_close) * 100 if prev_close else 0

            indices.append(
                {
                    "symbol": symbol,
                    "name": name,
                    "price": price,
                    "change": change,
                    "percentChange": p_change,
                }
            )
        except Exception as e:
            print(f"Error fetching {symbol}: {e}")
            continue

    return indices


@app.get("/quote/{ticker}")
@cached(cache=quotes_cache)
def get_quote(ticker: str):
    """Get live quote for a single ticker."""
    try:
        stock = yf.Ticker(ticker)
        info = stock.fast_info

        # Safe retrieval with defaults
        price = info.last_price if info.last_price else 0.0
        prev_close = info.previous_close if info.previous_close else price
        change = price - prev_close
        p_change = (change / prev_close) * 100 if prev_close != 0 else 0.0

        # Fetch extra info safely (slower, so we might want to cache this in frontend or DB in real app)
        # For now, we fetch it live.
        main_info = stock.info
        sector = main_info.get("sector", "Unknown")
        beta = main_info.get("beta", 1.0)  # Default to 1 (market correlation)
        long_name = main_info.get("longName", ticker)

        return {
            "symbol": ticker,
            "name": long_name,
            "price": price,
            "change": change,
            "percentChange": p_change,
            "dayHigh": info.day_high,
            "dayLow": info.day_low,
            "yearHigh": info.year_high,
            "yearLow": info.year_low,
            "marketCap": info.market_cap,
            "sector": sector,
            "beta": beta,
            "currency": info.currency,
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Ticker {ticker} not found: {e}")


@app.post("/batch-quotes")
def get_batch_quotes(tickers: list[str]):
    """Fetch quotes for multiple tickers efficiently."""
    results = []
    for ticker in tickers:
        try:
            stock = yf.Ticker(ticker)
            info = stock.fast_info
            price = info.last_price
            prev_close = info.previous_close
            change = price - prev_close
            p_change = (change / prev_close) * 100 if prev_close else 0

            # For batch view (dashboard), we generally don't need heavy 'info' like sector/beta
            # unless we are doing analytics. To keep dashboard fast, we might skip sector/beta here
            # OR we can try to fetch it if it's cached/fast.
            # 'stock.info' triggers a web request per stock.
            # Optimization: distinct endpoint for analytics data?
            # For now, let's include basic info.

            results.append(
                {
                    "symbol": ticker,
                    "price": price,
                    "change": change,
                    "percentChange": p_change,
                    "marketCap": info.market_cap,
                    "currency": info.currency,
                }
            )
        except:
            results.append({"symbol": ticker, "error": "Failed to fetch"})
    return results


@app.post("/batch-analytics")
def get_batch_analytics(tickers: list[str]):
    """Fetch detailed analytics (Sector, Beta, Market Cap) for charts."""
    results = []
    for ticker in tickers:
        try:
            stock = yf.Ticker(ticker)
            # This is slower, call only when needed (e.g. Analytics tab)
            info = stock.info

            results.append(
                {
                    "symbol": ticker,
                    "sector": info.get("sector", "Unknown"),
                    "industry": info.get("industry", "Unknown"),
                    "beta": info.get("beta", 1.0),
                    "marketCap": info.get("marketCap", 0),
                    "longName": info.get("longName", ticker),
                }
            )
        except:
            results.append({"symbol": ticker, "sector": "Unknown", "beta": 1.0})
    return results


@app.get("/search/{query}")
def search_ticker(query: str):
    """
    Search for a ticker.
    Focuses on Indian stocks if query doesn't specify suffix.
    """
    try:
        # We can use yf.Ticker to check if it exists or use an external search logic.
        # But yfinance doesn't have a built-in "search" API that returns a list.
        # We'll assume the user types "RELIANCE" and we try "RELIANCE.NS" or "RELIANCE.BO"

        # Simple heuristic: Append .NS and .BO and check validity
        candidates = []

        # If user explicitly typed a suffix, check that first
        if query.upper().endswith(".NS") or query.upper().endswith(".BO"):
            t = yf.Ticker(query)
            candidates.append(t)
        else:
            # Try NSE first
            candidates.append(yf.Ticker(f"{query}.NS"))
            candidates.append(yf.Ticker(f"{query}.BO"))

        results = []
        for stock in candidates:
            try:
                # Fast info check to see if it's valid
                if stock.fast_info.last_price is not None:
                    # Fetching full info is slow, but needed for the name.
                    # Let's try to get the name if possible, or just return the ticker.
                    # We will return the ticker as valid.
                    results.append(
                        {
                            "symbol": stock.ticker,
                            "name": stock.ticker,  # Name fetching is slow in YF, skipping for speed
                            "type": "Equity",
                            "region": "India",
                        }
                    )
            except:
                continue

        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analysis/{ticker}")
@cached(cache=analysis_cache)
def get_detailed_analysis(ticker: str):
    """Fetch advanced fundamental and technical metrics."""
    try:
        stock = yf.Ticker(ticker)
        info = stock.info

        # Fundamentals
        fundamentals = {
            "peRatio": info.get("forwardPE") or info.get("trailingPE") or 0,
            "dividendYield": (info.get("dividendYield") or 0) * 100,  # Convert to %
            "roe": (info.get("returnOnEquity") or 0) * 100,  # Convert to %
            "debtToEquity": info.get("debtToEquity") or 0,
            "pbRatio": info.get("priceToBook") or 0,
            "eps": info.get("trailingEps") or 0,
        }

        # Technicals (fetch 1y history for calculation)
        hist = stock.history(period="1y")
        if hist.empty:
            return {"fundamentals": fundamentals, "technicals": {}}

        # Calculate SMAs
        sma50 = hist["Close"].rolling(window=50).mean().iloc[-1]
        sma200 = hist["Close"].rolling(window=200).mean().iloc[-1]

        # Calculate RSI (14-day)
        delta = hist["Close"].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs.iloc[-1]))

        current_price = hist["Close"].iloc[-1]

        technicals = {
            "rsi": rsi,
            "sma50": sma50,
            "sma200": sma200,
            "priceVsSMA50": ((current_price - sma50) / sma50) * 100,
            "priceVsSMA200": ((current_price - sma200) / sma200) * 100,
            "high52": hist["High"].max(),
            "low52": hist["Low"].min(),
        }

        return {
            "symbol": ticker,
            "companyName": info.get("longName", ticker),
            "fundamentals": fundamentals,
            "technicals": technicals,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def calculate_macd(data, fast=12, slow=26, signal=9):
    """Calculate MACD (Moving Average Convergence Divergence)"""
    exp1 = data['Close'].ewm(span=fast).mean()
    exp2 = data['Close'].ewm(span=slow).mean()
    macd = exp1 - exp2
    signal_line = macd.ewm(span=signal).mean()
    histogram = macd - signal_line
    return {
        "macd": macd.iloc[-1],
        "signal": signal_line.iloc[-1],
        "histogram": histogram.iloc[-1],
        "trend": "bullish" if macd.iloc[-1] > signal_line.iloc[-1] else "bearish"
    }


def calculate_bollinger_bands(data, period=20, std_dev=2):
    """Calculate Bollinger Bands"""
    sma = data['Close'].rolling(window=period).mean()
    std = data['Close'].rolling(window=period).std()
    upper_band = sma + (std * std_dev)
    lower_band = sma - (std * std_dev)
    
    current_price = data['Close'].iloc[-1]
    current_sma = sma.iloc[-1]
    current_upper = upper_band.iloc[-1]
    current_lower = lower_band.iloc[-1]
    
    # Determine position relative to bands
    if current_price > current_upper:
        position = "above_upper"  # Potentially overbought
    elif current_price < current_lower:
        position = "below_lower"  # Potentially oversold
    else:
        position = "within_bands"
    
    # Calculate bandwidth (volatility measure)
    bandwidth = (current_upper - current_lower) / current_sma * 100
    
    return {
        "upper": current_upper,
        "middle": current_sma,
        "lower": current_lower,
        "position": position,
        "bandwidth": bandwidth,
        "percent_position": ((current_price - current_lower) / (current_upper - current_lower)) * 100
    }


def calculate_stochastic(data, k_period=14, d_period=3):
    """Calculate Stochastic Oscillator"""
    low_min = data['Low'].rolling(window=k_period).min()
    high_max = data['High'].rolling(window=k_period).max()
    
    k_percent = ((data['Close'] - low_min) / (high_max - low_min)) * 100
    d_percent = k_percent.rolling(window=d_period).mean()
    
    current_k = k_percent.iloc[-1]
    current_d = d_percent.iloc[-1]
    
    # Determine signal
    if current_k > 80 and current_d > 80:
        signal = "overbought"
    elif current_k < 20 and current_d < 20:
        signal = "oversold"
    elif current_k > current_d:
        signal = "bullish_crossover"
    else:
        signal = "bearish_crossover"
    
    return {
        "k": current_k,
        "d": current_d,
        "signal": signal
    }


def calculate_williams_r(data, period=14):
    """Calculate Williams %R"""
    high_max = data['High'].rolling(window=period).max()
    low_min = data['Low'].rolling(window=period).min()
    
    williams_r = ((high_max - data['Close']) / (high_max - low_min)) * -100
    current_wr = williams_r.iloc[-1]
    
    # Determine signal
    if current_wr > -20:
        signal = "overbought"
    elif current_wr < -80:
        signal = "oversold"
    else:
        signal = "neutral"
    
    return {
        "value": current_wr,
        "signal": signal
    }


def calculate_adx(data, period=14):
    """Calculate Average Directional Index (ADX)"""
    high = data['High']
    low = data['Low']
    close = data['Close']
    
    # Calculate True Range
    tr1 = high - low
    tr2 = abs(high - close.shift(1))
    tr3 = abs(low - close.shift(1))
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    
    # Calculate Directional Movement
    dm_plus = np.where((high - high.shift(1)) > (low.shift(1) - low), 
                       np.maximum(high - high.shift(1), 0), 0)
    dm_minus = np.where((low.shift(1) - low) > (high - high.shift(1)), 
                        np.maximum(low.shift(1) - low, 0), 0)
    
    # Convert to pandas Series
    dm_plus = pd.Series(dm_plus, index=data.index)
    dm_minus = pd.Series(dm_minus, index=data.index)
    
    # Calculate Smoothed values
    atr = tr.rolling(window=period).mean()
    di_plus = 100 * (dm_plus.rolling(window=period).mean() / atr)
    di_minus = 100 * (dm_minus.rolling(window=period).mean() / atr)
    
    # Calculate ADX
    dx = 100 * abs(di_plus - di_minus) / (di_plus + di_minus)
    adx = dx.rolling(window=period).mean()
    
    current_adx = adx.iloc[-1]
    current_di_plus = di_plus.iloc[-1]
    current_di_minus = di_minus.iloc[-1]
    
    # Determine trend strength
    if current_adx > 25:
        trend_strength = "strong"
    elif current_adx > 20:
        trend_strength = "moderate"
    else:
        trend_strength = "weak"
    
    # Determine trend direction
    if current_di_plus > current_di_minus:
        trend_direction = "uptrend"
    else:
        trend_direction = "downtrend"
    
    return {
        "adx": current_adx,
        "di_plus": current_di_plus,
        "di_minus": current_di_minus,
        "trend_strength": trend_strength,
        "trend_direction": trend_direction
    }


def calculate_atr(data, period=14):
    """Calculate Average True Range (ATR)"""
    high = data['High']
    low = data['Low']
    close = data['Close']
    
    # Calculate True Range
    tr1 = high - low
    tr2 = abs(high - close.shift(1))
    tr3 = abs(low - close.shift(1))
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    
    # Calculate ATR
    atr = tr.rolling(window=period).mean()
    current_atr = atr.iloc[-1]
    current_price = close.iloc[-1]
    
    # Calculate ATR as percentage of price
    atr_percent = (current_atr / current_price) * 100
    
    # Determine volatility level
    if atr_percent > 3:
        volatility = "high"
    elif atr_percent > 1.5:
        volatility = "moderate"
    else:
        volatility = "low"
    
    return {
        "value": current_atr,
        "percent": atr_percent,
        "volatility": volatility
    }


def detect_support_resistance(data, lookback=20, min_touches=2):
    """Detect support and resistance levels"""
    highs = data['High']
    lows = data['Low']
    close = data['Close']
    
    # Find potential resistance levels (local highs)
    resistance_levels = []
    for i in range(lookback, len(data) - lookback):
        current_high = highs.iloc[i]
        is_resistance = True
        
        # Check if this is a local maximum
        for j in range(i - lookback, i):
            if highs.iloc[j] >= current_high:
                is_resistance = False
                break
        for j in range(i + 1, i + lookback + 1):
            if j < len(highs) and highs.iloc[j] >= current_high:
                is_resistance = False
                break
        
        if is_resistance:
            # Count how many times price has touched this level
            touches = 0
            for j in range(len(data)):
                if abs(lows.iloc[j] - current_high) / current_high < 0.02:  # Within 2%
                    touches += 1
            
            if touches >= min_touches:
                resistance_levels.append({
                    "level": current_high,
                    "touches": touches,
                    "strength": "strong" if touches >= 3 else "moderate"
                })
    
    # Find potential support levels (local lows)
    support_levels = []
    for i in range(lookback, len(data) - lookback):
        current_low = lows.iloc[i]
        is_support = True
        
        # Check if this is a local minimum
        for j in range(i - lookback, i):
            if lows.iloc[j] <= current_low:
                is_support = False
                break
        for j in range(i + 1, i + lookback + 1):
            if j < len(lows) and lows.iloc[j] <= current_low:
                is_support = False
                break
        
        if is_support:
            # Count how many times price has touched this level
            touches = 0
            for j in range(len(data)):
                if abs(highs.iloc[j] - current_low) / current_low < 0.02:  # Within 2%
                    touches += 1
            
            if touches >= min_touches:
                support_levels.append({
                    "level": current_low,
                    "touches": touches,
                    "strength": "strong" if touches >= 3 else "moderate"
                })
    
    # Sort by strength and get the strongest levels
    resistance_levels.sort(key=lambda x: x["touches"], reverse=True)
    support_levels.sort(key=lambda x: x["touches"], reverse=True)
    
    current_price = close.iloc[-1]
    
    return {
        "resistance": resistance_levels[:3],  # Top 3 resistance levels
        "support": support_levels[:3],       # Top 3 support levels
        "current_position": {
            "price": current_price,
            "nearest_resistance": resistance_levels[0]["level"] if resistance_levels else None,
            "nearest_support": support_levels[0]["level"] if support_levels else None
        }
    }


def calculate_fibonacci_levels(data, period=100):
    """Calculate Fibonacci retracement levels"""
    if len(data) < period:
        period = len(data)
    
    recent_data = data.tail(period)
    high_max = recent_data['High'].max()
    low_min = recent_data['Low'].min()
    
    # Fibonacci retracement levels
    diff = high_max - low_min
    levels = {
        "high": high_max,
        "low": low_min,
        "0%": high_max,  # High
        "23.6%": high_max - (0.236 * diff),
        "38.2%": high_max - (0.382 * diff),
        "50%": high_max - (0.5 * diff),
        "61.8%": high_max - (0.618 * diff),
        "78.6%": high_max - (0.786 * diff),
        "100%": low_min   # Low
    }
    
    current_price = data['Close'].iloc[-1]
    
    # Determine which Fibonacci level the price is closest to
    closest_level = None
    min_distance = float('inf')
    
    for level_name, level_value in levels.items():
        if level_name in ["high", "low"]:
            continue
        distance = abs(current_price - level_value)
        if distance < min_distance:
            min_distance = distance
            closest_level = level_name
    
    return {
        "levels": levels,
        "current_price": current_price,
        "closest_level": closest_level,
        "retracement_from_high": ((high_max - current_price) / diff) * 100,
        "extension_from_low": ((current_price - low_min) / diff) * 100
    }


def calculate_pivot_points(data, method="classic"):
    """Calculate pivot points using different methods"""
    high = data['High'].iloc[-1]
    low = data['Low'].iloc[-1]
    close = data['Close'].iloc[-1]
    
    if method == "classic":
        pivot = (high + low + close) / 3
        resistance1 = (2 * pivot) - low
        resistance2 = pivot + (high - low)
        resistance3 = high + 2 * (pivot - low)
        support1 = (2 * pivot) - high
        support2 = pivot - (high - low)
        support3 = low - 2 * (high - pivot)
    
    elif method == "woodie":
        pivot = (high + low + 2 * close) / 4
        resistance1 = (2 * pivot) - low
        resistance2 = pivot + (high - low)
        resistance3 = high + 2 * (pivot - low)
        support1 = (2 * pivot) - high
        support2 = pivot - (high - low)
        support3 = low - 2 * (high - pivot)
    
    elif method == "camarilla":
        range_hl = high - low
        pivot = (high + low + close) / 3
        resistance1 = close + (range_hl * 1.1 / 12)
        resistance2 = close + (range_hl * 1.1 / 6)
        resistance3 = close + (range_hl * 1.1 / 4)
        resistance4 = close + (range_hl * 1.1 / 2)
        support1 = close - (range_hl * 1.1 / 12)
        support2 = close - (range_hl * 1.1 / 6)
        support3 = close - (range_hl * 1.1 / 4)
        support4 = close - (range_hl * 1.1 / 2)
    
    current_price = close
    
    return {
        "method": method,
        "pivot": pivot,
        "resistance": {
            "r1": resistance1,
            "r2": resistance2,
            "r3": resistance3,
            "r4": resistance4 if method == "camarilla" else None
        },
        "support": {
            "s1": support1,
            "s2": support2,
            "s3": support3,
            "s4": support4 if method == "camarilla" else None
        },
        "current_price": current_price,
        "position": "above_pivot" if current_price > pivot else "below_pivot"
    }


@app.get("/technical/{ticker}")
@cached(cache=analysis_cache)
def get_advanced_technicals(ticker: str, indicators: str = "macd,bollinger,rsi,stoch"):
    """Get advanced technical indicators for a ticker."""
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period="1y")
        
        if hist.empty:
            raise HTTPException(status_code=404, detail="No historical data found")
        
        # Parse requested indicators
        requested_indicators = [ind.strip().lower() for ind in indicators.split(",")]
        result = {"symbol": ticker, "indicators": {}}
        
        # Calculate requested indicators
        if "macd" in requested_indicators:
            result["indicators"]["macd"] = calculate_macd(hist)
        
        if "bollinger" in requested_indicators:
            result["indicators"]["bollinger"] = calculate_bollinger_bands(hist)
        
        if "stoch" in requested_indicators or "stochastic" in requested_indicators:
            result["indicators"]["stochastic"] = calculate_stochastic(hist)
        
        if "williams" in requested_indicators or "williams_r" in requested_indicators:
            result["indicators"]["williams_r"] = calculate_williams_r(hist)
        
        if "adx" in requested_indicators:
            result["indicators"]["adx"] = calculate_adx(hist)
        
        if "atr" in requested_indicators:
            result["indicators"]["atr"] = calculate_atr(hist)
        
        # Always include basic RSI if requested
        if "rsi" in requested_indicators:
            delta = hist["Close"].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / loss
            rsi = 100 - (100 / (1 + rs.iloc[-1]))
            result["indicators"]["rsi"] = {"value": rsi}
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/support-resistance/{ticker}")
@cached(cache=analysis_cache)
def get_support_resistance(ticker: str):
    """Get support and resistance levels for a ticker."""
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period="1y")
        
        if hist.empty:
            raise HTTPException(status_code=404, detail="No historical data found")
        
        sr_levels = detect_support_resistance(hist)
        fib_levels = calculate_fibonacci_levels(hist)
        
        return {
            "symbol": ticker,
            "support_resistance": sr_levels,
            "fibonacci": fib_levels
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/pivot-points/{ticker}")
@cached(cache=analysis_cache)
def get_pivot_points(ticker: str, method: str = "classic"):
    """Get pivot points for a ticker."""
    try:
        if method not in ["classic", "woodie", "camarilla"]:
            method = "classic"
        
        stock = yf.Ticker(ticker)
        hist = stock.history(period="5d")  # Need recent data for pivot points
        
        if hist.empty:
            raise HTTPException(status_code=404, detail="No historical data found")
        
        pivot_data = calculate_pivot_points(hist, method)
        
        return pivot_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def calculate_var(returns, confidence_level=0.95):
    """Calculate Value at Risk (VaR) using historical method"""
    if len(returns) == 0:
        return 0.0
    
    # Sort returns in ascending order
    sorted_returns = np.sort(returns)
    
    # Calculate the percentile
    var_index = int((1 - confidence_level) * len(sorted_returns))
    var = sorted_returns[var_index] if var_index < len(sorted_returns) else sorted_returns[-1]
    
    return var


def calculate_max_drawdown(prices):
    """Calculate Maximum Drawdown"""
    if len(prices) < 2:
        return 0.0
    
    peak = prices[0]
    max_drawdown = 0.0
    
    for price in prices[1:]:
        if price > peak:
            peak = price
        
        drawdown = (peak - price) / peak
        if drawdown > max_drawdown:
            max_drawdown = drawdown
    
    return max_drawdown


def calculate_correlation_matrix(tickers, period="1y"):
    """Calculate correlation matrix for multiple tickers"""
    correlation_data = {}
    
    for ticker in tickers:
        try:
            stock = yf.Ticker(ticker)
            hist = stock.history(period=period)
            
            if not hist.empty:
                # Calculate daily returns
                returns = hist['Close'].pct_change().dropna()
                correlation_data[ticker] = returns
        except Exception as e:
            print(f"Error fetching data for {ticker}: {e}")
            continue
    
    if len(correlation_data) < 2:
        return {}
    
    # Create DataFrame and calculate correlation matrix
    returns_df = pd.DataFrame(correlation_data)
    correlation_matrix = returns_df.corr()
    
    # Convert to dictionary format
    result = {}
    for ticker1 in correlation_matrix.columns:
        result[ticker1] = {}
        for ticker2 in correlation_matrix.columns:
            result[ticker1][ticker2] = float(correlation_matrix.loc[ticker1, ticker2])
    
    return result


@app.post("/risk-analysis")
def get_portfolio_risk_analysis(tickers: list[str]):
    """Get comprehensive risk analysis for portfolio tickers"""
    try:
        if not tickers:
            raise HTTPException(status_code=400, detail="No tickers provided")
        
        risk_analysis = {}
        
        for ticker in tickers:
            try:
                stock = yf.Ticker(ticker)
                hist = stock.history(period="2y")  # Use 2 years for better risk analysis
                
                if hist.empty:
                    risk_analysis[ticker] = {"error": "No historical data available"}
                    continue
                
                prices = hist['Close']
                returns = prices.pct_change().dropna()
                
                # Calculate risk metrics
                var_95 = calculate_var(returns, 0.95)
                var_99 = calculate_var(returns, 0.99)
                max_dd = calculate_max_drawdown(prices)
                
                # Calculate volatility (annualized)
                volatility = returns.std() * np.sqrt(252)
                
                # Calculate beta (if possible)
                try:
                    # Get market data (Nifty 50)
                    market = yf.Ticker("^NSEI")
                    market_hist = market.history(period="2y")
                    
                    if not market_hist.empty:
                        market_returns = market_hist['Close'].pct_change().dropna()
                        
                        # Align returns
                        aligned_returns = pd.DataFrame({
                            'stock': returns,
                            'market': market_returns
                        }).dropna()
                        
                        if len(aligned_returns) > 30:
                            covariance = aligned_returns.cov().iloc[0, 1]
                            market_variance = aligned_returns['market'].var()
                            beta = covariance / market_variance if market_variance != 0 else 1.0
                        else:
                            beta = 1.0
                    else:
                        beta = 1.0
                except:
                    beta = 1.0
                
                risk_analysis[ticker] = {
                    "var_95": abs(var_95),  # VaR as positive number
                    "var_99": abs(var_99),
                    "max_drawdown": max_dd,
                    "volatility": volatility,
                    "beta": beta,
                    "sharpe_ratio": (returns.mean() * 252) / (returns.std() * np.sqrt(252)) if returns.std() > 0 else 0,
                    "data_points": len(returns)
                }
                
            except Exception as e:
                risk_analysis[ticker] = {"error": str(e)}
        
        # Calculate portfolio-level metrics
        valid_tickers = [t for t in tickers if t in risk_analysis and "error" not in risk_analysis[t]]
        
        if len(valid_tickers) > 1:
            correlation_matrix = calculate_correlation_matrix(valid_tickers)
            
            # Calculate portfolio VaR (simplified - assumes equal weights)
            portfolio_var_95 = 0
            portfolio_var_99 = 0
            
            for ticker in valid_tickers:
                weight = 1.0 / len(valid_tickers)  # Equal weight
                portfolio_var_95 += (weight ** 2) * (risk_analysis[ticker]["var_95"] ** 2)
                portfolio_var_99 += (weight ** 2) * (risk_analysis[ticker]["var_99"] ** 2)
            
            portfolio_var_95 = np.sqrt(portfolio_var_95)
            portfolio_var_99 = np.sqrt(portfolio_var_99)
            
            return {
                "individual_assets": risk_analysis,
                "portfolio_metrics": {
                    "var_95": portfolio_var_95,
                    "var_99": portfolio_var_99,
                    "correlation_matrix": correlation_matrix
                }
            }
        else:
            return {
                "individual_assets": risk_analysis,
                "portfolio_metrics": None
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/correlation-matrix")
def get_correlation_matrix_endpoint(tickers: str = ""):
    """Get correlation matrix for specified tickers"""
    try:
        if not tickers:
            raise HTTPException(status_code=400, detail="No tickers provided")
        
        ticker_list = [t.strip() for t in tickers.split(",") if t.strip()]
        
        if len(ticker_list) < 2:
            raise HTTPException(status_code=400, detail="At least 2 tickers required for correlation analysis")
        
        correlation_matrix = calculate_correlation_matrix(ticker_list)
        
        return {
            "tickers": ticker_list,
            "correlation_matrix": correlation_matrix
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/position-size/{ticker}")
def calculate_position_size(
    ticker: str, 
    account_size: float = 100000,
    risk_per_trade: float = 2.0,
    stop_loss_pct: float = 5.0
):
    """Calculate optimal position size using various methods"""
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period="1y")
        
        if hist.empty:
            raise HTTPException(status_code=404, detail="No historical data found")
        
        current_price = hist['Close'].iloc[-1]
        returns = hist['Close'].pct_change().dropna()
        
        # Calculate ATR for volatility-based position sizing
        high_low = hist['High'] - hist['Low']
        high_close = abs(hist['High'] - hist['Close'].shift(1))
        low_close = abs(hist['Low'] - hist['Close'].shift(1))
        
        true_range = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        atr = true_range.rolling(window=14).mean().iloc[-1]
        
        # Method 1: Fixed Risk per Trade
        risk_amount_fixed = account_size * (risk_per_trade / 100)
        stop_loss_amount_fixed = current_price * (stop_loss_pct / 100)
        position_size_fixed = risk_amount_fixed / stop_loss_amount_fixed
        
        # Method 2: Kelly Criterion (simplified)
        if len(returns) > 30:
            win_rate = len(returns[returns > 0]) / len(returns)
            avg_win = returns[returns > 0].mean() if len(returns[returns > 0]) > 0 else 0
            avg_loss = abs(returns[returns < 0].mean()) if len(returns[returns < 0]) > 0 else 0
            
            if avg_loss > 0:
                kelly_fraction = win_rate - ((1 - win_rate) * (avg_win / avg_loss))
                kelly_fraction = max(0, min(kelly_fraction, 0.25))  # Cap at 25%
            else:
                kelly_fraction = 0
        else:
            kelly_fraction = 0
        
        position_size_kelly = (account_size * kelly_fraction) / current_price
        
        # Method 3: Volatility-Adjusted
        volatility = returns.std() * np.sqrt(252)
        volatility_adjusted_risk = risk_per_trade / (volatility * 100)  # Adjust for volatility
        position_size_volatility = (account_size * (volatility_adjusted_risk / 100)) / current_price
        
        return {
            "ticker": ticker,
            "current_price": current_price,
            "account_size": account_size,
            "atr": atr,
            "methods": {
                "fixed_risk": {
                    "position_size": position_size_fixed,
                    "risk_amount": risk_amount_fixed,
                    "stop_loss": stop_loss_pct,
                    "description": f"Risk {risk_per_trade}% of account ({risk_amount_fixed:.2f}) on this trade"
                },
                "kelly_criterion": {
                    "position_size": position_size_kelly,
                    "kelly_fraction": kelly_fraction,
                    "description": f"Kelly Criterion suggests {kelly_fraction*100:.1f}% of capital"
                },
                "volatility_adjusted": {
                    "position_size": position_size_volatility,
                    "volatility": volatility,
                    "description": f"Adjusted for {volatility*100:.1f}% annual volatility"
                }
            },
            "recommended": {
                "shares": int(min(position_size_fixed, position_size_kelly, position_size_volatility)),
                "value": current_price * int(min(position_size_fixed, position_size_kelly, position_size_volatility)),
                "risk_percentage": risk_per_trade
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/history/{ticker}")
@cached(cache=history_cache)
def get_history(ticker: str, timeframe: str = "1M"):
    """Get historical data for charts based on timeframe."""
    try:
        stock = yf.Ticker(ticker)

        # Map timeframe to yfinance period and interval
        tf_map = {
            "1D": {"period": "1d", "interval": "5m"},
            "1W": {"period": "5d", "interval": "15m"},
            "1M": {"period": "1mo", "interval": "1d"},
            "1Y": {"period": "1y", "interval": "1d"},
            "5Y": {"period": "5y", "interval": "1wk"},
        }

        tf = timeframe.upper()
        if tf not in tf_map:
            tf = "1M"

        hist = stock.history(
            period=tf_map[tf]["period"], interval=tf_map[tf]["interval"]
        )

        # Convert to list of dicts for frontend
        data = []
        for date, row in hist.iterrows():
            # For intraday (1D, 1W), we want time as well. For daily/weekly (1M, 1Y, 5Y), just date.
            if tf in ["1D", "1W"]:
                date_str = date.strftime("%b %d %H:%M")
            else:
                date_str = date.strftime("%Y-%m-%d")

            # Check for NaN which can break JSON
            price = row["Close"]
            if pd.isna(price):
                continue

            data.append({"date": date_str, "price": price})

        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/news/{ticker}")
@cached(cache=news_cache)
def get_stock_news(ticker: str):
    """Get news and sentiment for a single ticker."""
    try:
        # Fetch news for the ticker
        news_list = fetch_google_news(ticker, limit=10)
        
        # Analyze sentiment
        sentiment = analyze_sentiment(news_list)
        
        # Add ticker to each news item for frontend
        for item in news_list:
            item["ticker"] = ticker
        
        return {
            "news": news_list,
            "sentiment": sentiment
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/portfolio-news")
@cached(cache=news_cache)
def get_portfolio_news(tickers: list[str]):
    """Get aggregated news and sentiment for portfolio tickers."""
    try:
        all_news = []
        
        # Fetch news for each ticker
        for ticker in tickers:
            news_list = fetch_google_news(ticker, limit=5)  # Fewer per ticker to avoid overload
            for item in news_list:
                item["ticker"] = ticker
            all_news.extend(news_list)
        
        # Analyze overall sentiment
        sentiment = analyze_sentiment(all_news)
        
        return {
            "news": all_news,
            "sentiment": sentiment
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def calculate_dcf(ticker, growth_rate=0.05, discount_rate=0.10, terminal_growth=0.03, years=5):
    """Calculate Discounted Cash Flow (DCF) valuation"""
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        # Get financial data
        if not info.get('freeCashflow') or not info.get('sharesOutstanding'):
            return {"error": "Insufficient financial data for DCF calculation"}
        
        fcf = info['freeCashflow']
        shares_outstanding = info['sharesOutstanding']
        
        # Project future cash flows
        projected_fcf = []
        for year in range(1, years + 1):
            projected_fcf.append(fcf * ((1 + growth_rate) ** year))
        
        # Calculate terminal value
        terminal_fcf = projected_fcf[-1] * (1 + terminal_growth)
        terminal_value = terminal_fcf / (discount_rate - terminal_growth)
        
        # Discount cash flows to present value
        pv_fcf = []
        for i, fcf_projected in enumerate(projected_fcf, 1):
            pv = fcf_projected / ((1 + discount_rate) ** i)
            pv_fcf.append(pv)
        
        # Discount terminal value
        pv_terminal = terminal_value / ((1 + discount_rate) ** years)
        
        # Total enterprise value
        enterprise_value = sum(pv_fcf) + pv_terminal
        
        # Adjust for net debt (if available)
        net_debt = info.get('totalDebt', 0) - info.get('cashAndCashEquivalents', 0)
        equity_value = enterprise_value - net_debt
        
        # Fair value per share
        fair_value = equity_value / shares_outstanding
        
        return {
            "current_price": info.get('currentPrice') or info.get('regularMarketPrice', 0),
            "fair_value": fair_value,
            "upside_potential": ((fair_value - (info.get('currentPrice') or 0)) / (info.get('currentPrice') or 1)) * 100,
            "assumptions": {
                "growth_rate": growth_rate,
                "discount_rate": discount_rate,
                "terminal_growth": terminal_growth,
                "years": years,
                "fcf": fcf,
                "shares_outstanding": shares_outstanding
            },
            "projected_fcf": projected_fcf,
            "enterprise_value": enterprise_value,
            "equity_value": equity_value
        }
        
    except Exception as e:
        return {"error": f"DCF calculation failed: {str(e)}"}


def calculate_graham_number(ticker):
    """Calculate Graham Number for defensive stock valuation"""
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        # Get required data
        if not info.get('trailingEps') or not info.get('bookValue'):
            return {"error": "Insufficient data for Graham Number calculation"}
        
        eps = info['trailingEps']
        book_value = info['bookValue']
        current_price = info.get('currentPrice') or info.get('regularMarketPrice', 0)
        
        # Graham Number formula: sqrt(22.5 * EPS * Book Value per Share)
        graham_number = np.sqrt(22.5 * eps * book_value)
        
        # Margin of safety
        margin_of_safety = ((graham_number - current_price) / current_price) * 100 if current_price > 0 else 0
        
        return {
            "current_price": current_price,
            "graham_number": graham_number,
            "margin_of_safety": margin_of_safety,
            "is_undervalued": current_price < graham_number,
            "inputs": {
                "eps": eps,
                "book_value": book_value
            }
        }
        
    except Exception as e:
        return {"error": f"Graham Number calculation failed: {str(e)}"}


def calculate_peter_lynch_fair_value(ticker):
    """Calculate Peter Lynch Fair Value"""
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        # Get required data
        if not info.get('trailingEps'):
            return {"error": "Insufficient data for Peter Lynch valuation"}
        
        eps = info['trailingEps']
        peg_ratio = info.get('pegRatio', 0)
        current_price = info.get('currentPrice') or info.get('regularMarketPrice', 0)
        
        # Peter Lynch Fair Value: EPS * (reasonable P/E ratio)
        # Use P/E of 15 as a reasonable benchmark (Peter Lynch's preference)
        fair_value = eps * 15
        
        upside_potential = ((fair_value - current_price) / current_price) * 100 if current_price > 0 else 0
        
        return {
            "current_price": current_price,
            "fair_value": fair_value,
            "upside_potential": upside_potential,
            "peg_ratio": peg_ratio,
            "is_reasonable": current_price <= fair_value,
            "inputs": {
                "eps": eps,
                "peg_ratio": peg_ratio,
                "pe_used": 15
            }
        }
        
    except Exception as e:
        return {"error": f"Peter Lynch valuation failed: {str(e)}"}


def calculate_advanced_fundamentals(ticker):
    """Calculate advanced fundamental metrics"""
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        # Basic metrics
        current_price = info.get('currentPrice') or info.get('regularMarketPrice', 0)
        market_cap = info.get('marketCap', 0)
        
        # Profitability metrics
        gross_margin = info.get('grossMargins', 0) * 100
        operating_margin = info.get('operatingMargins', 0) * 100
        net_margin = info.get('profitMargins', 0) * 100
        
        # Financial health metrics
        current_ratio = info.get('currentRatio', 0)
        quick_ratio = info.get('quickRatio', 0)
        debt_to_equity = info.get('debtToEquity', 0)
        
        # Efficiency metrics
        return_on_equity = info.get('returnOnEquity', 0) * 100
        return_on_assets = info.get('returnOnAssets', 0) * 100
        asset_turnover = info.get('assetTurnover', 0)
        
        # Growth metrics
        revenue_growth = info.get('revenueGrowth', 0) * 100
        earnings_growth = info.get('earningsGrowth', 0) * 100
        
        # Valuation metrics
        price_to_sales = info.get('priceToSales', 0)
        price_to_book = info.get('priceToBook', 0)
        price_to_earnings = info.get('trailingPE') or info.get('forwardPE', 0)
        
        # Cash flow metrics
        free_cash_flow = info.get('freeCashflow', 0)
        operating_cash_flow = info.get('operatingCashflow', 0)
        cash_flow_per_share = free_cash_flow / info.get('sharesOutstanding', 1) if info.get('sharesOutstanding') else 0
        
        # Quality score (simplified)
        quality_score = 0
        if return_on_equity > 15: quality_score += 20
        if debt_to_equity < 0.5: quality_score += 20
        if current_ratio > 1.5: quality_score += 15
        if gross_margin > 30: quality_score += 15
        if net_margin > 10: quality_score += 15
        if free_cash_flow > 0: quality_score += 15
        
        return {
            "current_price": current_price,
            "market_cap": market_cap,
            "profitability": {
                "gross_margin": gross_margin,
                "operating_margin": operating_margin,
                "net_margin": net_margin
            },
            "financial_health": {
                "current_ratio": current_ratio,
                "quick_ratio": quick_ratio,
                "debt_to_equity": debt_to_equity
            },
            "efficiency": {
                "return_on_equity": return_on_equity,
                "return_on_assets": return_on_assets,
                "asset_turnover": asset_turnover
            },
            "growth": {
                "revenue_growth": revenue_growth,
                "earnings_growth": earnings_growth
            },
            "valuation": {
                "price_to_sales": price_to_sales,
                "price_to_book": price_to_book,
                "price_to_earnings": price_to_earnings
            },
            "cash_flow": {
                "free_cash_flow": free_cash_flow,
                "operating_cash_flow": operating_cash_flow,
                "cash_flow_per_share": cash_flow_per_share
            },
            "quality_score": min(100, quality_score)
        }
        
    except Exception as e:
        return {"error": f"Advanced fundamentals calculation failed: {str(e)}"}


@app.get("/valuation-models/{ticker}")
def get_valuation_models(
    ticker: str, 
    growth_rate: float = 0.05, 
    discount_rate: float = 0.10
):
    """Get multiple valuation models for a ticker"""
    try:
        # Calculate all valuation models
        dcf_result = calculate_dcf(ticker, growth_rate, discount_rate)
        graham_result = calculate_graham_number(ticker)
        lynch_result = calculate_peter_lynch_fair_value(ticker)
        fundamentals_result = calculate_advanced_fundamentals(ticker)
        
        # Calculate average fair value from available models
        fair_values = []
        if 'fair_value' in dcf_result:
            fair_values.append(dcf_result['fair_value'])
        if 'graham_number' in graham_result:
            fair_values.append(graham_result['graham_number'])
        if 'fair_value' in lynch_result:
            fair_values.append(lynch_result['fair_value'])
        
        average_fair_value = sum(fair_values) / len(fair_values) if fair_values else None
        
        # Generate recommendation
        recommendation = "HOLD"
        current_price = (dcf_result.get('current_price') or 
                        graham_result.get('current_price') or 
                        lynch_result.get('current_price') or 0)
        
        if average_fair_value and current_price > 0:
            upside = ((average_fair_value - current_price) / current_price) * 100
            if upside > 20:
                recommendation = "STRONG BUY"
            elif upside > 10:
                recommendation = "BUY"
            elif upside < -20:
                recommendation = "STRONG SELL"
            elif upside < -10:
                recommendation = "SELL"
        
        return {
            "ticker": ticker,
            "dcf": dcf_result,
            "graham_number": graham_result,
            "peter_lynch": lynch_result,
            "advanced_fundamentals": fundamentals_result,
            "summary": {
                "average_fair_value": average_fair_value,
                "recommendation": recommendation,
                "models_count": len(fair_values)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/advanced-fundamentals/{ticker}")
def get_advanced_fundamentals_endpoint(ticker: str):
    """Get advanced fundamental analysis for a ticker"""
    try:
        fundamentals = calculate_advanced_fundamentals(ticker)
        return fundamentals
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
