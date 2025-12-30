// src/market/ohlcv-fetcher.js
// OHLCV 데이터 수집 (Binance Public API 사용)

import axios from "axios";

const BINANCE_API_BASE_URL = "https://api.binance.com";

/**
 * Binance Kline 데이터 조회
 * @param {Object} params
 * @param {string} params.symbol - Trading pair (e.g., "BTCUSDT")
 * @param {string} params.interval - Timeframe ("1m" | "5m" | "1h" | "1d" 등)
 * @param {number} params.startTime - Start timestamp (milliseconds)
 * @param {number} params.endTime - End timestamp (milliseconds)
 * @param {number} [params.limit] - 최대 개수 (default: 1000)
 * @returns {Promise<Array>} - OHLCV 데이터 배열
 */
export async function fetchBinanceKlines({
  symbol,
  interval,
  startTime,
  endTime,
  limit = 1000,
}) {
  const params = {
    symbol: symbol.toUpperCase(),
    interval,
    startTime,
    endTime,
    limit,
  };

  try {
    const response = await axios.get(`${BINANCE_API_BASE_URL}/api/v3/klines`, {
      params,
    });

    // Binance 응답 형식: [timestamp, open, high, low, close, volume, ...]
    return response.data.map((kline) => ({
      timestamp: kline[0],
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
    }));
  } catch (error) {
    throw new Error(`Binance Kline fetch failed: ${error.message}`);
  }
}

/**
 * 90일 OHLCV 데이터 조회 (1m, 5m)
 * @param {Object} params
 * @param {string} params.symbol - Trading pair (e.g., "BTCUSDT", "ETHUSDT")
 * @param {number} [params.days] - Number of days (default: 90)
 * @returns {Promise<Object>} - { "1m": [...], "5m": [...] }
 */
export async function fetchOHLCVData({ symbol, days = 90 }) {
  const endTime = Date.now();
  const startTime = endTime - days * 24 * 60 * 60 * 1000;

  const [klines1m, klines5m] = await Promise.all([
    fetchBinanceKlines({
      symbol,
      interval: "1m",
      startTime,
      endTime,
      limit: 1000,
    }),
    fetchBinanceKlines({
      symbol,
      interval: "5m",
      startTime,
      endTime,
      limit: 1000,
    }),
  ]);

  return {
    "1m": klines1m,
    "5m": klines5m,
  };
}
