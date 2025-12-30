import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { sign } from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User";
import EmailAuth from "../models/EmailAuth";
import Exhibition from "../models/Exhibition";
import Terms from "../models/Terms";
import Exchange from "../models/Exchange";
import ExchangeEvent from "../models/ExchangeEvent";
import Integration from "../models/Integration";
import Payback from "../models/Payback";
import Uid from "../models/Uid";
import Faq from "../models/Faq";

dotenv.config();

// @ 공통 [01]
// - 이메일 유효성 체크 [01]
export const postCheckEmail = async (req, res) => {
  try {
    const { userID } = req.body;

    // 이메일을 입력하지 않은 경우
    if (!userID) {
      return res.status(400).json({
        code: "010101",
        msg: "이메일을 입력해주세요.",
      });
    }

    // 이메일이 이미 존재하는 경우
    const user = await User.findOne({ userID });
    if (user) {
      return res.status(400).json({
        code: "010102",
        msg: "이미 사용중인 이메일입니다.",
      });
    }

    return res.status(200).json({ msg: "사용 가능한 이메일입니다." });
  } catch (error) {
    return res.locals.handleError(error, res);
  }
};
// - 이메일 인증 번호 전송 [02]
export const postSendEmailAuthCode = async (req, res) => {
  try {
    const { userID } = req.body;

    // 이메일을 입력하지 않은 경우
    if (!userID) {
      return res.status(400).json({
        code: "010201",
        msg: "이메일을 입력해주세요.",
      });
    }

    // 인증번호 생성 규칙
    const authCode = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");

    // 인증번호 데이터 생성(10분간 유효)
    const emailAuth = await EmailAuth.create({
      email: userID,
      authCode,
      expiredAt: new Date(Date.now() + 10 * 60 * 1000), // 10분
    });

    const client = new SESv2Client({ region: "ap-northeast-2" }); // SES 리전 설정

    // 이메일 전송 (AWS SES 사용)
    const params = {
      FromEmailAddress: "TetherGrow <support@tethergrow.app>", // 발신자 이름 + 이메일
      Destination: {
        ToAddresses: [userID], // 수신자
        // CcAddresses, BccAddresses도 추가 가능
      },
      Content: {
        Simple: {
          Subject: {
            Data: `[TetherGrow] Email Address Verification Request`,
            Charset: "UTF-8",
          },
          Body: {
            Html: {
              Data: res.locals.emailAuthTemplate(emailAuth.authCode),
              Charset: "UTF-8",
            }, // 필요시 추가
          },
        },
      },
    };

    const command = new SendEmailCommand(params);
    await client.send(command);

    // 이메일 전송 성공
    return res
      .status(200)
      .json({ msg: "인증번호가 전송되었습니다.", emailAuthID: emailAuth._id });
  } catch (error) {
    return res.locals.handleError(error, res);
  }
};
// - 이메일 인증 번호 확인 [03]
export const postCheckEmailAuthCode = async (req, res) => {
  try {
    const { emailAuthID, authCode } = req.body;

    // 이메일 인증번호 ID를 입력하지 않은 경우
    if (!emailAuthID) {
      return res.status(400).json({
        code: "010301",
        msg: "EmailAuth id가 없습니다.",
      });
    }

    // 인증번호를 입력하지 않은 경우
    if (!authCode) {
      return res.status(400).json({
        code: "010302",
        msg: "인증번호가 없습니다.",
      });
    }

    // 이메일 인증번호 ID로 인증번호 데이터 조회
    const emailAuth = await EmailAuth.findById(emailAuthID);

    // 이메일 인증번호 데이터가 존재하지 않는 경우
    if (!emailAuth) {
      return res.status(400).json({
        code: "010303",
        msg: "이메일 인증번호 데이터가 존재하지 않습니다.",
      });
    }

    // 시간이 만료된 경우
    if (emailAuth.expiredAt < new Date()) {
      return res.status(400).json({
        code: "010304",
        msg: "인증번호가 만료되었습니다.",
      });
    }

    // 인증번호가 일치하지 않는 경우
    if (emailAuth.authCode !== authCode) {
      return res.status(400).json({
        code: "010305",
        msg: "인증번호가 일치하지 않습니다.",
      });
    }

    // 인증번호가 일치하는 경우
    return res.status(200).json({ msg: "인증번호가 확인되었습니다." });
  } catch (error) {
    return res.locals.handleError(error, res);
  }
};
// - 전시 관리 데이터 조회 [04]
export const getExhibition = async (req, res) => {
  try {
    const exhibition = await Exhibition.findOne({});
    return res
      .status(200)
      .json({ msg: "전시 관리 데이터가 조회되었습니다.", exhibition });
  } catch (error) {
    return res.locals.handleError(error, res);
  }
};
// - 이용약관 데이터 조회 [05]
export const getTerms = async (req, res) => {
  try {
    const terms = await Terms.findOne();
    return res
      .status(200)
      .json({ msg: "데이터 조회에 성공했습니다.", terms: terms.terms });
  } catch (error) {
    return res.locals.handleError(error);
  }
};
// - 개인정보 처리방침 데이터 조회 [06]
export const getPrivacy = async (req, res) => {
  try {
    const terms = await Terms.findOne();
    return res
      .status(200)
      .json({ msg: "데이터 조회에 성공했습니다.", privacy: terms.privacy });
  } catch (error) {
    return res.locals.handleError(error);
  }
};
// - FAQ 목록 조회 [07]
export const getFaqAll = async (req, res) => {
  try {
    // 노출 여부가 true인 FAQ만 조회, 카테고리별 정렬 순서로 정렬
    const faqs = await Faq.find({ isVisible: true })
      .sort({ category: 1, order: 1 })
      .select("title content category order")
      .lean();

    return res.status(200).json({ msg: "FAQ 목록이 조회되었습니다.", faqs });
  } catch (error) {
    return res.locals.handleError(error, res);
  }
};

