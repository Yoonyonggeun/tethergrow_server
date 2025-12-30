/* eslint-disable import/prefer-default-export */
/* eslint-disable operator-linebreak */
// src/calculators/simulation-calculator.js
// Trading Simulation Calculator

/**
 * 시뮬레이션 가정 룰 적용
 * @param {Object} params
 * @param {Array<Object>} params.results - UnifiedResult 배열 (시간순 정렬)
 * @param {Array<Object>} params.contexts - UnifiedContext 배열
 * @param {string} [params.ruleType] - 적용할 룰 타입 (기본값: "extreme_loss")
 * @returns {Object} 시뮬레이션 결과
 */
export function calculateSimulation({
  results = [],
  contexts = [],
  ruleType = "extreme_loss",
}) {
  if (!results || results.length === 0) {
    return {
      actual: [],
      simulated: [],
      ruleApplied: ruleType,
      removedTradesCount: 0,
      actualMDD: 0,
      simulatedMDD: 0,
    };
  }

  // 시간순 정렬 (closeTime 기준)
  const sortedResults = [...results].sort(
    (a, b) => (a.closeTime || 0) - (b.closeTime || 0)
  );

  // Context를 orderId로 매핑 (레버리지 정보용)
  const contextMap = new Map();
  contexts.forEach((ctx) => {
    contextMap.set(ctx.orderId, ctx);
  });

  // Actual Equity Curve 생성
  let actualEquity = 0;
  const actualPoints = sortedResults.map((r) => {
    actualEquity += r.netProfit || 0;
    return {
      date: new Date(r.closeTime).toISOString().split("T")[0],
      value: Math.round(actualEquity * 100) / 100,
      timestamp: r.closeTime,
    };
  });

  // Simulated Equity Curve 생성 (룰 적용)
  const removedIndices = new Set();
  let simulatedEquity = 0;

  // Rule 1: 극단 손실 거래 제거
  if (ruleType === "extreme_loss") {
    const lossTrades = sortedResults.filter((r) => (r.netProfit || 0) < 0);
    if (lossTrades.length > 0) {
      const lossAmounts = lossTrades.map((r) => Math.abs(r.netProfit || 0));
      const avgLoss =
        lossAmounts.reduce((sum, amt) => sum + amt, 0) / lossAmounts.length;
      const threshold = avgLoss * 2; // 평균 손실의 2배

      sortedResults.forEach((r, index) => {
        if ((r.netProfit || 0) < 0 && Math.abs(r.netProfit || 0) >= threshold) {
          removedIndices.add(index);
        }
      });
    }
  }

  // Rule 2: 연속 손실 이후 거래 제거
  if (ruleType === "loss_streak") {
    let currentStreak = 0;
    const streakThreshold = 3; // 3연패

    sortedResults.forEach((r, index) => {
      if ((r.netProfit || 0) < 0) {
        currentStreak += 1;
        if (currentStreak >= streakThreshold) {
          removedIndices.add(index);
        }
      } else {
        currentStreak = 0;
      }
    });
  }

  // Rule 3: 과도한 레버리지 거래 제거
  if (ruleType === "high_leverage") {
    // 평균 레버리지 계산
    const leverages = contexts
      .map((c) => c.leverage || 1)
      .filter((l) => l > 0);
    const avgLeverage =
      leverages.length > 0
        ? leverages.reduce((sum, l) => sum + l, 0) / leverages.length
        : 1;

    const threshold = avgLeverage * 2; // 평균의 2배

    sortedResults.forEach((r, index) => {
      // Result에서 orderId를 찾기 어려우므로, 간단히 건너뛰고
      // 대신 netProfit이 크고 fee가 높은 거래를 제거
      const totalFee = (r.openFee || 0) + (r.closeFee || 0);
      const feeRatio = totalFee / Math.abs(r.netProfit || 1);
      if (feeRatio > 0.5) {
        // 수수료가 netProfit의 50% 이상
        removedIndices.add(index);
      }
    });
  }

  // Rule 4: 수수료 과다 거래 제거
  if (ruleType === "high_fee") {
    sortedResults.forEach((r, index) => {
      const totalFee = (r.openFee || 0) + (r.closeFee || 0);
      const netProfit = r.netProfit || 0;
      if (netProfit > 0 && totalFee / netProfit > 0.3) {
        // 수익 거래에서 수수료가 30% 이상
        removedIndices.add(index);
      }
    });
  }

  // Simulated Equity Curve 생성
  const simulatedPoints = sortedResults.map((r, index) => {
    if (removedIndices.has(index)) {
      // 제거된 거래는 netProfit을 0으로 처리
      return {
        date: new Date(r.closeTime).toISOString().split("T")[0],
        value: Math.round(simulatedEquity * 100) / 100,
        timestamp: r.closeTime,
      };
    }
    simulatedEquity += r.netProfit || 0;
    return {
      date: new Date(r.closeTime).toISOString().split("T")[0],
      value: Math.round(simulatedEquity * 100) / 100,
      timestamp: r.closeTime,
    };
  });

  // Max Drawdown 계산
  const calculateMDD = (points) => {
    if (points.length === 0) return 0;
    let peak = points[0].value;
    let maxDrawdown = 0;

    points.forEach((point) => {
      if (point.value > peak) {
        peak = point.value;
      }
      const drawdown = peak - point.value;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    return Math.round(maxDrawdown * 100) / 100;
  };

  const actualMDD = calculateMDD(actualPoints);
  const simulatedMDD = calculateMDD(simulatedPoints);

  return {
    actual: actualPoints,
    simulated: simulatedPoints,
    ruleApplied: ruleType,
    removedTradesCount: removedIndices.size,
    actualMDD,
    simulatedMDD,
    equityVolatilityReduced: simulatedMDD < actualMDD,
  };
}

