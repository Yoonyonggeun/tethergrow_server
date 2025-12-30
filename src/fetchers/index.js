// src/fetchers/index.js
// Bitget API Fetchers 통합 엔트리 포인트

// 같은 파일에서 사용하기 위한 import
import { fetchAllFillHistory } from "./bitget-fill-history";
import { fetchAllOrdersHistory } from "./bitget-orders-history";
import { fetchAllPositionHistory } from "./bitget-position-history";

export { bitgetApiRequest, createBitgetHeaders } from "./bitget-api-client";
export { fetchFillHistory, fetchAllFillHistory } from "./bitget-fill-history";
export {
  fetchOrdersHistory,
  fetchAllOrdersHistory,
} from "./bitget-orders-history";
export {
  fetchPositionHistory,
  fetchAllPositionHistory,
} from "./bitget-position-history";

/**
 * 모든 Bitget 데이터를 한 번에 가져오기 (90일)
 * @param {Object} params
 * @param {string} params.apiKey - API Key
 * @param {string} params.secretKey - Secret Key
 * @param {string} params.passphrase - Passphrase
 * @param {string} [params.productType] - "USDT-FUTURES" | "COIN-FUTURES" | "USDC-FUTURES"
 * @param {number} [params.days] - Number of days (default: 90)
 * @param {Function} [params.onProgress] - Progress callback
 * @returns {Promise<Object>} - { fills, orders, positions }
 */
export async function fetchAllBitgetData({
  apiKey,
  secretKey,
  passphrase,
  productType = "USDT-FUTURES",
  days = 90,
  onProgress,
}) {
  const results = {
    fills: [],
    orders: [],
    positions: [],
  };

  // 병렬로 모든 데이터 가져오기
  const [fills, orders, positions] = await Promise.all([
    fetchAllFillHistory({
      apiKey,
      secretKey,
      passphrase,
      productType,
      days,
      onProgress: onProgress
        ? (count, batch) => onProgress("fills", count, batch)
        : undefined,
    }),
    fetchAllOrdersHistory({
      apiKey,
      secretKey,
      passphrase,
      productType,
      days,
      onProgress: onProgress
        ? (count, batch) => onProgress("orders", count, batch)
        : undefined,
    }),
    fetchAllPositionHistory({
      apiKey,
      secretKey,
      passphrase,
      productType,
      days,
      onProgress: onProgress
        ? (count, batch) => onProgress("positions", count, batch)
        : undefined,
    }),
  ]);

  results.fills = fills;
  results.orders = orders;
  results.positions = positions;

  return results;
}
