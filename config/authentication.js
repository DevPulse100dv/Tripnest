const flash = require("connect-flash");
const MongoStore = require("connect-mongo");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("../models/user.js");

module.exports = function configureAuthentication(app, { dbUrl, sessionSecret }) {
  const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: { secret: sessionSecret },
    touchAfter: 24 * 3600,
  });

  store.on("error", (error) => {
    console.error("ERROR in MONGO SESSION STORE", error);
  });

  app.use(session({
    store,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  }));

  app.use(flash());

  passport.use(new LocalStrategy(User.authenticate()));
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());
  app.use(passport.initialize());
  app.use(passport.session());

  app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user || null;
    res.locals.accountType = req.user?.accountType || "traveler";
    res.locals.isGuideAdmin = res.locals.accountType === "admin";
    next();
  });

  return store;
};
