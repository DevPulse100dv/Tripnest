const User = require("../models/user.js");
const { accountHome } = require("../middleware.js");
const crypto = require("crypto");

const accountTypes = ["traveler", "guide", "admin"];

const safeRedirectForRole = (target, user) => {
    if (typeof target !== "string" || !target.startsWith("/") || target.startsWith("//")) return accountHome(user);
    if (user.accountType === "admin") return target.startsWith("/guide-experiences/admin/") ? target : accountHome(user);
    if (user.accountType === "guide") return target.startsWith("/guide-experiences/") && !target.startsWith("/guide-experiences/admin/") ? target : accountHome(user);
    return target.startsWith("/guide-experiences/") ? accountHome(user) : target;
};

module.exports.renderSignupForm = (req,res)=>{
    res.render("users/signup.ejs");
}
module.exports.signup = async(req,res,next)=>{
    try{
    let{username,email,password} = req.body;
    const accountType = accountTypes.includes(req.body.accountType) ? req.body.accountType : "traveler";
    if (accountType === "admin") {
        const inviteCode = req.body.adminInviteCode;
        const configuredCode = process.env.ADMIN_INVITE_CODE;
        const providedCode = typeof inviteCode === "string" ? Buffer.from(inviteCode) : Buffer.alloc(0);
        const expectedCode = typeof configuredCode === "string" ? Buffer.from(configuredCode) : Buffer.alloc(0);
        const matchesInvite = expectedCode.length > 0
            && providedCode.length === expectedCode.length
            && crypto.timingSafeEqual(providedCode, expectedCode);
        if (!matchesInvite) {
            req.flash("error", "A valid administrator invite code is required to create an admin account.");
            return res.redirect("/signup");
        }
    }
    const newUser = new User({email,username,accountType});
    const registeredUser = await User.register(newUser,password);
    req.login(registeredUser,(err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","Welcome to TripNest");
        const redirectUrl = safeRedirectForRole(req.session.redirectUrl, registeredUser);
        delete req.session.redirectUrl;
        res.redirect(redirectUrl);
    });
    }catch(e){
        req.flash("error",e.message);
        res.redirect("/signup");
    }
}

module.exports.renderLoginForm = (req,res)=>{
    res.render("users/login.ejs");
}

module.exports.login = (req,res,next)=>{
    const selectedAccountType = accountTypes.includes(req.body.accountType) ? req.body.accountType : "traveler";
    if (req.user.accountType !== selectedAccountType) {
        return req.logout((err) => {
            if (err) return next(err);
            req.flash("error", "The selected account type does not match this account. Choose the correct type and try again.");
            res.redirect("/login");
        });
    }
    req.flash("success","You are logged in successfully");
    const redirectUrl = safeRedirectForRole(res.locals.redirectUrl || req.session.redirectUrl, req.user);
    delete req.session.redirectUrl;
    res.redirect(redirectUrl);
}
module.exports.logout = (req,res,next)=>{
    req.logout((err)=>{
        if(err){
           return next(err);
        }
        req.flash("success","You are logged out successsfully");
        res.redirect(accountHome(req.user));
    });
}
