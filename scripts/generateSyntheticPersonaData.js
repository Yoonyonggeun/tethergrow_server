/* eslint-disable operator-linebreak */
/**
 * Synthetic 페르소나 데이터 생성 스크립트
 *
 * 목적:
 * - 실제 사용자 데이터가 부족한 단계에서
 * - 다양한 유형(페르소나)의 선물 트레이더 100명을 가정하고
 * - 1인당 100건의 Bitget 선물 거래 데이터를 생성하여 DB에 저장
 *
 * 사용 방법:
 *   node scripts/generateSyntheticPersonaData.js
 *
 * 주의:
 * - 실제 API 키와는 무관한 synthetic apiKeyHash 를 사용한다. (예: "SYNTH_P01")
 * - 운영 DB가 아니라 개발/스테이징 환경에서만 실행하는 것을 권장.
 */

import {
  BitgetTrade,
  BitgetOrder,
  BitgetPositionHistory,
} from "../src/models/Bitget";
import "../src/db";
import { publicFetch } from "../src/services/bitgetClient";

// --------------------------
// 공통 유틸 함수
// --------------------------

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(random(min, max + 1));
}

function randomChoice(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

/**
 * Bitget 공개 API에서 BTCUSDT 선물 캔들 데이터 조회
 * - granularity: 1H (1시간봉)
 * - 최근 limit개 (최대 1000개) 조회
 */
async function fetchBtcCandles({
  granularity = "1H",
  limit = 1000,
  productType = "USDT-FUTURES",
} = {}) {
  const symbol = "BTCUSDT";
  const params = new URLSearchParams({
    symbol,
    granularity,
    limit: String(limit),
    productType,
  });

  const json = await publicFetch(
    "/api/mix/v1/market/history-candles",
    params.toString()
  );

  if (!json || !Array.isArray(json.data)) {
    throw new Error(
      `[SyntheticData] Bitget BTCUSDT 캔들 조회 실패: ${JSON.stringify(json)}`
    );
  }

  // Bitget 응답은 보통 최신 → 오래된 순서이므로, 시간 오름차순으로 정렬
  const candles = json.data
    .map((row) => {
      const [ts, open, high, low, close, vol] = row;
      return {
        ts: Number(ts),
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
        volume: Number(vol),
      };
    })
    .filter((c) => !Number.isNaN(c.ts) && !Number.isNaN(c.close))
    .sort((a, b) => a.ts - b.ts);

  if (!candles.length) {
    throw new Error("[SyntheticData] BTCUSDT 캔들이 비어 있습니다.");
  }

  return candles;
}

// --------------------------
// 페르소나 정의
// --------------------------

/**
 * 간단한 5개 아키타입을 정의하고,
 * 100명을 생성할 때 이 아키타입을 섞어서 사용한다.
 *
 * 각 아키타입은:
 * - winRate: 승률
 * - leverageRange: [min, max]
 * - baseTradeSizeRange: [min, max] (코인 수량)
 * - behavior: 간단한 태그 (참고용)
 */
const ARCHETYPES = [
  {
    id: "P1",
    name: "보수적 스윙 트레이더",
    winRate: 0.6,
    leverageRange: [2, 10],
    baseTradeSizeRange: [0.01, 0.1],
    behavior: ["low_leverage", "swing"],
  },
  {
    id: "P2",
    name: "극단적 리벤지 트레이더",
    winRate: 0.4,
    leverageRange: [30, 100],
    baseTradeSizeRange: [0.01, 0.05],
    behavior: ["high_leverage", "revenge_prone"],
  },
  {
    id: "P3",
    name: "수수료 헌납 단타",
    winRate: 0.55,
    leverageRange: [5, 20],
    baseTradeSizeRange: [0.005, 0.02],
    behavior: ["scalper", "high_frequency"],
  },
  {
    id: "P4",
    name: "롱 위주 추세 추종자",
    winRate: 0.65,
    leverageRange: [3, 15],
    baseTradeSizeRange: [0.01, 0.08],
    behavior: ["trend_follower", "long_biased"],
  },
  {
    id: "P5",
    name: "숏 위주 역추세",
    winRate: 0.45,
    leverageRange: [5, 25],
    baseTradeSizeRange: [0.01, 0.05],
    behavior: ["counter_trend", "short_biased"],
  },
];

const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];
const POSITION_SIDES = ["long", "short"];
const ORDER_TYPES = ["limit", "market"];
const MARGIN_MODES = ["crossed", "isolated"];

