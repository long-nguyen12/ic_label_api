import express from 'express';
import filesController from './files.controller';

export const filesRouter = express.Router();
filesRouter.route('/:id').get(filesController.findFileById);