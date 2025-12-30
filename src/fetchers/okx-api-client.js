// src/fetchers/okx-api-client.js
// OKX API client (signing & request helpers)

import crypto from "crypto";
import axios from "axios";

const OKX_API_BASE_URL = "https://www.okx.com";

/**
 * Generate OKX signature
 * @param {string} method - HTTP method
 * @param {string} requestPath - API path with query string
 * @param {string} body - Serialized request body
 * @param {string} timestamp - ISO8601 timestamp
 * @param {string} secretKey - API secret
 * @returns {string}
 */
function generateOkxSignature(method, requestPath, body, timestamp, secretKey) {
  const prehash = `${timestamp}${method}${requestPath}${body}`;
  return crypto
    .createHmac("sha256", secretKey)
    .update(prehash)
    .digest("base64");
}

/**
 * Build OKX auth headers
 * @param {Object} params
 * @param {string} params.apiKey
 * @param {string} params.secretKey
 * @param {string} params.passphrase
 * @param {string} params.method
 * @param {string} params.path
 * @param {string} [params.body]
 * @returns {Object}
 */
export function createOkxHeaders({
  apiKey,
  secretKey,
  passphrase,
  method,
  path,
  body = "",
}) {
  const timestamp = new Date().toISOString();
  const signature = generateOkxSignature(method, path, body, timestamp, secretKey);

  return {
    "OK-ACCESS-KEY": apiKey,
    "OK-ACCESS-SIGN": signature,
    "OK-ACCESS-TIMESTAMP": timestamp,
    "OK-ACCESS-PASSPHRASE": passphrase,
    "Content-Type": "application/json",
  };
}

/**
 * Execute an OKX API request
 * @param {Object} params
 * @param {string} params.apiKey
 * @param {string} params.secretKey
 * @param {string} params.passphrase
 * @param {string} params.method
 * @param {string} params.path
 * @param {Object} [params.params]
 * @param {Object} [params.body]
 * @returns {Promise<Object>}
 */
export async function okxApiRequest({
  apiKey,
  secretKey,
  passphrase,
  method = "GET",
  path,
  params = {},
  body,
}) {
  const queryString = new URLSearchParams(params).toString();
  const fullPath = queryString ? `${path}?${queryString}` : path;
  const serializedBody = body ? JSON.stringify(body) : "";

  const headers = createOkxHeaders({
    apiKey,
    secretKey,
    passphrase,
    method,
    path: fullPath,
    body: serializedBody,
  });

  const url = `${OKX_API_BASE_URL}${fullPath}`;

  try {
    const response = await axios({
      method,
      url,
      headers,
      data: serializedBody || undefined,
    });

    if (response.data.code !== "0") {
      throw new Error(
        `OKX API Error: ${response.data.msg} (code: ${response.data.code})`
      );
    }

    return { data: response.data, headers: response.headers };
  } catch (error) {
    if (error.response) {
      throw new Error(
        `OKX API Request Failed: ${error.response.status} - ${JSON.stringify(
          error.response.data
        )}`
      );
    }
    throw error;
  }
}

export const OKX_API_BASE = OKX_API_BASE_URL;
