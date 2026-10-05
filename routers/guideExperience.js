const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { requireAccountType, validateGuideExperience } = require("../middleware.js");
const guideExperienceController = require("../controllers/guideExperience.js");
const multer = require("multer");

const credentialUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.mimetype)) return callback(new Error("Upload a PDF, JPG, or PNG credential file."));
    callback(null, true);
  },
}).single("credentialDocument");

const uploadCredentialDocument = (req, res, next) => {
  credentialUpload(req, res, (error) => {
    if (!error) return next();
    req.flash("error", error.code === "LIMIT_FILE_SIZE"
      ? "Credential files must be 2 MB or smaller."
      : error.message);
    res.redirect("/guide-experiences/new");
  });
};

router.get("/new", requireAccountType("guide"), wrapAsync(guideExperienceController.new));
router.post("/", requireAccountType("guide"), uploadCredentialDocument, validateGuideExperience, wrapAsync(guideExperienceController.create));
router.get("/mine", requireAccountType("guide"), wrapAsync(guideExperienceController.mine));
router.get("/admin/dashboard", requireAccountType("admin"), wrapAsync(guideExperienceController.adminDashboard));
router.get("/admin/queue", requireAccountType("admin"), wrapAsync(guideExperienceController.adminQueue));
router.get("/admin/:id/credential-document", requireAccountType("admin"), wrapAsync(guideExperienceController.downloadCredentialDocument));
router.post("/admin/:id/review", requireAccountType("admin"), wrapAsync(guideExperienceController.review));
router.post("/:id/requests", requireAccountType("traveler"), wrapAsync(guideExperienceController.requestContact));

module.exports = router;
