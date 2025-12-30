/* eslint-disable operator-linebreak */
/**
 * Bitget 더미 데이터 생성 스크립트
 *
 * 목적: AI 분석 테스트를 위한 실제 거래 데이터와 유사한 더미 데이터 생성
 * 기준: 90일 내 100개 fill 기준으로 order와 position history 생성
 */

import crypto from "node:crypto";
import {
  BitgetTrade,
  BitgetOrder,
  BitgetPositionHistory,
} from "../src/models/Bitget";
import "../src/db";

/**
 * API 키의 해시값 생성 (백엔드와 동일한 로직)
 */
function hashApiKey(apiKey) {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

// 프론트엔드에서 사용하는 실제 API Key (landing.tsx의 기본값)
// 실제 사용 시: node scripts/generateDummyData.js <API_KEY>
const FRONTEND_API_KEY = "bg_c5cda9db6c83d74c3a1e51149c9c74db";
const API_KEY_HASH = process.argv[2]
  ? hashApiKey(process.argv[2])
  : hashApiKey(FRONTEND_API_KEY);
const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "ADAUSDT"];
const SIDES = ["buy", "sell"];
const POSITION_SIDES = ["long", "short"];
const ORDER_TYPES = ["limit", "market"];
const MARGIN_MODES = ["crossed", "isolated"];
const LEVERAGES = [1, 2, 3, 5, 10, 20, 50, 100];

/**
 * 랜덤 숫자 생성 (min ~ max)
 */
