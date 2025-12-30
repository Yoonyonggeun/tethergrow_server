import mongoose from "mongoose";

const { Schema } = mongoose;

const ExhibitionSchema = new Schema(
  {
    // 메인 페이지 노출 월 평균 페이백 금액
    monthlyAveragePayback: {
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

const model = mongoose.model("Exhibition", ExhibitionSchema);

export default model;
