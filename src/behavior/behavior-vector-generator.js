/* eslint-disable operator-linebreak */
// src/behavior/behavior-vector-generator.js
// BehaviorVector 생성

/**
 * 레버리지 버킷팅
 * @param {number} leverage - 레버리지 값
 * @returns {string} - "1x-5x" | "6x-10x" | "11x-20x" | "21x+"
 */
function bucketLeverage(leverage) {
  if (leverage <= 5) return "1x-5x";
  if (leverage <= 10) return "6x-10x";
  if (leverage <= 20) return "11x-20x";
  return "21x+";
}

/**
 * 마지막 거래로부터 경과 시간 버킷팅
 * @param {number} timeSinceLastTradeMs - 마지막 거래로부터 경과 시간 (밀리초)
 * @returns {string} - "0-1h" | "1-6h" | "6-24h" | "24h+"
 */
function bucketTimeSinceLastTrade(timeSinceLastTradeMs) {
  const hours = timeSinceLastTradeMs / (1000 * 60 * 60);
  if (hours < 1) return "0-1h";
  if (hours < 6) return "1-6h";
  if (hours < 24) return "6-24h";
  return "24h+";
}

/**
 * 연속 상태 계산 (win_streak, loss_streak, neutral)
 * @param {Array<Object>} recentResults - 최근 UnifiedResult 배열
 * @returns {string} - "win_streak" | "loss_streak" | "neutral"
 */
function calculateStreakState(recentResults) {
  if (!recentResults || recentResults.length === 0) {
    return "neutral";
  }

  // 최근 5개 결과만 확인
  const recent = recentResults.slice(-5);
  const wins = recent.filter((r) => r.netProfit > 0).length;
  const losses = recent.filter((r) => r.netProfit < 0).length;

  if (wins >= 3) return "win_streak";
  if (losses >= 3) return "loss_streak";
  return "neutral";
}

/**
 * 포지션 중복 여부 확인
 * @param {Object} action - UnifiedAction
 * @param {Array<Object>} openPositions - 현재 열린 포지션 배열
 * @returns {boolean} - 중복 여부
 */
function checkOverlappingPosition(action, openPositions) {
  if (!openPositions || openPositions.length === 0) {
    return false;
  }

  return openPositions.some(
    (pos) =>
      pos.symbol === action.symbol &&
      pos.direction === action.side &&
      pos.positionMode === action.positionMode
  );
}

/**
 * UnifiedAction과 UnifiedContext로부터 BehaviorVector 생성
 * @param {Object} params
 * @param {Object} params.action - UnifiedAction
 * @param {Object} [params.context] - UnifiedContext (선택적)
 * @param {Array<Object>} [params.recentResults] - 최근 UnifiedResult 배열 (streak 계산용)
 * @param {Array<Object>} [params.openPositions] - 현재 열린 포지션 배열 (중복 확인용)
 * @param {number} [params.timeSinceLastTradeMs] - 마지막 거래로부터 경과 시간
 * @returns {Object} BehaviorVector
 */
export function generateBehaviorVector({
  action,
  context,
  recentResults = [],
  openPositions = [],
  timeSinceLastTradeMs = 0,
}) {
  const direction = action.side === "sell" ? "short" : "long";

  // Context에서 레버리지 가져오기 (없으면 기본값 1)
  const leverage = context?.leverage || 1;
  const leverageBucket = bucketLeverage(leverage);

  // 마지막 거래로부터 경과 시간 버킷팅
  const timeSinceLastTradeBucket =
    bucketTimeSinceLastTrade(timeSinceLastTradeMs);

  // 연속 상태 계산
  const streakState = calculateStreakState(recentResults);

  // 주문 타입
  const orderType = context?.orderType || "market";

  // 포지션 중복 여부
  const isOverlappingPosition = checkOverlappingPosition(action, openPositions);

  return {
    direction,
    leverageBucket,
    timeSinceLastTradeBucket,
    streakState,
    orderType,
    isOverlappingPosition,
  };
}

/**
 * 여러 Action에 대한 BehaviorVector 일괄 생성
 * @param {Object} params
 * @param {Array<Object>} params.actions - UnifiedAction 배열
 * @param {Array<Object>} params.contexts - UnifiedContext 배열 (orderId로 매칭)
 * @param {Array<Object>} params.results - UnifiedResult 배열 (streak 계산용)
 * @returns {Array<Object>} BehaviorVector 배열
 */
export function generateBehaviorVectors({
  actions,
  contexts = [],
  results = [],
}) {
  // Context를 orderId로 매핑
  const contextMap = new Map();
  contexts.forEach((ctx) => {
    contextMap.set(ctx.orderId, ctx);
  });

  // Results를 시간순으로 정렬
  const sortedResults = [...results].sort((a, b) => a.closeTime - b.closeTime);

  // Actions를 시간순으로 정렬
  const sortedActions = [...actions].sort((a, b) => a.timestamp - b.timestamp);

  const behaviorVectors = [];
  const openPositions = [];

  sortedActions.forEach((action, index) => {
    const context = contextMap.get(action.orderId);
    const prevAction = index > 0 ? sortedActions[index - 1] : null;
    const timeSinceLastTradeMs = prevAction
      ? action.timestamp - prevAction.timestamp
      : 0;

    // 해당 시점 이전의 결과만 사용 (미래 데이터 누수 방지)
    const resultsBeforeAction = sortedResults.filter(
      (r) => r.closeTime < action.timestamp
    );

    const behaviorVector = generateBehaviorVector({
      action,
      context,
      recentResults: resultsBeforeAction.slice(-10), // 최근 10개만
      openPositions: [...openPositions],
      timeSinceLastTradeMs,
    });

    behaviorVectors.push(behaviorVector);

    // 포지션 상태 업데이트 (간단한 추적)
    if (action.lifecycleHint === "open") {
      openPositions.push({
        symbol: action.symbol,
        direction: action.side === "sell" ? "short" : "long",
        positionMode: action.positionMode,
      });
    } else if (action.lifecycleHint === "close") {
      const idx = openPositions.findIndex(
        (pos) =>
          pos.symbol === action.symbol &&
          pos.direction === (action.side === "sell" ? "short" : "long") &&
          pos.positionMode === action.positionMode
      );
      if (idx >= 0) {
        openPositions.splice(idx, 1);
      }
    }
  });

  return behaviorVectors;
}
