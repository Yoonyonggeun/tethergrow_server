/* eslint-disable import/prefer-default-export */
// src/calculators/index.js
// Calculators 모듈 통합 엔트리 포인트

import { calculateCostMetrics } from "./cost-calculator";
import { calculatePerformanceMetrics } from "./performance-calculator";
import { calculateRiskMetrics } from "./risk-calculator";
import { calculateSimulation } from "./simulation-calculator";

/**
 * 모든 진단 메트릭 계산
 * @param {Object} params
 * @param {Array<Object>} params.actions - UnifiedAction 배열
 * @param {Array<Object>} params.contexts - UnifiedContext 배열
 * @param {Array<Object>} params.results - UnifiedResult 배열
 * @returns {Object} - { performance, risk, cost }
 */
export function calculateAllMetrics({ actions, contexts, results }) {
  return {
    performance: calculatePerformanceMetrics({ results, contexts }),
    risk: calculateRiskMetrics({ results }),
    cost: calculateCostMetrics({ actions, results }),
  };
}

export { calculateSimulation };
