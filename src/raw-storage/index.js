// src/raw-storage/index.js
// Raw Storage Models 통합 엔트리 포인트

import crypto from "crypto";
import BitgetFillsRaw from "./bitget-fills-raw";
import BitgetOrdersRaw from "./bitget-orders-raw";
import BitgetPositionsRaw from "./bitget-positions-raw";

export { BitgetFillsRaw, BitgetOrdersRaw, BitgetPositionsRaw };

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
