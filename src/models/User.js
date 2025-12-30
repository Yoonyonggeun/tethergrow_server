import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    userID: { type: String, required: true }, // 아이디(이메일 주소)
    role: { type: String, required: true, enum: ["general", "admin", "master", "normal"] }, // general 관리자 승인 대기, admin 일반 관리자, master 마스터 관리자, normal: 일반 회원
  },
  { timestamps: true }
);

UserSchema.plugin(passportLocalMongoose, { usernameField: "userID" });

const model = mongoose.model("User", UserSchema);

export default model;
