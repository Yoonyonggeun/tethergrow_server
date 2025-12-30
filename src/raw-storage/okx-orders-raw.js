// src/raw-storage/okx-orders-raw.js
// OKX Orders Raw Storage Model

import mongoose from "mongoose";

const { Schema } = mongoose;

const OkxOrdersRawSchema = new Schema(
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
    ordId: {
      type: String,
      index: true,
    },
    clOrdId: {
      type: String,
      index: true,
    },
    cTime: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "okx_orders_raw",
  }
);

OkxOrdersRawSchema.index({ apiKeyHash: 1, instId: 1, cTime: -1 });
OkxOrdersRawSchema.index({ apiKeyHash: 1, ordId: 1 }, { unique: true });

const model = mongoose.model("OkxOrdersRaw", OkxOrdersRawSchema);

export default model;
