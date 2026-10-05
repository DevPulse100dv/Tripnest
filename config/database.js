const mongoose = require("mongoose");

module.exports = async function connectDatabase(dbUrl) {
  await mongoose.connect(dbUrl);
  return mongoose.connection;
};