// @ 유저 [02]
// - 회원가입 [01]
export const putSignUp = async (req, res) => {
  try {
    const { userID, password } = req.body;

    // 이메일을 입력하지 않은 경우
    if (!userID) {
      return res.status(400).json({
        code: "020101",
        msg: "이메일을 입력해주세요.",
      });
    }

    // 패스워드를 입력하지 않은 경우
    if (!password) {
      return res.status(400).json({
        code: "020102",
        msg: "비밀번호를 입력해주세요.",
      });
    }

    // 이메일이 이미 존재하는 경우
    const isExistUser = await User.findOne({ userID });
    if (isExistUser) {
      return res.status(400).json({
        code: "020103",
        msg: "이미 사용중인 이메일입니다.",
      });
    }

    // 회원 종류 설정(일반 회원)
    const role = "normal";

    // 회원 생성
    const userData = {
      userID,
      role,
    };
    const user = await User(userData);
    await User.register(user, password);

    // 회원가입 성공 시 JWT 토큰 발급
    const token = sign({ _id: user._id }, process.env.COOKIE_SECRET);

    return res
      .status(200)
      .json({ msg: "회원가입이 완료되었습니다.", token, user });
  } catch (error) {
    return res.locals.handleError(error, res);
  }
};
// - 로그인 [02]
export const postSignIn = async (req, res) => {
  try {
    const { userID, password } = req.body;

    // 이메일을 입력하지 않은 경우
    if (!userID) {
      return res.status(400).json({
        code: "020201",
        msg: "이메일을 입력해주세요.",
      });
    }

    // 패스워드를 입력하지 않은 경우
    if (!password) {
      return res.status(400).json({
        code: "020202",
        msg: "비밀번호를 입력해주세요.",
      });
    }

    const isMatchPassword = await User.authenticate()(userID, password);
    const user = isMatchPassword.user;

    // 로그인 실패
    if (!user) {
      return res.status(400).json({
        code: "020203",
        msg: "이메일 또는 비밀번호가 일치하지 않습니다.",
      });
    }

    // 로그인 성공
    const token = sign({ _id: user._id }, process.env.COOKIE_SECRET);
    return res.status(200).json({ msg: "로그인이 완료되었습니다.", token });
  } catch (error) {
    return res.locals.handleError(error, res);
  }
};
// - 이메일 존재 체크 [03]
export const postCheckEmailExist = async (req, res) => {
  try {
    const { userID } = req.body;

    // 이메일을 입력하지 않은 경우
    if (!userID) {
      return res.status(400).json({
        code: "020301",
        msg: "이메일을 입력해주세요.",
      });
    }

    // 이메일이 존재하는 경우
    const user = await User.findOne({ userID });
    if (!user) {
      return res.status(400).json({
        code: "020302",
        msg: "존재하지 않거나 잘못된 이메일 주소입니다.",
      });
    }

    return res.status(200).json({ msg: "인증된 이메일입니다." });
  } catch (error) {
    return res.locals.handleError(error, res);
  }
};
// - 비밀번호 재설정 [04]
export const postResetPw = async (req, res) => {
  try {
    const { userID, password1, password2 } = req.body;

    // 이메일을 입력하지 않은 경우
    if (!userID) {
      return res.status(400).json({
        code: "020401",
        msg: "이메일을 입력해주세요.",
      });
    }

    // 이메일이 존재하지 않는 경우
    const user = await User.findOne({ userID });
    if (!user) {
      return res.status(400).json({
        code: "020402",
        msg: "존재하지 않는 이메일입니다.",
      });
    }

    // 패스워드를 입력하지 않은 경우
    if (!password1 || !password2) {
      return res.status(400).json({
        code: "020403",
        msg: "비밀번호를 입력해주세요.",
      });
    }

    // 비밀번호1과 비밀번호2가 일치하지 않는 경우
    if (password1 !== password2) {
      return res.status(400).json({
        code: "020404",
        msg: "비밀번호가 일치하지 않습니다.",
      });
    }

    // 비밀번호 재설정
    await user.setPassword(password1);
    await user.save();
    return res.status(200).json({ msg: "비밀번호가 재설정되었습니다." });
  } catch (error) {
    return res.locals.handleError(error, res);
  }
};

