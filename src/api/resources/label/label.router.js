import express from "express";
import passport from "passport";
import labelController from "./label.controller";
import multer from "multer";
import fs from "fs";
import { convertFileName } from "../../utils/fileUtils";

let storageFiles = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/labels");
  },
  filename: function (req, file, cb) {
    let originalname = convertFileName(file.originalname);
    cb(null, originalname);
  },
});
function checkFileUploadPath(req, res, next) {
  let path = "./uploads/labels";
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
function extFileFiles(req, file, cb) {
  if (!file.originalname.match(/\.(xlsx|XLSX|xls|XLS)$/)) {
    return cb(new Error("Tệp tin không đúng định dạng"));
  } else {
    cb(null, true);
  }
}
let uploadFile = multer({
  storage: storageFiles,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10GB
  fileFilter: extFileFiles,
});

const labelRouter = express.Router();
labelRouter.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  labelController.create
);
labelRouter.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  labelController.findAll
);
labelRouter.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  labelController.findOne
);
labelRouter.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  labelController.update
);
labelRouter.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  labelController.delete
);
labelRouter.post(
  "/import-labels",
  checkFileUploadPath,
  uploadFile.single("file"),
  labelController.createLabelByExcel
);

export default labelRouter;
