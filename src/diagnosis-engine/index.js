// src/diagnosis-engine/index.js
// Bitget 90D Diagnosis Engine - Main Entry Point

import crypto from "crypto";
import { fetchAllBitgetData } from "../fetchers";
import {
  saveRawData,
  BitgetFillsRaw,
  BitgetOrdersRaw,
  BitgetPositionsRaw,
} from "../raw-storage";
import { transformAllToUnified } from "../transformers";
import { fetchOHLCVData, calculateMarketStatesForTimestamps } from "../market";
import { generateBehaviorVectors } from "../behavior";
import { generateDiagnosisReport } from "../report";

/**
 * API Key 해시 생성
 * @param {string} apiKey - API Key
 * @returns {string} - SHA256 해시
 */
function hashApiKey(apiKey) {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

/**
 * Bitget 90일 진단 리포트 생성 (전체 파이프라인)
 * @param {Object} params
 * @param {string} params.apiKey - Bitget API Key
 * @param {string} params.secretKey - Bitget Secret Key
 * @param {string} params.passphrase - Bitget Passphrase
 * @param {string} [params.productType] - "USDT-FUTURES" | "COIN-FUTURES" | "USDC-FUTURES" (default: "USDT-FUTURES")
 * @param {number} [params.days] - Number of days (default: 90)
 * @param {boolean} [params.saveRawData] - Raw 데이터 저장 여부 (default: true)
 * @param {Function} [params.onProgress] - Progress callback
 * @returns {Promise<Object>} DiagnosisReport
 */
export async function generateBitget90DDiagnosis({
  apiKey,
  secretKey,
  passphrase,
  productType = "USDT-FUTURES",
  days = 90,
  saveRawDataFlag = true,
  onProgress,
}) {
  try {
    const apiKeyHash = hashApiKey(apiKey);

    // Step 1: DB에서 기존 데이터 조회 또는 API에서 가져오기
    let rawData = { fills: [], orders: [], positions: [] };

    if (saveRawDataFlag) {
      // DB에서 기존 데이터 조회
      if (onProgress) onProgress("fetching", "저장된 데이터를 조회하는 중...");
      const existingFills = await BitgetFillsRaw.find({ apiKeyHash }).lean();
      const existingOrders = await BitgetOrdersRaw.find({ apiKeyHash }).lean();
      const existingPositions = await BitgetPositionsRaw.find({
        apiKeyHash,
      }).lean();

      rawData = {
        fills: existingFills.map((f) => f.rawData),
        orders: existingOrders.map((o) => o.rawData),
        positions: existingPositions.map((p) => p.rawData),
      };

      // 데이터가 없거나 부족하면 API에서 가져오기
      const totalCount =
        rawData.fills.length + rawData.orders.length + rawData.positions.length;
      if (totalCount === 0) {
        if (onProgress)
          onProgress("fetching", "Bitget API에서 데이터를 가져오는 중...");
        rawData = await fetchAllBitgetData({
          apiKey,
          secretKey,
          passphrase,
          productType,
          days,
          onProgress: (type, count, batch) => {
            if (onProgress) {
              onProgress("fetching", `${type}: ${count}개 수집됨`);
            }
          },
        });
      }
    } else {
      // saveRawDataFlag가 false면 API에서 직접 가져오기
      if (onProgress)
        onProgress("fetching", "Bitget API에서 데이터를 가져오는 중...");
      rawData = await fetchAllBitgetData({
        apiKey,
        secretKey,
        passphrase,
        productType,
        days,
        onProgress: (type, count, batch) => {
          if (onProgress) {
            onProgress("fetching", `${type}: ${count}개 수집됨`);
          }
        },
      });
    }

    // Step 2: Raw 데이터 저장 (선택적)
    if (saveRawDataFlag) {
      if (onProgress) onProgress("saving", "Raw 데이터 저장 중...");
      await saveRawData({
        apiKeyHash,
        fills: rawData.fills,
        orders: rawData.orders,
        positions: rawData.positions,
        productType,
      });
    }

    // Step 3: Unified 모델로 변환
    if (onProgress) onProgress("transforming", "Unified 모델로 변환 중...");
    const { actions, contexts, results } = transformAllToUnified({
      fills: rawData.fills,
      orders: rawData.orders,
      positions: rawData.positions,
    });

    // Step 4: OHLCV 데이터 가져오기 (주요 심볼만)
    if (onProgress) onProgress("market", "시장 데이터 수집 중...");
    const symbols = [...new Set(results.map((r) => r.symbol))].slice(0, 2); // 최대 2개 심볼
    const klinesData = {};
    for (const symbol of symbols) {
      try {
        klinesData[symbol] = await fetchOHLCVData({ symbol, days });
      } catch (error) {
        console.warn(`Failed to fetch OHLCV for ${symbol}:`, error.message);
      }
    }

    // Step 5: Market States 계산
    if (onProgress) onProgress("market", "시장 상태 계산 중...");
    const marketStates = [];
    for (const symbol of Object.keys(klinesData)) {
      const klines = klinesData[symbol]["5m"] || []; // 5분봉 사용
      const timestamps = results
        .filter((r) => r.symbol === symbol)
        .map((r) => r.closeTime);
      if (timestamps.length > 0) {
        const states = calculateMarketStatesForTimestamps({
          klines,
          timestamps,
          symbol,
        });
        marketStates.push(...states);
      }
    }

    // Step 6: Behavior Vectors 생성 (선택적, 리포트에 포함하지 않음)
    // const behaviorVectors = generateBehaviorVectors({ actions, contexts, results });

    // Step 7: Diagnosis Report 생성
    if (onProgress) onProgress("generating", "진단 리포트 생성 중...");
    const report = generateDiagnosisReport({
      actions,
      contexts,
      results,
      marketStates,
      klines: klinesData[symbols[0]]?.["5m"], // 첫 번째 심볼의 5분봉 사용
    });

    if (onProgress) onProgress("complete", "완료!");
    return report;
  } catch (error) {
    throw new Error(`Diagnosis generation failed: ${error.message}`);
  }
}
