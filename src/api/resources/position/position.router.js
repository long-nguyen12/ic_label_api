import express from 'express';
import passport from 'passport';
import positionController from './position.controller';

const positionRouter = express.Router();
positionRouter.post('/', passport.authenticate('jwt', { session: false }), positionController.create);

positionRouter.get('/', passport.authenticate('jwt', { session: false }), positionController.findAll);
positionRouter.get('/:id', passport.authenticate('jwt', { session: false }), positionController.findOne);
positionRouter.put('/:id', passport.authenticate('jwt', { session: false }), positionController.update)
positionRouter.delete('/:id', passport.authenticate('jwt', { session: false }),  positionController.delete);

export default positionRouter;


