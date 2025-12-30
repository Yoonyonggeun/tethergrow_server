// src/raw-storage/BitgetOrdersRaw.js
// Bitget Orders Raw Storage Model
// Bitget 주문(raw order) 응답을 변환 없이 저장하여 백필/진단 파이프라인에서 재활용하기 위한 스키마

import mongoose from "mongoose";

const { Schema } = mongoose;

const BitgetOrdersRawSchema = new Schema(
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
    orderId: {
      type: String,
      index: true,
    },
    clientOid: {
      type: String,
      index: true,
    },
    symbol: {
      type: String,
      index: true,
    },
    cTime: {
      type: String,
      index: true,
    }, // 타임스탬프 문자열
  },
  {
    timestamps: true,
    collection: "bitget_orders_raw",
  }
);

// 복합 인덱스
BitgetOrdersRawSchema.index({ apiKeyHash: 1, fetchedAt: -1 });
BitgetOrdersRawSchema.index({ apiKeyHash: 1, symbol: 1, cTime: -1 });

const model = mongoose.model("BitgetOrdersRaw", BitgetOrdersRawSchema);

export default model;
