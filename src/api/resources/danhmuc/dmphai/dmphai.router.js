import express from 'express';
import passport from 'passport';
import dmphaiController from './dmphai.controller';

export const dmphaiRouter = express.Router();


dmphaiRouter.post('/',passport.authenticate('jwt', { session: false }),  dmphaiController.create)
dmphaiRouter.get('/', dmphaiController.findAll);

dmphaiRouter
  .route('/:id')
  .get(dmphaiController.findOne)
  .delete(passport.authenticate('jwt', { session: false }), dmphaiController.delete)
  .put(passport.authenticate('jwt', { session: false }), dmphaiController.update)
