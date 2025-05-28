import express from 'express';
import passport from 'passport';
import salebillsController from './salebills.controller';

const salebillsRouter = express.Router();
salebillsRouter.post('/', passport.authenticate('jwt', { session: false }), salebillsController.create);

salebillsRouter.get('/', passport.authenticate('jwt', { session: false }), salebillsController.findAll);
salebillsRouter.get('/:id', passport.authenticate('jwt', { session: false }), salebillsController.findOne);
salebillsRouter.put('/:id', passport.authenticate('jwt', { session: false }), salebillsController.update)
salebillsRouter.delete('/:id', passport.authenticate('jwt', { session: false }),  salebillsController.delete);

export default salebillsRouter;


