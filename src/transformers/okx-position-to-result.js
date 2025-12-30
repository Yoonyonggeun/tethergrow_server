// src/transformers/okx-position-to-result.js
// OKX Position → UnifiedResult 변환
// Assumptions:
// - posSide differentiates long/short when hedge mode; otherwise side inferred as long.
// - Realized PnL fields use pnl/netPnl from OKX response (USDT denominated for USDT-margined swaps).

function mapDirection(posSide) {
  if (!posSide) return "long";
  const normalized = posSide.toLowerCase();
  if (normalized === "short") return "short";
  return "long";
}

export function transformOkxPositionToResult(rawPosition) {
  const position = rawPosition.rawData || rawPosition;

  const openTime = parseInt(position.openTime || position.cTime, 10) || Date.now();
  const closeTime =
    parseInt(position.closeTime || position.uTime || position.ts, 10) || Date.now();

  return {
    positionId: position.posId || "",
    symbol: (position.instId || "").toUpperCase(),
    direction: mapDirection(position.posSide),
    positionMode: position.posSide ? "hedge_mode" : "one_way_mode",
    marginMode: position.mgnMode || position.tdMode || "isolated",
    entryPrice: parseFloat(position.openAvgPx || 0),
    exitPrice: parseFloat(position.closeAvgPx || position.avgPx || 0),
    openTime,
    closeTime,
    realizedPnl: parseFloat(position.pnl || 0),
    netProfit: parseFloat(position.netPnl || position.pnl || 0),
    fundingCost: parseFloat(position.funding || position.fundingFee || 0),
    openFee: parseFloat(position.openFee || 0),
    closeFee: parseFloat(position.closeFee || 0),
  };
}

export function transformOkxPositionsToResults(rawPositions) {
  return rawPositions.map(transformOkxPositionToResult);
}
