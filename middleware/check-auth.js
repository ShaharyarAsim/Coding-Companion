//Importing required dependencies
const jwt = require("jsonwebtoken");
const redisClient = require("../helpers/init_redis");

//Function to check if the authentication is still valid
module.exports = async (req, res, next) => {
  try {
    console.log("Checking for authentication...");
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    const token_original = await redisClient.get(decodedToken.userId);

    //Throw error if the authentication has expired
    if (token_original !== token) {
      throw "LoginSessionExpired:TRUE";
    }
    //console.log("Authenticated!");
    next();
  } catch (err) {
    if (req.body.email) {
      console.log("Token expired for user: ", req.body.email);
    } else {
      console.log("Token for an unknown user has expired");
    }

    //Appedning message to the error to be detected by the interceptor
    res.status(440).json({ message: "LoginSessionExpired:TRUE" });
  }
};