// @ 제휴거래소 [03]
// - 전체 제휴거래소 데이터 조회 [01]
export const getExchangeAll = async (req, res) => {
  try {
    const exchanges = await Exchange.find({}).sort({ order: 1 });
    return res.status(200).json({
      msg: "전체 제휴거래소 데이터가 조회되었습니다.",
      exchanges,
    });
  } catch (error) {
    return res.locals.handleError(error, res);
  }
};
// - 개별 제휴거래소 데이터 조회 [02]
export const getExchangeDetail = async (req, res) => {
  try {
    const { exchangeName } = req.query;

    // 제휴거래소명을 입력하지 않은 경우
    if (!exchangeName) {
      return res.status(400).json({
        code: "030201",
        msg: "제휴거래소명을 입력해주세요.",
      });
    }

    // 제휴거래소 ID로 제휴거래소 데이터 조회
    const exchange = await Exchange.findOne({ nameEn: exchangeName });

    // 제휴거래소 데이터가 존재하지 않는 경우
    if (!exchange) {
      return res.status(400).json({
        code: "030202",
        msg: "존재하지 않는 제휴거래소입니다.",
      });
    }

    // 활성화된 이벤트 조회
    const events = await ExchangeEvent.find({
      exchangeID: exchange._id,
      isActive: true,
    }).sort({ order: 1 });

    // 제휴거래소 데이터가 존재하는 경우
    return res.status(200).json({
      msg: `${exchange.nameKo} 제휴거래소 데이터가 조회되었습니다.`,
      exchange,
      events,
    });
  } catch (error) {
    return res.locals.handleError(error, res);
  }
};

