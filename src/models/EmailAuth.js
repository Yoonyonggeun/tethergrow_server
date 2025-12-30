import mongoose from "mongoose";

const { Schema } = mongoose;

const EmailAuthSchema = new Schema(
  {
    email: { type: String, required: true }, // 이메일 주소
    authCode: { type: String, required: true }, // 인증 코드(6자리 숫자)
    expiredAt: { type: Date, required: true }, // 인증 코드 만료 시간(10분)
  },
  { timestamps: true }
);

const model = mongoose.model("EmailAuth", EmailAuthSchema);

export default model;
