/**
 * AI 분석 테스트 스크립트
 *
 * 목적: 더미 데이터로 AI 분석이 제대로 작동하는지 테스트
 */
import { generateAIAnalysis } from "../src/services/bitgetAIAnalyzer";
import "../src/db";
import dotenv from "dotenv";
import path from "path";

// .env 파일 경로 설정 (프로젝트 루트 기준)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const API_KEY_HASH = "dummy_test_api_key_hash_12345";

async function testAIAnalysis() {
  try {
    console.log("AI 분석 테스트 시작...");
    console.log(`API Key Hash: ${API_KEY_HASH}\n`);

    const startTime = Date.now();
    const result = await generateAIAnalysis(API_KEY_HASH);
    const endTime = Date.now();

    console.log("=== AI 분석 결과 ===");
    console.log("\n1. AI 3줄 요약:");
    console.log(
      `   총 손익: ${
        result.summary.totalPnl >= 0 ? "+" : ""
      }${result.summary.totalPnl.toFixed(2)} USDT`
    );
    console.log(`   치명적 습관: ${result.summary.fatalHabit}`);
    console.log(
      `   페이백 적립액: ${result.summary.paybackAmount.toFixed(2)} USDT`
    );

    console.log("\n2. 치명적 습관 TOP 1:");
    console.log(`   제목: ${result.fatalHabitTop1.title}`);
    console.log(`   설명: ${result.fatalHabitTop1.description}`);
    console.log(
      `   손실액: ${result.fatalHabitTop1.lossAmount.toFixed(2)} USDT`
    );
    console.log(`   빈도: ${result.fatalHabitTop1.frequency}회`);

    console.log("\n3. 숨겨진 강점 TOP 1:");
    console.log(`   제목: ${result.hiddenStrengthTop1.title}`);
    console.log(`   설명: ${result.hiddenStrengthTop1.description}`);
    console.log(`   승률: ${result.hiddenStrengthTop1.winRate.toFixed(2)}%`);
    console.log(`   패턴: ${result.hiddenStrengthTop1.pattern}`);

    console.log("\n4. 수익 드라이버:");
    result.profitDrivers.forEach((driver, index) => {
      console.log(
        `   ${index + 1}. ${driver.behavior}: ${driver.amount.toFixed(
          2
        )} USDT (${driver.frequency}회)`
      );
    });

    console.log("\n5. 손실 드라이버:");
    result.lossDrivers.forEach((driver, index) => {
      console.log(
        `   ${index + 1}. ${driver.behavior}: ${driver.amount.toFixed(
          2
        )} USDT (${driver.frequency}회)`
      );
    });

    console.log("\n6. AI 분석 텍스트:");
    console.log(result.aiAnalysisText);

    console.log("\n=== 토큰 사용량 ===");
    console.log(
      `프롬프트 토큰: ${result.tokenUsage.promptTokens.toLocaleString()}개`
    );
    console.log(
      `완성 토큰: ${result.tokenUsage.completionTokens.toLocaleString()}개`
    );
    console.log(`총 토큰: ${result.tokenUsage.totalTokens.toLocaleString()}개`);
    console.log(
      `예상 비용: $${result.tokenUsage.estimatedCost.totalCost.toFixed(6)}`
    );
    console.log(
      `  - Input: $${result.tokenUsage.estimatedCost.inputCost.toFixed(6)}`
    );
    console.log(
      `  - Output: $${result.tokenUsage.estimatedCost.outputCost.toFixed(6)}`
    );

    console.log("\n=== 통계 ===");
    console.log(`총 거래 횟수: ${result.statistics.totalTrades}회`);
    console.log(`승률: ${result.statistics.winRate.toFixed(2)}%`);
    console.log(`평균 레버리지: ${result.statistics.avgLeverage.toFixed(1)}x`);
    console.log(`총 주문 수: ${result.statistics.totalOrders}개`);
    console.log(`총 포지션 수: ${result.statistics.totalPositions}개`);

    console.log(`\n처리 시간: ${((endTime - startTime) / 1000).toFixed(2)}초`);

    process.exit(0);
  } catch (error) {
    console.error("AI 분석 테스트 오류:", error);
    console.error(error.stack);
    process.exit(1);
  }
}

// 스크립트 실행
testAIAnalysis();
