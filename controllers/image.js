//const fs = require("fs"); //To handle file system
const cloudinary = require("cloudinary"); //To handle Cloudinary operations
const User = require("../models/user"); //To access User database

//Connecting to cloudinary image host
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//Controller to upload image
const imageUpload = async (req, res, next) => {
  console.log(`Uploading image for userID: ${req.params.id}`);
  try {
    let user = await User.findById(req.params.id);
    if (!user) {
      throw "User not found.";
    }
    if (user.imagePath) {
      const image = await cloudinary.uploader.destroy(
        user.imagePath.split("/").pop().split(".")[0]
      );
      if (image.result !== "ok") {
        throw "Couldn't delete the picture!";
      }
    }
    const result = await cloudinary.uploader.upload(req.file.path);
    user.imagePath = result.url;
    user = await user.save();
    return res.status(200).json({
      message: "Picture uploaded successfully!",
    });
  } catch (err) {
    console.log(err);
  }
};

// Route to upload picture to the backend-server

// router.post(
//   "/upload-profile-picture/:id",
//   multer({ storage: storage }).single("image"),
//   (req, res, next) => {
//     console.log(`Uploading image for userID: ${req.params.id}`);
//     User.findById(req.params.id).then((user) => {
//       if (user.imagePath) {
//         const oldImagePath =
//           "backend/images/" + user.imagePath.split("/").pop();
//         console.log("Old image found: ", oldImagePath);
//         fs.unlink(oldImagePath, (error) => {
//           if (error) {
//             console.log(
//               "Error while deleting file: ",
//               user.imagePath,
//               "\nImage could not be uploaded!"
//             );
//             console.log(error);
//             return;
//           }

//           console.log("File deleted successfully: ", oldImagePath);
//         });
//       }

//       const url = req.protocol + "://" + req.get("host");
//       user.imagePath = url + "/images/" + req.file.filename; //
//       console.log("New ImagePath: ", user.imagePath);
//       user.save();
//     });
//   }
// );

module.exports = { imageUpload };
