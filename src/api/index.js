import express from "express";
import userRouter from "./resources/user/user.router";
import { imgUploadRouter } from "./resources/imgUpload/imgUpload.router";
import { thongtinchungRouter } from "./resources/thongtinchung/thongtinchung.router";
import { phanquyenvaitroRouter } from "./resources/phanquyenvaitro/phanquyenvaitro.router";
import { lichsuhoatdongRouter } from "./resources/lichsuhoatdong/lichsuhoatdong.router";
// import reportRouter from "./resources/reports/report.router";
import positionRouter from "./resources/position/position.router";
import datasetRouter from "./resources/dataset/dataset.router";
import galleryRouter from "./resources/gallery/gallery.router";
import { filesRouter } from "./resources/files/files.router";
// const restRouter = express.Router();

export const restRouter = express.Router();

restRouter.use("/users", userRouter);
restRouter.use("/file", filesRouter);
restRouter.use("/files", imgUploadRouter);
restRouter.use("/thong-tin-chung", thongtinchungRouter);
restRouter.use("/phan-quyen-vai-tro", phanquyenvaitroRouter);
restRouter.use("/lich-su-hoat-dong", lichsuhoatdongRouter);
// restRouter.use("/report", reportRouter);
restRouter.use("/position", positionRouter);
restRouter.use("/dataset", datasetRouter);
restRouter.use("/gallery", galleryRouter); // Assuming gallery uses the same controller as dataset

