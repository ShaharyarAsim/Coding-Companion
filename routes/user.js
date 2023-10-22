const express = require("express"); //Express framework
const bodyParser = require("body-parser"); // To parse JSON Object
const multer = require("../middleware/multer"); //To handle files on the server
const User = require("../models/user"); //To access User database
const checkAuth = require("../middleware/check-auth"); //Middleware to check for authentication status
const userControllers = require("../controllers/user"); // User controller functions
const imageController = require("../controllers/image"); // Image controller functions

const router = express.Router(); //Router to navigate through files and APIs

//User Registration
router.post("/register", bodyParser.json(), userControllers.registerUser);

//User Login and Token Generation
router.post("/login", bodyParser.json(), userControllers.loginUser);

//Route to fetch user profile data
router.get(
  "/fetch-profile/:id",
  checkAuth,
  bodyParser.json(),
  userControllers.fetchProfile
);

//Route to update user profile data
router.put(
  "/update-profile/:id",
  checkAuth,
  bodyParser.json(),
  userControllers.updateProfile
);

// Route to upload picture to cloudinary
router.post(
  "/upload-profile-picture/:id",
  multer.single("image"),
  imageController.imageUpload
);

//Route to update favorites
router.put("/edit-favorites/:id", userControllers.updateFavorites);

//Route to fetch favorites
router.get(
  "/get-favorites/:id",
  bodyParser.json(),
  userControllers.getFavorites
);
// Route to update-recent-activity
router.put(
  "/add-recent-activity/:id",
  bodyParser.json(),
  userControllers.updateRecentActivities
);

//Route to fetch recent activities
router.get(
  "/get-recent-activities/:id",
  bodyParser.json(),
  userControllers.getRecentActivities
);

// User History
router.get(
  "/user-history/:id",
  bodyParser.json(),
  userControllers.fetchHistory
);

module.exports = router;
