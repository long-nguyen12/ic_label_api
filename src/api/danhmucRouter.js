import express from "express";

/** Danh mục hành chính - địa chỉ */
 import { dmtinhthanhRouter } from './resources/danhmuc/dmtinhthanh/dmtinhthanh.router';
 import { dmphuongxaRouter } from './resources/danhmuc/dmphuongxa/dmphuongxa.router';
 import { dmquanhuyenRouter } from './resources/danhmuc/dmquanhuyen/dmquanhuyen.router';

/** Danh mục hành chính - đặc trưng */
import { dmphaiRouter } from './resources/danhmuc/dmphai/dmphai.router';
import { dmquoctichRouter } from './resources/danhmuc/dmquoctich/dmquoctich.router';
import { dmnghenghiepRouter } from './resources/danhmuc/dmnghenghiep/dmnghenghiep.router';
import { dmdantocRouter } from './resources/danhmuc/dmdantoc/dmdantoc.router';


/** Danh mục khác */
import { dmdoituongRouter } from './resources/danhmuc/dmdoituong/dmdoituong.router';
import { dmdonviRouter } from './resources/danhmuc/dmdonvi/dmdonvi.router';

export const restDanhMucRouter = express.Router();

restDanhMucRouter.use('/dmdantoc', dmdantocRouter);
restDanhMucRouter.use('/dmdoituong', dmdoituongRouter);
restDanhMucRouter.use('/dmnghenghiep', dmnghenghiepRouter);
restDanhMucRouter.use('/dmphai', dmphaiRouter);
restDanhMucRouter.use('/dmphuongxa', dmphuongxaRouter);
restDanhMucRouter.use('/dmquanhuyen', dmquanhuyenRouter);
restDanhMucRouter.use('/dmtinhthanh', dmtinhthanhRouter);
restDanhMucRouter.use('/dmquoctich', dmquoctichRouter);
restDanhMucRouter.use('/dmdonvi', dmdonviRouter);



