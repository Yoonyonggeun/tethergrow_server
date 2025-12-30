/* eslint-disable operator-linebreak */
// src/controllers/okxController.js
// OKX 관련 컨트롤러

import crypto from "crypto";
import Exchange from "../models/Exchange";
import OkxCredential from "../models/OkxCredential";
import { OkxFillsRaw, OkxOrdersRaw, OkxPositionsRaw, saveOkxRawData } from "../raw-storage";
import { fetchAllOkxData } from "../fetchers";
import { generateOkx90DDiagnosis } from "../diagnosis-engine";
import WaitList from "../models/WaitList";

function hashApiKey(apiKey) {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

export const postOkxAnalyze = async (req, res) => {
  try {
    const { apiKey, secretKey, passphrase, email, instType = "SWAP", instId } = req.body;

    if (!apiKey || !secretKey || !passphrase) {
      return res.status(400).json({
        code: "080201",
        msg: "API Key, Secret Key, Passphrase는 필수입니다.",
      });
    }

    const userID = null;
    const exchange = await Exchange.findOne({ nameEn: "OKX" });
    if (!exchange) {
      return res.status(400).json({
        code: "080203",
        msg: "OKX 거래소 정보를 찾을 수 없습니다.",
      });
    }

    const apiKeyHash = hashApiKey(apiKey);

    const existingCredential = await OkxCredential.findOne({
      exchangeID: exchange._id,
      isActive: true,
    });

    let credential = null;
    if (existingCredential) {
      const allCredentials = await OkxCredential.find({
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

    const existingFillsCount = await OkxFillsRaw.countDocuments({ apiKeyHash });
    const existingOrdersCount = await OkxOrdersRaw.countDocuments({ apiKeyHash });
    const existingPositionsCount = await OkxPositionsRaw.countDocuments({
      apiKeyHash,
    });

    const totalDataCount =
      existingFillsCount + existingOrdersCount + existingPositionsCount;

    if (totalDataCount < 100) {
      const rawData = await fetchAllOkxData({
        apiKey,
        secretKey,
        passphrase,
        instType,
        instId,
        onProgress: (type, count) => {
          console.log(`[OKX Fetcher] ${type}: ${count}개 수집됨`);
        },
      });

      const newTotalCount =
        rawData.fills.length + rawData.orders.length + rawData.positions.length;

      if (newTotalCount < 100) {
        return res.status(400).json({
          code: "080204",
          msg: "분석을 위해서는 최소 100개 이상의 거래 데이터가 필요합니다.",
          dataCount: newTotalCount,
          fillsCount: rawData.fills.length,
          ordersCount: rawData.orders.length,
          positionsCount: rawData.positions.length,
        });
      }

      await saveOkxRawData({
        apiKeyHash,
        fills: rawData.fills,
        orders: rawData.orders,
        positions: rawData.positions,
        instType,
      });

      if (!credential) {
        credential = await OkxCredential.createCredential({
          userID,
          exchangeID: exchange._id,
          apiKey,
          secretKey,
          passphrase,
          isActive: true,
        });
      }
    } else if (!credential) {
      credential = await OkxCredential.createCredential({
        userID,
        exchangeID: exchange._id,
        apiKey,
        secretKey,
        passphrase,
        isActive: true,
      });
    }

    const report = await generateOkx90DDiagnosis({
      apiKey,
      secretKey,
      passphrase,
      instType,
      instId,
      saveRawDataFlag: false,
      onProgress: (stage, message) => {
        console.log(`[OKX Diagnosis] [${stage}] ${message}`);
      },
    });

    if (email) {
      try {
        const existingWaitList = await WaitList.findOne({ email });
        if (!existingWaitList) {
          await WaitList.create({ email });
          console.log(`[WaitList] 이메일 추가됨: ${email}`);
        }
      } catch (waitListError) {
        console.warn(`[WaitList] 이메일 추가 실패: ${email}`, waitListError);
      }
    }

    return res.status(200).json({
      msg: "OKX 90일 진단 분석이 완료되었습니다.",
      report,
      credentialId: credential?._id,
      dataCount: {
        fills: existingFillsCount,
        orders: existingOrdersCount,
        positions: existingPositionsCount,
        total: totalDataCount,
      },
    });
  } catch (error) {
    console.error("OKX Analyze Error:", error);
    return res.locals.handleError(error, res);
  }
};
