const jwt = require("jsonwebtoken");
const redisClient = require("../helpers/init_redis");

module.exports = async (req, res, next) => {
  try {
    console.log("Checking for authentication...");
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    const token_original = await redisClient.get(decodedToken.userId);
    if (token_original !== token) {
      throw "LoginSessionExpired:TRUE";
    }
    //req.userData = { email: decodedToken.email, userID: decodedToken.userId };

    console.log("Authenticated!");
    next();
  } catch (err) {
    console.log(err);
    res.status(440).json({ message: "LoginSessionExpired:TRUE" });
  }
};
