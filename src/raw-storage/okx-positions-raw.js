// src/raw-storage/okx-positions-raw.js
// OKX Positions Raw Storage Model

import mongoose from "mongoose";

const { Schema } = mongoose;

const OkxPositionsRawSchema = new Schema(
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
    posId: {
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
    collection: "okx_positions_raw",
  }
);

OkxPositionsRawSchema.index({ apiKeyHash: 1, instId: 1, ts: -1 });
OkxPositionsRawSchema.index({ apiKeyHash: 1, posId: 1 }, { unique: true });

const model = mongoose.model("OkxPositionsRaw", OkxPositionsRawSchema);

export default model;