function random(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * 랜덤 정수 생성 (min ~ max)
 */
function randomInt(min, max) {
  return Math.floor(random(min, max + 1));
}

/**
 * 배열에서 랜덤 선택
 */
function randomChoice(array) {
  return array[randomInt(0, array.length - 1)];
}

/**
 * 날짜 생성 (최근 90일 내)
 */
function generateDate(daysAgo) {
  const now = Date.now();
  const daysAgoMs = daysAgo * 24 * 60 * 60 * 1000;
  const randomOffset = random(0, 24 * 60 * 60 * 1000); // 하루 내 랜덤 시간
  return new Date(now - daysAgoMs - randomOffset);
}

/**
 * Fill 데이터 생성 (100개)
 */
function generateFills() {
  const fills = [];

  // 100개 fill 생성 (최근 90일 내, 시간순 정렬)
  for (let i = 0; i < 100; i += 1) {
    const daysAgo = random(0, 90);
    const tradeTime = generateDate(daysAgo);
    const symbol = randomChoice(SYMBOLS);
    const side = randomChoice(SIDES);
    const positionSide = randomChoice(POSITION_SIDES);
    const leverage = randomChoice(LEVERAGES);
    const marginMode = randomChoice(MARGIN_MODES);

    // 가격 생성 (심볼별 기본 가격)
    const basePrices = {
      BTCUSDT: 90000,
      ETHUSDT: 3000,
      SOLUSDT: 150,
      BNBUSDT: 600,
      ADAUSDT: 0.5,
    };
    const basePrice = basePrices[symbol];
    const price = basePrice * random(0.95, 1.05); // ±5% 변동

    // 수량 생성
    const size = random(0.001, 0.1);

    // 수수료 계산 (0.04% ~ 0.06%)
    const feeRate = random(0.0004, 0.0006);
    const notional = price * size;
    const isTaker = randomChoice(["taker", "maker"]) === "taker";
    const fee = notional * feeRate * (isTaker ? 1 : -0.5);

    // 손익 생성 (60% 승률 가정)
    const isWin = Math.random() < 0.6;
    const profit = isWin
      ? random(0.01, 50) // 수익
      : random(-50, -0.01); // 손실

    const tradeId = `dummy_trade_${Date.now()}_${i}`;
    const orderId = `dummy_order_${Date.now()}_${i}`;
    const fillId = tradeId;

    fills.push({
      apiKeyHash: API_KEY_HASH,
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
      role: randomChoice(["taker", "maker"]),
      marginMode,
      leverage,
      tradeTime,
      raw: {
        fillId,
        tradeId,
        orderId,
        symbol,
        side,
        price: price.toString(),
        size: size.toString(),
        fee: fee.toString(),
        profit: profit.toString(),
        cTime: tradeTime.getTime().toString(),
      },
    });
  }

  // 시간순 정렬 (오래된 것부터)
  fills.sort((a, b) => a.tradeTime.getTime() - b.tradeTime.getTime());

  return fills;
}

/**
 * Order 데이터 생성 (Fill 기반)
 */
function generateOrders(fills) {
  const orders = [];
  const orderMap = new Map(); // orderId별로 그룹화

  // Fill을 orderId별로 그룹화
  fills.forEach((fill) => {
    if (!orderMap.has(fill.orderId)) {
      orderMap.set(fill.orderId, []);
    }
    orderMap.get(fill.orderId).push(fill);
  });

  // 각 orderId에 대해 Order 생성
  orderMap.forEach((fillGroup, orderId) => {
    const firstFill = fillGroup[0];
    const totalSize = fillGroup.reduce((sum, f) => sum + f.size, 0);
    const avgPrice =
      fillGroup.reduce((sum, f) => sum + f.price * f.size, 0) / totalSize;

    // reduceOnly 판단: close 포지션이면 true
    const isClose =
      (firstFill.side === "sell" && firstFill.positionSide === "long") ||
      (firstFill.side === "buy" && firstFill.positionSide === "short");

    orders.push({
      apiKeyHash: API_KEY_HASH,
      exchange: "bitget",
      productType: "USDT-FUTURES",
      symbol: firstFill.symbol,
      orderId,
      clientOid: `client_${orderId}`,
      side: firstFill.side,
      positionSide: firstFill.positionSide,
      orderType: randomChoice(ORDER_TYPES),
      timeInForce: randomChoice(["GTC", "IOC", "FOK"]),
      marginMode: firstFill.marginMode,
      leverage: firstFill.leverage,
      price: parseFloat(firstFill.price.toFixed(2)),
      size: parseFloat(totalSize.toFixed(6)),
      filledSize: parseFloat(totalSize.toFixed(6)),
      avgFillPrice: parseFloat(avgPrice.toFixed(2)),
      state: "filled",
      reduceOnly: isClose,
      createTime: firstFill.tradeTime,
      updateTime: fillGroup[fillGroup.length - 1].tradeTime,
      raw: {
        orderId,
        symbol: firstFill.symbol,
        side: firstFill.side,
        size: totalSize.toString(),
        status: "filled",
        cTime: firstFill.tradeTime.getTime().toString(),
        uTime: fillGroup[fillGroup.length - 1].tradeTime.getTime().toString(),
      },
    });
  });

  return orders;
}

/**
 * Position History 데이터 생성 (Fill 기반)
 */
function generatePositions(fills) {
  const positions = [];
  const positionMap = new Map(); // symbol + positionSide별로 그룹화

  // Fill을 포지션별로 그룹화
  fills.forEach((fill) => {
    const key = `${fill.symbol}_${fill.positionSide}`;
    if (!positionMap.has(key)) {
      positionMap.set(key, []);
    }
    positionMap.get(key).push(fill);
  });

  // 각 포지션에 대해 Position History 생성
  let positionIdCounter = 1;
  positionMap.forEach((fillGroup, key) => {
    const [symbol, holdSide] = key.split("_");

    // 오픈/클로즈 구분
    let openFills;
    let closeFills;
    if (holdSide === "long") {
      openFills = fillGroup.filter((f) => f.side === "buy");
      closeFills = fillGroup.filter((f) => f.side === "sell");
    } else {
      openFills = fillGroup.filter((f) => f.side === "sell");
      closeFills = fillGroup.filter((f) => f.side === "buy");
    }

    if (openFills.length === 0 || closeFills.length === 0) {
      return; // 오픈/클로즈가 모두 있어야 포지션 히스토리 생성
    }

    // 오픈 가격 (첫 오픈 fill)
    const openFill = openFills[0];
    const openPrice = openFill.price;
    const openTime = openFill.tradeTime;

    // 클로즈 가격 (마지막 클로즈 fill)
    const closeFill = closeFills[closeFills.length - 1];
    const closePrice = closeFill.price;
    const closeTime = closeFill.tradeTime;

    // 포지션 크기
    const size = openFills.reduce((sum, f) => sum + f.size, 0);

    // 손익 계산
    let realisedPnl = 0;
    if (holdSide === "long") {
      realisedPnl = (closePrice - openPrice) * size;
    } else {
      realisedPnl = (openPrice - closePrice) * size;
    }

    // 수수료 차감
    const totalFeeAmount = fillGroup.reduce(
      (sum, f) => sum + Math.abs(f.fee),
      0
    );
    realisedPnl -= totalFeeAmount;

    const leverage = openFill.leverage;
    const marginMode = openFill.marginMode;

    positions.push({
      apiKeyHash: API_KEY_HASH,
      exchange: "bitget",
      productType: "USDT-FUTURES",
      symbol,
      positionId: `dummy_position_${positionIdCounter}`,
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
        autoMargin: randomChoice(["on", "off"]),
        netProfit: parseFloat(realisedPnl.toFixed(2)),
        totalFunding: 0,
      },
      raw: {
        positionId: `dummy_position_${positionIdCounter}`,
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

/**
 * 더미 데이터 생성 및 저장
 */
async function generateAndSaveDummyData() {
  try {
    console.log("=== Bitget 더미 데이터 생성 시작 ===");
    console.log(`사용 API Key: ${process.argv[2] || FRONTEND_API_KEY}`);
    console.log(`API Key Hash: ${API_KEY_HASH}`);
    console.log(
      "\n⚠️  주의: 기존에 생성된 더미 데이터가 있다면 삭제 후 실행하세요.\n"
    );

    // 기존 더미 데이터 삭제
    await BitgetTrade.deleteMany({ apiKeyHash: API_KEY_HASH });
    await BitgetOrder.deleteMany({ apiKeyHash: API_KEY_HASH });
    await BitgetPositionHistory.deleteMany({ apiKeyHash: API_KEY_HASH });
    console.log("기존 더미 데이터 삭제 완료");

    // 1. Fill 데이터 생성 (100개)
    console.log("Fill 데이터 생성 중...");
    const fills = generateFills();
    await BitgetTrade.insertMany(fills);
    console.log(`Fill 데이터 ${fills.length}개 생성 완료`);

    // 2. Order 데이터 생성 (Fill 기반)
    console.log("Order 데이터 생성 중...");
    const orders = generateOrders(fills);
    await BitgetOrder.insertMany(orders);
    console.log(`Order 데이터 ${orders.length}개 생성 완료`);

    // 3. Position History 데이터 생성 (Fill 기반)
    console.log("Position History 데이터 생성 중...");
    const positions = generatePositions(fills);
    await BitgetPositionHistory.insertMany(positions);
    console.log(`Position History 데이터 ${positions.length}개 생성 완료`);

    console.log("\n=== 더미 데이터 생성 완료 ===");
    console.log(`사용 API Key: ${process.argv[2] || FRONTEND_API_KEY}`);
    console.log(`API Key Hash: ${API_KEY_HASH}`);
    console.log(`Fill: ${fills.length}개`);
    console.log(`Order: ${orders.length}개`);
    console.log(`Position: ${positions.length}개`);

    // 통계 출력
    const totalPnl = fills.reduce((sum, f) => sum + (f.realisedPnl || 0), 0);
    const totalFees = fills.reduce((sum, f) => sum + Math.abs(f.fee || 0), 0);
    const winCount = fills.filter((f) => (f.realisedPnl || 0) > 0).length;
    const winRate = (winCount / fills.length) * 100;

    console.log("\n=== 통계 ===");
    console.log(`총 손익: ${totalPnl.toFixed(2)} USDT`);
    console.log(`총 수수료: ${totalFees.toFixed(2)} USDT`);
    console.log(`승률: ${winRate.toFixed(2)}%`);
    console.log(`승리 거래: ${winCount}개`);
    console.log(`손실 거래: ${fills.length - winCount}개`);

    process.exit(0);
  } catch (error) {
    console.error("더미 데이터 생성 오류:", error);
    process.exit(1);
  }
}

// 스크립트 실행
generateAndSaveDummyData();
