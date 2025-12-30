import moment from "moment-timezone";
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import requestIp from "request-ip";
import dotenv from "dotenv";
import { verify } from "jsonwebtoken";
import routes from "./routes";

dotenv.config();

const s3 = new S3Client({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "ap-northeast-2",
});

// 거래소 로고, 썸네일 이미지 업로드
const multerExchangeImg = multer({
  storage: multerS3({
    s3,
    acl: "public-read",
    bucket: "tethergrow",
    key(req, file, cb) {
      cb(null, `exchange/${Date.now() + file.originalname}`);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
  }),
});

// 거래소 로고, 썸네일 이미지 업로드
export const uploadExchangeImg = multerExchangeImg.fields([
  { name: "exchangeLogoImg" },
  { name: "exchangeThumbnailImg" },
]);

export const localsMiddleware = (req, res, next) => {
  const mode = process.env.MODE;
  res.locals = {
    // --------------------- VARIABLES ---------------------
    siteName: "TetherGrow",
    routes,
    loggedUser: req.user || null,
    currentYear: new Date().getFullYear().toString(),
    currentUrl: req.url,
    // 랜덤 이미지 URL
    randomImg: "https://picsum.photos/300",
    // 이미지 파일 경로
    imgPath: "/images",
    // 외부 링크 URL
    naverLink: "https://www.naver.com/",
    instagramLink: "https://www.instagram.com/",
    youtubeLink: "https://www.youtube.com/",
    // 캐시 삭제 방지용 Date Query
    versionDateQuery: new Date().getTime(),
    // 혜택
    referralJoinTether: 10, // 추천인 코드 입력 후 가입 시 지급 테더(5 USDT)
    // ----------------------- REGEX -----------------------
    // --------------------- FUNCTIONS ---------------------
    // 시간 계산
    calcMomentTZ: (time) => {
      let calcTime;
      if (mode === "DEV") {
        calcTime = moment(time);
      } else if (mode === "PROD") {
        calcTime = moment(time).subtract(9, "hours");
      }
      return calcTime;
    },
    // 세자리 수마다 콤마 추가
    addComma: (number) => {
      const regexp = /\B(?=(\d{3})+(?!\d))/g;
      return number.toString().replace(regexp, ",");
    },
    // 날짜가 오늘인지 확인
    isToday: (date) => moment(date).isSame(new Date(), "day"),
    // 소수점 둘째 자리까지 표시
    toFixed2: (number) => Number(number).toFixed(2),
    // 날짜 형식 변환
    dateFormatYMD: (date) => moment(date).tz("Asia/Seoul").format("YYYY-MM-DD"),
    dateFormatYMDHm: (date) =>
      moment(date).tz("Asia/Seoul").format("YYYY-MM-DD HH:mm"),
    dateFormatYMDHms: (date) =>
      moment(date).tz("Asia/Seoul").format("YYYY-MM-DD HH:mm:ss"),
    // 해당하는 문자열 모두 치환
    replaceAll: (str, searchStr, replaceStr) =>
      str.split(searchStr).join(replaceStr),
    // 배열 Random 섞기
    shuffleArray: (arr) => {
      for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
      }
      return arr;
    },
    // 배열에 특정 문자열 포함되어 있는지 체크하는 함수
    arrIncludesStr: (arr, str) => {
      const arr2 = arr.map((x) => String(x._id));
      return arr2.includes(str);
    },
    // apiController 함수에서 에러 발생 시 처리
    handleError: (err, response) => {
      console.log(err);
      return response.status(500).json({
        code: "999999",
        msg: "알 수 없는 오류가 발생했습니다.",
      });
    },
    // adminController 함수에서 에러 발생 시 처리
    handleAdminError: (err, response) => {
      console.log(err);
      response.send(
        `<script>alert("알 수 없는 오류가 발생했습니다."); \
        location.href="${routes.home}"</script>`
      );
    },
    // 인증번호 전송 메일 템플릿
    emailAuthTemplate: (authCode) => `
      <div lang="en" style="-webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; padding: 20px 0px; margin: 0 auto; background: #e9e9e9">
        <table style="width: 100%; background: #e9e9e9" border="0">
          <tbody>
            <tr>
              <td align="center">
                <div style="width: 100%; max-width: 630px; background: #ffffff; margin: 0px auto">
                  <table style="width: 100%; border: 0" cellpadding="0" cellspacing="0">
                    <tbody>
                      <tr>
                        <td
                          style="
                            word-break: break-all;
                            text-align: left;
                            margin: 0px;
                            line-height: 1.7;
                            word-break: break-word;
                            font-size: 16px;
                            font-family: noto sans kr, noto sans cjk kr, noto sans cjk, Malgun Gothic, apple sd gothic neo, nanum gothic, malgun gothic, dotum, arial, helvetica, Meiryo, MS Gothic,
                              sans-serif !important;
                            -ms-text-size-adjust: 100%;
                            -webkit-text-size-adjust: 100%;
                            color: #000000;
                            padding: 25px 25px 25px 25px;
                          "
                        >
                          <div><span style="font-weight: bold">TetherGrow Verification Code</span></div>
                          <div><span style="font-size: 26px; font-weight: bold; color: #7F22FE;">${authCode}</span></div>
                          <div>The verification code is valid for <span style="font-weight: bold">10 minutes</span>.</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
    // 베타 대기자 명단 등록 완료 메일 템플릿
    waitlistRegistrationTemplate: () => `
      <div lang="ko" style="-webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; padding: 20px 0px; margin: 0 auto; background: #e9e9e9">
        <table style="width: 100%; background: #e9e9e9" border="0">
          <tbody>
            <tr>
              <td align="center">
                <div style="width: 100%; max-width: 630px; background: #ffffff; margin: 0px auto">
                  <table style="width: 100%; border: 0" cellpadding="0" cellspacing="0">
                    <tbody>
                      <tr>
                        <td
                          style="
                            word-break: break-all;
                            text-align: left;
                            margin: 0px;
                            line-height: 1.7;
                            word-break: break-word;
                            font-size: 16px;
                            font-family: noto sans kr, noto sans cjk kr, noto sans cjk, Malgun Gothic, apple sd gothic neo, nanum gothic, malgun gothic, dotum, arial, helvetica, Meiryo, MS Gothic,
                              sans-serif !important;
                            -ms-text-size-adjust: 100%;
                            -webkit-text-size-adjust: 100%;
                            color: #000000;
                            padding: 25px 25px 25px 25px;
                          "
                        >
                          <div style="margin-bottom: 20px;">
                            <span style="font-size: 24px; font-weight: bold; color: #7F22FE;">TetherGrow 베타 대기자 명단 등록 완료</span>
                          </div>
                          <div style="margin-bottom: 20px; line-height: 1.8;">
                            <p>안녕하세요,</p>
                            <p>베타 대기자 명단 등록이 정상적으로 완료되었습니다.</p>
                          </div>
                          <div style="margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-left: 4px solid #7F22FE;">
                            <p style="margin: 0; font-weight: bold; color: #7F22FE;">🎁 베타 테스터 혜택</p>
                            <p style="margin: 10px 0 0 0;">선착순 500명에게 <strong>100 USDT 구독 크레딧</strong>을 런칭 즉시 지급합니다.</p>
                          </div>
                          <div style="margin-bottom: 20px; line-height: 1.8;">
                            <p><strong>다음 단계:</strong></p>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                              <li>12월 말, TetherGrow 베타 런칭 알림을 이메일로 보내드립니다.</li>
                              <li>런칭 시 100 USDT 구독 크레딧이 자동으로 지급됩니다.</li>
                              <li>AI 거래 분석 대시보드를 무료로 체험하실 수 있습니다.</li>
                            </ul>
                          </div>
                          <div style="margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 5px;">
                            <p style="margin: 0; font-size: 14px; color: #666;">
                              <strong>TetherGrow</strong>는 선물 수수료 페이백 + AI 거래 코치 서비스입니다.<br>
                              페이백은 기본, AI로 내 '필살기 패턴'까지 찾아주는 플랫폼입니다.
                            </p>
                          </div>
                          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 14px; color: #666;">
                            <p style="margin: 0;">궁금한 점이 있으시면 언제든지 <a href="mailto:tethergrow25@gmail.com" style="color: #7F22FE;">tethergrow25@gmail.com</a>로 문의해주세요.</p>
                            <p style="margin: 10px 0 0 0;">감사합니다.<br>TetherGrow 팀</p>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
  };
  next();
};

