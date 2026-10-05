const express = require("express");
const wrapAsync = require("../utils/wrapAsync.js");
const comparisonController = require("../controllers/comparison.js");
const { isTraveler } = require("../middleware.js");

const router = express.Router();
router.get("/", isTraveler, comparisonController.start);
router.post("/", isTraveler, wrapAsync(comparisonController.select));

module.exports = router;
