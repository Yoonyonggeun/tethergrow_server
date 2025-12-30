// src/fetchers/bitget-api-client.js
// Bitget API 클라이언트 (인증 및 요청 공통 로직)

import crypto from "crypto";
import axios from "axios";

const BITGET_API_BASE_URL = "https://api.bitget.com";

/**
 * Bitget API 서명 생성
 * @param {string} method - HTTP 메서드
 * @param {string} requestPath - API 경로
 * @param {string} body - 요청 본문 (JSON 문자열)
 * @param {string} timestamp - 타임스탬프 (밀리초)
 * @param {string} secretKey - API Secret Key
 * @returns {string} - 서명
 */
function generateSignature(method, requestPath, body, timestamp, secretKey) {
  const message = timestamp + method + requestPath + body;
  return crypto
    .createHmac("sha256", secretKey)
    .update(message)
    .digest("base64");
}

/**
 * Bitget API 요청 헤더 생성
 * @param {Object} params
 * @param {string} params.apiKey - API Key
 * @param {string} params.secretKey - Secret Key
 * @param {string} params.passphrase - Passphrase
 * @param {string} params.method - HTTP 메서드
 * @param {string} params.path - API 경로
 * @param {string} params.body - 요청 본문
 * @returns {Object} - HTTP 헤더 객체
 */
export function createBitgetHeaders({
  apiKey,
  secretKey,
  passphrase,
  method,
  path,
  body = "",
}) {
  const timestamp = Date.now().toString();
  const signature = generateSignature(method, path, body, timestamp, secretKey);

  return {
    "ACCESS-KEY": apiKey,
    "ACCESS-SIGN": signature,
    "ACCESS-TIMESTAMP": timestamp,
    "ACCESS-PASSPHRASE": passphrase,
    "Content-Type": "application/json",
    locale: "en-US",
  };
}

/**
 * Bitget API 요청 실행
 * @param {Object} params
 * @param {string} params.apiKey - API Key
 * @param {string} params.secretKey - Secret Key
 * @param {string} params.passphrase - Passphrase
 * @param {string} params.method - HTTP 메서드
 * @param {string} params.path - API 경로
 * @param {Object} params.params - 쿼리 파라미터
 * @returns {Promise<Object>} - API 응답
 */
export async function bitgetApiRequest({
  apiKey,
  secretKey,
  passphrase,
  method = "GET",
  path,
  params = {},
}) {
  // 쿼리 파라미터를 URL에 추가
  const queryString = new URLSearchParams(params).toString();
  const fullPath = queryString ? `${path}?${queryString}` : path;

  const headers = createBitgetHeaders({
    apiKey,
    secretKey,
    passphrase,
    method,
    path: fullPath,
    body: "",
  });

  const url = `${BITGET_API_BASE_URL}${fullPath}`;

  try {
    const response = await axios({
      method,
      url,
      headers,
    });

    if (response.data.code !== "00000") {
      throw new Error(
        `Bitget API Error: ${response.data.msg} (code: ${response.data.code})`
      );
    }

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        `Bitget API Request Failed: ${error.response.status} - ${JSON.stringify(
          error.response.data
        )}`
      );
    }
    throw error;
  }
}
