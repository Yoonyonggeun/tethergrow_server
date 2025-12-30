/* eslint-disable operator-linebreak */
// src/controllers/bitgetController.js
// Bitget 관련 컨트롤러

import crypto from "crypto";
import Exchange from "../models/Exchange";
import BitgetCredential from "../models/BitgetCredential";
import {
  BitgetFillsRaw,
  BitgetOrdersRaw,
  BitgetPositionsRaw,
  saveRawData,
} from "../raw-storage";
import { fetchAllBitgetData } from "../fetchers";
import { generateBitget90DDiagnosis } from "../diagnosis-engine";
import WaitList from "../models/WaitList";

/**
 * API Key 해시 생성
 * @param {string} apiKey - API Key
 * @returns {string} - SHA256 해시
 */
function hashApiKey(apiKey) {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

/**
 * Bitget 분석 요청
 * @ @ 공통 [08]
 * @ - Bitget 90일 진단 분석 [01]
 */
// eslint-disable-next-line import/prefer-default-export
export const postBitgetAnalyze = async (req, res) => {
  try {
    const {
      apiKey,
      secretKey,
      passphrase,
      email,
      productType = "USDT-FUTURES",
    } = req.body;

    // 1. 필수 필드 검증
    if (!apiKey || !secretKey || !passphrase) {
      return res.status(400).json({
        code: "080101",
        msg: "API Key, Secret Key, Passphrase는 필수입니다.",
      });
    }

    // 2. 이메일 중복 검증 (이메일이 제공된 경우)
    // Note: WaitList는 중복 허용하므로 여기서는 체크하지 않음
    const userID = null; // 비회원 분석이므로 항상 null

    // 3. Exchange 정보 조회 (Bitget)
    const exchange = await Exchange.findOne({ nameEn: "Bitget" });
    if (!exchange) {
      return res.status(400).json({
        code: "080103",
        msg: "Bitget 거래소 정보를 찾을 수 없습니다.",
      });
    }

    // 4. API Key 해시 생성
    const apiKeyHash = hashApiKey(apiKey);

    // 5. Credential 체크 (이미 분석한 계정인지 확인)
    const existingCredential = await BitgetCredential.findOne({
      exchangeID: exchange._id,
      isActive: true,
    });

    // API Key로 기존 credential 찾기 (복호화해서 비교)
    let credential = null;
    if (existingCredential) {
      const allCredentials = await BitgetCredential.find({
        exchangeID: exchange._id,
        isActive: true,
      }).lean();

      for (const cred of allCredentials) {
        const { decryptSecret } = await import("../lib/secret-vault");
        const decryptedApiKey = decryptSecret(cred.encryptedApiKey);
        if (decryptedApiKey === apiKey) {
          credential = cred;
          break;
        }
      }
    }

    // 6. 기존 데이터 개수 체크
    const existingFillsCount = await BitgetFillsRaw.countDocuments({
      apiKeyHash,
    });
    const existingOrdersCount = await BitgetOrdersRaw.countDocuments({
      apiKeyHash,
    });
    const existingPositionsCount = await BitgetPositionsRaw.countDocuments({
      apiKeyHash,
    });

    const totalDataCount =
      existingFillsCount + existingOrdersCount + existingPositionsCount;

    // 7. 데이터가 100개 미만이면 새로 가져오기
    if (totalDataCount < 100) {
      // Bitget API에서 데이터 가져오기
      const rawData = await fetchAllBitgetData({
        apiKey,
        secretKey,
        passphrase,
        productType,
        days: 90,
        onProgress: (type, count) => {
          // 진행 상황 로깅 (선택적)
          console.log(`[Bitget Fetcher] ${type}: ${count}개 수집됨`);
        },
      });

      const newFillsCount = rawData.fills.length;
      const newOrdersCount = rawData.orders.length;
      const newPositionsCount = rawData.positions.length;
      const newTotalCount = newFillsCount + newOrdersCount + newPositionsCount;

      // 새로 가져온 데이터도 100개 미만이면 에러
      if (newTotalCount < 100) {
        return res.status(400).json({
          code: "080104",
          msg: "분석을 위해서는 최소 100개 이상의 거래 데이터가 필요합니다.",
          dataCount: newTotalCount,
          fillsCount: newFillsCount,
          ordersCount: newOrdersCount,
          positionsCount: newPositionsCount,
        });
      }

      // Raw 데이터 저장
      await saveRawData({
        apiKeyHash,
        fills: rawData.fills,
        orders: rawData.orders,
        positions: rawData.positions,
        productType,
      });

      // Credential 저장 (없는 경우)
      if (!credential) {
        credential = await BitgetCredential.createCredential({
          userID,
          exchangeID: exchange._id,
          apiKey,
          secretKey,
          passphrase,
          isActive: true,
        });
      }
    } else if (!credential) {
      // 기존 데이터가 100개 이상이면 그대로 사용
      // Credential이 없으면 생성
      credential = await BitgetCredential.createCredential({
        userID,
        exchangeID: exchange._id,
        apiKey,
        secretKey,
        passphrase,
        isActive: true,
      });
    }

    // 8. 진단 리포트 생성
    const report = await generateBitget90DDiagnosis({
      apiKey,
      secretKey,
      passphrase,
      productType,
      days: 90,
      saveRawDataFlag: false, // 이미 저장했으므로
      onProgress: (stage, message) => {
        console.log(`[Diagnosis Engine] [${stage}] ${message}`);
      },
    });

    // 9. 이메일이 있으면 WaitList에 추가 (중복 체크)
    if (email) {
      try {
        const existingWaitList = await WaitList.findOne({ email });
        if (!existingWaitList) {
          await WaitList.create({ email });
          console.log(`[WaitList] 이메일 추가됨: ${email}`);
        }
      } catch (waitListError) {
        // WaitList 추가 실패는 무시 (로그만 남김)
        console.warn(`[WaitList] 이메일 추가 실패: ${email}`, waitListError);
      }
    }

    // 10. 성공 응답
    return res.status(200).json({
      msg: "Bitget 90일 진단 분석이 완료되었습니다.",
      report,
      credentialId: credential._id,
      dataCount: {
        fills: existingFillsCount,
        orders: existingOrdersCount,
        positions: existingPositionsCount,
        total: totalDataCount,
      },
    });
  } catch (error) {
    console.error("Bitget Analyze Error:", error);
    return res.locals.handleError(error, res);
  }
};
