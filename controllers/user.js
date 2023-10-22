const bcrypt = require("bcryptjs"); // To encrypt password
const jwt = require("jsonwebtoken"); // To generate token
const User = require("../models/user"); //To access User database
const Validators = require("../helpers/validation_schema"); //To validate data the data receiver in API req body
const redisClient = require("../helpers/init_redis");

//User login controller
const loginUser = async (req, res, next) => {
  try {
    //Checking for invalid email entry
    const { error, value } = await Validators.emailSchema.validateAsync(
      req.body.email
    );

    //Looking for email in database
    let fetchedUser = await User.findOne({ email: req.body.email });

    //If email doesn't exist
    if (!fetchedUser) {
      throw "Entered email does not exist";
    }

    //Comparing password
    const reult = await bcrypt.compare(req.body.password, fetchedUser.password);
    //If password doesn't match
    if (!reult) {
      throw "Invalid email or password entered";
    }

    // ----- IF AUTHENTICATED -----

    // Update user login streak

    const now = Date.now();
    if (fetchedUser.loginStreak.nextDate <= now) {
      // If the next login date has already passed or it's the first login, check if it's a new day.
      const lastLoginDate = new Date(fetchedUser.loginStreak.onDate);
      const currentLoginDate = new Date(now);

      if (
        lastLoginDate.getFullYear() === currentLoginDate.getFullYear() &&
        lastLoginDate.getMonth() === currentLoginDate.getMonth() &&
        lastLoginDate.getDate() === currentLoginDate.getDate()
      ) {
        // It's the same day, so do not reset the streak.
        fetchedUser.loginStreak.streakCount++;
      } else {
        // It's a new day, so reset the streak.
        fetchedUser.loginStreak.streakCount = 1;
      }
    }

    //Saving user to database
    fetchedUser = await fetchedUser.save();

    if (!fetchedUser) {
      throw error.status(500).json({
        message:
          "Internal server error occured while logging in. Please try again",
      });
    }

    //Generating token

    const token = jwt.sign(
      { email: fetchedUser.email, userId: fetchedUser._id },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
    await redisClient.set(fetchedUser._id.toString(), token, "EX", 3600);

    console.log("User logged in: ", fetchedUser.email);

    return res.status(200).json({
      token: token,
      expiresIn: 3600,
      userID: fetchedUser._id,
    });
  } catch (err) {
    if (err.details && err.details.length > 0) {
      return res.status(422).json({
        message: err.details[0].message,
      });
    } else {
      return res.status(401).json({
        message: err,
      });
    }
  }
};

//User registration controller
const registerUser = async (req, res, next) => {
  try {
    //Validating user input
    const { error, value } = await Validators.registrationSchema.validateAsync(
      req.body
    );

    //Looking for pre-existing email in the db
    let user = await User.findOne({ email: req.body.email });
    if (user) {
      throw "Email already in use. Please try another one.";
    }

    //Looking for pre-existing username in the db
    user = await User.findOne({ username: req.body.username });
    if (user) {
      throw "Username already in use. Please try another one.";
    }

    // ----------- AFTER VALIDATION ---------------

    //Generating password hash
    let hash = await bcrypt.hash(req.body.password, 10);

    let new_user = new User({
      email: req.body.email,
      password: hash,
      name: req.body.name,
      username: req.body.username,
      dob: req.body.dob,
      imagePath: "",
      loginStreak: {
        onDate: null,
        nextDate: null,
        streakCount: 0,
      },
    });

    //Saving the new user in db
    new_user = await new_user.save();

    //Logging success message to console
    console.log("New user created: ", new_user.email);

    //Returning response
    return res.status(200).json({
      message: "User Created",
    });
  } catch (err) {
    //If a validation error is thrown
    if (err.details && err.details.length > 0) {
      return res.status(422).json({
        message: err.details[0].message,
      });
    } else {
      //For all other errors
      return res.status(406).json({
        message: err,
      });
    }
  }
};

// User profile fetch controller
const fetchProfile = async (req, res, next) => {
  try {
    const fetchedUser = await User.findById(req.params.id);
    if (!fetchedUser) {
      throw "Unable to fetch user profile data";
    }

    //Calculating learning progress

    let learningProgress = 0;
    let completed = 0;
    let beginnerComp = 0;
    let intermediateComp = 0;
    let advancedComp = 0;

    if (fetchedUser.qAnswers) {
      fetchedUser.qAnswers.forEach((ans) => {
        if (ans.completedOnce === true) {
          completed++;
        }
        learningProgress = ((completed / 26) * 100).toFixed(0);
        console.log(learningProgress);

        if (ans.qID.includes("py-01") && ans.completedOnce == true) {
          beginnerComp++;
        }
        if (ans.qID.includes("py-02") && ans.completedOnce == true) {
          intermediateComp++;
        }
        if (ans.qID.includes("py-03") && ans.completedOnce == true) {
          advancedComp++;
        }
      });
      if (
        beginnerComp == 4 &&
        !fetchedUser.coursesCompleted.includes("Python for Everyday Math")
      ) {
        fetchedUser.coursesCompleted.push("Python for Everyday Math");
      }

      if (
        intermediateComp == 6 &&
        !fetchedUser.coursesCompleted.includes("Python Text-Based Quiz Game")
      ) {
        fetchedUser.coursesCompleted.push("Python Text-Based Quiz Game");
      }

      if (
        advancedComp == 6 &&
        !fetchedUser.coursesCompleted.includes(
          "Simulation Modeling with Python"
        )
      ) {
        fetchedUser.coursesCompleted.push("Simulation Modeling with Python");
      }
    }

    let user = {
      email: fetchedUser.email,
      joined: fetchedUser.joinedOn,
      name: fetchedUser.name,
      username: fetchedUser.username,
      dob: fetchedUser.dob,
      loginStreakCount: fetchedUser.loginStreak.streakCount,
      imagePath: fetchedUser.imagePath,
      bioData: fetchedUser.bioData,
      favorites: fetchedUser.favorites,
      recentActivities: fetchedUser.recentActivities,
      learningProgress: learningProgress,
      certificates: fetchedUser.certificates,
      coursesCompleted: fetchedUser.coursesCompleted,
    };

    console.log("Profile data fetched for user: ", fetchedUser.email);

    return res.status(200).send(user);
  } catch (err) {
    return res.status(401).json({
      message: err,
    });
  }
};

//User profile update controller
const updateProfile = async (req, res, next) => {
  try {
    const { error, value } = await Validators.editProfileSchema.validateAsync(
      req.body
    );

    let fetchedUser = await User.findById(req.params.id);
    if (!fetchedUser) {
      throw "User profile could not be updated";
    }

    const user = await User.findOne({ email: req.body.email });
    if (user && req.body.email !== fetchedUser.email) {
      throw "Email already in use. Please try another one.";
    }

    const new_user = await User.findOne({ username: req.body.username });
    if (new_user) {
      if (req.body.username !== fetchedUser.username) {
        throw "Username already in use. Please try another one.";
      }
    }

    fetchedUser.name = req.body.name;
    fetchedUser.bioData = req.body.bioData;
    fetchedUser.dob = req.body.dob;
    fetchedUser.email = req.body.email;
    fetchedUser.password = await bcrypt.hash(req.body.password, 10);

    fetchedUser = await fetchedUser.save();
    if (!fetchedUser) {
      throw "Profile could not be updated";
    }
    console.log(`Profile data updated for user: ${req.body.email}`);

    return res.status(200).json({ message: "Profile updated successfully" });
  } catch (err) {
    if (err.details && err.details.length > 0) {
      return res.status(422).json({
        message: err.details[0].message,
      });
    } else {
      return res.status(422).json({
        message: err,
      });
    }
  }
};

//User favorites update controller
const updateFavorites = async (req, res, next) => {
  try {
    let fetchedUser = await User.findById(req.params.id);
    if (!fetchedUser) {
      throw "Could not update favorites";
    }

    let index = fetchedUser.favorites.indexOf(req.body.courseID);
    if (index !== -1) {
      fetchedUser.favorites.splice(index, 1);
    } else {
      fetchedUser.favorites.push(req.body.courseID);
    }

    fetchedUser = await fetchedUser.save();
    if (!fetchedUser) {
      throw "Could not update favorites";
    }

    console.log("Favorites updated for user: ", fetchedUser.email);

    return res.status(200).json({
      message: `Favorites updated for user: ${fetchedUser.email}`,
    });
  } catch (err) {
    return res.status(401).json({
      message: err,
    });
  }

  // (req, res, next) => {
  //   if (!req.body.courseID) {
  //     return;
  //   }

  //   User.findById(req.params.id).then((fetchedUser) => {
  //     if (!fetchedUser) {
  //       return res.status(404).send(`User with ID: ${req.params.id} not found.`);
  //     }
  // let index = fetchedUser.favorites.indexOf(req.body.courseID);
  // if (index !== -1) {
  //   fetchedUser.favorites.splice(index, 1);
  // } else {
  //   fetchedUser.favorites.push(req.body.courseID);
  // }

  // console.log(fetchedUser.favorites, index);

  // fetchedUser.save();
  // console.log(`Favorites updated for userID: ${req.params.id}`);
  // return res.status(200).json({
  //   message: `Favorites updated for userID: ${req.params.id}`,
  // });
  //   });
  // }
};

//User favorites fetch controller
const getFavorites = async (req, res, next) => {
  try {
    let fetchedUser = await User.findById(req.params.id);
    if (!fetchedUser) {
      throw "Could not fetch favorites";
    }

    console.log("Favorites fetched profile data: ", fetchedUser.email);

    return res.status(200).send(fetchedUser.favorites);
  } catch (err) {
    return res.status(401).json({
      message: err,
    });
  }

  // (req, res, next) => {
  //   User.findById(req.params.id).then((fetchedUser) => {
  //     if (!fetchedUser) {
  //       return res.status(404).send(`User with ID: ${req.params.id} not found.`);
  //     }
  //     console.log("Getting favorites... \n" + fetchedUser.favorites);
  //    return res.status(200).send(fetchedUser.favorites);
  //   });
  // }
};

//User recent acitvities update controller
const updateRecentActivities = async (req, res, next) => {
  try {
    let fetchedUser = await User.findById(req.params.id);
    if (!fetchedUser) {
      throw "Could not update recent activities";
    }

    if (fetchedUser.recentActivities.length < 5) {
      fetchedUser.recentActivities.push(req.body.activity);
    } else {
      fetchedUser.recentActivities.shift();
      fetchedUser.recentActivities.push(req.body.activity);
    }
    fetchedUser = await fetchedUser.save();
    if (!fetchedUser) {
      throw "Could not update recent activities";
    }
    console.log("Activity added for user:", fetchedUser.email);
    return res.status(200).json({
      message: `Recent activities updated for userID: ${req.params.id}`,
    });
  } catch (err) {
    return res.status(401).json({
      message: err,
    });
  }

  // (req, res, next) => {
  //   User.findById(req.params.id).then((fetchedUser) => {
  //     if (!fetchedUser) {
  //       return res.status(404).send(`User with ID: ${req.params.id} not found.`);
  //     }
  //     console.log(fetchedUser.recentActivities);
  // if (fetchedUser.recentActivities.length < 5) {
  //   fetchedUser.recentActivities.push(req.body.activity);
  //   console.log("Activity added", fetchedUser.recentActivities);
  // } else {
  //   fetchedUser.recentActivities.shift();
  //   fetchedUser.recentActivities.push(req.body.activity);
  //   console.log("Activity added", fetchedUser.recentActivities);
  // }
  // fetchedUser.save();
  // return res.status(200).json({
  //   message: `Recent activities updated for userID: ${req.params.id}`,
  // });
  //   });
  // }
};

//User recent acitvities fetch controller
const getRecentActivities = async (req, res, next) => {
  try {
    let fetchedUser = await User.findById(req.params.id);
    if (!fetchedUser) {
      throw "Could not fetch favorites";
    }
    const activities = fetchedUser.activities;
    console.log("Recent activities fetched for user: ", fetchedUser.email);
    return res.status(200).send(activities);
  } catch (err) {
    return res.status(401).json({
      message: err,
    });
  }

  // (req, res, next) => {
  //   User.findById(req.params.id).then((fetchedUser) => {
  //     if (!fetchedUser) {
  //       return res
  //         .status(404)
  //         .send(`User with ID: ${req.params.id} not found.`);
  //     }
  // const activities = fetchedUser.activities;
  // console.log("Sending activities: ", activities);
  // return res.status(200).send(activities);
  //   });
  // }
};

//User history fetch controller
const fetchHistory = async (req, res, next) => {
  try {
    const fetchedUser = await User.findById(req.params.id);
    if (!fetchedUser) {
      throw "Unable to fetch user profile data";
    }

    console.log("here");

    const userHistory = fetchedUser.qAnswers.map((answer) => ({
      userAnswer: answer.exercise,
      completedOn: answer.completedOn,
    }));

    return res.status(200).json(userHistory);
  } catch (err) {
    return res.status(401).json({
      message: err,
    });
  }
};

module.exports = {
  loginUser,
  registerUser,
  fetchProfile,
  updateProfile,
  updateFavorites,
  getFavorites,
  updateRecentActivities,
  getRecentActivities,
  fetchHistory,
};
