import express from 'express';
import passport from 'passport';
import thongtinchungController from './thongtinchung.controller';

export const thongtinchungRouter = express.Router();
thongtinchungRouter.get('/', thongtinchungController.findAll);
thongtinchungRouter.route('/')
  .post(passport.authenticate('jwt', { session: false }),thongtinchungController.create)
  // .get(passport.authenticate('jwt', { session: false }),thongtinchungController.findOne)

thongtinchungRouter
  .route('/:id')
    .delete(passport.authenticate('jwt', { session: false }),thongtinchungController.delete)
    .put(passport.authenticate('jwt', { session: false }),thongtinchungController.update)