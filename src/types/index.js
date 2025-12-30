// src/types/index.js
// Bitget 90D Diagnosis Engine - Type Definitions

/**
 * @typedef {Object} UnifiedAction
 * @property {number} timestamp - Unix timestamp in milliseconds
 * @property {string} symbol - Trading pair (e.g., "BTCUSDT")
 * @property {string} side - "buy" | "sell"
 * @property {string} lifecycleHint - "open" | "close" | "reduce"
 * @property {string} positionMode - "one_way_mode" | "hedge_mode"
 * @property {string} executionRole - "maker" | "taker"
 * @property {number} fillPrice - Execution price
 * @property {number} baseQty - Base quantity
 * @property {number} quoteQty - Quote quantity
 * @property {number} fee - Transaction fee
 * @property {string} source - "WEB" | "API" | "SYS" | "ANDROID" | "IOS"
 * @property {string} orderId - Order ID
 * @property {string} tradeId - Trade ID
 */

/**
 * @typedef {Object} UnifiedContext
 * @property {string} orderId - Order ID
 * @property {string} orderType - "limit" | "market"
 * @property {string} orderSource - Order source type
 * @property {number} leverage - Leverage value
 * @property {string} marginMode - "isolated" | "crossed"
 * @property {boolean} reduceOnly - Whether order is reduce-only
 * @property {boolean} hasSL - Has stop loss
 * @property {boolean} hasTP - Has take profit
 * @property {number} orderCreatedAt - Order creation timestamp
 * @property {number} orderUpdatedAt - Order update timestamp
 * @property {number|null} liquidationPrice - Liquidation price
 */

/**
 * @typedef {Object} UnifiedResult
 * @property {string} positionId - Position ID
 * @property {string} symbol - Trading pair
 * @property {string} direction - "long" | "short"
 * @property {string} positionMode - "one_way_mode" | "hedge_mode"
 * @property {string} marginMode - "isolated" | "crossed"
 * @property {number} entryPrice - Average entry price
 * @property {number} exitPrice - Average exit price
 * @property {number} openTime - Position open timestamp
 * @property {number} closeTime - Position close timestamp
 * @property {number} realizedPnl - Realized PnL
 * @property {number} netProfit - Net profit
 * @property {number} fundingCost - Total funding cost
 * @property {number} openFee - Opening fee
 * @property {number} closeFee - Closing fee
 */

/**
 * @typedef {Object} BehaviorVector
 * @property {string} direction - "long" | "short"
 * @property {string} leverageBucket - "1x-5x" | "6x-10x" | "11x-20x" | "21x+"
 * @property {string} timeSinceLastTradeBucket - "0-1h" | "1-6h" | "6-24h" | "24h+"
 * @property {string} streakState - "win_streak" | "loss_streak" | "neutral"
 * @property {string} orderType - "limit" | "market"
 * @property {boolean} isOverlappingPosition - Whether position overlaps with existing
 */

/**
 * @typedef {Object} ResultLabel
 * @property {string} outcome - "win" | "loss" | "breakeven"
 * @property {string} pnlBucket - "large_loss" | "small_loss" | "small_win" | "large_win"
 * @property {string} holdingBucket - "0-1h" | "1-6h" | "6-24h" | "24h+"
 */

/**
 * @typedef {Object} MarketState
 * @property {number} timestamp - Unix timestamp in milliseconds
 * @property {string} symbol - Trading pair
 * @property {string} volatilityState - "low" | "mid" | "high"
 * @property {string} trendState - "up" | "down" | "range"
 * @property {string} priceLocation - "above_vwap" | "below_vwap" | "mid"
 * @property {string} session - "asia" | "london" | "newyork"
 */

/**
 * @typedef {Object} DiagnosisReport
 * @property {Object} overview - Overview metrics
 * @property {Object} performanceBreakdown - Performance breakdown
 * @property {Object} riskAnalysis - Risk analysis
 * @property {Object} costAnalysis - Cost analysis
 * @property {Object} marketContextSummary - Market context summary
 */

/**
 * @typedef {Object} RawFillData
 * @property {string} tradeId
 * @property {string} symbol
 * @property {string} marginCoin
 * @property {string} orderId
 * @property {string} price
 * @property {string} baseVolume
 * @property {Array<Object>} feeDetail
 * @property {string} side
 * @property {string} quoteVolume
 * @property {string} profit
 * @property {string} enterPointSource
 * @property {string} tradeSide
 * @property {string} posMode
 * @property {string} tradeScope
 * @property {string} cTime
 */

/**
 * @typedef {Object} RawOrderData
 * @property {string} symbol
 * @property {string} size
 * @property {string} orderId
 * @property {string} clientOid
 * @property {string} baseVolume
 * @property {string} fee
 * @property {string} price
 * @property {string} priceAvg
 * @property {string} status
 * @property {string} side
 * @property {string} force
 * @property {string} totalProfits
 * @property {string} posSide
 * @property {string} marginCoin
 * @property {string} quoteVolume
 * @property {string} leverage
 * @property {string} marginMode
 * @property {string} enterPointSource
 * @property {string} tradeSide
 * @property {string} posMode
 * @property {string} posAvg
 * @property {string} orderType
 * @property {string} orderSource
 * @property {string} cTime
 * @property {string} uTime
 * @property {string} presetStopSurplusPrice
 * @property {string} presetStopLossPrice
 * @property {string} liqPrice
 */

/**
 * @typedef {Object} RawPositionData
 * @property {string} positionId
 * @property {string} marginCoin
 * @property {string} symbol
 * @property {string} holdSide
 * @property {string} openAvgPrice
 * @property {string} closeAvgPrice
 * @property {string} marginMode
 * @property {string} openTotalPos
 * @property {string} closeTotalPos
 * @property {string} pnl
 * @property {string} netProfit
 * @property {string} totalFunding
 * @property {string} openFee
 * @property {string} closeFee
 * @property {string} posMode
 * @property {string} ctime
 * @property {string} utime
 */

export {};