// @ 마이페이지 [04]
// - 회원정보 조회 [01]
export const getUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.userID);
    if (!user) {
      return res.status(400).json({
        code: "040101",
        msg: "존재하지 않는 유저입니다.",
      });
    }

    // 유저 정보 조회 성공
    return res.status(200).json({ msg: "유저 정보가 조회되었습니다.", user });
  } catch (error) {
    return res.locals.handleError(error, res);
  }
};
// - 회원탈퇴 [02]
export const postWithdrawal = async (req, res) => {
  try {
    const { password } = req.body;

    // 이메일이 존재하지 않는 경우
    const user = await User.findById(req.userID);
    if (!user) {
      return res.status(400).json({
        code: "040201",
        msg: "존재하지 않는 유저입니다.",
      });
    }

    // 패스워드를 입력하지 않은 경우
    if (!password) {
      return res.status(400).json({
        code: "040202",
        msg: "비밀번호를 입력해주세요.",
      });
    }

    // 패스워드가 일치하지 않는 경우
    const isMatchPassword = await User.authenticate()(user.userID, password);
    const matchedUser = isMatchPassword.user;
    if (!matchedUser) {
      return res.status(400).json({
        code: "040203",
        msg: "비밀번호가 일치하지 않습니다.",
      });
    }

    // 회원탈퇴 및 관련 데이터 삭제 처리
    await User.findByIdAndDelete(user._id);
    await Integration.deleteMany({ userID: user._id });
    await Payback.deleteMany({ userID: user._id });
    return res.status(200).json({ msg: "회원탈퇴가 완료되었습니다." });
  } catch (error) {
    return res.locals.handleError(error, res);
  }
};
// - 회원 거래소 연동 상태 조회 [03]
export const getIntegrationStatus = async (req, res) => {
  try {
    const { exchangeID } = req.query;
    console.log(exchangeID);

    const integrations = await Integration.findOne({
      userID: req.userID,
      exchangeID,
    })
      .populate("exchangeID")
      .sort({ createdAt: -1 });

    if (!integrations) {
      return res.status(200).json({
        msg: "UID를 연동하지 않았습니다.",
        status: "null",
        integration: null,
        uid: null,
      });
    }

    if (integrations.status === "pending") {
      return res.status(200).json({
        msg: "관리자 확인중인 UID 연동 신청입니다.",
        status: "pending",
        integration: integrations,
        uid: integrations.uid,
      });
    }
    if (integrations.status === "approved") {
      const uidData = await Uid.findOne({
        exchangeID,
        uid: integrations.uid,
      });

      return res.status(200).json({
        msg: "UID 연동이 완료되었습니다.",
        status: "approved",
        integration: integrations,
        uid: uidData.uid,
      });
    }
    if (integrations.status === "rejected") {
      return res.status(200).json({
        msg: "UID 연동이 거절되었습니다.",
        status: "rejected",
        integration: integrations,
        uid: null,
      });
    }
    return true;
  } catch (error) {
    return res.locals.handleError(error, res);
  }
};
export const connectExchangeIntegration = async (req, res) => {
  try {
    const userID = req.userID;
    if (!userID) {
      return res
        .status(401)
        .json({ ok: false, error: "로그인 정보가 필요합니다." });
    }
    const { exchangeID, uid } = req.body || {};

    if (!exchangeID || !uid) {
      return res
        .status(400)
        .json({ ok: false, error: "exchangeID와 uid는 필수입니다." });
    }

    const integration = await Integration.findOneAndUpdate(
      { userID, exchangeID },
      {
        uid,
        status: "pending", // UID 입력 후 관리자 승인 대기
        hasApiKeys: false, // UID만 등록된 상태
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.json({
      ok: true,
      integration,
    });
  } catch (e) {
    console.error("connectExchangeIntegration error", e);
    return res
      .status(500)
      .json({ ok: false, error: "integration connect failed" });
  }
};

// @ UID 연동 [05]
// - UID 연동 신청 [01]
export const postApplyIntegration = async (req, res) => {
  try {
    const { exchangeID, uid } = req.body;

    // 거래소 ID를 입력하지 않은 경우
    if (!exchangeID) {
      return res.status(400).json({
        code: "050101",
        msg: "거래소 ID를 입력해주세요.",
      });
    }

    // UID ID를 입력하지 않은 경우
    if (!uid) {
      return res.status(400).json({
        code: "050102",
        msg: "UID를 입력해주세요.",
      });
    }

    // 거래소 ID가 존재하지 않는 경우
    const exchange = await Exchange.findById(exchangeID);
    if (!exchange) {
      return res.status(400).json({
        code: "050103",
        msg: "존재하지 않는 거래소입니다.",
      });
    }
    // 이미 신청한 경우 status = pending => 관리자 확인중
    const isPending = await Integration.findOne({
      exchangeID,
      uid,
      status: "pending",
    });
    if (isPending) {
      return res.status(400).json({
        code: "050104",
        msg: "관리자 확인중인 UID 연동 신청입니다.",
      });
    }

    // UID 연동 신청 데이터 생성
    const integration = await Integration.create({
      exchangeID,
      uid,
      status: "pending",
      userID: req.userID,
    });

    return res.status(200).json({
      msg: "UID 연동 신청이 완료되었습니다.",
      integration,
    });
  } catch (error) {
    return res.locals.handleError(error, res);
  }
};
