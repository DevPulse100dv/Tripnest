const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const Review = require("../models/reviews.js");
const { calculateScores, normalizePreferences } = require("../utils/compareListings.js");

const getListingIds = (body) => {
  const rawIds = body.listingIds;
  const ids = Array.isArray(rawIds) ? rawIds : rawIds ? [rawIds] : [];
  const uniqueIds = [...new Set(ids)];

  if (uniqueIds.length < 2 || uniqueIds.length > 4) {
    throw new Error("Select between 2 and 4 different stays to compare.");
  }
  if (uniqueIds.some((id) => typeof id !== "string" || !mongoose.isValidObjectId(id))) {
    throw new Error("One or more selected stay IDs are invalid. Please select stays again.");
  }
  return uniqueIds;
};

const getRatings = async (listings) => {
  const reviewIds = listings.flatMap((listing) => listing.reviews || []);
  const reviews = await Review.find({ _id: { $in: reviewIds } }).select("ratings").lean();
  const reviewsById = new Map(reviews.map((review) => [String(review._id), review]));
  const ratingsByListing = new Map();

  for (const listing of listings) {
    const listingReviews = (listing.reviews || [])
      .map((reviewId) => reviewsById.get(String(reviewId)))
      .filter((review) => Number.isFinite(review?.ratings));
    if (listingReviews.length) {
      ratingsByListing.set(String(listing._id), {
        averageRating: listingReviews.reduce((total, review) => total + review.ratings, 0) / listingReviews.length,
        reviewCount: listingReviews.length,
      });
    }
  }
  return ratingsByListing;
};

module.exports.start = (req, res) => {
  req.flash("error", "Choose 2–4 stays from Explore before opening a comparison.");
  res.redirect("/listings");
};

module.exports.select = async (req, res) => {
  let listingIds;
  let preferences;
  try {
    listingIds = getListingIds(req.body);
    preferences = normalizePreferences(req.body.preferences === undefined
      ? { price: "medium", rating: "medium" }
      : req.body.preferences);
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect("/listings");
  }

  const listings = await Listing.find({ _id: { $in: listingIds } }).lean();
  if (listings.length !== listingIds.length) {
    req.flash("error", "A selected stay is no longer available. Please choose your stays again.");
    return res.redirect("/listings");
  }

  const ratingByListing = await getRatings(listings);
  const byId = new Map(listings.map((listing) => {
    const rating = ratingByListing.get(String(listing._id));
    return [String(listing._id), {
      id: String(listing._id),
      title: listing.title,
      description: listing.description,
      image: listing.image?.url || "",
      location: [listing.location, listing.country].filter(Boolean).join(", "),
      price: Number.isFinite(listing.price) && listing.price > 0 ? listing.price : null,
      rating: rating?.averageRating ?? null,
      reviewCount: rating?.reviewCount ?? 0,
    }];
  }));
  const orderedListings = listingIds.map((id) => byId.get(id));
  const comparisonListings = calculateScores(orderedListings, preferences)
    .sort((first, second) => (second.matchScore ?? -1) - (first.matchScore ?? -1));

  res.render("comparison/results.ejs", { listings: comparisonListings, preferences });
};
