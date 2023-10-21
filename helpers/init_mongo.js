const mongoose = require("mongoose");

let isConnected = false;

const dbUrl =
  "mongodb+srv://" +
  process.env.MONGO_UNAME +
  ":" +
  process.env.MONGO_PW +
  "@codecompanion.mss4qje.mongodb.net/";

const mongoConnectWithRetry = () => {
  console.log("Connecting to MongoDB...");
  mongoose
    .connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log(
        `Connected to MongoDB: (User: ${process.env.MONGO_UNAME})\n--------------------------\n`
      );
      isConnected = true;
    })
    .catch((err) => {
      console.error(
        "Failed to connect to MongoDB. Retrying in 5 seconds.\nError: ",
        err.error.message
      );
      setTimeout(connectWithRetry, 5000); // Retry after 5 seconds
    });
};

mongoConnectWithRetry();

module.exports = { isConnected };
