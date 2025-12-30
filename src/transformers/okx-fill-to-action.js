/* eslint-disable operator-linebreak */
// src/transformers/okx-fill-to-action.js
// OKX Fill → UnifiedAction 변환
// Assumptions:
// - instType is futures/swap (USDT or coin margined); fee currency provided by feeCcy.
// - posSide indicates hedge mode; absence -> one-way.
// - fillSz is treated as base quantity; quote qty derived via fillPx * fillSz.

function mapLifecycleHint(side, posSide) {
  // Without explicit trade type from OKX, infer close when side opposes position side.
  if (!posSide) return "open";
  const normalizedPos = posSide.toLowerCase();
  const normalizedSide = (side || "").toLowerCase();
  if (normalizedPos === "long" && normalizedSide === "sell") return "close";
  if (normalizedPos === "short" && normalizedSide === "buy") return "close";
  return "open";
}

function normalizeExecutionRole(execType) {
  if (!execType) return "taker";
  return execType.toUpperCase() === "M" ? "maker" : "taker";
}

export function transformOkxFillToAction(rawFill) {
  const fill = rawFill.rawData || rawFill;

  const fillPrice = parseFloat(fill.fillPx || fill.px || 0);
  const baseQty = parseFloat(fill.fillSz || fill.sz || 0);
  const feeValue = Math.abs(parseFloat(fill.fee || 0));

  return {
    timestamp: parseInt(fill.ts || fill.fillTime || Date.now(), 10),
    symbol: (fill.instId || "").toUpperCase(),
    side: (fill.side || "buy").toLowerCase() === "sell" ? "sell" : "buy",
    lifecycleHint: mapLifecycleHint(fill.side, fill.posSide),
    positionMode: fill.posSide ? "hedge_mode" : "one_way_mode",
    executionRole: normalizeExecutionRole(fill.execType),
    fillPrice,
    baseQty,
    quoteQty: fillPrice * baseQty,
    fee: feeValue,
    feeCurrency: (fill.feeCcy || "").toUpperCase() || null,
    source: fill.source || "UNKNOWN",
    orderId: fill.ordId || "",
    tradeId: fill.tradeId || "",
  };
}

export function transformOkxFillsToActions(rawFills) {
  return rawFills.map(transformOkxFillToAction);
}
