const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const guideInquirySchema = new Schema({
  experience: { type: Schema.Types.ObjectId, ref: "GuideExperience", required: true },
  visitor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  status: { type: String, enum: ["new", "contacted", "closed"], default: "new" },
}, { timestamps: true });

guideInquirySchema.index({ experience: 1, createdAt: -1 });
guideInquirySchema.index({ visitor: 1, createdAt: -1 });

module.exports = mongoose.model("GuideInquiry", guideInquirySchema);
