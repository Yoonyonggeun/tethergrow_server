/* eslint-disable import/prefer-default-export */
/* eslint-disable indent */
/* eslint-disable operator-linebreak */
// src/report/report-generator.js
// DiagnosisReport 생성

import { calculateAllMetrics, calculateSimulation } from "../calculators";
import { generateResultLabels } from "../labels";
import { calculateMarketStatesForTimestamps } from "../market";

/**
 * Market Context Summary 생성
 * @param {Array<Object>} marketStates - MarketState 배열
 * @returns {Object} Market Context Summary
 */
function generateMarketContextSummary(marketStates) {
  if (!marketStates || marketStates.length === 0) {
    return {
      volatilityDistribution: { low: 0, mid: 0, high: 0 },
      trendDistribution: { up: 0, down: 0, range: 0 },
      sessionDistribution: { asia: 0, london: 0, newyork: 0 },
    };
  }

  const volatilityCounts = { low: 0, mid: 0, high: 0 };
  const trendCounts = { up: 0, down: 0, range: 0 };
  const sessionCounts = { asia: 0, london: 0, newyork: 0 };

  marketStates.forEach((state) => {
    volatilityCounts[state.volatilityState] =
      (volatilityCounts[state.volatilityState] || 0) + 1;
    trendCounts[state.trendState] = (trendCounts[state.trendState] || 0) + 1;
    sessionCounts[state.session] = (sessionCounts[state.session] || 0) + 1;
  });

  const total = marketStates.length;

  return {
    volatilityDistribution: {
      low: Math.round((volatilityCounts.low / total) * 10000) / 100,
      mid: Math.round((volatilityCounts.mid / total) * 10000) / 100,
      high: Math.round((volatilityCounts.high / total) * 10000) / 100,
    },
    trendDistribution: {
      up: Math.round((trendCounts.up / total) * 10000) / 100,
      down: Math.round((trendCounts.down / total) * 10000) / 100,
      range: Math.round((trendCounts.range / total) * 10000) / 100,
    },
    sessionDistribution: {
      asia: Math.round((sessionCounts.asia / total) * 10000) / 100,
      london: Math.round((sessionCounts.london / total) * 10000) / 100,
      newyork: Math.round((sessionCounts.newyork / total) * 10000) / 100,
    },
  };
}

/**
 * Overview 생성
 * @param {Object} metrics - 모든 메트릭
 * @param {Array<Object>} results - UnifiedResult 배열
 * @returns {Object} Overview
 */
function generateOverview(metrics, results) {
  const totalPnL = results.reduce((sum, r) => sum + (r.netProfit || 0), 0);

  return {
    period: "90 days",
    totalTrades: metrics.performance.totalTrades,
    totalPnL: Math.round(totalPnL * 100) / 100,
    winRate: metrics.performance.winRate,
    avgLeverage: metrics.performance.avgLeverage,
    maxDrawdown: metrics.risk.maxDrawdown,
  };
}

/**
 * DiagnosisReport 생성
 * @param {Object} params
 * @param {Array<Object>} params.actions - UnifiedAction 배열
 * @param {Array<Object>} params.contexts - UnifiedContext 배열
 * @param {Array<Object>} params.results - UnifiedResult 배열
 * @param {Array<Object>} [params.marketStates] - MarketState 배열 (선택적)
 * @param {Array<Object>} [params.klines] - OHLCV 데이터 (선택적, marketStates가 없을 때 사용)
 * @returns {Object} DiagnosisReport
 */
export function generateDiagnosisReport({
  actions,
  contexts,
  results,
  marketStates,
  klines,
}) {
  // 메트릭 계산
  const metrics = calculateAllMetrics({ actions, contexts, results });

  // Result Labels 생성
  const resultLabels = generateResultLabels(results);

  // Market States가 없으면 klines에서 생성
  let finalMarketStates = marketStates;
  if (!finalMarketStates && klines && results.length > 0) {
    const timestamps = results.map((r) => r.closeTime);
    const symbol = results[0]?.symbol || "BTCUSDT";
    finalMarketStates = calculateMarketStatesForTimestamps({
      klines,
      timestamps,
      symbol,
    });
  }

  // Long/Short 비율 계산 (코인별)
  const longShortByCoin = {};
  results.forEach((r) => {
    const coin = r.symbol || "UNKNOWN";
    if (!longShortByCoin[coin]) {
      longShortByCoin[coin] = { long: 0, short: 0 };
    }
    if (r.direction === "long") {
      longShortByCoin[coin].long += 1;
    } else {
      longShortByCoin[coin].short += 1;
    }
  });

  // 전체 Long/Short 비율
  const totalLongs = results.filter((r) => r.direction === "long").length;
  const totalShorts = results.filter((r) => r.direction === "short").length;
  const totalPositions = totalLongs + totalShorts;
  const longPercent =
    totalPositions > 0
      ? Math.round((totalLongs / totalPositions) * 10000) / 100
      : 0;
  const shortPercent =
    totalPositions > 0
      ? Math.round((totalShorts / totalPositions) * 10000) / 100
      : 0;

  // 코인별 Long/Short 비율 배열 생성
  const longShortRatio = Object.entries(longShortByCoin).map(([coin, data]) => {
    const total = data.long + data.short;
    return {
      coin,
      long: total > 0 ? Math.round((data.long / total) * 10000) / 100 : 0,
      short: total > 0 ? Math.round((data.short / total) * 10000) / 100 : 0,
    };
  });

  // 시뮬레이션 계산 (Rule 1: 극단 손실 거래 제거)
  const simulation = calculateSimulation({
    results,
    contexts,
    ruleType: "extreme_loss",
  });

  // Report 생성
  const report = {
    overview: generateOverview(metrics, results),
    performanceBreakdown: {
      ...metrics.performance,
      resultLabels: {
        wins: resultLabels.filter((l) => l.outcome === "win").length,
        losses: resultLabels.filter((l) => l.outcome === "loss").length,
        breakevens: resultLabels.filter((l) => l.outcome === "breakeven")
          .length,
        pnlDistribution: {
          large_loss: resultLabels.filter((l) => l.pnlBucket === "large_loss")
            .length,
          small_loss: resultLabels.filter((l) => l.pnlBucket === "small_loss")
            .length,
          small_win: resultLabels.filter((l) => l.pnlBucket === "small_win")
            .length,
          large_win: resultLabels.filter((l) => l.pnlBucket === "large_win")
            .length,
        },
      },
    },
    longShortRatio: {
      overall: {
        long: longPercent,
        short: shortPercent,
      },
      byCoin: longShortRatio,
    },
    riskAnalysis: {
      ...metrics.risk,
      maxLossStreak: metrics.risk.maxLossStreak,
    },
    costAnalysis: {
      ...metrics.cost,
    },
    simulation: {
      actual: simulation.actual,
      simulated: simulation.simulated,
      ruleApplied: simulation.ruleApplied,
      removedTradesCount: simulation.removedTradesCount,
      actualMDD: simulation.actualMDD,
      simulatedMDD: simulation.simulatedMDD,
      equityVolatilityReduced: simulation.equityVolatilityReduced,
    },
    marketContextSummary: finalMarketStates
      ? generateMarketContextSummary(finalMarketStates)
      : {
          volatilityDistribution: { low: 0, mid: 0, high: 0 },
          trendDistribution: { up: 0, down: 0, range: 0 },
          sessionDistribution: { asia: 0, london: 0, newyork: 0 },
        },
    generatedAt: new Date().toISOString(),
  };

  return report;
}
