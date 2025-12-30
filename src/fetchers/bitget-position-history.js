/* eslint-disable no-promise-executor-return */
// src/fetchers/bitget-position-history.js
// Bitget Position History Fetcher
// API: GET /api/v2/mix/position/history-position

import { bitgetApiRequest } from "./bitget-api-client";

/**
 * Bitget Position History 조회 (페이지네이션 지원)
 * @param {Object} params
 * @param {string} params.apiKey - API Key
 * @param {string} params.secretKey - Secret Key
 * @param {string} params.passphrase - Passphrase
 * @param {string} [params.productType] - "USDT-FUTURES" | "COIN-FUTURES" | "USDC-FUTURES" (default: "USDT-FUTURES")
 * @param {string} [params.symbol] - Trading pair (optional)
 * @param {number} [params.startTime] - Start timestamp (milliseconds)
 * @param {number} [params.endTime] - End timestamp (milliseconds)
 * @param {string} [params.idLessThan] - Pagination: ID less than this value
 * @param {number} [params.limit] - Number of results (max 100, default 20)
 * @returns {Promise<Object>} - API response with list and endId
 */
export async function fetchPositionHistory({
  apiKey,
  secretKey,
  passphrase,
  productType = "USDT-FUTURES",
  symbol,
  startTime,
  endTime,
  idLessThan,
  limit = 20,
}) {
  const params = {
    productType,
  };

  if (symbol) params.symbol = symbol;
  if (startTime) params.startTime = startTime.toString();
  if (endTime) params.endTime = endTime.toString();
  if (idLessThan) params.idLessThan = idLessThan;
  if (limit) params.limit = limit.toString();

  return bitgetApiRequest({
    apiKey,
    secretKey,
    passphrase,
    method: "GET",
    path: "/api/v2/mix/position/history-position",
    params,
  });
}

/**
 * Bitget Position History 전체 조회 (90일 백필, 최대 3개월)
 * @param {Object} params
 * @param {string} params.apiKey - API Key
 * @param {string} params.secretKey - Secret Key
 * @param {string} params.passphrase - Passphrase
 * @param {string} [params.productType] - "USDT-FUTURES" | "COIN-FUTURES" | "USDC-FUTURES"
 * @param {number} [params.days] - Number of days to fetch (default: 90, max: 90)
 * @param {Function} [params.onProgress] - Progress callback (currentCount, totalCount)
 * @returns {Promise<Array>} - All position history records
 */
export async function fetchAllPositionHistory({
  apiKey,
  secretKey,
  passphrase,
  productType = "USDT-FUTURES",
  days = 90,
  onProgress,
}) {
  const allPositions = [];
  let idLessThan = null;
  let hasMore = true;
  let totalFetched = 0;

  // Bitget API는 최대 3개월 데이터만 제공
  const maxDays = Math.min(days, 90);
  const endTime = Date.now();
  const startTime = endTime - maxDays * 24 * 60 * 60 * 1000;

  while (hasMore) {
    const params = {
      apiKey,
      secretKey,
      passphrase,
      productType,
      startTime,
      endTime,
      limit: 100, // 최대값 사용
    };

    if (idLessThan) {
      params.idLessThan = idLessThan;
    }

    const response = await fetchPositionHistory(params);

    if (response.data && response.data.list) {
      allPositions.push(...response.data.list);
      totalFetched += response.data.list.length;

      if (onProgress) {
        onProgress(totalFetched, response.data.list.length);
      }

      // 다음 페이지가 있는지 확인
      if (response.data.endId && response.data.list.length === 100) {
        idLessThan = response.data.endId;
      } else {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }

    // Rate limit: 20 times/S (uid)
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return allPositions;
}
