import express from 'express';
import imgUploadController from './imgUpload.controller';

export const getFileUploadRouter = express.Router();

getFileUploadRouter.get('/:id', imgUploadController.findFileById)
getFileUploadRouter.get('/image/:id', imgUploadController.findFileById)
getFileUploadRouter.get('/avatar/:id', imgUploadController.findFileById)
