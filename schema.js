const Joi = require("joi");
module.exports.listingSchema = Joi.object({
    listing : Joi.object({
        title : Joi.string().trim().min(3).max(100).required(),
        description : Joi.string().trim().min(10).max(2000).required(),
        location : Joi.string().trim().min(2).max(120).required(),
        country : Joi.string().trim().min(2).max(100).required(),
        price : Joi.number().positive().required(),
        image : Joi.any()
    }).required()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        ratings: Joi.number().required(),
        comment: Joi.string().required().min(1).max(1000)
    }).required()
});

module.exports.guideExperienceSchema = Joi.object({
    guideExperience: Joi.object({
        listingId: Joi.string().hex().length(24).required(),
        title: Joi.string().trim().min(5).max(100).required(),
        description: Joi.string().trim().min(30).max(1600).required(),
        area: Joi.string().trim().min(2).max(140).required(),
        durationHours: Joi.number().min(0.25).max(24).required(),
        price: Joi.number().min(0).max(1000000).required(),
        languages: Joi.string().trim().min(2).max(240).required(),
        includes: Joi.string().trim().max(500).allow(""),
        contactPhone: Joi.string().trim().pattern(/^[+0-9() .-]{7,20}$/).required(),
        credentialType: Joi.string().trim().max(100).allow(""),
        credentialReference: Joi.string().trim().max(100).allow(""),
    }).required(),
}).required();
