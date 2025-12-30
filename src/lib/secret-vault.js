// src/lib/secret-vault.js
// API 키 암호화 공통 유틸리티 (AES-256-GCM)
import crypto from "crypto";

// 환경변수: API_CRED_SECRET (기존 BITGET_CRED_SECRET과 호환)
const RAW_KEY = process.env.API_CRED_SECRET || process.env.BITGET_CRED_SECRET;

if (!RAW_KEY) {
  throw new Error(
    "API_CRED_SECRET 환경변수가 없습니다. API 키 암호화를 위해 필수입니다."
  );
}

// 32바이트 키로 변환 (AES-256용)
const KEY = crypto.createHash("sha256").update(RAW_KEY).digest(); // Buffer(32)

/**
 * 평문 문자열을 AES-256-GCM으로 암호화
 * @param {string} plain - 암호화할 평문 문자열
 * @returns {string} - 암호화된 문자열 (형식: iv:ciphertext:tag, hex)
 */
export function encryptSecret(plain) {
  if (!plain) return "";

  const iv = crypto.randomBytes(12); // GCM 권장 12바이트 nonce
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);

  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv.toString("hex"), enc.toString("hex"), tag.toString("hex")].join(
    ":"
  );
}

/**
 * 암호화 문자열(iv:cipher:tag) 복호화
 * @param {string} enc - 암호화된 문자열 (형식: iv:ciphertext:tag, hex)
 * @returns {string} - 복호화된 평문 문자열
 */
export function decryptSecret(enc) {
  if (!enc) return "";

  const [ivHex, dataHex, tagHex] = enc.split(":");
  if (!ivHex || !dataHex || !tagHex) {
    throw new Error("잘못된 암호화 형식입니다.");
  }

  const iv = Buffer.from(ivHex, "hex");
  const data = Buffer.from(dataHex, "hex");
  const tag = Buffer.from(tagHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);

  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString("utf8");
}
