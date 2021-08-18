const collections = require("./collections");

const mongoClient = require("mongodb").MongoClient;

const state = {
  database: null,
};

module.exports.connect = function (done) {
  const url = process.env.DATABASE_URL;
  const databaseName = collections.DATABASE_NAME;

  mongoClient.connect(
    url,
    { useNewUrlParser: true,useUnifiedTopology: true },
    (error, data) => {
      if (error) return done(error);
      state.database = data.db(databaseName);
      done();
    }
  );
};

module.exports.get = function () {
  return state.database;
};