// 심볼별 BTCUSDT 대비 가격 스케일링 비율 (단순 근사)
const PRICE_FACTORS = {
  BTCUSDT: 1,
  ETHUSDT: 0.03,
  SOLUSDT: 0.0015,
  BNBUSDT: 0.006,
};

// --------------------------
// 페르소나별 거래 생성
// --------------------------

/**
 * 단일 페르소나에 대해 BitgetTrade 문서 배열 생성
 * - tradeTime/price 는 실제 BTCUSDT 캔들에 기반
 * - 심볼별 가격은 BTCUSDT 가격에 심볼별 스케일 팩터를 곱해서 근사
 */
function generateTradesForPersona(
  personaId,
  archetype,
  tradeCount = 100,
  btcCandles = []
) {
  const trades = [];

  if (!btcCandles || btcCandles.length === 0) {
    throw new Error("[SyntheticData] BTCUSDT 캔들 데이터가 비어 있습니다.");
  }

  for (let i = 0; i < tradeCount; i += 1) {
    // 무작위 BTC 캔들 선택
    const candle = btcCandles[randomInt(0, btcCandles.length - 1)];
    const tradeTime = new Date(candle.ts);

    const symbol = randomChoice(SYMBOLS);
    const factor = PRICE_FACTORS[symbol] || 1;
    const basePrice = candle.close * factor;
    const side = randomChoice(["buy", "sell"]);

    // 아키타입에 따라 방향 편향
    let positionSide = randomChoice(POSITION_SIDES);
    if (archetype.behavior.includes("long_biased")) {
      positionSide = Math.random() < 0.7 ? "long" : "short";
    } else if (archetype.behavior.includes("short_biased")) {
      positionSide = Math.random() < 0.7 ? "short" : "long";
    }

    const leverage = random(
      archetype.leverageRange[0],
      archetype.leverageRange[1]
    );
    const marginMode = randomChoice(MARGIN_MODES);

    const price = basePrice * random(0.98, 1.02); // 같은 시점에서 약간의 슬리피지 반영
    const size = random(
      archetype.baseTradeSizeRange[0],
      archetype.baseTradeSizeRange[1]
    );
    const notional = price * size;

    // 수수료 (단순 0.04~0.06% 가정, taker/maker 혼합)
    const feeRate = random(0.0004, 0.0006);
    const isTaker = Math.random() < 0.7;
    const fee = notional * feeRate * (isTaker ? 1 : -0.5);

    // 승/패 결정
    const isWin = Math.random() < archetype.winRate;
    // 실제 가격(notional)에 비례하는 손익 규모 (예: 0.2% ~ 3% 수준)
    const pnlPct = random(0.002, 0.03);
    const profit = isWin ? notional * pnlPct : -notional * pnlPct;

    const tradeId = `SYNTH_${personaId}_trade_${i}`;
    const orderId = `SYNTH_${personaId}_order_${i}`;
    const fillId = tradeId;

    trades.push({
      apiKeyHash: personaId, // 실환경에서는 apiKeyHash, 여기서는 synthetic ID
      exchange: "bitget",
      productType: "USDT-FUTURES",
      symbol,
      fillId,
      tradeId,
      orderId,
      side,
      positionSide,
      price: parseFloat(price.toFixed(2)),
      size: parseFloat(size.toFixed(6)),
      notional: parseFloat(notional.toFixed(2)),
      fee: parseFloat(fee.toFixed(6)),
      feeCoin: "USDT",
      profit: parseFloat(profit.toFixed(2)),
      realisedPnl: parseFloat(profit.toFixed(2)),
      role: isTaker ? "taker" : "maker",
      marginMode,
      leverage: parseFloat(leverage.toFixed(2)),
      tradeTime,
      raw: {
        fillId,
        tradeId,
        orderId,
        symbol,
        side,
        positionSide,
        price: price.toString(),
        size: size.toString(),
        fee: fee.toString(),
        profit: profit.toString(),
        cTime: tradeTime.getTime().toString(),
      },
    });
  }

  // 시간 순으로 정렬
  trades.sort((a, b) => a.tradeTime.getTime() - b.tradeTime.getTime());
  return trades;
}

