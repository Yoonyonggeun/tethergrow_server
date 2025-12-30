import mongoose from "mongoose";

const { Schema } = mongoose;

const TermsSchema = new Schema(
  {
    // 이용약관
    terms: {
      translation: {
        ko: { type: String, required: true },
        en: { type: String, required: true },
        "zh-CN": { type: String, required: true },
        ja: { type: String, required: true },
        es: { type: String, required: true },
      },
    },
    // 개인정보 처리방침
    privacy: {
      translation: {
        ko: { type: String, required: true },
        en: { type: String, required: true },
        "zh-CN": { type: String, required: true },
        ja: { type: String, required: true },
        es: { type: String, required: true },
      },
    },
  },
  { timestamps: true }
);

const model = mongoose.model("Terms", TermsSchema);

export default model;
