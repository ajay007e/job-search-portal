const database = require("../config/connection");
const collection = require("../config/collections");

const bcrypt = require("bcrypt");
const objectId = require("mongodb").ObjectId;
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const hbs = require("nodemailer-express-handlebars").default;

module.exports = {
  doSignup: (userData, domain) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      userData.emailToken = crypto.randomBytes(32).toString("hex");
      userData.password = await bcrypt.hash(userData.password, 10);
      database
        .get()
        .collection(collection.USER_COLLECTION)
        .insertOne(userData)
        .then(async (data) => {
          response.user = await database
            .get()
            .collection(collection.USER_COLLECTION)
            .findOne({ _id: data.insertedId });
          response.status = true;
          const mailOption = {
            to: response.user.email,
            from: "ajay010e@gmail.com",
            subject: "Verify Your Account",
            template: "verification",
            context: {
              name: response.user.name,
              link: `http://${domain}/verify-account?token=${response.user.emailToken}`,
            },
          };
          sentEmail("verification", mailOption).then(([err, info]) => {
            if (err) {
              console.log(err);
              response.sentMail = false;
              response.error = err;
              resolve(response);
            } else {
              response.sentMail = true;
              response.details = info;
              response.token = token;
              resolve(response);
            }
          });
        });
    });
  },

  doLogin: (userdata) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let user = await database
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ mobile: userdata.mob });
      if (user) {
        bcrypt.compare(userdata.pass, user.password).then((status) => {
          if (status) {
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            resolve({ status: false });
          }
        });
      } else {
        resolve({ status: false });
      }
    });
  },

  validate: (data) => {
    return new Promise(async (resolve, reject) => {
      let regexPass = /^(?=.*\d).{3,}/;
      await database
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ $or: [{ email: data.email }, { mobile: data.mob }] })
        .then((resp) => {
          if (resp) {
            resolve({
              status: false,
              message:
                "Already registerd with the given mail or mobile, please login",
            });
          } else if (
            data.job === undefined ||
            data.ans === undefined ||
            data.loc == undefined ||
            data.ques === undefined ||
            data.job === "" ||
            data.ans === "" ||
            data.loc === "" ||
            data.ques === ""
          ) {
            resolve({ status: false, message: "All fields must be filled." });
          } else if (!regexPass.test(data.pass)) {
            resolve({
              status: false,
              message:
                "Password must contain atleast 5 letter, alpha-numeric-special charcter combination.",
            });
          } else {
            resolve({ status: true });
          }
        });
    });
  },

  editProfile: (userId, userData) => {
    return new Promise(async (resolve, reject) => {
      await database
        .get()
        .collection(collection.USER_COLLECTION)
        .find(
          {
            $or: [{ email: userData.email }, { mobile: userData.mob }],
          },
          { _id: 1 }
        )
        .toArray()
        .then((resp) => {
          if (resp[0]._id.toString() !== userId) {
            resolve({
              status: false,
              message: "Email or Mobile is already registered.",
            });
          } else {
            database
              .get()
              .collection(collection.USER_COLLECTION)
              .updateOne(
                { _id: objectId(userId) },
                {
                  $set: {
                    name: userData.name.toLowerCase(),
                    mobile: userData.mob,
                    email: userData.email,
                  },
                }
              )
              .then(() => {
                resolve({
                  status: true,
                  message: "Profile Updated.",
                });
              });
          }
        });
    });
  },

  userData: (userId) => {
    return new Promise(async (resolve, reject) => {
      await database
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(userId) })
        .then((data) => {
          resolve(data);
        });
    });
  },

  editPassword: (userId, pass, newPass) => {
    return new Promise(async (resolve, reject) => {
      let user = await database
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(userId) });
      if (user) {
        bcrypt.compare(pass, user.password).then(async (status) => {
          if (status) {
            let newPassword = await bcrypt.hash(newPass, 10);
            database
              .get()
              .collection(collection.USER_COLLECTION)
              .updateOne(
                { _id: objectId(userId) },
                {
                  $set: {
                    password: newPassword,
                  },
                }
              )
              .then(() => {
                resolve({ status: true, message: "Password Changed." });
              });
          } else {
            resolve({
              status: false,
              message: "Current Password is Incorrect.",
            });
          }
        });
      } else {
        resolve({
          status: false,
          message: "Some Error occured, Try after sometimes.",
        });
      }
    });
  },

  editQuestion: (userId, data) => {
    return new Promise(async (resolve, reject) => {
      let user = await database
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(userId) });
      if (user) {
        bcrypt.compare(data.pass, user.password).then(async (status) => {
          if (status) {
            database
              .get()
              .collection(collection.USER_COLLECTION)
              .updateOne(
                { _id: objectId(userId) },
                {
                  $set: {
                    question: data.ques,
                    answer: data.ans,
                  },
                }
              )
              .then(() => {
                resolve({
                  status: true,
                  message: "Security Question Changed.",
                });
              });
          } else {
            resolve({
              status: false,
              message: "Current Password is Incorrect.",
            });
          }
        });
      } else {
        resolve({
          status: false,
          message: "Some Error occured, Try after sometimes.",
        });
      }
    });
  },

  resetPassword: (data) => {
    return new Promise(async (resolve, reject) => {
      let user = await database
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({
          mobile: data.mob,
          question: data.ques,
          answer: data.ans,
        });
      if (user) {
        let pass = (function () {
          var p = "";
          var str =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
            "abcdefghijklmnopqrstuvwxyz0123456789@#$";

          for (i = 1; i <= 8; i++) {
            var char = Math.floor(Math.random() * str.length + 1);

            p += str.charAt(char);
          }
          return p;
        })();
        let newPassword = await bcrypt.hash(pass, 10);
        database
          .get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: user._id },
            {
              $set: {
                password: newPassword,
              },
            }
          )
          .then(() => {
            resolve({
              status: true,
              message: "Password Reset.",
              password: pass,
            });
          });
      } else {
        resolve({
          status: false,
          message: "Enter valid Entries.",
        });
      }
    });
  },

  sentPassword: (data) => {
    return new Promise(async (resolve, reject) => {
      let user = await database
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({
          email: data.email,
        });
      if (user) {
        let pass = (function () {
          var p = "";
          var str =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
            "abcdefghijklmnopqrstuvwxyz0123456789@#$";

          for (i = 1; i <= 8; i++) {
            var char = Math.floor(Math.random() * str.length + 1);

            p += str.charAt(char);
          }

          return p;
        })();
        let newPassword = await bcrypt.hash(pass, 10);
        database
          .get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: user._id },
            {
              $set: {
                password: newPassword,
              },
            }
          )
          .then(() => {
            const mailOption = {
              from: "ajay010e@gmail.com",
              to: data.email,
              subject: `Temporary Password Generated`,
              template: "forget",
              context: {
                name: user.name,
                password: pass,
              },
            };
            sentEmail("forget", mailOption).then(([err, info]) => {
              if (err) {
                resolve({
                  status: false,
                  error: err,
                  message: "Some Error occured, try after sometimes.",
                });
              } else {
                resolve({
                  status: true,
                  message: "Tempoparary Password is sent to your mail.",
                });
              }
            });
          });
      } else {
        resolve({ status: false, message: "Enter Valid mail ID." });
      }
    });
  },

  sentContactMail: (data) => {
    return new Promise((resolve, reject) => {
      const mailOption = {
        from: data.email,
        to: process.env.NOTIFICATION_EMAIL,
        subject: `${data.subject}`,
        template: "contact",
        context: {
          name: data.name,
          message: data.message,
          email: data.email,
          mobile: data.mobile,
        },
      };
      sentEmail("contact", mailOption).then(([err, info]) => {
        if (err) {
          console.log(err);
          resolve({
            status: false,
            error: err,
            message: "Some Error occured, try after sometimes.",
          });
        } else {
          resolve({
            status: true,
            detail: info,
            message: "Email sent ,we will get back to you soon.",
          });
        }
      });
    });
  },

  verifyAccount: (token) => {
    return new Promise(async (resolve, reject) => {
      let user = await database
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ emailToken: token });
      if (user) {
        database
          .get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: user._id },
            {
              $set: {
                emailToken: null,
                verified: true,
                status: "active",
              },
            }
          )
          .then(() => {
            resolve({
              status: true,
              message: "Account Verified,Please Login.",
            });
          });
      } else {
        resolve({
          status: false,
          message: "Some Error occured, try after sometimes.",
        });
      }
    });
  },

  verifyProfile: (userId, domain) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let user = await database
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({
          _id: objectId(userId),
        });
      if (user) {
        let token = crypto.randomBytes(32).toString("hex");
        database
          .get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: user._id },
            {
              $set: {
                emailToken: token,
              },
            }
          )
          .then((data) => {
            if (data.acknowledged) {
              const mailOption = {
                to: user.email,
                from: process.env.NOTIFICATION_EMAIL,
                subject: "Verify Your Account",
                template: "verification",
                context: {
                  name: user.name,
                  link: `http://${domain}/verify-account?token=${token}`,
                },
              };
              sentEmail("verification", mailOption).then(([err, info]) => {
                if (err) {
                  console.log(err);
                  response.sentMail = false;
                  response.error = err;
                  resolve(response);
                } else {
                  response.sentMail = true;
                  response.details = info;
                  response.token = token;
                  resolve(response);
                }
              });
            }
          });
      } else {
        resolve({ status: false });
      }
    });
  },

  search: (data) => {
    return new Promise(async (resolve, reject) => {
      database
        .get()
        .collection(collection.ADMIN_COLLECTION)
        .updateOne(
          {
            _id: objectId("611d41403b274a2cfefff887"),
          },
          {
            $inc: { searchCount: 1 },
          }
        );
      let users = await database
        .get()
        .collection(collection.USER_COLLECTION)
        .find({
          location: data.place.toLowerCase(),
          job: data.job.toLowerCase(),
        })
        .toArray();

      if (users.length) {
        resolve({ status: true, result: true, emp: users });
      } else {
        let emp = await database
          .get()
          .collection(collection.USER_COLLECTION)
          .find({
            job: data.job.toLowerCase(),
          })
          .toArray();

        if (emp.length) {
          resolve({ status: true, result: false, emp: emp });
        } else {
          resolve({ status: false });
        }
      }
    });
  },

  incrementCount: () => {
    return new Promise((resolve, reject) => {
      database
        .get()
        .collection(collection.ADMIN_COLLECTION)
        .updateOne(
          {
            _id: objectId("611d41403b274a2cfefff887"),
          },
          {
            $inc: { clickCount: 1 },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },

  adminLogin: (data) => {
    return new Promise(async (resolve, reject) => {
      let user = await database
        .get()
        .collection(collection.ADMIN_COLLECTION)
        .find()
        .toArray();
      bcrypt.compare(data.id, user[0].id).then((r1) => {
        if (r1) {
          bcrypt.compare(data.code, user[0].code).then((r2) => {
            if (r2) {
              resolve({ status: true, admin: user[0]._id.toString() });
            } else {
              resolve({ status: false });
            }
          });
        } else {
          resolve({ status: false });
        }
      });
    });
  },

  getData: () => {
    return new Promise(async (resolve, reject) => {
      let data = await database
        .get()
        .collection(collection.ADMIN_COLLECTION)
        .find()
        .toArray();
      let resp = await database
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .toArray();
      resolve({ status: true, data, resp });
    });
  },

  suspendUser: (userId) => {
    return new Promise((resolve, reject) => {
      database
        .get()
        .collection(collection.USER_COLLECTION)
        .update(
          { _id: objectId(userId) },
          {
            $set: {
              status: "suspended",
              verified: false,
            },
          }
        )
        .then((response) => {
          if (response) {
            resolve({ status: true });
          } else {
            resolve({ status: false });
          }
        });
    });
  },

  editImage: (userId) => {
    return new Promise((resolve, reject) => {
      database
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              image: true,
            },
          }
        )
        .then((response) => {
          if (response) resolve({ status: true });
          else resolve({ status: false });
        });
    });
  },

  removeImage: (userId) => {
    return new Promise((resolve, reject) => {
      database
        .get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              image: false,
            },
          }
        )
        .then((response) => {
          if (response) resolve({ status: true });
          else resolve({ status: false });
        });
    });
  },
};

const sentEmail = async (template, mailOption) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.NOTIFICATION_EMAIL,
      pass: process.env.NOTIFICATION_EMAIL_PASSKEY,
    },
  });
  transporter.use(
    "compile",
    hbs({
      viewEngine: {
        extname: ".hbs", // handlebars extension
        layoutsDir: "views/email/", // location of handlebars templates
        defaultLayout: template, // name of main template
      },
      // viewPath: "views",
      viewPath: "views/email",
      extName: ".hbs",
    })
  );
  return new Promise((resolve) => {
    transporter.sendMail(mailOption, (err, info) => {
      resolve([err, info]);
    });
  });
};
