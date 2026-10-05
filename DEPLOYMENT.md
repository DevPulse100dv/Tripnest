# TripNest deployment

TripNest is a Node.js 20 Express application that renders EJS pages. MongoDB stores listings, accounts, reviews, guide experiences, enquiries, and login sessions. Listing images are stored in Cloudinary when configured; MongoDB stores their URL and public ID. Guide credential documents are stored in MongoDB.

## Before deployment

1. Create a MongoDB Atlas cluster and a database user. Allow network access from the app host (for an initial deployment, Atlas may require `0.0.0.0/0`; use a strong database password and least-privilege database user).
2. Create a Cloudinary account and copy its cloud name, API key, and API secret.
3. Rotate the local `SECRET` and `ADMIN_INVITE_CODE` values. Do not commit `.env` or put credentials in source control.
4. Push this repository to GitHub.

## Render web service

Create a **Web Service** in Render and connect this repository. Leave the root directory blank because the Git repository itself is `Backend-Airbnb-`. Choose the Node runtime, set the build command to `npm install`, and the start command to `npm start`. Set these environment variables in Render:

- `NODE_ENV=production`
- `ATLASDB_URL` = the MongoDB Atlas connection string
- `SECRET` = a fresh, long random value
- `ADMIN_INVITE_CODE` = a fresh private invite code
- `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET` = Cloudinary credentials

Render supplies `PORT`. Once deployed, check `/health` for `{"status":"ok"}`. The app connects to MongoDB before it begins listening, so a missing/invalid database URL prevents startup. Do not rely on local disk uploads in production; production startup requires Cloudinary credentials.

Seed demo listings only if desired by running `npm run seed` with the same Atlas URL set in the environment. Seeding is not part of the web service startup.

## Free-tier considerations

Free service quotas and eligibility change. Render has historically offered free web services with sleeping/cold starts and limited compute; check its current pricing before choosing it. MongoDB Atlas and Cloudinary also have separate plan limits. The code is compatible with a standard Node web service; Vercel is less direct because this application starts a persistent Express listener and serves EJS, so prefer a web-service host such as Render unless you intentionally adapt it to serverless functions.

For local development, copy `.env.example` to `.env`, use a local MongoDB or Atlas URL, and leave Cloudinary values blank to use local `public/uploads` storage.
