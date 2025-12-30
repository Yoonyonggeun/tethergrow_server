import express from "express";
import routes from "../routes";
import {
  postCheckEmail,
  postSendEmailAuthCode,
  postCheckEmailAuthCode,
  getExhibition,
  getTerms,
  getPrivacy,
  putSignUp,
  postSignIn,
  postCheckEmailExist,
  postResetPw,
  getExchangeAll,
  getExchangeDetail,
  getUserInfo,
  postWithdrawal,
  getIntegrationStatus,
  connectExchangeIntegration,
  postApplyIntegration,
  getFaqAll,
} from "../controllers/apiController";
import { postBitgetAnalyze } from "../controllers/bitgetController";
import { postOkxAnalyze } from "../controllers/okxController";
import { checkApiKey, onlyUser } from "../middlewares";

const apiRouter = express.Router();

// API 호출 시 KEY 체크
apiRouter.use(checkApiKey);

// @ 공통 [01]
// - 이메일 유효성 체크 [01]
apiRouter.post(`${routes.common}/check-email`, postCheckEmail);
// - 이메일 인증 번호 전송 [02]
apiRouter.post(`${routes.common}/send-email-auth-code`, postSendEmailAuthCode);
// - 이메일 인증 번호 확인 [03]
apiRouter.post(
  `${routes.common}/check-email-auth-code`,
  postCheckEmailAuthCode
);
// - 전시 관리 데이터 조회 [04]
apiRouter.get(`${routes.common}/exhibition`, getExhibition);
// - 이용약관 데이터 조회 [05]
apiRouter.get(`${routes.common}${routes.terms}`, getTerms);
// - 개인정보 처리방침 데이터 조회 [06]
apiRouter.get(`${routes.common}${routes.privacy}`, getPrivacy);
// - FAQ 목록 조회 [07]
apiRouter.get(`${routes.common}${routes.faq}/all`, getFaqAll);

// @ 유저 [02]
// - 회원가입 [01]
apiRouter.put(`${routes.user}${routes.signUp}`, putSignUp);
// - 로그인 [02]
apiRouter.post(`${routes.user}${routes.signIn}`, postSignIn);
// - 이메일 존재 체크 [03]
apiRouter.post(`${routes.user}${routes.checkEmailExist}`, postCheckEmailExist);
// - 비밀번호 재설정 [04]
apiRouter.post(`${routes.user}${routes.resetPw}`, postResetPw);

// @ 제휴거래소 [03]
// - 전체 제휴거래소 데이터 조회 [01]
apiRouter.get(`${routes.exchange}/all`, getExchangeAll);
// - 개별 제휴거래소 데이터 조회 [02]
apiRouter.get(`${routes.exchange}/detail`, getExchangeDetail);

// @ 마이페이지 [04]
// - 회원정보 조회 [01]
apiRouter.get(`${routes.myPage}${routes.user}/info`, onlyUser, getUserInfo);
// - 회원탈퇴 [02]
apiRouter.post(
  `${routes.myPage}${routes.withdrawal}`,
  onlyUser,
  postWithdrawal
);
// - 회원 거래소 연동 상태 조회
apiRouter.get(
  `${routes.myPage}${routes.integration}/status`,
  onlyUser,
  getIntegrationStatus
);
apiRouter.post(
  `${routes.myPage}${routes.integration}/connect`,
  onlyUser,
  connectExchangeIntegration
);

// @ UID 연동 [05]
// - UID 연동 신청 [01]
apiRouter.post(`${routes.integration}/apply`, onlyUser, postApplyIntegration);

// @ 공개 API [06]
// - Bitget 90일 진단 분석 [01]
apiRouter.post(`${routes.public}${routes.analysis}`, postBitgetAnalyze);
// - OKX 90일 진단 분석 [02]
apiRouter.post(
  `${routes.public}${routes.analysis}${routes.okxApi}`,
  postOkxAnalyze
);

export default apiRouter;
