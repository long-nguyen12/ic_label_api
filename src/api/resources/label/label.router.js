import express from "express";
import passport from "passport";
import labelController from "./label.controller";
import multer from "multer";
import fs from "fs";
import { convertFileName } from "../../utils/fileUtils";

const storageFiles = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "./uploads/labels");
  },
  filename(req, file, cb) {
    const originalname = convertFileName(file.originalname);
    cb(null, originalname);
  },
});

function checkFileUploadPath(req, res, next) {
  const uploadPath = "./uploads/labels";
  fs.mkdir(uploadPath, { recursive: true }, (err) => {
    if (err) {
      return next(err);
    }
    return next();
  });
}

function extFileFiles(req, file, cb) {
  if (!file.originalname.match(/\.(xlsx|XLSX|xls|XLS)$/)) {
    return cb(new Error("Invalid file format"));
  }
  return cb(null, true);
}

const uploadFile = multer({
  storage: storageFiles,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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
  passport.authenticate("jwt", { session: false }),
  checkFileUploadPath,
  uploadFile.single("file"),
  labelController.createLabelByExcel
);

export default labelRouter;
