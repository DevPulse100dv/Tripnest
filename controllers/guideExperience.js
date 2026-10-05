const mongoose = require("mongoose");
const GuideExperience = require("../models/guideExperience.js");
const GuideInquiry = require("../models/guideInquiry.js");
const Listing = require("../models/listing.js");

module.exports.new = async (req, res) => {
  const listings = await Listing.find({}).select("title location country").sort({ _id: -1 }).lean();
  const selectedListingId = typeof req.query.listingId === "string" && mongoose.isValidObjectId(req.query.listingId)
    ? req.query.listingId
    : "";
  res.render("guideExperiences/new.ejs", { listings, selectedListingId });
};

module.exports.create = async (req, res) => {
  const input = req.body.guideExperience;
  const listing = await Listing.findById(input.listingId).select("_id").lean();
  if (!listing) {
    req.flash("error", "Choose an existing stay to connect this experience to.");
    return res.redirect("/guide-experiences/new");
  }

  const languages = [...new Set(input.languages.split(",").map((language) => language.trim()).filter(Boolean))].slice(0, 8);
  if (!languages.length) {
    req.flash("error", "Add at least one language you can guide in.");
    return res.redirect(`/guide-experiences/new?listingId=${input.listingId}`);
  }

  await GuideExperience.create({
    guide: req.user._id,
    listing: listing._id,
    title: input.title,
    description: input.description,
    area: input.area,
    durationHours: Number(input.durationHours),
    price: Number(input.price),
    languages,
    includes: input.includes,
    contactPhone: input.contactPhone,
    credentialType: input.credentialType,
    credentialReference: input.credentialReference,
    ...(req.file ? {
      credentialDocument: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        fileName: req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-160),
      },
    } : {}),
  });
  req.flash("success", "Your guide experience was submitted for TripNest review.");
  res.redirect("/guide-experiences/mine");
};

module.exports.mine = async (req, res) => {
  const experiences = await GuideExperience.find({ guide: req.user._id })
    .populate("listing", "title location country")
    .sort({ createdAt: -1 })
    .lean();
  const experienceIds = experiences.map((experience) => experience._id);
  const incomingRequests = await GuideInquiry.find({ experience: { $in: experienceIds } })
    .populate("visitor", "username email")
    .populate("experience", "title")
    .sort({ createdAt: -1 })
    .lean();
  const sentRequests = await GuideInquiry.find({ visitor: req.user._id })
    .populate({ path: "experience", select: "title guide listing", populate: [
      { path: "guide", select: "username" },
      { path: "listing", select: "title location" },
    ] })
    .sort({ createdAt: -1 })
    .lean();
  res.render("guideExperiences/mine.ejs", { experiences, incomingRequests, sentRequests });
};

module.exports.requestContact = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    req.flash("error", "That guide experience could not be found.");
    return res.redirect("/listings");
  }
  const experience = await GuideExperience.findOne({ _id: id, status: "approved" }).select("guide listing").lean();
  if (!experience) {
    req.flash("error", "That guide experience is not currently available.");
    return res.redirect("/listings");
  }
  if (String(experience.guide) === String(req.user._id)) {
    req.flash("error", "You can’t send a visitor request to your own guide profile.");
    return res.redirect(`/listings/${experience.listing}#local-experiences`);
  }
  const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
  if (message.length < 10 || message.length > 1000) {
    req.flash("error", "Write a message between 10 and 1,000 characters for the guide.");
    return res.redirect(`/listings/${experience.listing}#local-experiences`);
  }
  await GuideInquiry.create({ experience: experience._id, visitor: req.user._id, message });
  req.flash("success", "Your contact request was sent. The guide can respond through the contact details they provided.");
  res.redirect(`/listings/${experience.listing}#local-experiences`);
};

module.exports.adminQueue = async (req, res) => {
  const applications = await GuideExperience.find({ status: "pending" })
    .populate("guide", "username email")
    .populate("listing", "title location country")
    .sort({ createdAt: 1 })
    .lean();
  res.render("guideExperiences/adminQueue.ejs", { applications });
};

module.exports.downloadCredentialDocument = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    req.flash("error", "That guide credential file could not be found.");
    return res.redirect("/guide-experiences/admin/queue");
  }
  const experience = await GuideExperience.findById(req.params.id)
    .select("credentialDocument.fileName credentialDocument.contentType +credentialDocument.data");
  if (!experience?.credentialDocument?.data) {
    req.flash("error", "No credential file was attached to this submission.");
    return res.redirect("/guide-experiences/admin/queue");
  }
  const fileName = experience.credentialDocument.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  res.set("Content-Type", "application/octet-stream");
  res.set("Content-Disposition", `attachment; filename="${fileName}"`);
  res.set("X-Content-Type-Options", "nosniff");
  res.send(experience.credentialDocument.data);
};

module.exports.adminDashboard = async (req, res) => {
  const [pending, approved, rejected] = await Promise.all([
    GuideExperience.countDocuments({ status: "pending" }),
    GuideExperience.countDocuments({ status: "approved" }),
    GuideExperience.countDocuments({ status: "rejected" }),
  ]);
  res.render("guideExperiences/adminDashboard.ejs", { stats: { pending, approved, rejected } });
};

module.exports.review = async (req, res) => {
  const { id } = req.params;
  const status = req.body.status;
  if (!mongoose.isValidObjectId(id) || !["approved", "rejected"].includes(status)) {
    req.flash("error", "Choose a valid guide application decision.");
    return res.redirect("/guide-experiences/admin/queue");
  }

  const experience = await GuideExperience.findById(id);
  if (!experience) {
    req.flash("error", "That guide application no longer exists.");
    return res.redirect("/guide-experiences/admin/queue");
  }
  experience.status = status;
  experience.identityChecked = status === "approved" && req.body.identityChecked === "on";
  experience.credentialChecked = status === "approved"
    && Boolean(experience.credentialType)
    && req.body.credentialChecked === "on";
  experience.adminNote = typeof req.body.adminNote === "string" ? req.body.adminNote.trim().slice(0, 500) : "";
  experience.reviewedAt = new Date();
  experience.reviewedBy = req.user._id;
  await experience.save();

  req.flash("success", status === "approved" ? "Guide experience approved and published." : "Guide experience was declined.");
  res.redirect("/guide-experiences/admin/queue");
};
