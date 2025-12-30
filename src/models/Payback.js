import mongoose from "mongoose";

const { Schema } = mongoose;

const PaybackSchema = new Schema(
  {
    userID: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // 회원 정보
    status: { type: String, enum: ["pending", "approved", "rejected"], required: true, default: "pending" }, // 페이백 신청 처리 상태 [승인대기, 출금완료, 출금실패]
    totalAmount: { type: Number, required: true, default: 0 }, // 출금 신청한 금액(USDT)
    uidID: { type: mongoose.Schema.Types.ObjectId, ref: "Uid" }, // 출금 신청한 UID
  },
  { timestamps: true }
);

const model = mongoose.model("Payback", PaybackSchema);

export default model;
