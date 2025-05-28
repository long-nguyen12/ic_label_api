import express from 'express';
import passport from 'passport';
import phanquyenvaitroController from './phanquyenvaitro.controller';

export const phanquyenvaitroRouter = express.Router();

phanquyenvaitroRouter
  .route('/')
  .get(phanquyenvaitroController.findAll)
  .post(passport.authenticate('jwt', { session: false }), phanquyenvaitroController.create);

phanquyenvaitroRouter
  .route('/:id')
  .put(passport.authenticate('jwt', { session: false }), phanquyenvaitroController.update)
  .delete(phanquyenvaitroController.delete);

phanquyenvaitroRouter
  .route('/:id/trang')
  .post(passport.authenticate('jwt', { session: false }), phanquyenvaitroController.postTrang)
phanquyenvaitroRouter
  .route('/:id/trang/:id')
  .put(passport.authenticate('jwt', { session: false }), phanquyenvaitroController.putTrang)