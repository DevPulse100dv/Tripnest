if(process.env.NODE_ENV != "production"){
  require('dotenv').config();
}

const express = require("express");
const app = express();
const path = require("path");
const methodOverride = require('method-override');
const ejsMate = require("ejs-mate");

const connectDatabase = require("./config/database.js");
const configureAuthentication = require("./config/authentication.js");
const ExpressError = require("./utils/ExpressError.js");
const Listing = require("./models/listing.js");
const wrapAsync = require("./utils/wrapAsync.js");

const dbUrl = process.env.ATLASDB_URL;

const sessionSecret = process.env.SECRET;
if (!dbUrl || !sessionSecret) {
  throw new Error("ATLASDB_URL and SECRET are required. Set them in the server environment or local .env file.");
}

const listingsRouter = require("./routers/listing.js");
const reviewRouter = require("./routers/review.js");
const userRouter = require("./routers/user.js")
const comparisonRouter = require("./routers/comparison.js");
const guideExperienceRouter = require("./routers/guideExperience.js");

app.set("view engine","ejs");//When I ask you to render a view, use EJS as the template engine.(res.render())
app.engine("ejs",ejsMate);
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname,"public")));//The public directory is specifically meant for browser-accessible static assets.
//because we have our app.js and env like all files we cannot give that to browser so therefore we are telling that browser resource
// are present in the public folder so u can go and access there.

// Authentication
configureAuthentication(app, { dbUrl, sessionSecret });

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/", wrapAsync(async (req, res) => {
  if (req.user?.accountType === "guide") return res.redirect("/guide-experiences/mine");
  if (req.user?.accountType === "admin") return res.redirect("/guide-experiences/admin/dashboard");
  const featuredListings = await Listing.find({}).sort({ _id: -1 }).limit(3).lean();
  res.render("home.ejs", { featuredListings });
}));

app.use("/compare", comparisonRouter);
app.use("/guide-experiences", guideExperienceRouter);
app.use("/listings",listingsRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);


app.all("*",(req,res,next)=>{
   next(new ExpressError(404,"page not found"));
});
app.use((err,req,res,next)=>{
  let {status=500,message="Something went wrong"} = err;
  if (status >= 500) console.error("Request failed:", err);
  res.status(status).render("error.ejs",{message: status >= 500 ? "We couldn’t save this stay. Please check the server configuration and try again." : message});
});


const port = process.env.PORT || 8081;
async function startServer() {
  try {
    await connectDatabase(dbUrl);
    console.log(dbUrl)
    console.log("connected to database");
    app.listen(port, () => {
      console.log("server is listening", `http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Could not connect to the database:", error);
    process.exitCode = 1;
  }
}
startServer();
