import passport from "passport";
import User from "./models/User";

passport.use(User.createStrategy());

passport.serializeUser((user, done) => {
  console.log("serialize");
  done(null, user);
});

passport.deserializeUser((user, done) => {
  console.log("deserialize");
  done(null, user);
});
