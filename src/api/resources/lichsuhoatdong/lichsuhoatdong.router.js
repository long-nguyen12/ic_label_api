import express from 'express';
import passport from 'passport';
import lichsuhoatdongController from './lichsuhoatdong.controller';

export const lichsuhoatdongRouter = express.Router();

lichsuhoatdongRouter.route('/')
  .get(passport.authenticate('jwt', { session: false }), lichsuhoatdongController.getAll)
  .delete(passport.authenticate('jwt', { session: false }), lichsuhoatdongController.delete)