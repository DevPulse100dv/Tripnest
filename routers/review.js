const express = require("express");
const router = express.Router({mergeParams:true});
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const Review = require("../models/reviews.js");
const {validateReview} = require("../middleware.js");
const isLoggedIn = require("../middleware.js");
const {isAuthor} = require("../middleware.js");
const {requireAccountType} = require("../middleware.js");
const reviewController = require("../controllers/review.js")

//post Review Route
router.post("/",isLoggedIn,requireAccountType("traveler"),validateReview,wrapAsync(reviewController.createReview)
 );
 //Delete route
 router.delete("/:reviewId",isLoggedIn,requireAccountType("traveler"),isAuthor,wrapAsync(reviewController.destroyReview)
 );
 module.exports = router;
