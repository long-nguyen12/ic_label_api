import express from 'express';
import passport from 'passport';
import dmquanhuyenController from './dmquanhuyen.controller';
import {checkTempFolder, multipartMiddleware} from "../../../utils/fileUtils";

export const dmquanhuyenRouter = express.Router();

dmquanhuyenRouter.post('/import', passport.authenticate('jwt', {session: false}), checkTempFolder, multipartMiddleware, dmquanhuyenController.import)
dmquanhuyenRouter.post('/',passport.authenticate('jwt', { session: false }),  dmquanhuyenController.create)
dmquanhuyenRouter.get('/', dmquanhuyenController.findAll);

dmquanhuyenRouter
  .route('/:id')
  .get(dmquanhuyenController.findOne)
  .delete(passport.authenticate('jwt', { session: false }), dmquanhuyenController.delete)
  .put(passport.authenticate('jwt', { session: false }), dmquanhuyenController.update);

dmquanhuyenRouter.get('/:id/dmphuongxa', passport.authenticate('jwt', { session: false }), dmquanhuyenController.dsPhuongXaByHuyen);