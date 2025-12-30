/* eslint-disable import/prefer-default-export */
/* eslint-disable operator-linebreak */
/* eslint-disable no-nested-ternary */
/* eslint-disable indent */
// src/calculators/cost-calculator.js
// Cost 메트릭 계산

/**
 * Cost 메트릭 계산
 * @param {Object} params
 * @param {Array<Object>} params.actions - UnifiedAction 배열 (수수료 정보)
 * @param {Array<Object>} params.results - UnifiedResult 배열 (funding cost 정보)
 * @returns {Object} Cost 메트릭
 */
export function calculateCostMetrics({ actions = [], results = [] }) {
  // Total Fees 계산 (actions에서)
  const totalFees = actions.reduce((sum, action) => sum + (action.fee || 0), 0);

  // Total Funding Cost 계산 (results에서)
  const totalFundingCost = results.reduce(
    (sum, result) => sum + (result.fundingCost || 0),
    0
  );

  // Total PnL 계산
  const totalPnL = results.reduce(
    (sum, result) => sum + (result.netProfit || 0),
    0
  );

  // Fee to PnL Ratio
  const feeToPnLRatio =
    totalPnL !== 0
      ? Math.abs(totalFees / totalPnL)
      : totalFees > 0
      ? Infinity
      : 0;

  // Funding Cost Ratio
  const fundingCostRatio =
    totalPnL !== 0
      ? Math.abs(totalFundingCost / totalPnL)
      : totalFundingCost > 0
      ? Infinity
      : 0;

  return {
    totalFees: Math.round(totalFees * 100) / 100,
    feeToPnLRatio: Math.round(feeToPnLRatio * 10000) / 100, // 백분율
    fundingCostRatio: Math.round(fundingCostRatio * 10000) / 100, // 백분율
    totalFundingCost: Math.round(totalFundingCost * 100) / 100,
  };
}
