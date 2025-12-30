/* eslint-disable no-await-in-loop */
// src/fetchers/okx-fill-history.js
// OKX Fill History Fetcher
// API: GET /api/v5/trade/fills

import { okxApiRequest } from "./okx-api-client";

/**
 * Fetch a single page of OKX fills
 * @param {Object} params
 * @param {string} params.apiKey
 * @param {string} params.secretKey
 * @param {string} params.passphrase
 * @param {string} params.instType - e.g., "SWAP" | "FUTURES"
 * @param {string} [params.instId]
 * @param {string} [params.before]
 * @param {string} [params.after]
 * @param {number} [params.limit]
 * @returns {Promise<Object>}
 */
export async function fetchOkxFillHistoryPage({
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
    path: "/api/v5/trade/fills",
    params,
  });

  return {
    data: data.data || [],
    before: headers["ok-before"],
    after: headers["ok-after"],
  };
}

/**
 * Fetch all OKX fills with pagination
 * @param {Object} params
 * @param {string} params.apiKey
 * @param {string} params.secretKey
 * @param {string} params.passphrase
 * @param {string} params.instType
 * @param {string} [params.instId]
 * @param {Function} [params.onProgress]
 * @returns {Promise<Array>}
 */
export async function fetchAllOkxFills({
  apiKey,
  secretKey,
  passphrase,
  instType = "SWAP",
  instId,
  onProgress,
}) {
  const allFills = [];
  let before = null;
  let hasMore = true;

  while (hasMore) {
    const { data, before: nextBefore } = await fetchOkxFillHistoryPage({
      apiKey,
      secretKey,
      passphrase,
      instType,
      instId,
      before,
      limit: 100,
    });

    allFills.push(...data);

    if (onProgress) {
      onProgress(allFills.length, data.length);
    }

    if (data.length === 100 && nextBefore) {
      before = nextBefore;
    } else {
      hasMore = false;
    }

    // Rate limit: safe buffer for OKX (max 20 requests/2s for private trade endpoints)
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return allFills;
}
