const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const guideExperienceSchema = new Schema({
  guide: { type: Schema.Types.ObjectId, ref: "User", required: true },
  listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 1600 },
  area: { type: String, required: true, trim: true, maxlength: 140 },
  durationHours: { type: Number, required: true, min: 0.25, max: 24 },
  price: { type: Number, required: true, min: 0 },
  languages: [{ type: String, trim: true, maxlength: 40 }],
  includes: { type: String, trim: true, maxlength: 500 },
  contactPhone: { type: String, required: true, trim: true, maxlength: 20 },
  credentialType: { type: String, trim: true, maxlength: 100 },
  credentialReference: { type: String, trim: true, maxlength: 100 },
  credentialDocument: {
    data: { type: Buffer, select: false },
    contentType: { type: String, enum: ["application/pdf", "image/jpeg", "image/png"] },
    fileName: { type: String, trim: true, maxlength: 160 },
  },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  identityChecked: { type: Boolean, default: false },
  credentialChecked: { type: Boolean, default: false },
  reviewedAt: Date,
  reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  adminNote: { type: String, trim: true, maxlength: 500 },
}, { timestamps: true });

guideExperienceSchema.index({ listing: 1, status: 1 });
guideExperienceSchema.index({ guide: 1, createdAt: -1 });

module.exports = mongoose.model("GuideExperience", guideExperienceSchema);
