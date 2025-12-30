import mongoose from "mongoose";

const { Schema } = mongoose;

const UidSchema = new Schema(
  {
    uid: { type: String, required: true }, // 거래소별 uid 정보
    exchangeID: { type: mongoose.Schema.Types.ObjectId, ref: "Exchange" }, // 거래소 정보
    payback: {
      accumulate: { type: Number, required: true, default: 0 }, // 누적 페이백
      receive: { type: Number, required: true, default: 0 }, // 받아간 페이백
    },
  },
  { timestamps: true }
);

const model = mongoose.model("Uid", UidSchema);

export default model;
