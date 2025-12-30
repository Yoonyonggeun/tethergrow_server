/* eslint-disable no-promise-executor-return */
// src/fetchers/bitget-orders-history.js
// Bitget Orders History Fetcher
// API: GET /api/v2/mix/order/orders-history

import { bitgetApiRequest } from "./bitget-api-client";

/**
 * Bitget Orders History 조회 (페이지네이션 지원)
 * @param {Object} params
 * @param {string} params.apiKey - API Key
 * @param {string} params.secretKey - Secret Key
 * @param {string} params.passphrase - Passphrase
 * @param {string} params.productType - "USDT-FUTURES" | "COIN-FUTURES" | "USDC-FUTURES"
 * @param {string} [params.symbol] - Trading pair (optional)
 * @param {string} [params.orderId] - Order ID (optional)
 * @param {string} [params.clientOid] - Client Order ID (optional)
 * @param {string} [params.orderSource] - Order source (optional)
 * @param {number} [params.startTime] - Start timestamp (milliseconds)
 * @param {number} [params.endTime] - End timestamp (milliseconds)
 * @param {string} [params.idLessThan] - Pagination: ID less than this value
 * @param {number} [params.limit] - Number of results (max 100, default 100)
 * @returns {Promise<Object>} - API response with entrustedList and endId
 */
export async function fetchOrdersHistory({
  apiKey,
  secretKey,
  passphrase,
  productType = "USDT-FUTURES",
  symbol,
  orderId,
  clientOid,
  orderSource,
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
  if (clientOid) params.clientOid = clientOid;
  if (orderSource) params.orderSource = orderSource;
  if (startTime) params.startTime = startTime.toString();
  if (endTime) params.endTime = endTime.toString();
  if (idLessThan) params.idLessThan = idLessThan;
  if (limit) params.limit = limit.toString();

  return bitgetApiRequest({
    apiKey,
    secretKey,
    passphrase,
    method: "GET",
    path: "/api/v2/mix/order/orders-history",
    params,
  });
}

/**
 * Bitget Orders History 전체 조회 (90일 백필)
 * @param {Object} params
 * @param {string} params.apiKey - API Key
 * @param {string} params.secretKey - Secret Key
 * @param {string} params.passphrase - Passphrase
 * @param {string} params.productType - "USDT-FUTURES" | "COIN-FUTURES" | "USDC-FUTURES"
 * @param {number} [params.days] - Number of days to fetch (default: 90)
 * @param {Function} [params.onProgress] - Progress callback (currentCount, totalCount)
 * @returns {Promise<Array>} - All orders history records
 */
export async function fetchAllOrdersHistory({
  apiKey,
  secretKey,
  passphrase,
  productType = "USDT-FUTURES",
  days = 90,
  onProgress,
}) {
  const allOrders = [];
  let idLessThan = null;
  let hasMore = true;
  let totalFetched = 0;

  const endTime = Date.now();
  const startTime = endTime - days * 24 * 60 * 60 * 1000;

  while (hasMore) {
    const params = {
      apiKey,
      secretKey,
      passphrase,
      productType,
      startTime,
      endTime,
      limit: 100,
    };

    if (idLessThan) {
      params.idLessThan = idLessThan;
    }

    const response = await fetchOrdersHistory(params);

    if (response.data && response.data.entrustedList) {
      allOrders.push(...response.data.entrustedList);
      totalFetched += response.data.entrustedList.length;

      if (onProgress) {
        onProgress(totalFetched, response.data.entrustedList.length);
      }

      // 다음 페이지가 있는지 확인
      if (response.data.endId && response.data.entrustedList.length === 100) {
        idLessThan = response.data.endId;
      } else {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }

    // Rate limit: 10 req/sec/UID
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return allOrders;
}
