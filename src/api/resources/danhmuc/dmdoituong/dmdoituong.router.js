import express from 'express';
import passport from 'passport';
import dmdoituongController from './dmdoituong.controller';

export const dmdoituongRouter = express.Router();


dmdoituongRouter.post('/',passport.authenticate('jwt', { session: false }),  dmdoituongController.create)
dmdoituongRouter.get('/',passport.authenticate('jwt', { session: false }),  dmdoituongController.findAll);

dmdoituongRouter
  .route('/:id')
  .get(passport.authenticate('jwt', { session: false }), dmdoituongController.findOne)
  .delete(passport.authenticate('jwt', { session: false }), dmdoituongController.delete)
  .put(passport.authenticate('jwt', { session: false }), dmdoituongController.update)
