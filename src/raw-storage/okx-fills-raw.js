// src/raw-storage/okx-fills-raw.js
// OKX Fills Raw Storage Model

import mongoose from "mongoose";

const { Schema } = mongoose;

const OkxFillsRawSchema = new Schema(
  {
    rawData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    apiKeyHash: {
      type: String,
      required: true,
      index: true,
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    instType: {
      type: String,
      index: true,
    },
    instId: {
      type: String,
      index: true,
    },
    tradeId: {
      type: String,
      index: true,
    },
    ordId: {
      type: String,
      index: true,
    },
    ts: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "okx_fills_raw",
  }
);

OkxFillsRawSchema.index({ apiKeyHash: 1, instId: 1, ts: -1 });
OkxFillsRawSchema.index({ apiKeyHash: 1, tradeId: 1 }, { unique: true });

const model = mongoose.model("OkxFillsRaw", OkxFillsRawSchema);

export default model;