/**
 * 간단한 Order/Position 도 같이 생성 (분석 품질 향상을 위해)
 * - 구조는 기존 generateDummyData.js 를 최대한 재사용
 */
function generateOrdersFromTrades(apiKeyHash, trades) {
  const orders = [];
  const orderMap = new Map();

  trades.forEach((t) => {
    if (!orderMap.has(t.orderId)) {
      orderMap.set(t.orderId, []);
    }
    orderMap.get(t.orderId).push(t);
  });

  orderMap.forEach((tradeGroup, orderId) => {
    const first = tradeGroup[0];
    const totalSize = tradeGroup.reduce((sum, f) => sum + f.size, 0);
    const avgPrice =
      tradeGroup.reduce((sum, f) => sum + f.price * f.size, 0) /
      (totalSize || 1);

    const isClose =
      (first.side === "sell" && first.positionSide === "long") ||
      (first.side === "buy" && first.positionSide === "short");

    orders.push({
      apiKeyHash,
      exchange: "bitget",
      productType: "USDT-FUTURES",
      symbol: first.symbol,
      orderId,
      clientOid: `client_${orderId}`,
      side: first.side,
      positionSide: first.positionSide,
      orderType: randomChoice(ORDER_TYPES),
      timeInForce: randomChoice(["GTC", "IOC", "FOK"]),
      marginMode: first.marginMode,
      leverage: first.leverage,
      price: first.price,
      size: parseFloat(totalSize.toFixed(6)),
      filledSize: parseFloat(totalSize.toFixed(6)),
      avgFillPrice: parseFloat(avgPrice.toFixed(2)),
      state: "filled",
      reduceOnly: isClose,
      createTime: first.tradeTime,
      updateTime: tradeGroup[tradeGroup.length - 1].tradeTime,
      raw: {
        orderId,
        symbol: first.symbol,
        side: first.side,
        size: totalSize.toString(),
        status: "filled",
        cTime: first.tradeTime.getTime().toString(),
        uTime: tradeGroup[tradeGroup.length - 1].tradeTime
          .getTime()
          .toString(),
      },
    });
  });

  return orders;
}

function generatePositionsFromTrades(apiKeyHash, trades) {
  const positions = [];
  const positionMap = new Map(); // symbol + positionSide

  trades.forEach((t) => {
    const key = `${t.symbol}_${t.positionSide || "unknown"}`;
    if (!positionMap.has(key)) {
      positionMap.set(key, []);
    }
    positionMap.get(key).push(t);
  });

  let positionIdCounter = 1;
  positionMap.forEach((group, key) => {
    const [symbol, holdSide] = key.split("_");
    if (holdSide === "unknown") return;

    const openTrade = group[0];
    const closeTrade = group[group.length - 1];

    const openTime = openTrade.tradeTime;
    const closeTime = closeTrade.tradeTime;
    const openPrice = openTrade.price;
    const closePrice = closeTrade.price;
    const size = group.reduce((sum, t) => sum + t.size, 0);

    let realisedPnl = 0;
    if (holdSide === "long") {
      realisedPnl = (closePrice - openPrice) * size;
    } else {
      realisedPnl = (openPrice - closePrice) * size;
    }

    const totalFee = group.reduce((sum, t) => sum + Math.abs(t.fee || 0), 0);
    realisedPnl -= totalFee;

    const leverage = openTrade.leverage || 1;
    const marginMode = openTrade.marginMode || "crossed";

    positions.push({
      apiKeyHash,
      exchange: "bitget",
      productType: "USDT-FUTURES",
      symbol,
      positionId: `SYNTH_${apiKeyHash}_pos_${positionIdCounter}`,
      holdSide,
      openTime,
      closeTime,
      openPrice: parseFloat(openPrice.toFixed(2)),
      closePrice: parseFloat(closePrice.toFixed(2)),
      size: parseFloat(size.toFixed(6)),
      leverage,
      marginMode,
      realisedPnl: parseFloat(realisedPnl.toFixed(2)),
      maxDrawdown: parseFloat(random(-100, 0).toFixed(2)),
      maxProfit: parseFloat(random(0, 100).toFixed(2)),
      meta: {
        margin: parseFloat(((openPrice * size) / leverage).toFixed(2)),
      },
      raw: {
        positionId: `SYNTH_${apiKeyHash}_pos_${positionIdCounter}`,
        symbol,
        holdSide,
        openAvgPrice: openPrice.toString(),
        closeAvgPrice: closePrice.toString(),
        pnl: realisedPnl.toString(),
        ctime: openTime.getTime().toString(),
        utime: closeTime.getTime().toString(),
      },
    });

    positionIdCounter += 1;
  });

  return positions;
}

