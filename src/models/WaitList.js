import mongoose from "mongoose";

const { Schema } = mongoose;

const WaitListSchema = new Schema(
  {
    email: { type: String, required: true }, // 이메일 주소
  },
  { timestamps: true }
);

const model = mongoose.model("WaitList", WaitListSchema);

export default model;
