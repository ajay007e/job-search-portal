var express = require("express");
var router = express.Router();
var userHelper = require("../helpers/user-helper");

const checkAdminLoggedInOrNot = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/__admin/login");
  }
};

router.get("/", checkAdminLoggedInOrNot, async (req, res) => {
  await userHelper.getData().then((response) => {
    res.render("user/index", {
      title: "Job Search Portal | Admin Portal",
      users: response.resp,
      admin: true,
      searchCount: response.data[0].searchCount,
      clickCount: response.data[0].clickCount,
    });
  });
});

router.get("/login", (req, res) => {
  if (req.session.admin) {
    res.redirect("/__admin");
  } else {
    res.render("user/login", {
      title: "Admin Login",
    });
  }
});

router.post("/a-login", (req, res) => {
  userHelper.adminLogin(req.body).then((response) => {
    if (response.status) {
      req.session.admin = response.admin;
      res.redirect("/__admin/");
    } else {
      res.redirect("/__admin/login");
    }
  });
});

router.get("/logout", (req, res) => {
  req.session.admin = null;
  if (!req.session.admin) {
    res.redirect("/__admin/login");
  } else res.redirect("/__admin");
});

router.get("/profile/:id", (req, res) => {
  userHelper.userData(req.params.id).then((response) => {
    if (response.status) {
      res.render("user/profile", {
        title: "Profile",
        user: response,
      });
    } else {
      res.redirect("/__admin/");
    }
  });
});

router.get("/suspend/:id", (req, res) => {
  userHelper.suspendUser(req.params.id).then((response) => {
    res.redirect(`/__admin/profile/${req.params.id}`);
  });
});

module.exports = router;
