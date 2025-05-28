import express from 'express';
import passport from 'passport';
import dmphuongxaController from './dmphuongxa.controller';
import {checkTempFolder, multipartMiddleware} from "../../../utils/fileUtils";

export const dmphuongxaRouter = express.Router();
dmphuongxaRouter.post('/import', passport.authenticate('jwt', {session: false}), checkTempFolder, multipartMiddleware, dmphuongxaController.import)

dmphuongxaRouter.post('/',passport.authenticate('jwt', { session: false }),  dmphuongxaController.create)
dmphuongxaRouter.get('/', dmphuongxaController.findAll);

dmphuongxaRouter
  .route('/:id')
  .get(dmphuongxaController.findOne)
  .delete(passport.authenticate('jwt', { session: false }), dmphuongxaController.delete)
  .put(passport.authenticate('jwt', { session: false }), dmphuongxaController.update)
