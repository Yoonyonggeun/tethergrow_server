/* eslint-disable no-await-in-loop */
// src/fetchers/okx-orders-history.js
// OKX Orders History Fetcher
// API: GET /api/v5/trade/orders-history-archive

import { okxApiRequest } from "./okx-api-client";

/**
 * Fetch a single page of OKX orders history
 * @param {Object} params
 * @param {string} params.apiKey
 * @param {string} params.secretKey
 * @param {string} params.passphrase
 * @param {string} params.instType
 * @param {string} [params.instId]
 * @param {string} [params.before]
 * @param {string} [params.after]
 * @param {number} [params.limit]
 * @returns {Promise<Object>}
 */
export async function fetchOkxOrdersHistoryPage({
  apiKey,
  secretKey,
  passphrase,
  instType = "SWAP",
  instId,
  before,
  after,
  limit = 100,
}) {
  const params = {
    instType,
    limit: limit.toString(),
  };

  if (instId) params.instId = instId;
  if (before) params.before = before;
  if (after) params.after = after;

  const { data, headers } = await okxApiRequest({
    apiKey,
    secretKey,
    passphrase,
    method: "GET",
    path: "/api/v5/trade/orders-history-archive",
    params,
  });

  return {
    data: data.data || [],
    before: headers["ok-before"],
    after: headers["ok-after"],
  };
}

/**
 * Fetch all OKX orders history with pagination
 * @param {Object} params
 * @param {string} params.apiKey
 * @param {string} params.secretKey
 * @param {string} params.passphrase
 * @param {string} params.instType
 * @param {string} [params.instId]
 * @param {Function} [params.onProgress]
 * @returns {Promise<Array>}
 */
export async function fetchAllOkxOrdersHistory({
  apiKey,
  secretKey,
  passphrase,
  instType = "SWAP",
  instId,
  onProgress,
}) {
  const allOrders = [];
  let before = null;
  let hasMore = true;

  while (hasMore) {
    const { data, before: nextBefore } = await fetchOkxOrdersHistoryPage({
      apiKey,
      secretKey,
      passphrase,
      instType,
      instId,
      before,
      limit: 100,
    });

    allOrders.push(...data);

    if (onProgress) {
      onProgress(allOrders.length, data.length);
    }

    if (data.length === 100 && nextBefore) {
      before = nextBefore;
    } else {
      hasMore = false;
    }

    // Rate limit buffer: private trade endpoints 20 requests/2s
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return allOrders;
}
