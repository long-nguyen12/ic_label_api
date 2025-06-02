import express from 'express';
import passport from 'passport';
import datasetController from './dataset.controller';

const datasetRouter = express.Router();
datasetRouter.post('/', passport.authenticate('jwt', { session: false }), datasetController.create);

datasetRouter.get('/', passport.authenticate('jwt', { session: false }), datasetController.findAll);
datasetRouter.get('/:id', passport.authenticate('jwt', { session: false }), datasetController.findOne);
datasetRouter.put('/:id', passport.authenticate('jwt', { session: false }), datasetController.update)
datasetRouter.delete('/:id', passport.authenticate('jwt', { session: false }),  datasetController.delete);

export default datasetRouter;


