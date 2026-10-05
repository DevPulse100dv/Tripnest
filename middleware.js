const Listing = require("./models/listing.js");
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema,reviewSchema,guideExperienceSchema} = require("./schema.js");
const Review = require("./models/reviews.js");

const isLoggedIn = (req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("error","You must be logged in before using TripNest");
        return res.redirect("/login");
    }
    next();
}
module.exports = isLoggedIn;

const accountHome = (user) => {
    if (user?.accountType === "guide") return "/guide-experiences/mine";
    if (user?.accountType === "admin") return "/guide-experiences/admin/dashboard";
    return "/listings";
};

const redirectWrongRole = (req, res) => {
    req.flash("error", "That page isn’t available for your account type.");
    return res.redirect(accountHome(req.user));
};

module.exports.requireAccountType = (...allowedTypes) => (req, res, next) => {
    if (!req.isAuthenticated()) return isLoggedIn(req, res, next);
    if (!allowedTypes.includes(req.user.accountType || "traveler")) return redirectWrongRole(req, res);
    next();
};

module.exports.isTraveler = (req, res, next) => {
    if (!req.isAuthenticated() || (req.user.accountType || "traveler") === "traveler") return next();
    return redirectWrongRole(req, res);
};

module.exports.isAdmin = (req, res, next) => {
    if (!req.isAuthenticated()) return isLoggedIn(req, res, next);
    if (req.user.accountType !== "admin") return redirectWrongRole(req, res);
    next();
};

module.exports.accountHome = accountHome;

module.exports.saveRedirectUrl = (req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = async (req,res,next)=>{
    let {id}=req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }
    if(req.user?.accountType !== "admin" && !listing.owner?._id?.equals(res.locals.currUser._id)){
        req.flash("error","Permission denied! Please contact the owner");
        return res.redirect(`/listings/${id}`);
    }
    next();
};
module.exports.validateListing = (req,res,next)=>{
    const listingData = req.body.listing;
    if (listingData && typeof listingData.price === "string") {
        listingData.price = Number(listingData.price);
    }
    let {error: err} = listingSchema.validate(req.body);
    if(err){
        let errMsg = err.details.map((el) => el.message).join(",");
        return next(new ExpressError(400,errMsg));
    }else{
        next();
    }
};

module.exports.validateReview = (req,res,next)=>{
    let {error: err} = reviewSchema.validate(req.body);
    if(err){
        let errMsg = err.details.map((el) => el.message).join(",");
        return next(new ExpressError(400,errMsg));
    }else{
        next();
    }
};
module.exports.isAuthor = async (req,res,next)=>{
    let {id,reviewId}=req.params;
    let review = await Review.findById(reviewId);
    if (!review) {
        req.flash("error", "Review not found");
        return res.redirect(`/listings/${id}`);
    }
    if(!review.author.equals(res.locals.currUser._id)){
        req.flash("error","Permission denied! Please contact the owner");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

module.exports.validateGuideExperience = (req,res,next)=>{
    const validationInput = { ...req.body };
    delete validationInput.credentialDocument;
    const {error, value} = guideExperienceSchema.validate(validationInput);
    if(error){
        const message = error.details.map((detail) => detail.message).join(", ");
        return next(new ExpressError(400,message));
    }
    req.body = value;
    next();
};
