/* eslint-disable arrow-body-style */
/* eslint-disable operator-linebreak */
// src/market/market-state-calculator.js
// MarketState 계산 (volatility, trend, priceLocation, session)

/**
 * 변동성 상태 계산
 * @param {Array} klines - OHLCV 데이터 배열
 * @param {number} lookbackPeriod - 계산 기간 (기본: 20)
 * @returns {string} - "low" | "mid" | "high"
 */
function calculateVolatilityState(klines, lookbackPeriod = 20) {
  if (!klines || klines.length < lookbackPeriod) {
    return "mid"; // 기본값
  }

  const recentKlines = klines.slice(-lookbackPeriod);
  const returns = [];

  for (let i = 1; i < recentKlines.length; i += 1) {
    const prevClose = recentKlines[i - 1].close;
    const currClose = recentKlines[i].close;
    const returnPct = Math.abs((currClose - prevClose) / prevClose) * 100;
    returns.push(returnPct);
  }

  const avgVolatility = returns.reduce((sum, r) => sum + r, 0) / returns.length;

  // 임계값 설정 (조정 가능)
  if (avgVolatility < 0.5) return "low";
  if (avgVolatility > 2.0) return "high";
  return "mid";
}

/**
 * 추세 상태 계산 (Simple Moving Average 기반)
 * @param {Array} klines - OHLCV 데이터 배열
 * @returns {string} - "up" | "down" | "range"
 */
function calculateTrendState(klines) {
  if (!klines || klines.length < 20) {
    return "range"; // 기본값
  }

  const recentKlines = klines.slice(-20);
  const closes = recentKlines.map((k) => k.close);

  // 단기 MA (5기간)
  const shortMA = closes.slice(-5).reduce((sum, c) => sum + c, 0) / 5;
  // 장기 MA (20기간)
  const longMA = closes.reduce((sum, c) => sum + c, 0) / closes.length;

  const diff = ((shortMA - longMA) / longMA) * 100;

  if (diff > 1.0) return "up";
  if (diff < -1.0) return "down";
  return "range";
}

/**
 * 가격 위치 계산 (VWAP 기준)
 * @param {Array} klines - OHLCV 데이터 배열
 * @param {number} currentPrice - 현재 가격
 * @returns {string} - "above_vwap" | "below_vwap" | "mid"
 */
function calculatePriceLocation(klines, currentPrice) {
  if (!klines || klines.length === 0 || !currentPrice) {
    return "mid"; // 기본값
  }

  // VWAP 계산 (Volume Weighted Average Price)
  let totalVolumePrice = 0;
  let totalVolume = 0;

  klines.forEach((kline) => {
    const typicalPrice = (kline.high + kline.low + kline.close) / 3;
    totalVolumePrice += typicalPrice * kline.volume;
    totalVolume += kline.volume;
  });

  const vwap = totalVolume > 0 ? totalVolumePrice / totalVolume : currentPrice;
  const diff = ((currentPrice - vwap) / vwap) * 100;

  if (diff > 2.0) return "above_vwap";
  if (diff < -2.0) return "below_vwap";
  return "mid";
}

/**
 * 거래 세션 계산 (UTC 기준)
 * @param {number} timestamp - Unix timestamp (milliseconds)
 * @returns {string} - "asia" | "london" | "newyork"
 */
function calculateSession(timestamp) {
  const date = new Date(timestamp);
  const utcHour = date.getUTCHours();

  // Asia: 00:00-08:00 UTC
  if (utcHour >= 0 && utcHour < 8) {
    return "asia";
  }
  // London: 08:00-16:00 UTC
  if (utcHour >= 8 && utcHour < 16) {
    return "london";
  }
  // New York: 16:00-24:00 UTC
  return "newyork";
}

/**
 * MarketState 계산
 * @param {Object} params
 * @param {Array} params.klines - OHLCV 데이터 배열
 * @param {number} params.timestamp - 타임스탬프
 * @param {string} params.symbol - Trading pair
 * @param {number} [params.currentPrice] - 현재 가격 (없으면 마지막 close 사용)
 * @returns {Object} MarketState
 */
export function calculateMarketState({
  klines,
  timestamp,
  symbol,
  currentPrice,
}) {
  if (!klines || klines.length === 0) {
    return {
      timestamp,
      symbol,
      volatilityState: "mid",
      trendState: "range",
      priceLocation: "mid",
      session: calculateSession(timestamp),
    };
  }

  const price = currentPrice || klines[klines.length - 1].close;

  return {
    timestamp,
    symbol,
    volatilityState: calculateVolatilityState(klines),
    trendState: calculateTrendState(klines),
    priceLocation: calculatePriceLocation(klines, price),
    session: calculateSession(timestamp),
  };
}

/**
 * 여러 타임스탬프에 대한 MarketState 일괄 계산
 * @param {Object} params
 * @param {Array} params.klines - OHLCV 데이터 배열
 * @param {Array<number>} params.timestamps - 타임스탬프 배열
 * @param {string} params.symbol - Trading pair
 * @returns {Array<Object>} MarketState 배열
 */
export function calculateMarketStatesForTimestamps({
  klines,
  timestamps,
  symbol,
}) {
  return timestamps.map((timestamp) => {
    // 해당 타임스탬프에 가장 가까운 kline 찾기
    const nearestKline = klines.reduce((prev, curr) => {
      return Math.abs(curr.timestamp - timestamp) <
        Math.abs(prev.timestamp - timestamp)
        ? curr
        : prev;
    });

    return calculateMarketState({
      klines,
      timestamp,
      symbol,
      currentPrice: nearestKline?.close,
    });
  });
}
