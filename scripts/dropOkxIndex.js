/**
 * OKX Credential 인덱스 삭제 스크립트
 * 
 * 베타 버전에서 userID: null, exchangeID 조합의 unique 인덱스를 삭제하여
 * 여러 비회원이 각자 다른 API 키를 등록할 수 있도록 함
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 환경 변수 로드
dotenv.config({ path: join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/tethergrow";

async function dropIndex() {
  try {
    console.log("MongoDB 연결 중...");
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB 연결 성공");

    const db = mongoose.connection.db;
    const collection = db.collection("okxcredentials");

    // 현재 인덱스 확인
    console.log("\n현재 인덱스 목록:");
    const indexes = await collection.indexes();
    indexes.forEach((index) => {
      console.log(`- ${index.name}:`, JSON.stringify(index.key));
    });

    // userID_1_exchangeID_1 인덱스 삭제
    const indexName = "userID_1_exchangeID_1";
    try {
      await collection.dropIndex(indexName);
      console.log(`\n✅ 인덱스 "${indexName}" 삭제 성공`);
    } catch (error) {
      if (error.codeName === "IndexNotFound") {
        console.log(`\n⚠️  인덱스 "${indexName}"가 이미 존재하지 않습니다.`);
      } else {
        throw error;
      }
    }

    // 삭제 후 인덱스 목록 확인
    console.log("\n삭제 후 인덱스 목록:");
    const remainingIndexes = await collection.indexes();
    remainingIndexes.forEach((index) => {
      console.log(`- ${index.name}:`, JSON.stringify(index.key));
    });

    console.log("\n✅ 완료!");
  } catch (error) {
    console.error("❌ 오류 발생:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\nMongoDB 연결 종료");
  }
}

dropIndex();

