const cloudinary = require('cloudinary').v2;
const {CloudinaryStorage} = require("multer-storage-cloudinary");
const { diskStorage } = require("multer");
const path = require("path");
const fs = require("fs");

const hasCloudinaryConfig = Boolean(
  process.env.CLOUD_NAME && process.env.CLOUD_API_KEY && process.env.CLOUD_API_SECRET
);

if (process.env.NODE_ENV === "production" && !hasCloudinaryConfig) {
  throw new Error("CLOUD_NAME, CLOUD_API_KEY, and CLOUD_API_SECRET are required in production for persistent listing images.");
}

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

const uploadDirectory = path.join(__dirname, "public", "uploads");
if (!hasCloudinaryConfig) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}
const storage = hasCloudinaryConfig
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'tripnest',
        allowedFormats: async () => ['png', 'jpg', 'jpeg', 'webp']
      },
    })
  : diskStorage({
      destination: uploadDirectory,
      filename: (req, file, callback) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-");
        callback(null, `${Date.now()}-${safeName}`);
      },
    });

  module.exports = {
    cloudinary,
    storage
  }
