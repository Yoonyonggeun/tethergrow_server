// src/fetchers/bitget-fill-history.js
// Bitget Fill History Fetcher
// API: GET /api/v2/mix/order/fill-history

import { bitgetApiRequest } from "./bitget-api-client";

/**
 * Bitget Fill History 조회 (페이지네이션 지원)
 * @param {Object} params
 * @param {string} params.apiKey - API Key
 * @param {string} params.secretKey - Secret Key
 * @param {string} params.passphrase - Passphrase
 * @param {string} params.productType - "USDT-FUTURES" | "COIN-FUTURES" | "USDC-FUTURES"
 * @param {string} [params.symbol] - Trading pair (optional)
 * @param {string} [params.orderId] - Order ID (optional)
 * @param {number} [params.startTime] - Start timestamp (milliseconds)
 * @param {number} [params.endTime] - End timestamp (milliseconds)
 * @param {string} [params.idLessThan] - Pagination: ID less than this value
 * @param {number} [params.limit] - Number of results (max 100, default 100)
 * @returns {Promise<Object>} - API response with fillList and endId
 */
export async function fetchFillHistory({
  apiKey,
  secretKey,
  passphrase,
  productType = "USDT-FUTURES",
  symbol,
  orderId,
  startTime,
  endTime,
  idLessThan,
  limit = 100,
}) {
  const params = {
    productType,
  };

  if (symbol) params.symbol = symbol;
  if (orderId) params.orderId = orderId;
  if (startTime) params.startTime = startTime.toString();
  if (endTime) params.endTime = endTime.toString();
  if (idLessThan) params.idLessThan = idLessThan;
  if (limit) params.limit = limit.toString();

  return bitgetApiRequest({
    apiKey,
    secretKey,
    passphrase,
    method: "GET",
    path: "/api/v2/mix/order/fill-history",
    params,
  });
}

/**
 * Bitget Fill History 전체 조회 (90일 백필)
 * Bitget API는 최대 7일 간격만 허용하므로 7일씩 나눠서 요청
 * @param {Object} params
 * @param {string} params.apiKey - API Key
 * @param {string} params.secretKey - Secret Key
 * @param {string} params.passphrase - Passphrase
 * @param {string} params.productType - "USDT-FUTURES" | "COIN-FUTURES" | "USDC-FUTURES"
 * @param {number} [params.days] - Number of days to fetch (default: 90)
 * @param {Function} [params.onProgress] - Progress callback (currentCount, totalCount)
 * @returns {Promise<Array>} - All fill history records
 */
export async function fetchAllFillHistory({
  apiKey,
  secretKey,
  passphrase,
  productType = "USDT-FUTURES",
  days = 90,
  onProgress,
}) {
  const allFills = [];
  const endTime = Date.now();
  const startTime = endTime - days * 24 * 60 * 60 * 1000;

  // 7일씩 나눠서 요청 (Bitget API 제한)
  const maxIntervalDays = 7;
  const intervals = Math.ceil(days / maxIntervalDays);
  let totalFetched = 0;

  for (let i = 0; i < intervals; i += 1) {
    // 각 구간의 시작/종료 시간 계산
    const intervalEndTime = endTime - i * maxIntervalDays * 24 * 60 * 60 * 1000;
    const intervalStartTime = Math.max(
      startTime,
      intervalEndTime - maxIntervalDays * 24 * 60 * 60 * 1000
    );

    let idLessThan = null;
    let hasMore = true;

    while (hasMore) {
      const params = {
        apiKey,
        secretKey,
        passphrase,
        productType,
        startTime: intervalStartTime,
        endTime: intervalEndTime,
        limit: 100,
      };

      if (idLessThan) {
        params.idLessThan = idLessThan;
      }

      const response = await fetchFillHistory(params);

      if (response.data && response.data.fillList) {
        allFills.push(...response.data.fillList);
        totalFetched += response.data.fillList.length;

        if (onProgress) {
          onProgress(totalFetched, response.data.fillList.length);
        }

        // 다음 페이지가 있는지 확인
        if (response.data.endId && response.data.fillList.length === 100) {
          idLessThan = response.data.endId;
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }

      // Rate limit: 10 req/sec/UID
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 100);
      });
    }

    // 구간 간 대기 (API 부하 방지)
    if (i < intervals - 1) {
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 200);
      });
    }
  }

  return allFills;
}
