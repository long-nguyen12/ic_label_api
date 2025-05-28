import express from 'express';
import passport from 'passport';
import dmquoctichController from './dmquoctich.controller';

export const dmquoctichRouter = express.Router();


dmquoctichRouter.post('/',passport.authenticate('jwt', { session: false }),  dmquoctichController.create)
dmquoctichRouter.get('/', dmquoctichController.findAll);

dmquoctichRouter
  .route('/:id')
  .get(dmquoctichController.findOne)
  .delete(passport.authenticate('jwt', { session: false }), dmquoctichController.delete)
  .put(passport.authenticate('jwt', { session: false }), dmquoctichController.update)
