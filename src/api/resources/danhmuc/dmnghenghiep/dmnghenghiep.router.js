import express from 'express';
import passport from 'passport';
import dmnghenghiepController from './dmnghenghiep.controller';

export const dmnghenghiepRouter = express.Router();


dmnghenghiepRouter.post('/',passport.authenticate('jwt', { session: false }),  dmnghenghiepController.create)
dmnghenghiepRouter.get('/', dmnghenghiepController.findAll);

dmnghenghiepRouter
  .route('/:id')
  .get(dmnghenghiepController.findOne)
  .delete(passport.authenticate('jwt', { session: false }), dmnghenghiepController.delete)
  .put(passport.authenticate('jwt', { session: false }), dmnghenghiepController.update)
