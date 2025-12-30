import mongoose from "mongoose";

const { Schema } = mongoose;

const ExchangeEventSchema = new Schema(
  {
    exchangeID: { type: Schema.Types.ObjectId, ref: "Exchange", required: true },
    title: { type: String, required: true }, // "신규 가입 + 입금 + 거래하면 $14,360 받아가세요"
    subTitle: { type: String }, // "Bitget 신규가입 입금 이벤트"
    bannerImage: { type: String, required: true },
    rewardDesc: { type: String, required: true }, // "최대 14,360 USDT 혜택"
    period: { type: String, required: true }, // "25.01.12 ~ 25.01.31"
    ctaLabel: { type: String, default: "자세히 보기" },
    ctaLink: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const model = mongoose.model("ExchangeEvent", ExchangeEventSchema);

export default model;

