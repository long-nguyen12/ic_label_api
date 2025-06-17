import express from "express";
import passport from "passport";
import multer from "multer";
import userController from "./user.controller";
import {
  checkTempFolder,
  convertFileName,
  multipartMiddleware,
} from "../../utils/fileUtils";
import fs from "fs";

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/files");
  },
  filename: function (req, file, cb) {
    let originalname = convertFileName(file.originalname);
    cb(null, originalname);
  },
});
function extFile(req, file, cb) {
  if (!file.originalname.match(/\.(jpg|png|jpeg|gif|JPG|PNG|JPEG)$/)) {
    return cb(new Error("Ảnh không đúng định dạng"));
  } else {
    cb(null, true);
  }
}
let upload = multer({ storage: storage, fileFilter: extFile });

function checkUploadPath(req, res, next) {
  let path = "./uploads/files";
  fs.exists(path, function (exists) {
    if (exists) {
      next();
    } else {
      fs.mkdir(path, function (err) {
        if (err) {
          console.log("Error in folder creation");
          next();
        }
        next();
      });
    }
  });
}

const userRouter = express.Router();
userRouter.post("/", userController.signup);

userRouter.post("/login", userController.login);
userRouter.get(
  "/me",
  passport.authenticate("jwt", { session: false }),
  userController.authenticate
);
userRouter.put(
  "/info",
  passport.authenticate("jwt", { session: false }),
  userController.updateInfo
);
userRouter.put(
  "/reset-password",
  passport.authenticate("jwt", { session: false }),
  userController.resetPassword
);

userRouter.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  userController.findAll
);

userRouter.put(
  "/:id/avatar",
  checkTempFolder,
  multipartMiddleware,
  userController.updateAvatar
);

userRouter.put(
  "/change-password",
  passport.authenticate("jwt", { session: false }),
  userController.changePassword
);
userRouter.post("/forgot-password-mail", userController.forgotPasswordMail);

userRouter
  .route("/:id")
  .get(passport.authenticate("jwt", { session: false }), userController.findOne)
  .delete(
    passport.authenticate("jwt", { session: false }),
    userController.delete
  )
  .put(passport.authenticate("jwt", { session: false }), userController.update);

userRouter.get(
  "/generate-password/:id",
  passport.authenticate("jwt", { session: false }),
  userController.generatePassword
);

export default userRouter;
