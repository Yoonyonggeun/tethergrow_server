import passport from "passport";
import paginate from "express-paginate";
import moment from "moment-timezone";
import routes from "../routes";
import User from "../models/User";

// @ 관리자 계정 기본 기능
// - 관리자 로그인
export const getAdminSignIn = (req, res) => {
  try {
    if (req.user) {
      res.send(`<script>location.href="${routes.adminUser}"</script>`);
    } else {
      res.render("admin/common/adminSignIn");
    }
  } catch (err) {
    res.locals.handleAdminError(err, res);
  }
};
export const postAdminSignIn = (req, res, next) => {
  try {
    passport.authenticate("local", (err, user) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        res.send(
          `<script>alert("로그인 정보가 잘못되었습니다.");\
          location.href="${routes.home}"</script>`
        );
      } else if (user.role === "general") {
        res.send(
          `<script>alert("마스터 관리자에게 승인 요청이 필요합니다.");\
          location.href="${routes.home}"</script>`
        );
      } else {
        req.logIn(user, (e) => {
          if (err) {
            next(e);
          }
          res.send(`<script>location.href="${routes.adminUser}"</script>`);
        });
      }
    })(req, res, next);
  } catch (err) {
    res.locals.handleAdminError(err, res);
  }
};
// - 회원가입
export const getAdminSignUp = (req, res) => {
  try {
    if (req.user) {
      res.send(`<script>location.href="${routes.adminUser}"</script>`);
    } else {
      res.render("admin/common/adminSignUp");
    }
  } catch (err) {
    res.locals.handleAdminError(err, res);
  }
};
export const postAdminSignUp = async (req, res) => {
  try {
    const { body } = req;
    const users = await User.findOne({ userID: body.userID });
    body.role = "general";
    if (body.password !== body.password2) {
      res.send(
        `<script>\
          alert("비밀번호가 일치하지 않습니다.");\
          location.href="${routes.home}"\
        </script>`
      );
    } else if (users) {
      res.send(
        `<script>alert("이미 가입된 아이디 입니다.");history.go(-1);</script>`
      );
    } else {
      try {
        body.createdAt = moment(new Date()).tz("Asia/Seoul");
        body.updatedAt = moment(new Date()).tz("Asia/Seoul");
        const user = await User(body);
        await User.register(user, body.password);
        res.send(
          `<script>\
            alert("회원가입이 완료되었습니다.\\r\\n마스터 관리자 승인 후 로그인 하세요.");\
            location.href="${routes.home}"\
          </script>`
        );
      } catch (err) {
        res.locals.handleAdminError(err, res);
      }
    }
  } catch (err) {
    res.locals.handleAdminError(err, res);
  }
};
// - 로그아웃
export const getAdminSignOut = (req, res) => {
  try {
    req.logout(() => {
      req.session.destroy(() => {
        res.send(`<script>location.href="${routes.home}"</script>`);
      });
    });
  } catch (err) {
    res.locals.handleAdminError(err, res);
  }
};
// - 비밀번호 변경
export const getAdminChangePW = (req, res) => {
  try {
    res.render("admin/common/adminChangePW");
  } catch (err) {
    res.locals.handleAdminError(err, res);
  }
};
export const postAdminChangePW = async (req, res) => {
  try {
    const {
      body: { newPassword, newPassword1 },
    } = req;
    if (newPassword !== newPassword1) {
      res.send(`<script>\
                  alert("비밀번호가 일치하지 않습니다.\\r\\n다시 한 번 확인해 주세요.");\
                  history.go(-1);\
                </script>`);
    } else {
      const user = await User.findById({ _id: req.user._id });
      await user.setPassword(newPassword);
      await user.save();

      req.logout(() => {
        req.session.destroy(() => {
          res.send(
            `<script>alert("비밀번호가 변경되었습니다. \\r\\n다시 로그인해주세요.");\
          location.href="${routes.home}"</script>`
          );
        });
      });
    }
  } catch (err) {
    res.locals.handleAdminError(err, res);
  }
};

// @ 유저 관리
// - 관리자 계정 관리
export const getAdminUser = async (req, res) => {
  try {
    const {
      query: { searchKey, searchValue, limit },
    } = req;

    const findQuery = {
      $or: [{ role: "admin" }, { role: "master" }, { role: "general" }],
    };
    const sortQuery = { createdAt: 1 };

    // BEGIN: 검색 기능이 있을 경우
    const searchArr = [
      { code: "0", title: "아이디", value: "userID", type: "string" },
      { code: "1", title: "이름", value: "name", type: "string" },
    ];
    if (searchKey && searchValue) {
      findQuery[`${searchArr[parseInt(searchKey, 10)].value}`] = {
        $regex: searchValue,
        $options: "i",
      };
    }
    // END: 검색 기능이 있을 경우

    const [adminItems, totalCount] = await Promise.all([
      User.find(findQuery)
        .sort(sortQuery)
        .limit(req.query.limit)
        .skip(req.skip)
        .exec(),
      User.countDocuments(findQuery),
    ]);
    const pageCount = Math.ceil(totalCount / req.query.limit);
    const pages = paginate.getArrayPages(req)(10, pageCount, req.query.page);

    // 엑셀 다운로드용 전체 데이터
    const excelData = await User.find().sort(sortQuery);

    res.render("admin/pages/adminUser", {
      adminNameKo: "관리자 계정",
      adminLink: routes.adminUser,
      limit,
      searchArr,
      searchKey,
      searchValue,
      adminItems,
      totalCount,
      pageCount,
      pages,
      excelData,
    });
  } catch (err) {
    res.locals.handleAdminError(err, res);
  }
};
export const getAdminUserApprove = async (req, res) => {
  try {
    const {
      params: { userID },
    } = req;
    await User.findByIdAndUpdate(userID, { role: "admin" });
    res.send(
      `<script>\
        alert("승인 되었습니다.");\
        location.href="${routes.adminUser}"\
      </script>`
    );
  } catch (err) {
    res.locals.handleAdminError(err, res);
  }
};
export const getAdminUserDelete = async (req, res) => {
  try {
    const {
      params: { userID },
    } = req;
    await User.findByIdAndDelete(userID);
    res.send(`<script>location.href="${routes.adminUser}"</script>`);
  } catch (err) {
    res.locals.handleAdminError(err, res);
  }
};

// TODO:@ FAQ 관리
// - FAQ 관리
