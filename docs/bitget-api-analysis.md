# Bitget API 분석 문서 - AI 분석용

**작성일**: 2025-01-XX  
**목적**: TetherGrow AI 분석 시스템을 위한 Bitget API 엔드포인트 분석 및 문서화  
**참고**: [Bitget 공식 API 문서](https://www.bitget.com/api-doc/contract/intro)

---

## 📋 목차

1. [체결 내역 (Fills/Trades)](#1-체결-내역-fillstrades)
2. [레버리지 정보 (Leverage)](#2-레버리지-정보-leverage)
3. [강제 청산 (Force Close)](#3-강제-청산-force-close)
4. [AI 분석에 필요한 데이터 매핑](#4-ai-분석에-필요한-데이터-매핑)

---

## 1. 체결 내역 (Fills/Trades)

### 1-1. API 엔드포인트

**엔드포인트**: `GET /api/v2/mix/order/fill-history`  
**공식 문서**: https://www.bitget.com/api-doc/contract/trade/Get-Fill-History  
**목적**: 실제 체결된 거래의 상세 정보 및 수수료 (PnL 계산에 필수)

### 1-2. Request 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|---------|------|------|------|------|
| `productType` | String | ✅ | 상품 타입 | `USDT-FUTURES` |
| `symbol` | String | ❌ | 거래쌍 | `BTCUSDT` |
| `startTime` | Long | ❌ | 시작 시간 (밀리초) | `1704067200000` |
| `endTime` | Long | ❌ | 종료 시간 (밀리초) | `1704153600000` |
| `pageSize` | Integer | ❌ | 페이지 크기 (최대 100) | `100` |
| `lastEndId` | String | ❌ | 마지막 체결 ID (페이지네이션) | `987654321` |

### 1-3. Response 구조

```json
{
  "code": "00000",
  "msg": "success",
  "requestTime": 1704067200000,
  "data": {
    "list": [
      {
        "fillId": "987654321",
        "orderId": "123456789",
        "symbol": "BTCUSDT",
        "side": "open_long",
        "price": "45000",
        "size": "0.1",
        "fee": "4.5",
        "feeCoin": "USDT",
        "profit": "0",
        "enterPointSource": "web",
        "tradeSide": "open",
        "holdMode": "double_hold",
        "cTime": "1704067200000",
        "takerMakerFlag": "maker"
      }
    ],
    "endId": "987654321",
    "hasMore": true
  }
}
```

### 1-4. AI 분석에 필요한 필드

| 필드 | 설명 | AI 분석 활용 |
|------|------|-------------|
| `fillId` | 체결 ID (고유키) | 중복 방지, 거래 추적 |
| `orderId` | 주문 ID | 주문-체결 매칭 |
| `symbol` | 거래쌍 | 코인별 분석 |
| `side` | 방향 (`open_long`, `close_long`, `open_short`, `close_short`) | 포지션 방향 분석 |
| `price` | 체결 가격 | PnL 계산 |
| `size` | 체결 수량 | 거래 규모 분석 |
| `fee` | 수수료 | 페이백 계산 |
| `feeCoin` | 수수료 코인 | 수수료 통계 |
| `profit` | 실현 손익 | 수익/손실 분석 |
| `cTime` | 체결 시간 (밀리초) | 시간대별 패턴 분석 |
| `takerMakerFlag` | Taker/Maker 구분 | 수수료 환급 계산 |

### 1-5. 페이지네이션 처리

- `hasMore: true`인 경우 `lastEndId`를 다음 요청에 사용
- 최대 `pageSize: 100`까지 가능
- 최근 30일 데이터 수집 시 반복 호출 필요

---

## 2. 레버리지 정보 (Leverage)

### 2-1. API 엔드포인트

**현재 포지션**: `GET /api/mix/v1/position/allPosition-v2`  
**공식 문서**: https://bitgetlimited.github.io/apidoc/en/mix/#get-all-position-v2  
**목적**: 현재 보유 포지션 및 레버리지 정보

**히스토리 포지션**: `GET /api/v2/mix/position/history-position`  
**공식 문서**: https://www.bitget.com/api-doc/contract/position/Get-History-Position  
**목적**: 과거 포지션 히스토리 및 레버리지 사용 패턴

### 2-2. Request 파라미터 (현재 포지션)

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|---------|------|------|------|------|
| `productType` | String | ✅ | 상품 타입 | `usdt-m` |
| `symbol` | String | ❌ | 거래쌍 | `BTCUSDT` |

### 2-3. Response 구조 (현재 포지션)

```json
{
  "code": "00000",
  "msg": "success",
  "data": [
    {
      "symbol": "BTCUSDT",
      "holdSide": "long",
      "openPriceAvg": "45000",
      "total": "0.1",
      "available": "0.1",
      "leverage": "10",
      "marginMode": "isolated",
      "unrealizedPL": "500",
      "margin": "450",
      "autoMargin": "on"
    }
  ]
}
```

### 2-4. Request 파라미터 (히스토리 포지션)

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|---------|------|------|------|------|
| `productType` | String | ✅ | 상품 타입 | `USDT-FUTURES` |
| `symbol` | String | ❌ | 거래쌍 | `BTCUSDT` |
| `startTime` | Long | ❌ | 시작 시간 (밀리초) | `1704067200000` |
| `endTime` | Long | ❌ | 종료 시간 (밀리초) | `1704153600000` |
| `pageSize` | Integer | ❌ | 페이지 크기 | `100` |
| `lastEndId` | String | ❌ | 마지막 ID (페이지네이션) | `123456789` |

### 2-5. AI 분석에 필요한 필드

| 필드 | 설명 | AI 분석 활용 |
|------|------|-------------|
| `leverage` | 레버리지 배수 | '과다 레버리지' 패턴 분석 |
| `holdSide` | 포지션 방향 (`long`/`short`) | 방향별 레버리지 사용 패턴 |
| `marginMode` | 마진 모드 (`isolated`/`cross`) | 리스크 관리 패턴 |
| `unrealizedPL` | 미실현 손익 | 포지션별 수익성 분석 |
| `margin` | 사용 마진 | 자본 효율성 분석 |

### 2-6. '과다 레버리지' 분석 기준

- **기준 1**: 레버리지 10배 이상 사용 빈도
- **기준 2**: 레버리지 20배 이상 사용 빈도
- **기준 3**: 고레버리지 사용 시 손실 발생 빈도
- **기준 4**: 레버리지와 손익의 상관관계 분석

---

## 3. 강제 청산 (Force Close)

### 3-1. API 엔드포인트

**엔드포인트**: `GET /api/v2/mix/order/orders-history`  
**공식 문서**: https://www.bitget.com/api-doc/contract/trade/Get-Orders-History  
**목적**: 주문 내역 조회 (강제 청산 확인, 승률 계산, 손익비 계산)

### 3-2. Request 파라미터

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|---------|------|------|------|------|
| `productType` | String | ✅ | 상품 타입 | `USDT-FUTURES` |
| `symbol` | String | ❌ | 거래쌍 | `BTCUSDT` |
| `startTime` | Long | ❌ | 시작 시간 (밀리초) | `1704067200000` |
| `endTime` | Long | ❌ | 종료 시간 (밀리초) | `1704153600000` |
| `pageSize` | Integer | ❌ | 페이지 크기 (최대 100) | `100` |
| `lastEndId` | String | ❌ | 마지막 주문 ID (페이지네이션) | `123456789` |
| `status` | String | ❌ | 주문 상태 (`filled`, `canceled` 등) | `filled` |

### 3-3. Response 구조

```json
{
  "code": "00000",
  "msg": "success",
  "requestTime": 1704067200000,
  "data": {
    "list": [
      {
        "orderId": "123456789",
        "clientOid": "abc123",
        "symbol": "BTCUSDT",
        "size": "0.1",
        "orderType": "limit",
        "side": "open_long",
        "price": "45000",
        "priceAvg": "45000",
        "filledAmount": "0.1",
        "status": "filled",
        "leverage": "10",
        "marginMode": "isolated",
        "reduceOnly": false,
        "enterPointSource": "web",
        "tradeSide": "open",
        "holdMode": "double_hold",
        "cTime": "1704067200000",
        "uTime": "1704067300000"
      }
    ],
    "endId": "123456789",
    "hasMore": true
  }
}
```

### 3-4. 강제 청산 확인 방법

**⚠️ 중요**: Bitget API 응답에 직접적인 `force` 필드가 없을 수 있습니다.

**강제 청산 판단 방법**:

1. **체결 내역 (`fill-history`)에서 확인**:
   - `side: "close_long"` 또는 `side: "close_short"`인데
   - `reduceOnly: false`이고
   - 손실이 큰 경우 강제 청산 가능성

2. **주문 히스토리 (`orders-history`)에서 확인**:
   - `status: "filled"`이고
   - `reduceOnly: true`인 경우 손절/이익실현
   - `reduceOnly: false`인데 손실이 큰 경우 강제 청산 가능성

3. **포지션 히스토리에서 확인**:
   - 포지션이 갑자기 종료되고
   - 손실이 큰 경우 강제 청산 가능성

### 3-5. AI 분석에 필요한 필드

| 필드 | 설명 | AI 분석 활용 |
|------|------|-------------|
| `orderId` | 주문 ID (고유키) | 주문 추적 |
| `status` | 주문 상태 (`filled`, `canceled` 등) | 완료된 거래만 분석 |
| `side` | 방향 (`open_long`, `close_long` 등) | 포지션 개폐 분석 |
| `reduceOnly` | 감소 전용 주문 여부 | 손절/이익실현 vs 강제 청산 구분 |
| `leverage` | 레버리지 배수 | 레버리지와 강제 청산 상관관계 |
| `cTime` | 주문 생성 시간 | 시간대별 패턴 분석 |

### 3-6. '손절'과 '강제 청산' 구분 방법

| 구분 | 손절 (Stop Loss) | 강제 청산 (Force Close) |
|------|-----------------|------------------------|
| `reduceOnly` | `true` | `false` (또는 없음) |
| 손실 규모 | 작은 손실 | 큰 손실 (마진 부족) |
| 주문 유형 | Limit/Market 주문 | 시스템 자동 청산 |
| 레버리지 | 낮은 레버리지 | 높은 레버리지 |

---

## 4. AI 분석에 필요한 데이터 매핑

### 4-1. 데이터 수집 전략

**최근 30일 데이터 수집**:

1. **체결 내역 수집** (`/api/v2/mix/order/fill-history`)
   - `startTime`: 현재 시간 - 30일 (밀리초)
   - `endTime`: 현재 시간 (밀리초)
   - `productType`: `USDT-FUTURES` (기본값)
   - 페이지네이션 처리 필수

2. **포지션 히스토리 수집** (`/api/v2/mix/position/history-position`)
   - `startTime`: 현재 시간 - 30일 (밀리초)
   - `endTime`: 현재 시간 (밀리초)
   - 레버리지 정보 추출

3. **주문 히스토리 수집** (`/api/v2/mix/order/orders-history`)
   - `startTime`: 현재 시간 - 30일 (밀리초)
   - `endTime`: 현재 시간 (밀리초)
   - `status: "filled"` (완료된 주문만)
   - 강제 청산 패턴 분석

### 4-2. AI 분석에 필요한 통계 데이터

**체결 내역 기반 통계**:

- 총 거래 횟수
- 총 실현 손익 (PnL)
- 승률 (수익 거래 / 전체 거래)
- 평균 손익비
- 코인별 거래 분포
- 시간대별 거래 패턴
- 수수료 총액 (페이백 계산)

**레버리지 기반 통계**:

- 평균 레버리지 사용량
- 최대 레버리지 사용 빈도
- 레버리지별 손익 분석
- '과다 레버리지' 사용 횟수

**강제 청산 기반 통계**:

- 강제 청산 발생 횟수
- 강제 청산으로 인한 손실액
- 강제 청산과 레버리지 상관관계
- 손절 vs 강제 청산 비율

### 4-3. 데이터 전처리 필요 사항

1. **타임스탬프 변환**: 밀리초 → Date 객체
2. **숫자 타입 변환**: 문자열 → Number
3. **사이드 정규화**: `open_long` → `BUY`, `close_long` → `SELL`
4. **중복 제거**: `tradeId` 기준 Unique 제약
5. **데이터 보완**: 누락된 필드 계산 (예: `notional = price * size`)

---

## 5. 에러 처리 및 Rate Limit

### 5-1. 에러 코드

| 코드 | 의미 | 처리 방법 |
|------|------|----------|
| `00000` | 성공 | 정상 처리 |
| `40001` | 잘못된 요청 | 파라미터 확인 |
| `40003` | 서명 오류 | 인증 재확인 |
| `40004` | 타임스탬프 오류 | 시간 동기화 |
| `40005` | 권한 없음 | API 키 권한 확인 |
| `40008` | Rate Limit 초과 | 재시도 대기 |

### 5-2. Rate Limit 처리

- **권장**: 요청 간 100ms 대기
- **Rate Limit 초과 시**: Exponential Backoff 재시도
- **최대 재시도**: 3회

### 5-3. 타임아웃 설정

- **권장 타임아웃**: 10초
- **재시도 간격**: 1초, 2초, 4초 (Exponential Backoff)

---

## 6. 구현 체크리스트

- [x] API 엔드포인트 확인
- [x] Request/Response 구조 분석
- [x] AI 분석에 필요한 필드 매핑
- [ ] 실제 API 호출 테스트
- [ ] 에러 케이스 처리 확인
- [ ] Rate Limit 확인 및 처리
- [ ] 페이지네이션 처리 구현
- [ ] 데이터 전처리 로직 구현

---

## 7. 참고 자료

- [Bitget 공식 API 문서](https://www.bitget.com/api-doc/contract/intro)
- [Bitget API 참조 가이드](../tethergrow_client/.cursor/rules/09-bitget-api-reference.mdc)
- [프로젝트 개요 - AI 분석 대시보드](../tethergrow_client/.cursor/rules/00-project-overview.mdc)

