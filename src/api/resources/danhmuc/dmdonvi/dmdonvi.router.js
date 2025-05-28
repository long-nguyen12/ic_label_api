import express from 'express';
import passport from 'passport';
import dmdonviController from './dmdonvi.controller';

export const dmdonviRouter = express.Router();


dmdonviRouter.post('/', passport.authenticate('jwt', {session: false}), dmdonviController.create)
dmdonviRouter.get('/', passport.authenticate('jwt', {session: false}), dmdonviController.findAll);

dmdonviRouter
  .route('/:id')
  .get(dmdonviController.findOne)
  .delete(passport.authenticate('jwt', {session: false}), dmdonviController.delete)
  .put(passport.authenticate('jwt', {session: false}), dmdonviController.update)
