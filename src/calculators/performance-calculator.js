/* eslint-disable import/prefer-default-export */
/* eslint-disable operator-linebreak */
/* eslint-disable no-nested-ternary */
// src/calculators/performance-calculator.js
// Performance 메트릭 계산

/**
 * Performance 메트릭 계산
 * @param {Object} params
 * @param {Array<Object>} params.results - UnifiedResult 배열
 * @param {Array<Object>} params.contexts - UnifiedContext 배열
 * @returns {Object} Performance 메트릭
 */
export function calculatePerformanceMetrics({ results, contexts = [] }) {
  if (!results || results.length === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      avgRiskReward: 0,
      avgLeverage: 0,
      longShortRatio: 0,
    };
  }

  const totalTrades = results.length;

  // Win Rate 계산
  const wins = results.filter((r) => r.netProfit > 0).length;
  const winRate = totalTrades > 0 ? wins / totalTrades : 0;

  // Risk-Reward Ratio 계산 (평균)
  const riskRewardRatios = results
    .map((r) => {
      const risk = Math.abs(r.netProfit < 0 ? r.netProfit : 0);
      const reward = r.netProfit > 0 ? r.netProfit : 0;
      if (risk === 0) return 0;
      return reward / risk;
    })
    .filter((rr) => rr > 0);

  const avgRiskReward =
    riskRewardRatios.length > 0
      ? riskRewardRatios.reduce((sum, rr) => sum + rr, 0) /
        riskRewardRatios.length
      : 0;

  // Average Leverage 계산
  const leverages = contexts.map((c) => c.leverage || 1).filter((l) => l > 0);
  const avgLeverage =
    leverages.length > 0
      ? leverages.reduce((sum, l) => sum + l, 0) / leverages.length
      : 1;

  // Long/Short Ratio 계산
  const longs = results.filter((r) => r.direction === "long").length;
  const shorts = results.filter((r) => r.direction === "short").length;
  const longShortRatio = shorts > 0 ? longs / shorts : longs > 0 ? Infinity : 0;

  return {
    totalTrades,
    winRate: Math.round(winRate * 10000) / 100, // 소수점 2자리
    avgRiskReward: Math.round(avgRiskReward * 100) / 100,
    avgLeverage: Math.round(avgLeverage * 100) / 100,
    longShortRatio: Math.round(longShortRatio * 100) / 100,
  };
}
