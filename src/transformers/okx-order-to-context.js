// src/transformers/okx-order-to-context.js
// OKX Order → UnifiedContext 변환
// Assumptions:
// - tdMode maps to isolated/cross marginMode.
// - reduceOnly flag follows OKX reduceOnly boolean/string.

function normalizeMarginMode(tdMode) {
  if (!tdMode) return "isolated";
  return tdMode.toLowerCase() === "cross" ? "cross" : "isolated";
}

export function transformOkxOrderToContext(rawOrder) {
  const order = rawOrder.rawData || rawOrder;

  const reduceOnly =
    order.reduceOnly === true ||
    order.reduceOnly === "true" ||
    order.reduceOnly === "1";

  return {
    orderId: order.ordId || "",
    orderType: order.ordType || "limit",
    orderSource: (order.source || order.tgtCcy || "normal").toString(),
    leverage: parseFloat(order.lever || 1),
    marginMode: normalizeMarginMode(order.tdMode),
    reduceOnly,
    hasSL: !!(order.slOrdPx && parseFloat(order.slOrdPx) > 0),
    hasTP: !!(order.tpOrdPx && parseFloat(order.tpOrdPx) > 0),
    orderCreatedAt: parseInt(order.cTime, 10) || Date.now(),
    orderUpdatedAt:
      parseInt(order.uTime, 10) || parseInt(order.cTime, 10) || Date.now(),
    liquidationPrice: order.liqPx ? parseFloat(order.liqPx) : null,
  };
}

export function transformOkxOrdersToContexts(rawOrders) {
  return rawOrders.map(transformOkxOrderToContext);
}
