// src/labels/result-label-generator.js
// ResultLabel 생성 (UnifiedResult에서만 생성)

/**
 * PnL 버킷팅
 * @param {number} netProfit - 순이익
 * @returns {string} - "large_loss" | "small_loss" | "small_win" | "large_win"
 */
function bucketPnL(netProfit) {
  if (netProfit < -100) return "large_loss";
  if (netProfit < 0) return "small_loss";
  if (netProfit < 100) return "small_win";
  return "large_win";
}

/**
 * 보유 시간 버킷팅
 * @param {number} holdingTimeMs - 보유 시간 (밀리초)
 * @returns {string} - "0-1h" | "1-6h" | "6-24h" | "24h+"
 */
function bucketHoldingTime(holdingTimeMs) {
  const hours = holdingTimeMs / (1000 * 60 * 60);
  if (hours < 1) return "0-1h";
  if (hours < 6) return "1-6h";
  if (hours < 24) return "6-24h";
  return "24h+";
}

/**
 * 결과 분류 (win | loss | breakeven)
 * @param {number} netProfit - 순이익
 * @returns {string} - "win" | "loss" | "breakeven"
 */
function classifyOutcome(netProfit) {
  const threshold = 0.01; // 0.01 USDT 이상 차이를 의미있는 것으로 간주
  if (netProfit > threshold) return "win";
  if (netProfit < -threshold) return "loss";
  return "breakeven";
}

/**
 * UnifiedResult로부터 ResultLabel 생성
 * @param {Object} result - UnifiedResult
 * @returns {Object} ResultLabel
 */
export function generateResultLabel(result) {
  const netProfit = result.netProfit || 0;
  const holdingTimeMs = result.closeTime - result.openTime;

  return {
    outcome: classifyOutcome(netProfit),
    pnlBucket: bucketPnL(netProfit),
    holdingBucket: bucketHoldingTime(holdingTimeMs),
  };
}

/**
 * 여러 UnifiedResult에 대한 ResultLabel 일괄 생성
 * @param {Array<Object>} results - UnifiedResult 배열
 * @returns {Array<Object>} ResultLabel 배열
 */
export function generateResultLabels(results) {
  return results.map((result) => ({
    ...generateResultLabel(result),
    positionId: result.positionId, // 참조용
    symbol: result.symbol, // 참조용
  }));
}
