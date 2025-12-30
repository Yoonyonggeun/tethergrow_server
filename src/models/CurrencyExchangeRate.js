import mongoose from "mongoose";

const { Schema } = mongoose;

const CurrencyExchangeRateSchema = new Schema(
  {
    currency: { type: String, required: true }, // 환율 통화
    exchangeRate: { type: Number, required: true }, // 환율
  },
  { timestamps: true }
);

const model = mongoose.model("CurrencyExchangeRate", CurrencyExchangeRateSchema);

export default model;
