import mongoose from "mongoose";

const { Schema } = mongoose;

const IntegrationSchema = new Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    }, // 연동 신청 처리 상태 [승인대기, 연동완료, 연동실패]
    userID: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // 회원 정보
    uid: { type: String, required: true }, // uid
    exchangeID: { type: mongoose.Schema.Types.ObjectId, ref: "Exchange" }, // 연동 신청 uid 거래소 정보
    hasApiKeys: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

const model = mongoose.model("Integration", IntegrationSchema);

export default model;
