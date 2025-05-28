import express from "express";
import userRouter from "./resources/user/user.router";
import { imgUploadRouter } from "./resources/imgUpload/imgUpload.router";
import { thongtinchungRouter } from "./resources/thongtinchung/thongtinchung.router";
import { phanquyenvaitroRouter } from "./resources/phanquyenvaitro/phanquyenvaitro.router";
import { lichsuhoatdongRouter } from "./resources/lichsuhoatdong/lichsuhoatdong.router";
import customerRouter from "./resources/customer/customer.router";
import productRouter from "./resources/product/product.router";
import salebillsRouter from "./resources/salebills/salebills.router";
import salebillsdetailRouter from "./resources/salebillsdetail/salebillsdetail.router";
import reportRouter from "./resources/reports/report.router";
import positionRouter from "./resources/position/position.router";
// const restRouter = express.Router();

export const restRouter = express.Router();

restRouter.use("/users", userRouter);
restRouter.use("/customers", customerRouter);
restRouter.use("/products", productRouter);
restRouter.use("/files", imgUploadRouter);
restRouter.use("/salebills", salebillsRouter);
restRouter.use("/salebills-detail", salebillsdetailRouter);
restRouter.use("/thong-tin-chung", thongtinchungRouter);
restRouter.use("/phan-quyen-vai-tro", phanquyenvaitroRouter);
restRouter.use("/lich-su-hoat-dong", lichsuhoatdongRouter);
restRouter.use("/report", reportRouter);
restRouter.use("/position", positionRouter);

