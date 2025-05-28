import express from 'express';
import passport from 'passport';
import dmdantocController from './dmdantoc.controller';
import {checkTempFolder, multipartMiddleware} from "../../../utils/fileUtils";

export const dmdantocRouter = express.Router();


dmdantocRouter.post('/import', checkTempFolder, multipartMiddleware, passport.authenticate('jwt', {session: false}), dmdantocController.import)
dmdantocRouter.post('/', passport.authenticate('jwt', {session: false}), dmdantocController.create)
dmdantocRouter.get('/', dmdantocController.findAll);

dmdantocRouter
  .route('/:id')
  .get(dmdantocController.findOne)
  .delete(passport.authenticate('jwt', {session: false}), dmdantocController.delete)
  .put(passport.authenticate('jwt', {session: false}), dmdantocController.update)
