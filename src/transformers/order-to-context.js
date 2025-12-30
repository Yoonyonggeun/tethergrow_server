// src/transformers/order-to-context.js
// Order → UnifiedContext 변환

/**
 * orderSource를 표준화
 * @param {string} orderSource - Bitget orderSource 값
 * @returns {string} - 표준화된 orderSource
 */
function normalizeOrderSource(orderSource) {
  if (!orderSource) return "normal";
  return orderSource.toLowerCase();
}

/**
 * Raw Order 데이터를 UnifiedContext로 변환
 * @param {Object} rawOrder - Bitget order raw data
 * @returns {Object} UnifiedContext
 */
export function transformOrderToContext(rawOrder) {
  const order = rawOrder.rawData || rawOrder;

  // Stop Loss/Take Profit 확인
  const hasSL = !!(
    order.presetStopLossPrice && parseFloat(order.presetStopLossPrice) > 0
  );
  const hasTP = !!(
    order.presetStopSurplusPrice && parseFloat(order.presetStopSurplusPrice) > 0
  );

  // reduceOnly 확인
  const reduceOnly = order.reduceOnly === "YES" || order.reduceOnly === true;

  return {
    orderId: order.orderId || "",
    orderType: order.orderType || "limit",
    orderSource: normalizeOrderSource(order.orderSource),
    leverage: parseFloat(order.leverage || 1),
    marginMode: order.marginMode || "isolated",
    reduceOnly,
    hasSL,
    hasTP,
    orderCreatedAt: parseInt(order.cTime, 10) || Date.now(),
    orderUpdatedAt:
      parseInt(order.uTime, 10) || parseInt(order.cTime, 10) || Date.now(),
    liquidationPrice: order.liqPrice ? parseFloat(order.liqPrice) : null,
  };
}

/**
 * 여러 Order 데이터를 일괄 변환
 * @param {Array<Object>} rawOrders - Raw order 데이터 배열
 * @returns {Array<Object>} UnifiedContext 배열
 */
export function transformOrdersToContexts(rawOrders) {
  return rawOrders.map(transformOrderToContext);
}
