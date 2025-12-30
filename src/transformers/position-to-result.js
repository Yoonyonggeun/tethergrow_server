// src/transformers/position-to-result.js
// Position → UnifiedResult 변환

/**
 * holdSide를 direction으로 변환
 * @param {string} holdSide - Bitget holdSide 값
 * @returns {string} - "long" | "short"
 */
function mapDirection(holdSide) {
  if (!holdSide) return "long";
  return holdSide.toLowerCase() === "short" ? "short" : "long";
}

/**
 * Raw Position 데이터를 UnifiedResult로 변환
 * @param {Object} rawPosition - Bitget position raw data
 * @returns {Object} UnifiedResult
 */
export function transformPositionToResult(rawPosition) {
  const position = rawPosition.rawData || rawPosition;

  const openTime = parseInt(position.ctime, 10) || Date.now();
  const closeTime = parseInt(position.utime, 10) || Date.now();

  return {
    positionId: position.positionId || "",
    symbol: (position.symbol || "").toUpperCase(),
    direction: mapDirection(position.holdSide),
    positionMode: position.posMode || "one_way_mode",
    marginMode: position.marginMode || "isolated",
    entryPrice: parseFloat(position.openAvgPrice || 0),
    exitPrice: parseFloat(position.closeAvgPrice || 0),
    openTime,
    closeTime,
    realizedPnl: parseFloat(position.pnl || 0),
    netProfit: parseFloat(position.netProfit || 0),
    fundingCost: parseFloat(position.totalFunding || 0),
    openFee: parseFloat(position.openFee || 0),
    closeFee: parseFloat(position.closeFee || 0),
  };
}

/**
 * 여러 Position 데이터를 일괄 변환
 * @param {Array<Object>} rawPositions - Raw position 데이터 배열
 * @returns {Array<Object>} UnifiedResult 배열
 */
export function transformPositionsToResults(rawPositions) {
  return rawPositions.map(transformPositionToResult);
}
