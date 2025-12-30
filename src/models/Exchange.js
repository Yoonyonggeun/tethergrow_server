import mongoose from "mongoose";

const { Schema } = mongoose;

const ExchangeSchema = new Schema(
  {
    order: { type: Number, required: true }, // 노출 순서
    logo: { type: String, required: true }, // 거래소 로고
    nameKo: { type: String, required: true }, // 거래소 이름(한글)
    nameEn: { type: String, required: true }, // 거래소 이름(영어)
    joinLink: { type: String, required: true }, // 거래소 가입 링크
    paybackRate: { type: Number, required: true }, // 테더그로우 페이백율
    exchangePaybackRate: { type: Number, required: true }, // 거래소 페이백율
    transactionDiscountRate: { type: Number, required: true }, // 거래 할인율
    normalLimitOrder: { type: String, required: true }, // 일반 지정가
    normalMarketOrder: { type: String, required: true }, // 일반 시장가
    customLimitOrder: { type: String, required: true }, // 테더그로우 지정가
    customMarketOrder: { type: String, required: true }, // 테더그로우 시장가
    detailPageParams: { type: String, required: true }, // 상세 페이지 파라미터[거래소명 영문으로 저장]
    // 데이터 가공용
    lastUploadUidAt: { type: Date }, // 마지막 UID 업로드 일시
    // 상세페이지용 필드
    descriptionShort: { type: String }, // 한 줄 설명
    highlightBadge: { type: String }, // "한국 유저 추천", "높은 페이백" 등
    paybackPayoutTimeDesc: { type: String }, // 페이백 지급 시간 설명
    withdrawDesc: { type: String }, // 출금 안내
    relationshipDesc: { type: String }, // 제휴 관계 안내
    // 통계/신뢰도 필드
    avgMonthlyPaybackUsd: { type: Number }, // 최근 n개월 평균 환급액
    avgUserPaybackUsd: { type: Number }, // 1인당 평균 누적 페이백
    totalIntegratedUsers: { type: Number }, // UID 연동된 유저 수
    samplePaybackExamples: [
      {
        month: String, // "2025-10"
        amountUsd: Number,
      },
    ],
  },
  { timestamps: true }
);

const model = mongoose.model("Exchange", ExchangeSchema);

export default model;
