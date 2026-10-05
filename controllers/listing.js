const Listing = require("../models/listing.js");
const GuideExperience = require("../models/guideExperience.js");

module.exports.index = async (req,res)=>{
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
    const allListings = await Listing.find(search ? {
        $or: ["title", "description", "location", "country"].map((field) => ({
            [field]: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" },
        })),
    } : {}).populate("reviews", "ratings").sort({ _id: -1 });
    allListings.forEach((listing) => {
        const ratings = listing.reviews.map((review) => review.ratings).filter(Number.isFinite);
        listing.averageRating = ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null;
        listing.reviewCount = ratings.length;
    });
    res.render("listings/index.ejs",{allListings, search});
}

module.exports.renderNewForm = (req,res)=>{
    res.render("listings/new.ejs");
}

module.exports.showListing = async (req,res)=>{
    let {id}=req.params;
    const List = await Listing.findById(id).populate({path:"reviews",populate:{path:"author"}}).populate("owner");
    if(!List){
        req.flash("error","Requested listing does not exists");
        return res.redirect("/listings");
    }
    const localExperiences = await GuideExperience.find({ listing: List._id, status: "approved" })
        .populate("guide", "username")
        .sort({ createdAt: -1 })
        .lean();
    res.render("listings/show.ejs",{List, localExperiences});
}

module.exports.createListing = async (req,res)=>{
    const listing = new Listing(req.body.listing);
    listing.owner = req.user._id;
    if (req.file) {
        const imageUrl = req.file.path.startsWith("http")
            ? req.file.path
            : `/uploads/${req.file.filename}`;
        listing.image = { url: imageUrl, filename: req.file.filename };
    }
    await listing.save();
    req.flash("success","New listing added");
    res.redirect(`/listings/${listing._id}`);
}

module.exports.renderEditForm = async (req,res)=>{
    let {id}=req.params;
    const List = await Listing.findById(id);
    if(!List){
        req.flash("error","Requested listing does not exists");
        return res.redirect("/listings");
    }
    let imgUrl = List.image?.url || "";
    if (imgUrl.startsWith("http")) imgUrl = imgUrl.replace("/upload","/upload/w_250");
    res.render("listings/edit.ejs",{List,imgUrl});
}

module.exports.updateListing = async (req,res)=>{
    let {id}=req.params;
    let lists = await Listing.findByIdAndUpdate(id,{...req.body.listing});
    if (!lists) {
        req.flash("error", "Requested listing does not exist");
        return res.redirect("/listings");
    }
    if (req.file) {
        const imageUrl = req.file.path.startsWith("http")
            ? req.file.path
            : `/uploads/${req.file.filename}`;
        lists.image = { url: imageUrl, filename: req.file.filename };
        await lists.save();
    }
    req.flash("success","List was updated");
    res.redirect(`/listings/${id}`);
}

module.exports.destroyListing = async (req,res)=>{
    let {id}=req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("error","Listing was deleted");
    res.redirect("/listings");
}
