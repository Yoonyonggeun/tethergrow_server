import mongoose from "mongoose";

const { Schema } = mongoose;

const FaqSchema = new Schema(
  {
    title: { type: String, required: true }, // 제목
    content: { type: String, required: true }, // 내용
    category: {
      type: String,
      enum: ["service", "security", "ai", "pricing", "etc"],
      required: true,
      index: true,
    }, // 카테고리
    order: {
      type: Number,
      required: true,
      default: 0,
    }, // 카테고리별 노출 순서 (같은 카테고리 내에서만 의미 있음)
    isVisible: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    }, // 노출 여부
  },
  { timestamps: true }
);

// 복합 인덱스: 카테고리별 정렬 순서 (같은 카테고리 내에서만 order가 의미 있음)
FaqSchema.index({ category: 1, order: 1 });
FaqSchema.index({ category: 1, isVisible: 1, order: 1 });

const model = mongoose.model("Faq", FaqSchema);

export default model;
