import "core-js/stable";
import "regenerator-runtime/runtime";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import vhost from "vhost";
import passport from "passport";
import session from "express-session";
import path from "path";
import cors from "cors";
import MongoStore from "connect-mongo";
import morgan from "morgan";
import csp from "./csp";
import adminRouter from "./routers/adminRouter";
import apiRouter from "./routers/apiRouter";
import { localsMiddleware } from "./middlewares";
import "./passport";

const app = express();

app.use(cors());
app.use(csp);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: {
      policy: "same-origin-allow-popups",
    },
    referrerPolicy: {
      policy: ["no-referrer-when-downgrade"],
    },
  })
);
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "/views"));
app.use("/", express.static(path.join(__dirname, "static")));
app.use(cookieParser());
app.use(
  bodyParser.json({
    limit: "50mb",
  })
);
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(morgan("dev"));
app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URL_PROD }),
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(localsMiddleware);

const mode = process.env.MODE;
if (mode === "PROD") {
  // 배포 모드
  app.use(vhost("admin.tethergrow.app", adminRouter));
  app.use(vhost("api.tethergrow.app", apiRouter));
} else {
  // 개발 모드
  app.use("/", apiRouter);
  app.use("/", adminRouter);
}

app.use((_, res) => {
  // 404 처리 부분
  res.status(404).render("error/404");
});

export default app;
