var express = require("express");
var router = express.Router();
var userHelper = require("../helpers/user-helper");
const fs = require("fs");

const checkUserLoggedInOrNot = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

router.get("/", (req, res) => {
  res.render("index/index", {
    title: "Job Search Portal | Find Your Employee Here",
    user: req.session.user,
  });
});

router.post("/signup", (req, res) => {
  userHelper.validate(req.body).then((validation) => {
    if (!validation.status) {
      req.session.flash = {
        error: true,
        type: "danger",
        title: "",
        message: validation.message,
      };
      res.json({ reload: true });
    } else {
      let userData = {
        name: req.body.name.toLowerCase(),
        mobile: req.body.mob,
        email: req.body.email,
        location: req.body.loc.toLowerCase(),
        password: req.body.pass,
        job: req.body.job,
        question: req.body.ques,
        answer: req.body.ans,
        verified: false,
        status: "pending",
        image: false,
        orginDate: new Date().getTime(),
      };
      userHelper.doSignup(userData, req.headers.host).then((response) => {
        if (response.status) {
          req.session.user = response.user;
          req.session.flash = {
            type: "success",
            title: "Mail Sent",
            message:
              "Verifiction mail sent to your mail, kindly verify using the mail.",
          };
        } else {
          req.session.flash = {
            type: "info",
            title: "Error",
            message: "Some Error occured, try after sometimes.",
          };
        }
        res.json(response);
      });
    }
  });
});

router.get("/login", (req, res) => {
  if (req.session.user) {
    res.redirect("/profile");
  } else {
    res.render("index/login", {
      title: "Be a Member Now",
    });
  }
});
router.post("/login", (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user;
      res.redirect("/profile");
    } else {
      req.session.loginErr = true;
      res.redirect("/login");
    }
  });
});

router.get("/logout", (req, res) => {
  req.session.user = null;
  if (!req.session.user) {
    res.redirect("/login");
  } else res.redirect("/");
});

router.get("/profile", checkUserLoggedInOrNot, (req, res) => {
  userHelper.userData(req.session.user._id).then((response) => {
    res.render("index/profile", {
      title: "Profile",
      user: response,
    });
  });
});

router.get("/change-password", checkUserLoggedInOrNot, (req, res) => {
  res.render("index/change_password", {
    title: "Change Password",
  });
});

router.get("/verify-account", (req, res) => {
  userHelper.verifyAccount(req.query.token).then((response) => {
    if (response.status) {
      req.session.flash = {
        type: "success",
        title: "Account Verified",
        message: "Successfully verified, please login",
      };
      res.redirect("/profile");
    } else {
      req.session.flash = {
        type: "info",
        title: "Error",
        message: "Some Error occured, try after sometimes.",
      };
      res.redirect("/");
    }
  });
});

router.get("/verify-profile", checkUserLoggedInOrNot, (req, res) => {
  userHelper
    .verifyProfile(req.session.user._id, req.headers.host)
    .then((response) => {
      if (response.sentMail) {
        req.session.flash = {
          type: "success",
          title: "Mail Sent",
          message:
            "Verifiction mail sent to your mail, kindly verify using the mail.",
        };
      } else {
        req.session.flash = {
          type: "info",
          title: "Error",
          message: "Some Error occured, try after sometimes.",
        };
      }
      res.json(response);
    });
});

router.post("/edit-profile", checkUserLoggedInOrNot, (req, res) => {
  userHelper.editProfile(req.session.user._id, req.body).then((response) => {
    if (response.status) {
      req.session.flash = {
        type: "success",
        message: response.message,
      };
    } else {
      req.session.flash = {
        type: "danger",
        message: response.message,
      };
    }
    res.redirect("/profile");
  });
});

router.post("/change-password", checkUserLoggedInOrNot, (req, res) => {
  if (req.body.newPass !== req.body.rePass) {
    req.session.flash = {
      type: "danger",
      message: "Password didn't match.",
    };
    res.redirect("/change-password");
  } else {
    userHelper
      .editPassword(req.session.user._id, req.body.pass, req.body.newPass)
      .then((response) => {
        if (response.status) {
          req.session.flash = {
            type: "success",
            message: response.message,
          };
          res.redirect("/profile");
        } else {
          req.session.flash = {
            type: "info",
            message: response.message,
          };
          res.redirect("/change-password");
        }
      });
  }
});

router.post("/change-question", checkUserLoggedInOrNot, (req, res) => {
  if (req.body.ques === "") {
    req.session.flash = {
      type: "danger",
      message: "All fields must be filled.",
    };
    res.redirect("/change-password");
  } else {
    userHelper.editQuestion(req.session.user._id, req.body).then((response) => {
      if (response.status) {
        req.session.flash = {
          type: "success",
          message: response.message,
        };
        res.redirect("/profile");
      } else {
        req.session.flash = {
          type: "info",
          message: response.message,
        };
        res.redirect("/change-password");
      }
    });
  }
});

router.post("/edit-image/:id", (req, res) => {
  let image = req.files.image;
  image.mv("public/images/user-images/" + req.params.id + ".jpg");
  userHelper.editImage(req.params.id).then(() => {});
  res.redirect("/profile");
});

router.get("/remove-image/:id", (req, res) => {
  userHelper.removeImage(req.params.id).then(() => {
    res.redirect("/profile");
    fs.unlink(
      "./public/images/user-images/" + req.params.id + ".jpg",
      (err) => {
        if (err) console.log(err);
      }
    );
  });
});

router.get("/contact-us", (req, res) => {
  res.render("index/contact_us", {
    title: "Contact Us",
  });
});

router.post("/contact-form", (req, res) => {
  userHelper.sentContactMail(req.body).then((response) => {
    if (response.status) {
      req.session.flash = {
        type: "success",
        message: response.message,
      };
    } else {
      req.session.flash = {
        type: "info",
        message: response.message,
      };
    }
    res.json(response);
  });
});

router.get("/forget-password", (req, res) => {
  res.render("index/forget_password", {
    title: "Reset Password",
  });
});

router.post("/forget-password", (req, res) => {
  if (req.body.ques) {
    userHelper.resetPassword(req.body).then((response) => {
      if (!response.status) {
        req.session.flash = {
          type: "danger",
          message: response.message,
        };
      }
      res.json(response);
    });
  }
});

router.post("/reset-password", (req, res) => {
  userHelper.sentPassword(req.body).then((response) => {
    if (response.status) {
      req.session.flash = {
        type: "success",
        message: response.message,
      };
    } else {
      req.session.flash = {
        type: "info",
        message: response.message,
      };
    }
    res.json(response);
  });
});

router.get("/terms", (req, res) => {
  res.render("index/terms", {
    title: "Terms and Conditions",
  });
});

router.get("/policy", (req, res) => {
  res.render("index/policy", {
    title: "Privacy Policy",
  });
});

router.get("/search", (req, res) => {
  userHelper.search(req.query).then((response) => {
    res.render("index/search", {
      title: "Search Result",
      results: response,
    });
  });
});

router.get("/increment-count", (req, res) => {
  userHelper.incrementCount().then((data) => {
    console.log(data);
  });
});

module.exports = router;
