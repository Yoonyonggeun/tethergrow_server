// src/transformers/index.js
// Transformers 통합 엔트리 포인트

import {
  transformFillToAction,
  transformFillsToActions,
} from "./fill-to-action";
import {
  transformOrderToContext,
  transformOrdersToContexts,
} from "./order-to-context";
import {
  transformPositionToResult,
  transformPositionsToResults,
} from "./position-to-result";

// Export individual transformers
export {
  transformFillToAction,
  transformFillsToActions,
  transformOrderToContext,
  transformOrdersToContexts,
  transformPositionToResult,
  transformPositionsToResults,
};

/**
 * Raw 데이터를 Unified 모델로 일괄 변환
 * @param {Object} rawData
 * @param {Array} rawData.fills - Raw fill 데이터
 * @param {Array} rawData.orders - Raw order 데이터
 * @param {Array} rawData.positions - Raw position 데이터
 * @returns {Object} - { actions, contexts, results }
 */
export function transformAllToUnified({
  fills = [],
  orders = [],
  positions = [],
}) {
  return {
    actions: transformFillsToActions(fills),
    contexts: transformOrdersToContexts(orders),
    results: transformPositionsToResults(positions),
  };
}