// --------------------------
// 메인 실행 함수
// --------------------------

async function generateSyntheticData() {
  const PERSONA_COUNT = 100;
  const TRADES_PER_PERSONA = 100;

  try {
    console.log("=== Synthetic Bitget 페르소나 데이터 생성 시작 ===");
    console.log(`페르소나 수: ${PERSONA_COUNT}, 1인당 거래 수: ${TRADES_PER_PERSONA}`);

    // 1. BTCUSDT 캔들 데이터 선조회 (실제 시장 가격 기반 시뮬레이션용)
    console.log("BTCUSDT 1H 캔들 데이터 조회 중...");
    const btcCandles = await fetchBtcCandles({
      granularity: "1H",
      limit: 1000,
    });
    console.log(
      `BTCUSDT 캔들 수: ${btcCandles.length}, 기간: ${new Date(
        btcCandles[0].ts
      ).toISOString()} ~ ${new Date(
        btcCandles[btcCandles.length - 1].ts
      ).toISOString()}`
    );

    // 안전을 위해 synthetic apiKeyHash prefix로만 삭제
    await BitgetTrade.deleteMany({ apiKeyHash: { $regex: /^SYNTH_/ } });
    await BitgetOrder.deleteMany({ apiKeyHash: { $regex: /^SYNTH_/ } });
    await BitgetPositionHistory.deleteMany({
      apiKeyHash: { $regex: /^SYNTH_/ },
    });
    console.log("기존 SYNTH_* 데이터 삭제 완료");

    for (let i = 0; i < PERSONA_COUNT; i += 1) {
      const personaIndex = i + 1;
      const personaId = `SYNTH_P${personaIndex.toString().padStart(3, "0")}`;
      const archetype = ARCHETYPES[i % ARCHETYPES.length];

      console.log(
        `\n[${personaId}] ${archetype.name} (${archetype.behavior.join(", ")})`
      );

      const trades = generateTradesForPersona(
        personaId,
        archetype,
        TRADES_PER_PERSONA,
        btcCandles
      );
      const orders = generateOrdersFromTrades(personaId, trades);
      const positions = generatePositionsFromTrades(personaId, trades);

      await BitgetTrade.insertMany(trades);
      await BitgetOrder.insertMany(orders);
      await BitgetPositionHistory.insertMany(positions);

      const totalPnl = trades.reduce(
        (sum, t) => sum + (t.realisedPnl || 0),
        0
      );
      const totalFees = trades.reduce(
        (sum, t) => sum + Math.abs(t.fee || 0),
        0
      );
      const winCount = trades.filter((t) => (t.realisedPnl || 0) > 0).length;
      const winRate = (winCount / trades.length) * 100;

      console.log(
        `  - Trades: ${trades.length}, Orders: ${orders.length}, Positions: ${positions.length}`
      );
      console.log(
        `  - PnL: ${totalPnl.toFixed(2)} USDT, Fees: ${totalFees.toFixed(
          2
        )} USDT, WinRate: ${winRate.toFixed(2)}%`
      );
    }

    console.log("\n=== Synthetic 페르소나 데이터 생성 완료 ===");
    process.exit(0);
  } catch (err) {
    console.error("Synthetic 데이터 생성 오류:", err);
    process.exit(1);
  }
}

generateSyntheticData();


