// src/lib/credential-examples.js
// API 키 저장/조회 사용 예제

import mongoose from "mongoose";
import {
  saveCredential,
  getCredential,
  updateCredential,
  deleteCredential,
} from "./credential-utils";

/**
 * 예제 1: API 키 저장
 */
export async function exampleSaveCredential() {
  try {
    const credential = await saveCredential({
      exchangeName: "bitget", // 또는 "okx"
      userID: new mongoose.Types.ObjectId(), // 회원인 경우, 비회원은 null
      exchangeID: new mongoose.Types.ObjectId(), // Exchange 모델의 _id
      apiKey: "bg_c5cda9db6c83d74c3a1e51149c9c74db",
      secretKey:
        "a99ff62a5c7f927cb9077cb697c7dc188c87a27cfcc17d804c65f8fa6502f2fc",
      passphrase: "dydwnddnl9",
      isActive: true,
    });

    console.log("✅ API 키 저장 완료:", credential._id);
    return credential;
  } catch (error) {
    console.error("❌ 저장 실패:", error);
    throw error;
  }
}

/**
 * 예제 2: API 키 조회 (복호화된 값 포함)
 */
export async function exampleGetCredential() {
  try {
    const credential = await getCredential({
      exchangeName: "bitget",
      userID: new mongoose.Types.ObjectId(), // 선택적
      exchangeID: new mongoose.Types.ObjectId(),
      isActive: true,
    });

    if (!credential) {
      console.log("⚠️ Credential을 찾을 수 없습니다.");
      return null;
    }

    // 복호화된 값 사용
    console.log("API Key:", credential.apiKey);
    console.log("Secret Key:", credential.secretKey);
    console.log("Passphrase:", credential.passphrase);

    return credential;
  } catch (error) {
    console.error("❌ 조회 실패:", error);
    throw error;
  }
}

/**
 * 예제 3: API 키 업데이트
 */
export async function exampleUpdateCredential() {
  try {
    const credential = await updateCredential({
      exchangeName: "bitget",
      credentialID: new mongoose.Types.ObjectId(),
      apiKey: "new_api_key", // 선택적 - 업데이트할 필드만 전달
      secretKey: "new_secret_key",
      // passphrase는 업데이트하지 않음
    });

    console.log("✅ API 키 업데이트 완료:", credential._id);
    return credential;
  } catch (error) {
    console.error("❌ 업데이트 실패:", error);
    throw error;
  }
}

/**
 * 예제 4: API 키 삭제 (비활성화)
 */
export async function exampleDeleteCredential() {
  try {
    const credential = await deleteCredential({
      exchangeName: "bitget",
      credentialID: new mongoose.Types.ObjectId(),
    });

    console.log("✅ API 키 삭제 완료:", credential._id);
    return credential;
  } catch (error) {
    console.error("❌ 삭제 실패:", error);
    throw error;
  }
}

/**
 * 예제 5: 컨트롤러에서 사용하는 방법
 */
export async function exampleInController(req, res) {
  try {
    const { exchangeName, apiKey, secretKey, passphrase } = req.body;
    const userID = req.userID; // 미들웨어에서 설정된 사용자 ID
    const exchangeID = req.body.exchangeID; // 또는 쿼리에서 가져오기

    // API 키 저장
    const credential = await saveCredential({
      exchangeName,
      userID,
      exchangeID,
      apiKey,
      secretKey,
      passphrase,
    });

    return res.status(200).json({
      ok: true,
      credentialId: credential._id,
      message: "API 키가 저장되었습니다.",
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}

/**
 * 예제 6: API 호출 시 Credential 사용
 */
export async function exampleUseCredentialForApiCall() {
  try {
    // 1. Credential 조회
    const credential = await getCredential({
      exchangeName: "bitget",
      userID: new mongoose.Types.ObjectId(),
      exchangeID: new mongoose.Types.ObjectId(),
    });

    if (!credential) {
      throw new Error("Credential을 찾을 수 없습니다.");
    }

    // 2. API 호출에 사용
    const apiKey = credential.apiKey; // 복호화된 값
    const secretKey = credential.secretKey;
    const passphrase = credential.passphrase;

    // 예: Bitget API 호출
    // const response = await bitgetApiCall({
    //   apiKey,
    //   secretKey,
    //   passphrase,
    // });

    return { apiKey, secretKey, passphrase };
  } catch (error) {
    console.error("❌ API 호출 실패:", error);
    throw error;
  }
}
