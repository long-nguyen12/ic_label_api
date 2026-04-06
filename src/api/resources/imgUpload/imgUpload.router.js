import express from "express";
import imgUploadController from "./imgUpload.controller";
import multer from "multer";
import fs from "fs";
import path from "path";
import { convertFileName } from "../../utils/fileUtils";

export const imgUploadRouter = express.Router();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const uploadsRoot = path.join(process.cwd(), "uploads");
const imagesDir = path.join(uploadsRoot, "images");
const documentsDir = path.join(uploadsRoot, "documents");
const filesDir = path.join(uploadsRoot, "files");

const ensureDir = (dirPath) => async (req, res, next) => {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
    next();
  } catch (err) {
    next(err);
  }
};

const maxImageUploadMb = toNumber(process.env.MAX_IMAGE_UPLOAD_MB, 10);
const maxDocumentUploadMb = toNumber(process.env.MAX_DOCUMENT_UPLOAD_MB, 10);
const maxDatasetUploadGb = toNumber(process.env.MAX_DATASET_UPLOAD_GB, 10);

// config upload image
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesDir);
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

let uploadImage = multer({
  storage: storage,
  fileFilter: extFile,
  limits: { fileSize: maxImageUploadMb * 1024 * 1024 },
});
imgUploadRouter.route("/hissync").get(imgUploadController.downloadFileHisSync);

imgUploadRouter.route("/image/:imgNm").get(imgUploadController.getImageByName);

imgUploadRouter.route("/:imgNm").get(imgUploadController.getFileByName);

imgUploadRouter
  .route("/")
  .post(
    ensureDir(imagesDir),
    uploadImage.single("image"),
    imgUploadController.uploadImages
  );
// kết thúc config upload image

// config upload file
let storageFiles = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, documentsDir);
  },
  filename: function (req, file, cb) {
    let originalname = convertFileName(file.originalname);
    cb(null, originalname);
  },
});

function extFileFiles(req, file, cb) {
  if (!file.originalname.match(/\.(pdf|PDF)$/)) {
    return cb(new Error("Tệp tin không đúng định dạng"));
  } else {
    cb(null, true);
  }
}

let uploadDocumenteFile = multer({
  storage: storageFiles,
  limits: { fileSize: maxDocumentUploadMb * 1024 * 1024 }, // MB
  fileFilter: extFileFiles,
});

imgUploadRouter
  .route("/upload-document")
  .post(
    ensureDir(documentsDir),
    uploadDocumenteFile.single("file"),
    imgUploadController.uploadDocumenteFile
  );

// kết thúc config upload Files

// Route for uploading large dataset files
let largeFileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, filesDir);
  },
  filename: function (req, file, cb) {
    let originalname = convertFileName(file.originalname);
    cb(null, originalname);
  },
});

let uploadLargeFile = multer({
  storage: largeFileStorage,
  limits: { fileSize: maxDatasetUploadGb * 1024 * 1024 * 1024 }, // GB
});

// Route for large file upload
imgUploadRouter
  .route("/upload-file")
  .post(
    ensureDir(filesDir),
    uploadLargeFile.single("file"),
    imgUploadController.uploadLargeFile
  );
