import express from 'express';
import passport from 'passport';
import salebillsdetailController from './salebillsdetail.controller';

const salebillsdetailRouter = express.Router();
salebillsdetailRouter.post('/', passport.authenticate('jwt', { session: false }), salebillsdetailController.create);

salebillsdetailRouter.get('/', passport.authenticate('jwt', { session: false }), salebillsdetailController.findAll);
salebillsdetailRouter.get('/:id', passport.authenticate('jwt', { session: false }), salebillsdetailController.findOne);
salebillsdetailRouter.put('/:id', passport.authenticate('jwt', { session: false }), salebillsdetailController.update)
salebillsdetailRouter.delete('/:id', passport.authenticate('jwt', { session: false }),  salebillsdetailController.delete);

export default salebillsdetailRouter;


