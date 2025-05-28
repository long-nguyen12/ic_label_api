import express from 'express';
import passport from 'passport';
import dmtinhthanhController from './dmtinhthanh.controller';
import {checkTempFolder, multipartMiddleware} from "../../../utils/fileUtils";

export const dmtinhthanhRouter = express.Router();


dmtinhthanhRouter.post('/import', passport.authenticate('jwt', {session: false}), checkTempFolder, multipartMiddleware, dmtinhthanhController.import)
dmtinhthanhRouter.post('/', passport.authenticate('jwt', {session: false}), dmtinhthanhController.create)
dmtinhthanhRouter.get('/', dmtinhthanhController.findAll);

dmtinhthanhRouter
  .route('/:id')
  .get(dmtinhthanhController.findOne)
  .delete(passport.authenticate('jwt', {session: false}), dmtinhthanhController.delete)
  .put(passport.authenticate('jwt', {session: false}), dmtinhthanhController.update)

dmtinhthanhRouter.get('/:id/dmquanhuyen', passport.authenticate('jwt', {session: false}), dmtinhthanhController.dsQuanHuyenByTinh)