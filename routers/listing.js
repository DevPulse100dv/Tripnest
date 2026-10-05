const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync.js");

const {isAdmin} = require("../middleware.js");
const {validateListing} = require("../middleware.js");

const listingController = require("../controllers/listing.js");

const multer  = require('multer');
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage });
const uploadImage = upload.single("listing[image]");

const validateImageFile = (req, res, next) => {
  if (req.file && !["image/jpeg", "image/png", "image/webp"].includes(req.file.mimetype)) {
    req.flash("error", "Choose a JPG, PNG, or WebP image.");
    return res.redirect("/listings/new");
  }
  next();
};

const handleListingImageUpload = (req, res, next) => {
  uploadImage(req, res, (error) => {
    if (error) {
      req.flash("error", `Image upload failed: ${error.message}`);
      return res.redirect("/listings/new");
    }
    validateImageFile(req, res, next);//check the uploaded image
  });
};

//Routes with '/'
router.route("/").get( wrapAsync(listingController.index))
.post( isAdmin,handleListingImageUpload,validateListing,wrapAsync(listingController.createListing));

//new route
router.get("/new",isAdmin,listingController.renderNewForm);

//Routes with '/id'
router.route("/:id").get( wrapAsync(listingController.showListing))
.put( isAdmin,handleListingImageUpload,validateListing,wrapAsync(listingController.updateListing))
.delete( isAdmin,wrapAsync(listingController.destroyListing));

//edit route
router.get("/:id/edit",isAdmin,wrapAsync(listingController.renderEditForm));

module.exports = router;
