// src/lib/credential-utils.js
// API 키 저장/조회 공통 유틸리티

import BitgetCredential from "../models/BitgetCredential";
import OkxCredential from "../models/OkxCredential";
import { decryptSecret } from "./secret-vault";

/**
 * 거래소별 Credential 모델 매핑
 */
const CREDENTIAL_MODELS = {
  bitget: BitgetCredential,
  okx: OkxCredential,
  // 향후 다른 거래소 추가 가능
};

/**
 * 거래소명으로 Credential 모델 가져오기
 * @param {string} exchangeName - 거래소명 (bitget, okx 등)
 * @returns {Model} - Mongoose 모델
 */
export function getCredentialModel(exchangeName) {
  const model = CREDENTIAL_MODELS[exchangeName?.toLowerCase()];
  if (!model) {
    throw new Error(`지원하지 않는 거래소입니다: ${exchangeName}`);
  }
  return model;
}

/**
 * API 키 저장 (암호화)
 * @param {Object} params
 * @param {string} params.exchangeName - 거래소명
 * @param {ObjectId} params.userID - 사용자 ID (선택)
 * @param {ObjectId} params.exchangeID - 거래소 ID
 * @param {string} params.apiKey - API Key
 * @param {string} params.secretKey - Secret Key
 * @param {string} params.passphrase - Passphrase
 * @param {boolean} params.isActive - 활성화 여부
 * @returns {Promise<Document>} - 저장된 Credential 문서
 */
export async function saveCredential({
  exchangeName,
  userID,
  exchangeID,
  apiKey,
  secretKey,
  passphrase,
  isActive = true,
}) {
  const CredentialModel = getCredentialModel(exchangeName);

  return CredentialModel.createCredential({
    userID,
    exchangeID,
    apiKey,
    secretKey,
    passphrase,
    isActive,
  });
}

/**
 * API 키 조회 (복호화)
 * @param {Object} params
 * @param {string} params.exchangeName - 거래소명
 * @param {ObjectId} params.userID - 사용자 ID (선택)
 * @param {ObjectId} params.exchangeID - 거래소 ID
 * @param {boolean} params.isActive - 활성화 여부 필터
 * @returns {Promise<Document|null>} - Credential 문서 (virtual 필드로 복호화된 값 포함)
 */
export async function getCredential({
  exchangeName,
  userID,
  exchangeID,
  isActive = true,
}) {
  const CredentialModel = getCredentialModel(exchangeName);

  const query = { exchangeID, isActive };
  if (userID !== undefined) {
    query.userID = userID;
  }

  const credential = await CredentialModel.findOne(query).lean();

  if (!credential) return null;

  // lean() 사용 시 virtual 필드가 작동하지 않으므로 수동 복호화
  return {
    ...credential,
    apiKey: credential.encryptedApiKey
      ? decryptSecret(credential.encryptedApiKey)
      : null,
    secretKey: credential.encryptedSecretKey
      ? decryptSecret(credential.encryptedSecretKey)
      : null,
    passphrase: credential.encryptedPassphrase
      ? decryptSecret(credential.encryptedPassphrase)
      : null,
  };
}

/**
 * API 키 업데이트 (암호화)
 * @param {Object} params
 * @param {string} params.exchangeName - 거래소명
 * @param {ObjectId} params.credentialID - Credential ID
 * @param {string} params.apiKey - API Key (선택)
 * @param {string} params.secretKey - Secret Key (선택)
 * @param {string} params.passphrase - Passphrase (선택)
 * @param {boolean} params.isActive - 활성화 여부 (선택)
 * @returns {Promise<Document>} - 업데이트된 Credential 문서
 */
export async function updateCredential({
  exchangeName,
  credentialID,
  apiKey,
  secretKey,
  passphrase,
  isActive,
}) {
  const CredentialModel = getCredentialModel(exchangeName);
  const credential = await CredentialModel.findById(credentialID);

  if (!credential) {
    throw new Error("Credential을 찾을 수 없습니다.");
  }

  return credential.updateCredentials({
    apiKey,
    secretKey,
    passphrase,
    isActive,
  });
}

/**
 * API 키 삭제 (비활성화)
 * @param {Object} params
 * @param {string} params.exchangeName - 거래소명
 * @param {ObjectId} params.credentialID - Credential ID
 * @returns {Promise<Document>} - 업데이트된 Credential 문서
 */
export async function deleteCredential({ exchangeName, credentialID }) {
  return updateCredential({
    exchangeName,
    credentialID,
    isActive: false,
  });
}
