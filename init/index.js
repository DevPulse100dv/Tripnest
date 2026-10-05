if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const mongoose = require("mongoose");
const { data: sampleListings } = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

const dbUrl = process.env.ATLASDB_URL
  || process.env.MONGO_URL
  || "mongodb://127.0.0.1:27017/TripNest";

const seedListings = async () => {
  await mongoose.connect(dbUrl);
  const owner = await User.findOne().select("_id").lean();

  const existingDemoUpdates = sampleListings.map((listing) => ({
    updateOne: {
      filter: {
        title: listing.title,
        location: listing.location,
        country: listing.country,
      },
      update: {
        $set: {
          description: listing.description,
          image: listing.image,
          price: listing.price,
        },
      },
    },
  }));
  const refreshed = await Listing.bulkWrite(existingDemoUpdates, { ordered: true });

  const operations = sampleListings.map((listing) => {
    const seedListing = owner ? { ...listing, owner: owner._id } : listing;
    return {
      updateOne: {
        filter: {
          title: listing.title,
          location: listing.location,
          country: listing.country,
        },
        update: { $setOnInsert: seedListing },
        upsert: true,
      },
    };
  });

  const result = await Listing.bulkWrite(operations, { ordered: true });
  console.log(`Karnataka demo listings ready. Added ${result.upsertedCount}; refreshed ${refreshed.modifiedCount}; already present ${result.matchedCount}.`);
};

seedListings()
  .catch((error) => {
    console.error("Could not seed TripNest demo listings:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
