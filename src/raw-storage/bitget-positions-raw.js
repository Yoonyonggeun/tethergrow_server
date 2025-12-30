// src/raw-storage/bitget-positions-raw.js
// Bitget Positions Raw Storage Model
// API 응답을 변환 없이 그대로 저장

import mongoose from "mongoose";

const { Schema } = mongoose;

const BitgetPositionsRawSchema = new Schema(
  {
    // API 응답 원본 데이터 (변환 없이 저장)
    rawData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    // 메타데이터
    apiKeyHash: {
      type: String,
      required: true,
      index: true,
    }, // API Key 해시 (사용자 식별용)
    fetchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    }, // 데이터 수집 시점
    productType: {
      type: String,
      required: true,
      index: true,
    }, // "USDT-FUTURES" | "COIN-FUTURES" | "USDC-FUTURES"
    // 인덱싱을 위한 주요 필드 (조회 성능 향상)
    positionId: {
      type: String,
      index: true,
    },
    symbol: {
      type: String,
      index: true,
    },
    ctime: {
      type: String,
      index: true,
    }, // 타임스탬프 문자열
  },
  {
    timestamps: true,
    collection: "bitget_positions_raw",
  }
);

// 복합 인덱스
BitgetPositionsRawSchema.index({ apiKeyHash: 1, fetchedAt: -1 });
BitgetPositionsRawSchema.index({ apiKeyHash: 1, symbol: 1, ctime: -1 });

const model = mongoose.model("BitgetPositionsRaw", BitgetPositionsRawSchema);

export default model;