// --- 접근 권한 설정 ---
// API 호출 시 KEY 체크
export const checkApiKey = async (req, res, next) => {
  try {
    const { key } = req.headers;
    if (!key) return res.status(403).json({ msg: "API KEY가 없습니다." });
    if (key !== process.env.TETHERGROW_API_KEY) {
      return res.status(403).json({ msg: "API KEY가 올바르지 않습니다." });
    }
    return next();
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "알 수 없는 오류가 발생했습니다." });
  }
};

// 로그인 유저만 접근 가능
export const onlyUser = (req, res, next) => {
  try {
    if (req.method === "OPTIONS") {
      return next();
    }

    // 헤더에 Authorization이 없을 경우
    if (!req.headers.authorization) {
      return res
        .status(401)
        .json({ msg: "유저 인증 오류: 토큰 정보가 없습니다." });
    }

    // 헤더에 Authorization이 있을 경우
    const splitedToken = req.headers.authorization.split(" ");

    // 토큰 검증
    const validatedToken = verify(splitedToken[1], process.env.COOKIE_SECRET);
    req.userID = validatedToken._id;
  } catch (error) {
    console.log(error);
    return res
      .status(401)
      .json({ msg: "유저 인증 오류: 토큰 정보가 올바르지 않습니다." });
  }
  return next();
};

// 관리자 페이지 접근 시 IP 체크
export const checkAdminIPWhiteList = (req, res, next) => {
  try {
    const allowedIPs = process.env.ADMIN_IP_WHITE_LIST.split("/");
    const clientIp = requestIp.getClientIp(req);

    const mode = process.env.MODE;

    if (mode === "DEV") {
      if (allowedIPs.includes(clientIp) || clientIp === "::1") {
        next();
      } else {
        res.send(
          `<script>alert("Not Allowed IP"); \
          location.href="https://tethergrow.app/"</script>`
        );
      }
    } else if (mode === "PROD") {
      if (allowedIPs.includes(clientIp)) {
        next();
      } else {
        res.send(
          `<script>alert("Not Allowed IP"); \
          location.href="https://tethergrow.app/"</script>`
        );
      }
    }
  } catch (err) {
    console.log(err);
    res.send(
      `<script>alert("알 수 없는 오류가 발생하였습니다."); \
      location.href="${routes.home}"</script>`
    );
  }
};

// 관리자만 접근 가능
export const onlyAdmin = (req, res, next) => {
  try {
    if (req.user) {
      if (req.user.role === "master" || req.user.role === "admin") {
        next();
      } else {
        res.send(
          `<script>alert("관리자 권한이 필요합니다."); \
          location.href="${routes.home}"</script>`
        );
      }
    } else {
      res.send(
        `<script>alert("관리자 로그인이 필요합니다."); \
        location.href="${routes.home}"</script>`
      );
    }
  } catch (err) {
    console.log(err);
    res.send(
      `<script>alert("알 수 없는 오류가 발생했습니다."); \
      location.href="${routes.home}"</script>`
    );
  }
};
