import paginate from "express-paginate";
import express from "express";
import routes from "../routes";
import {
  getAdminSignIn,
  postAdminSignIn,
  getAdminSignUp,
  postAdminSignUp,
  getAdminSignOut,
  getAdminChangePW,
  postAdminChangePW,
  getAdminUser,
  getAdminUserApprove,
  getAdminUserDelete,
} from "../controllers/adminController";
import { checkAdminIPWhiteList, onlyAdmin } from "../middlewares";

const adminRouter = express.Router();

adminRouter.use(checkAdminIPWhiteList);

// @ 관리자 계정 기본 기능
adminRouter.get("/", (_, res) => res.redirect(routes.adminSignIn));
// - 관리자 로그인
adminRouter.get(routes.adminSignIn, getAdminSignIn);
adminRouter.post(routes.adminSignIn, postAdminSignIn);
// - 관리자 회원가입
adminRouter.get(routes.adminSignUp, getAdminSignUp);
adminRouter.post(routes.adminSignUp, postAdminSignUp);
// - 로그아웃
adminRouter.get(routes.adminSignOut, onlyAdmin, getAdminSignOut);
// - 비밀번호 변경
adminRouter.get(`${routes.adminChangePW}`, onlyAdmin, getAdminChangePW);
adminRouter.post(`${routes.adminChangePW}`, onlyAdmin, postAdminChangePW);

// @ 유저 관리
// - 관리자 계정 관리
adminRouter.get(
  routes.adminUser,
  onlyAdmin,
  paginate.middleware(20, 50),
  getAdminUser
);
adminRouter.get(
  `${routes.adminUser}/approve/:userID`,
  onlyAdmin,
  getAdminUserApprove
);
adminRouter.get(
  `${routes.adminUser}/delete/:userID`,
  onlyAdmin,
  getAdminUserDelete
);

// TODO: @ FAQ 관리

export default adminRouter;
