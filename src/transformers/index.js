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
import {
  transformOkxFillToAction,
  transformOkxFillsToActions,
} from "./okx-fill-to-action";
import {
  transformOkxOrderToContext,
  transformOkxOrdersToContexts,
} from "./okx-order-to-context";
import {
  transformOkxPositionToResult,
  transformOkxPositionsToResults,
} from "./okx-position-to-result";

// Export individual transformers
export {
  transformFillToAction,
  transformFillsToActions,
  transformOrderToContext,
  transformOrdersToContexts,
  transformPositionToResult,
  transformPositionsToResults,
  transformOkxFillToAction,
  transformOkxFillsToActions,
  transformOkxOrderToContext,
  transformOkxOrdersToContexts,
  transformOkxPositionToResult,
  transformOkxPositionsToResults,
};

/**
 * Raw 데이터를 Unified 모델로 일괄 변환
 * @param {Object} rawData
 * @param {Array} rawData.fills - Raw fill 데이터
 * @param {Array} rawData.orders - Raw order 데이터
 * @param {Array} rawData.positions - Raw position 데이터
 * @param {string} [exchange] - "bitget" | "okx"
 * @returns {Object} - { actions, contexts, results }
 */
export function transformAllToUnified({
  fills = [],
  orders = [],
  positions = [],
  exchange = "bitget",
}) {
  const isOkx = exchange === "okx";

  return {
    actions: isOkx
      ? transformOkxFillsToActions(fills)
      : transformFillsToActions(fills),
    contexts: isOkx
      ? transformOkxOrdersToContexts(orders)
      : transformOrdersToContexts(orders),
    results: isOkx
      ? transformOkxPositionsToResults(positions)
      : transformPositionsToResults(positions),
  };
}
