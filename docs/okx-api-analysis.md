# OKX API 분석 문서

> **목적**: TetherGrow AI 분석을 위한 OKX API 엔드포인트 분석 및 문서화  
> **작성일**: 2025-01-XX  
> **참고**: GPT Deep Thinking 결과 기반

## 📋 개요

OKX 거래소 API를 통한 거래 데이터 수집 및 AI 분석을 위한 필수 엔드포인트 분석입니다.

## 🔑 인증 방식

OKX API는 API Key, Secret, Passphrase를 사용합니다.

- **Base URL**: `https://www.okx.com`
- **API Version**: v5
- **인증 방식**: HMAC SHA256 서명

### 인증 헤더

- `OK-ACCESS-KEY`: API Key
- `OK-ACCESS-SIGN`: 서명 (HMAC SHA256)
- `OK-ACCESS-TIMESTAMP`: 타임스탬프 (ISO 8601 형식)
- `OK-ACCESS-PASSPHRASE`: Passphrase
- `Content-Type`: `application/json`

## 📊 필수 데이터 3종

### 1. 체결 내역 (Fills / Trade History)

#### 엔드포인트

- **사용 엔드포인트**: `GET /api/v5/trade/fills-history` (최대 3개월 조회 가능)
- **미사용**: `GET /api/v5/trade/fills` (최근 3일만 조회 가능 - 분석 목적에 부적합)

**참고**: Bitget과 동일한 전략 적용

- 최대 90일 전까지 조회
- Fill 정보가 우선 100개가 되거나 최초 넘어서는 날까지 조회

#### 필수 파라미터

- `instType`: `SWAP` (선물 거래)
- `instId`: 심볼 (예: `BTC-USDT-SWAP`)
- `begin`: 시작 시간 (선택, Unix timestamp in milliseconds)
- `end`: 종료 시간 (선택, Unix timestamp in milliseconds)
- `limit`: 페이지당 개수 (기본값: 100, 최대: 100)

#### 필수 필드

- `ordId`: 주문 ID
- `instId`: 심볼
- `side`: 방향 (`buy` / `sell`)
- `posSide`: 포지션 방향 (`long` / `short`)
- `fillSz`: 체결 수량
- `fillPx`: 체결 가격
- `fee`: 수수료
- `feeCcy`: 수수료 통화
- `fillPnl`: 체결 손익
- `fillTime`: 체결 시간 (Unix timestamp in milliseconds)
- `tradeId`: 거래 ID
- `execType`: 체결 유형 (`T` = Taker, `M` = Maker)
- `subType`: 서브 타입 (강제 청산 여부 판별)

#### 강제 청산 여부 판별

- `subType` 필드 확인
- `tradeId` 음수값 확인
- `fillPnl` 큰 음수값 확인

#### 공식 문서

- **사용**: https://www.okx.com/docs-v5/en/#rest-api-trade-get-transaction-details-history-3-months (과거 데이터, 최대 3개월)
- 참고: https://www.okx.com/docs-v5/en/#rest-api-trade-get-transaction-details-last-3-days (최근 3일 - 미사용)

---

### 2. 포지션별 레버리지 정보

#### 엔드포인트

- `GET /api/v5/account/positions`

#### 필수 파라미터

- `instType`: `SWAP` (선물 거래)
- `instId`: 심볼 (선택, 특정 심볼만 조회 시)

#### 핵심 필드

- `instId`: 심볼
- `lever`: 레버리지 배수
- `posSide`: 포지션 방향 (`long` / `short`)
- `mgnMode`: 마진 모드 (`isolated` / `cross`)
- `pos`: 포지션 수량
- `liqPx`: 청산 가격
- `upl`: 미실현 손익
- `margin`: 마진

#### 주의사항

- `lever`는 `isolated` 모드에서 정확함
- `cross` 모드에서는 일부 공백일 수 있음

#### 공식 문서

- https://www.okx.com/docs-v5/en/#rest-api-account-get-positions

---

### 3. 강제 청산 여부가 포함된 주문 내역

#### 엔드포인트

- **최근 7일**: `GET /api/v5/trade/orders-history`
- **과거 데이터**: `GET /api/v5/trade/orders-history-archive`

#### 필수 파라미터

- `instType`: `SWAP` (선물 거래)
- `instId`: 심볼 (선택)
- `begin`: 시작 시간 (선택)
- `end`: 종료 시간 (선택)
- `limit`: 페이지당 개수 (기본값: 100, 최대: 100)

#### 판별 필드

- `category`: 주문 카테고리
  - `normal`: 일반 주문
  - `partial_liquidation`: 부분 청산
  - `full_liquidation`: 전체 청산
  - `adl`: ADL (Auto-Deleveraging)

#### 기타 필드

- `pnl`: 손익
- `reduceOnly`: 감소 전용 (`true` / `false`)
- `avgPx`: 평균 체결 가격
- `state`: 주문 상태 (`filled`, `canceled` 등)
- `tdMode`: 거래 모드 (`isolated` / `cross`)
- `fillPx`: 체결 가격
- `fillSz`: 체결 수량
- `fillTime`: 체결 시간

#### 보존 기간

- 기본: 최근 7일
- 그 이상: `/orders-history-archive` 사용

#### 공식 문서

- 최근 7일: https://www.okx.com/docs-v5/en/#rest-api-trade-get-order-history-last-7-days
- 과거 데이터: https://www.okx.com/docs-v5/en/#rest-api-trade-get-order-history-archive

---

## 🔄 데이터 수집 전략

### 베타 버전 기준 (Bitget과 동일한 전략)

1. **체결 내역**:
   - 엔드포인트: `/api/v5/trade/fills-history` (최대 3개월)
   - 조회 시점 기준 최대 90일 전까지 조회
   - Fill 정보가 우선 100개가 되거나 최초 넘어서는 날까지 조회
   - ⚠️ `/api/v5/trade/fills`는 최근 3일만 조회 가능하므로 사용하지 않음
2. **포지션 정보**: 현재 포지션 조회 (`/api/v5/account/positions`)
3. **주문 히스토리**: 체결 내역과 동일한 기간 조회 (`/api/v5/trade/orders-history`)

### 수집 순서

1. 체결 내역 수집 (`/api/v5/trade/fills-history`) - **90일 또는 100개 기준**
2. 포지션 정보 수집 (`/api/v5/account/positions`)
3. 주문 히스토리 수집 (`/api/v5/trade/orders-history` 또는 `/orders-history-archive`)

---

## ⚠️ 주의사항

1. **Rate Limit**: OKX API는 Rate Limit이 있으므로 요청 간격 조절 필요
2. **인증 방식**: Bitget과 다르므로 별도 클라이언트 구현 필요
3. **응답 구조**: OKX는 `code: "0"`이 성공, `data` 배열에 실제 데이터 포함
4. **시간 형식**: Unix timestamp in milliseconds 사용
5. **심볼 형식**: `BTC-USDT-SWAP` 형식 (Bitget은 `BTCUSDT`)

---

## 📝 다음 단계

1. OKX API 클라이언트 구현 (`okxClient.js`)
2. OKX 모델 생성 (`Okx.js`)
3. OKX 데이터 수집 로직 구현 (`okxDataCollector.js`)
4. OKX AI 분석 연동 (`okxAIAnalyzer.js`)
