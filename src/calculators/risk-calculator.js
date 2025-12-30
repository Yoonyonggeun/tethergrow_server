/* eslint-disable import/prefer-default-export */
// src/calculators/risk-calculator.js
// Risk 메트릭 계산

/**
 * Maximum Drawdown (MDD) 계산
 * @param {Array<Object>} results - UnifiedResult 배열 (시간순 정렬)
 * @returns {number} - MDD (음수 값, 절댓값이 클수록 큰 손실)
 */
function calculateMaxDrawdown(results) {
  if (!results || results.length === 0) {
    return 0;
  }

  // 누적 수익률 계산
  let cumulative = 0;
  let peak = 0;
  let maxDrawdown = 0;

  results.forEach((result) => {
    cumulative += result.netProfit;
    if (cumulative > peak) {
      peak = cumulative;
    }
    const drawdown = cumulative - peak;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  return maxDrawdown;
}

/**
 * Average Maximum Adverse Excursion (MAE) 계산
 * @param {Array<Object>} results - UnifiedResult 배열
 * @returns {number} - Average MAE
 */
function calculateAverageMAE(results) {
  if (!results || results.length === 0) {
    return 0;
  }

  // 각 거래의 최대 불리한 가격 변동 계산
  // 실제로는 fill 데이터가 필요하지만, 여기서는 간단히 realizedPnl과 netProfit 차이로 근사
  const maes = results.map((r) => {
    // realizedPnl과 netProfit의 차이가 최대 불리한 변동을 나타냄
    const adverse = Math.abs(r.realizedPnl - r.netProfit);
    return adverse;
  });

  return maes.length > 0
    ? maes.reduce((sum, mae) => sum + mae, 0) / maes.length
    : 0;
}

/**
 * Maximum Loss Streak 계산
 * @param {Array<Object>} results - UnifiedResult 배열 (시간순 정렬)
 * @returns {number} - 최대 연속 손실 횟수
 */
function calculateMaxLossStreak(results) {
  if (!results || results.length === 0) {
    return 0;
  }

  let maxStreak = 0;
  let currentStreak = 0;

  results.forEach((result) => {
    if (result.netProfit < 0) {
      currentStreak += 1;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
  });

  return maxStreak;
}

/**
 * Average Holding Time 계산
 * @param {Array<Object>} results - UnifiedResult 배열
 * @returns {number} - 평균 보유 시간 (시간 단위)
 */
function calculateAvgHoldingTime(results) {
  if (!results || results.length === 0) {
    return 0;
  }

  const holdingTimes = results.map((r) => {
    const ms = r.closeTime - r.openTime;
    return ms / (1000 * 60 * 60); // 시간 단위로 변환
  });

  return holdingTimes.reduce((sum, ht) => sum + ht, 0) / holdingTimes.length;
}

/**
 * Risk 메트릭 계산
 * @param {Object} params
 * @param {Array<Object>} params.results - UnifiedResult 배열
 * @returns {Object} Risk 메트릭
 */
export function calculateRiskMetrics({ results }) {
  if (!results || results.length === 0) {
    return {
      maxDrawdown: 0,
      averageMAE: 0,
      maxLossStreak: 0,
      avgHoldingTime: 0,
    };
  }

  // 시간순 정렬
  const sortedResults = [...results].sort((a, b) => a.closeTime - b.closeTime);

  return {
    maxDrawdown: Math.round(calculateMaxDrawdown(sortedResults) * 100) / 100,
    averageMAE: Math.round(calculateAverageMAE(sortedResults) * 100) / 100,
    maxLossStreak: calculateMaxLossStreak(sortedResults),
    avgHoldingTime:
      Math.round(calculateAvgHoldingTime(sortedResults) * 100) / 100,
  };
}
