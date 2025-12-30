import mongoose from "mongoose";
import { encryptSecret, decryptSecret } from "../lib/secret-vault";

const { Schema } = mongoose;

const BitgetCredentialSchema = new Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    }, // 회원 정보 (null일 경우 비회원)
    exchangeID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exchange",
      required: true,
      index: true,
    }, // 거래소 정보
    encryptedApiKey: {
      type: String,
      required: true,
    }, // 암호화된 API Key
    encryptedSecretKey: {
      type: String,
      required: true,
    }, // 암호화된 Secret Key
    encryptedPassphrase: {
      type: String,
      required: true,
    }, // 암호화된 Passphrase
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    }, // 활성화 여부
  },
  { timestamps: true }
);

// 복합 인덱스: userID와 exchangeID 조합 (비회원도 고려)
BitgetCredentialSchema.index({ userID: 1, exchangeID: 1 });

// Virtual 필드: 복호화된 API Key (조회 시에만 사용)
BitgetCredentialSchema.virtual("apiKey").get(function () {
  return this.encryptedApiKey ? decryptSecret(this.encryptedApiKey) : null;
});

BitgetCredentialSchema.virtual("secretKey").get(function () {
  return this.encryptedSecretKey
    ? decryptSecret(this.encryptedSecretKey)
    : null;
});

BitgetCredentialSchema.virtual("passphrase").get(function () {
  return this.encryptedPassphrase
    ? decryptSecret(this.encryptedPassphrase)
    : null;
});

// JSON 변환 시 virtual 필드 포함
BitgetCredentialSchema.set("toJSON", { virtuals: true });

// Static 메서드: API 키 저장 (암호화)
BitgetCredentialSchema.statics.createCredential = async function (data) {
  const {
    userID,
    exchangeID,
    apiKey,
    secretKey,
    passphrase,
    isActive = true,
  } = data;

  return this.create({
    userID: userID || null,
    exchangeID,
    encryptedApiKey: encryptSecret(apiKey),
    encryptedSecretKey: encryptSecret(secretKey),
    encryptedPassphrase: encryptSecret(passphrase),
    isActive,
  });
};

// Instance 메서드: API 키 업데이트 (암호화)
BitgetCredentialSchema.methods.updateCredentials = function (data) {
  const { apiKey, secretKey, passphrase, isActive } = data;

  if (apiKey) this.encryptedApiKey = encryptSecret(apiKey);
  if (secretKey) this.encryptedSecretKey = encryptSecret(secretKey);
  if (passphrase) this.encryptedPassphrase = encryptSecret(passphrase);
  if (isActive !== undefined) this.isActive = isActive;

  return this.save();
};

const model = mongoose.model("BitgetCredential", BitgetCredentialSchema);

export default model;
