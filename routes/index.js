var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index/index", {
    title: "Job Search Portal | Find Your Employee Here",
  });
});

router.get("/login", function (req, res, next) {
  res.render("index/login", {
    title: "Be a Member Now",
  });
});
router.post("/login", function (req, res, next) {
  console.log(req.body);
});
router.post("/signup", function (req, res, next) {
  console.log(req.body);
});

router.get("/contact-us", function (req, res, next) {
  res.render("index/contact_us", {
    title: "Contact Us",
  });
});
router.get("/forget-password", function (req, res, next) {
  res.render("index/forget_password", {
    title: "Reset Password",
  });
});
router.get("/terms", function (req, res, next) {
  res.render("index/terms", {
    title: "Terms and Conditions",
  });
});
router.get("/search", function (req, res, next) {
  res.render("index/search", {
    title: "Search Result",
  });
});
router.get("/profile", function (req, res, next) {
  res.render("index/profile", {
    title: "Profile",
  });
});
router.get("/change-password", function (req, res, next) {
  res.render("index/change_password", {
    title: "Change Password",
  });
});
module.exports = router;
