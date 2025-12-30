// src/raw-storage/index.js
// Raw Storage Models 통합 엔트리 포인트

import crypto from "crypto";
import BitgetFillsRaw from "./bitget-fills-raw";
import BitgetOrdersRaw from "./bitget-orders-raw";
import BitgetPositionsRaw from "./bitget-positions-raw";
import OkxFillsRaw from "./okx-fills-raw";
import OkxOrdersRaw from "./okx-orders-raw";
import OkxPositionsRaw from "./okx-positions-raw";

export {
  BitgetFillsRaw,
  BitgetOrdersRaw,
  BitgetPositionsRaw,
  OkxFillsRaw,
  OkxOrdersRaw,
  OkxPositionsRaw,
};

/**
 * Raw 데이터 저장 헬퍼 함수
 * @param {string} apiKeyHash - API Key 해시
 * @param {Array} fills - Fill 데이터 배열
 * @param {Array} orders - Order 데이터 배열
 * @param {Array} positions - Position 데이터 배열
 * @param {string} productType - Product type
 * @returns {Promise<Object>} - 저장 결과
 */

export async function saveRawData({
  apiKeyHash,
  fills = [],
  orders = [],
  positions = [],
  productType = "USDT-FUTURES",
}) {
  // API Key 해시 생성 (이미 해시된 경우 그대로 사용)
  const hash = apiKeyHash.includes(":")
    ? crypto.createHash("sha256").update(apiKeyHash).digest("hex")
    : apiKeyHash;

  const results = {
    fills: [],
    orders: [],
    positions: [],
  };

  // Fills 저장
  if (fills.length > 0) {
    const fillDocs = fills.map((fill) => ({
      rawData: fill,
      apiKeyHash: hash,
      productType,
      tradeId: fill.tradeId,
      orderId: fill.orderId,
      symbol: fill.symbol,
      cTime: fill.cTime,
    }));

    // 중복 제거: tradeId 기준
    const existingTradeIds = await BitgetFillsRaw.distinct("tradeId", {
      apiKeyHash: hash,
    });
    const newFills = fillDocs.filter(
      (doc) => !existingTradeIds.includes(doc.tradeId)
    );

    if (newFills.length > 0) {
      results.fills = await BitgetFillsRaw.insertMany(newFills, {
        ordered: false,
      });
    }
  }

  // Orders 저장
  if (orders.length > 0) {
    const orderDocs = orders.map((order) => ({
      rawData: order,
      apiKeyHash: hash,
      productType,
      orderId: order.orderId,
      clientOid: order.clientOid,
      symbol: order.symbol,
      cTime: order.cTime,
    }));

    // 중복 제거: orderId 기준
    const existingOrderIds = await BitgetOrdersRaw.distinct("orderId", {
      apiKeyHash: hash,
    });
    const newOrders = orderDocs.filter(
      (doc) => !existingOrderIds.includes(doc.orderId)
    );

    if (newOrders.length > 0) {
      results.orders = await BitgetOrdersRaw.insertMany(newOrders, {
        ordered: false,
      });
    }
  }

  // Positions 저장
  if (positions.length > 0) {
    const positionDocs = positions.map((position) => ({
      rawData: position,
      apiKeyHash: hash,
      productType,
      positionId: position.positionId,
      symbol: position.symbol,
      ctime: position.ctime,
    }));

    // 중복 제거: positionId 기준
    const existingPositionIds = await BitgetPositionsRaw.distinct(
      "positionId",
      {
        apiKeyHash: hash,
      }
    );
    const newPositions = positionDocs.filter(
      (doc) => !existingPositionIds.includes(doc.positionId)
    );

    if (newPositions.length > 0) {
      results.positions = await BitgetPositionsRaw.insertMany(newPositions, {
        ordered: false,
      });
    }
  }

  return results;
}

/**
 * Save OKX raw data with deduplication
 * @param {Object} params
 * @param {string} params.apiKeyHash
 * @param {Array} params.fills
 * @param {Array} params.orders
 * @param {Array} params.positions
 * @param {string} [params.instType]
 * @returns {Promise<Object>}
 */
export async function saveOkxRawData({
  apiKeyHash,
  fills = [],
  orders = [],
  positions = [],
  instType = "SWAP",
}) {
  const hash =
    apiKeyHash && apiKeyHash.length === 64 && /^[a-f0-9]+$/i.test(apiKeyHash)
      ? apiKeyHash
      : crypto.createHash("sha256").update(apiKeyHash).digest("hex");

  const results = { fills: [], orders: [], positions: [] };

  if (fills.length > 0) {
    const fillDocs = fills.map((fill) => ({
      rawData: fill,
      apiKeyHash: hash,
      instType,
      instId: fill.instId,
      tradeId: fill.tradeId,
      ordId: fill.ordId,
      ts: fill.ts || fill.fillTime,
    }));

    const existingTradeIds = await OkxFillsRaw.distinct("tradeId", {
      apiKeyHash: hash,
    });
    const newFills = fillDocs.filter(
      (doc) => doc.tradeId && !existingTradeIds.includes(doc.tradeId)
    );

    if (newFills.length > 0) {
      results.fills = await OkxFillsRaw.insertMany(newFills, {
        ordered: false,
      });
    }
  }

  if (orders.length > 0) {
    const orderDocs = orders.map((order) => ({
      rawData: order,
      apiKeyHash: hash,
      instType,
      instId: order.instId,
      ordId: order.ordId,
      clOrdId: order.clOrdId,
      cTime: order.cTime,
    }));

    const existingOrdIds = await OkxOrdersRaw.distinct("ordId", {
      apiKeyHash: hash,
    });
    const newOrders = orderDocs.filter(
      (doc) => doc.ordId && !existingOrdIds.includes(doc.ordId)
    );

    if (newOrders.length > 0) {
      results.orders = await OkxOrdersRaw.insertMany(newOrders, {
        ordered: false,
      });
    }
  }

  if (positions.length > 0) {
    const positionDocs = positions.map((position) => ({
      rawData: position,
      apiKeyHash: hash,
      instType,
      instId: position.instId,
      posId: position.posId,
      ts: position.ts,
    }));

    const existingPosIds = await OkxPositionsRaw.distinct("posId", {
      apiKeyHash: hash,
    });
    const newPositions = positionDocs.filter(
      (doc) => doc.posId && !existingPosIds.includes(doc.posId)
    );

    if (newPositions.length > 0) {
      results.positions = await OkxPositionsRaw.insertMany(newPositions, {
        ordered: false,
      });
    }
  }

  return results;
}
