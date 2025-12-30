/* eslint-disable operator-linebreak */
// src/transformers/fill-to-action.js
// Fill → UnifiedAction 변환

/**
 * tradeSide를 lifecycleHint로 변환
 * @param {string} tradeSide - Bitget tradeSide 값
 * @returns {string} - "open" | "close" | "reduce"
 */
function mapLifecycleHint(tradeSide) {
  if (!tradeSide) return "open";

  // Open 관련
  if (
    tradeSide.includes("open") ||
    tradeSide === "buy_single" ||
    tradeSide === "sell_single"
  ) {
    return "open";
  }

  // Close 관련
  if (
    tradeSide.includes("close") ||
    tradeSide.includes("burst") ||
    tradeSide.includes("delivery") ||
    tradeSide.includes("adl")
  ) {
    return "close";
  }

  // Reduce 관련
  if (tradeSide.includes("reduce")) {
    return "reduce";
  }

  return "open"; // 기본값
}

/**
 * side를 표준화
 * @param {string} side - Bitget side 값
 * @returns {string} - "buy" | "sell"
 */
function normalizeSide(side) {
  if (!side) return "buy";
  return side.toLowerCase() === "sell" ? "sell" : "buy";
}

/**
 * Raw Fill 데이터를 UnifiedAction으로 변환
 * @param {Object} rawFill - Bitget fill raw data
 * @returns {Object} UnifiedAction
 */
export function transformFillToAction(rawFill) {
  const fill = rawFill.rawData || rawFill;

  // feeDetail에서 총 수수료 계산
  let totalFee = 0;
  if (fill.feeDetail && Array.isArray(fill.feeDetail)) {
    fill.feeDetail.forEach((fee) => {
      const feeValue = parseFloat(fee.totalFee || 0);
      totalFee += Math.abs(feeValue); // 절댓값 사용
    });
  }

  return {
    timestamp: parseInt(fill.cTime, 10) || Date.now(),
    symbol: (fill.symbol || "").toUpperCase(),
    side: normalizeSide(fill.side),
    lifecycleHint: mapLifecycleHint(fill.tradeSide),
    positionMode: fill.posMode || "one_way_mode",
    executionRole: fill.tradeScope === "maker" ? "maker" : "taker",
    fillPrice: parseFloat(fill.price || 0),
    baseQty: parseFloat(fill.baseVolume || 0),
    quoteQty: parseFloat(fill.quoteVolume || 0),
    fee: totalFee,
    source: fill.enterPointSource || "UNKNOWN",
    orderId: fill.orderId || "",
    tradeId: fill.tradeId || "",
  };
}

/**
 * 여러 Fill 데이터를 일괄 변환
 * @param {Array<Object>} rawFills - Raw fill 데이터 배열
 * @returns {Array<Object>} UnifiedAction 배열
 */
export function transformFillsToActions(rawFills) {
  return rawFills.map(transformFillToAction);
}
